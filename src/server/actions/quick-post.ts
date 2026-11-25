"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { evaluatePermission } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import { isPostPackageLine } from "@/modules/packages/package-quantity";
import { resolveRuntimeContext } from "@/server/auth/runtime-context";
import { createDeliverableSchema } from "@/server/commands/deliverables/deliverable-schemas";
import { listEligibleDeliverableMembers } from "./deliverable-member-read";
import { listFirstActivePackageLines } from "./deliverable-package-read";
import { asDeliverableWriteError } from "./deliverable-write-errors";
import { createDeliverableViaRpc } from "./deliverable-write-rpc";

const formSchema = z.object({
  requestId: z.uuid(),
  name: z.string().trim().min(2).max(160),
  packageLineId: z.uuid().or(z.literal("")),
  ownerUserId: z.uuid().or(z.literal("")),
  finalDueDate: z.iso.date().or(z.literal("")),
});

type QuickPostResult =
  | { ok: true; deliverableId: string }
  | { ok: false; message: string };

const saveError = "تعذّر حفظ المنشور. حاول مرة أخرى.";
const capacityError =
  "لا يوجد رصيد كافٍ في بند المنشورات. اختر بندًا آخر إن توفر.";

export async function createQuickPostAction(
  clientId: string,
  formData: FormData,
): Promise<QuickPostResult> {
  const parsed = formSchema.safeParse({
    requestId: formData.get("requestId"),
    name: formData.get("name"),
    packageLineId: formData.get("packageLineId") ?? "",
    ownerUserId: formData.get("ownerUserId") ?? "",
    finalDueDate: formData.get("finalDueDate") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, message: "راجع عنوان المنشور والبيانات المختارة." };
  }

  const supabase = await createSupabaseServerClient();
  const runtime = await resolveRuntimeContext(supabase);
  if (!runtime.ok) {
    return { ok: false, message: "سجّل الدخول مرة أخرى لإضافة المنشور." };
  }

  const { actor, clients } = runtime;
  const tenantId = actor.tenantId;
  const client = clients.find(
    (item) =>
      item.id === clientId &&
      item.tenantId === tenantId &&
      item.status === "active",
  );
  if (
    !client ||
    !evaluatePermission({
      actor,
      permission: PERMISSIONS.DELIVERABLE_CREATE,
      resource: { tenantId, clientId },
    }).allowed
  ) {
    return {
      ok: false,
      message: "حسابك لا يملك صلاحية إضافة منشور لهذا العميل.",
    };
  }

  const draft = parsed.data;
  const idempotencyKey =
    "quick-post:" +
    createHash("sha256")
      .update(JSON.stringify([tenantId, clientId, actor.userId, draft]))
      .digest("hex");

  const readSavedPost = () =>
    supabase
      .from("deliverables")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("client_id", clientId)
      .eq("created_by", actor.userId)
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

  const finish = (deliverableId: string): QuickPostResult => {
    revalidatePath(`/clients/${clientId}/deliverables`);
    revalidatePath(`/clients/${clientId}/deliverables/board`);
    return { ok: true, deliverableId };
  };

  const saved = await readSavedPost();
  if (saved.error) return { ok: false, message: saveError };
  if (saved.data) return finish(saved.data.id);

  const context = await listFirstActivePackageLines({ tenantId, clientId });
  if (!context.ok) {
    return {
      ok: false,
      message: context.reason === "missing" ? capacityError : saveError,
    };
  }

  const available = context.packageLines.filter(
    (line) => isPostPackageLine(line) && line.balance.available >= 1,
  );
  const targetLine = draft.packageLineId
    ? available.find((line) => line.id === draft.packageLineId)
    : available.length === 1
      ? available[0]
      : undefined;

  if (!targetLine) {
    // A retry can overlap the original commit while the package is being read.
    const retry = await readSavedPost();
    if (retry.data) return finish(retry.data.id);
    return {
      ok: false,
      message:
        !draft.packageLineId && available.length > 1
          ? "اختر بند المنشورات أولًا."
          : capacityError,
    };
  }

  if (draft.ownerUserId) {
    const eligible = await listEligibleDeliverableMembers({
      tenantId,
      clientId,
    });
    if (!eligible.ok) return { ok: false, message: saveError };
    if (
      !eligible.members.some((member) => member.userId === draft.ownerUserId)
    ) {
      return { ok: false, message: "اختر مسؤولًا من فريق هذا العميل." };
    }
  }

  const ownerUserId = draft.ownerUserId || actor.userId;
  const isScopedAccountManager = actor.roleAssignments.some(
    (role) =>
      role.roleKey === "account_manager" &&
      role.status === "active" &&
      role.tenantId === tenantId &&
      role.scopeType === "client" &&
      role.scopeId === clientId,
  );
  // Account managers follow cards through the same assignment rules as the board.
  const contributorUserIds =
    isScopedAccountManager && ownerUserId !== actor.userId
      ? [actor.userId]
      : [];

  const post = createDeliverableSchema.parse({
    clientId,
    contractId: context.contractId,
    packageId: context.packageId,
    packageLineId: targetLine.id,
    name: draft.name,
    type: "post",
    reservedQuantity: 1,
    idempotencyKey,
    ownerUserId,
    contributorUserIds,
    finalDueDate: draft.finalDueDate,
  });

  const result = await createDeliverableViaRpc({
    supabase,
    input: {
      ...post,
      deliverableId: crypto.randomUUID(),
      allocationId: crypto.randomUUID(),
      ledgerEntryId: crypto.randomUUID(),
      auditEventId: crypto.randomUUID(),
      description: null,
      ownerUserId: post.ownerUserId ?? null,
      startDate: null,
      internalDueDate: null,
      clientDueDate: null,
      finalDueDate: post.finalDueDate ?? null,
    },
  });

  if (result.ok) {
    return result.value.clientId === clientId &&
      result.value.createdBy === actor.userId
      ? finish(result.value.id)
      : { ok: false, message: saveError };
  }
  const error = asDeliverableWriteError(result.error);
  if (
    error.code === "23505" ||
    error.message === "insufficient package capacity"
  ) {
    const retry = await readSavedPost();
    if (retry.data) return finish(retry.data.id);
    if (error.message === "insufficient package capacity") {
      return { ok: false, message: capacityError };
    }
  }
  return { ok: false, message: saveError };
}

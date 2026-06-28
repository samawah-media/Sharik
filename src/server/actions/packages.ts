"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { evaluatePermission } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import type { PackageFormState } from "@/modules/packages/package-form-state";
import { packageFormError } from "@/modules/packages/package-form-state";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveRuntimeContext } from "@/server/auth/runtime-context";
import { createPackageSchema } from "@/server/commands/packages/package-schemas";
import {
  nullableFormValue,
  packageValuesFromFormData,
} from "./package-write-mappers";
import { createPackageViaRpc } from "./package-write-rpc";

const saveFailureMessage = "تعذر حفظ الباقة بأمان.";
const validationFailureMessage = "راجع بيانات الباقة ثم حاول مرة أخرى.";
const permissionFailureMessage = "لا يمكنك حفظ هذه الباقة.";

const mapWriteError = (code: string | undefined) => {
  if (code === "23505") {
    return "تم تسجيل طلب إنشاء هذه الباقة مسبقًا.";
  }

  if (code === "42501") {
    return permissionFailureMessage;
  }

  return saveFailureMessage;
};

export async function createPackageAction(
  _previousState: PackageFormState,
  formData: FormData,
): Promise<PackageFormState> {
  const values = packageValuesFromFormData(formData);
  const parsed = createPackageSchema.safeParse({
    clientId: values.clientId,
    contractId: values.contractId,
    name: values.name,
    periodStart: values.periodStart,
    periodEnd: values.periodEnd,
    status: values.status,
    lines: [
      {
        serviceLabel: values.lineServiceLabel,
        deliverableTypeHint: values.lineDeliverableTypeHint,
        unitLabel: values.lineUnitLabel,
        committedQuantity: values.lineCommittedQuantity,
      },
    ],
    idempotencyKey: values.idempotencyKey,
  });

  if (!parsed.success) {
    return packageFormError({
      message: validationFailureMessage,
      values,
    });
  }

  const supabase = await createSupabaseServerClient();
  const runtime = await resolveRuntimeContext(supabase);

  if (!runtime.ok) {
    return packageFormError({
      message: permissionFailureMessage,
      values,
    });
  }

  const client = runtime.clients.find(
    (item) =>
      item.id === parsed.data.clientId &&
      item.tenantId === runtime.actor.tenantId &&
      item.status === "active",
  );

  if (!client) {
    return packageFormError({
      message: permissionFailureMessage,
      values,
    });
  }

  const allowed = evaluatePermission({
    actor: runtime.actor,
    permission: PERMISSIONS.PACKAGE_CREATE,
    resource: { tenantId: client.tenantId, clientId: client.id },
  }).allowed;

  if (!allowed) {
    return packageFormError({
      message: permissionFailureMessage,
      values,
    });
  }

  const { data: contractRows, error: contractError } = await supabase
    .from("contracts")
    .select("id, tenant_id, client_id, status")
    .eq("tenant_id", client.tenantId)
    .eq("client_id", client.id)
    .eq("id", parsed.data.contractId)
    .in("status", ["draft", "active"])
    .limit(1);

  if (contractError || !contractRows?.[0]) {
    return packageFormError({
      message: permissionFailureMessage,
      values,
    });
  }

  const result = await createPackageViaRpc({
    supabase,
    input: {
      packageId: crypto.randomUUID(),
      auditEventId: crypto.randomUUID(),
      clientId: client.id,
      contractId: parsed.data.contractId,
      name: parsed.data.name,
      status: parsed.data.status,
      periodStart: nullableFormValue(parsed.data.periodStart),
      periodEnd: nullableFormValue(parsed.data.periodEnd),
      idempotencyKey: parsed.data.idempotencyKey,
      lines: parsed.data.lines.map((line) => ({
        id: crypto.randomUUID(),
        ledgerEntryId: crypto.randomUUID(),
        serviceLabel: line.serviceLabel,
        deliverableTypeHint: nullableFormValue(line.deliverableTypeHint),
        unitLabel: line.unitLabel,
        committedQuantity: line.committedQuantity,
      })),
    },
  });

  if (!result.ok) {
    return packageFormError({
      message: mapWriteError(result.error.code),
      values,
    });
  }

  revalidatePath(`/clients/${client.id}/contracts/${parsed.data.contractId}/packages`);
  redirect(
    `/clients/${client.id}/contracts/${parsed.data.contractId}/packages?saved=created`,
  );
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { evaluatePermission } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cancelNotStartedDeliverableSchema } from "@/server/commands/deliverables/deliverable-schemas";
import { resolveRuntimeContext } from "@/server/auth/runtime-context";
import { cancelNotStartedDeliverableViaRpc } from "./deliverable-write-rpc";
import type { CancelNotStartedDeliverableInput } from "@/server/commands/deliverables/deliverable-schemas";
import type { RuntimeContext } from "@/server/auth/runtime-context";

type ReadyRuntimeContext = Extract<RuntimeContext, { ok: true }>;

const redirectWithSafeResult = (
  clientId: string,
  result: "cancelled" | "denied",
): never => {
  redirect(`/clients/${clientId}/deliverables?saved=${result}`);
};

export async function cancelNotStartedDeliverableAction(formData: FormData) {
  const values = {
    clientId: String(formData.get("clientId") ?? ""),
    deliverableId: String(formData.get("deliverableId") ?? ""),
    expectedStatus: String(formData.get("expectedStatus") ?? "not_started"),
    expectedRevision: String(formData.get("expectedRevision") ?? ""),
    reason: String(formData.get("reason") ?? ""),
    idempotencyKey: String(formData.get("idempotencyKey") ?? ""),
  };
  const parsedInput = (() => {
    const parsed = cancelNotStartedDeliverableSchema.safeParse({
      ...values,
      expectedRevision: values.expectedRevision || undefined,
    });

    if (parsed.data === undefined) {
      redirectWithSafeResult(values.clientId, "denied");
    }

    return parsed.data as CancelNotStartedDeliverableInput;
  })();

  const supabase = await createSupabaseServerClient();
  const runtime = await resolveRuntimeContext(supabase);

  if (!("actor" in runtime)) {
    redirectWithSafeResult(parsedInput.clientId, "denied");
  }
  const readyRuntime = runtime as ReadyRuntimeContext;

  const client = readyRuntime.clients.find(
    (item) =>
      item.id === parsedInput.clientId &&
      item.tenantId === readyRuntime.actor.tenantId &&
      item.status === "active",
  );

  const scopedClient = client ?? redirectWithSafeResult(parsedInput.clientId, "denied");

  const allowed = evaluatePermission({
    actor: readyRuntime.actor,
    permission: PERMISSIONS.DELIVERABLE_CANCEL_NOT_STARTED,
    resource: { tenantId: scopedClient.tenantId, clientId: scopedClient.id },
  }).allowed;

  if (!allowed) {
    redirectWithSafeResult(scopedClient.id, "denied");
  }

  const result = await cancelNotStartedDeliverableViaRpc({
    supabase,
    input: {
      deliverableId: parsedInput.deliverableId,
      releaseLedgerEntryId: crypto.randomUUID(),
      auditEventId: crypto.randomUUID(),
      clientId: scopedClient.id,
      reason: parsedInput.reason,
      expectedStatus: "not_started",
      expectedRevision: parsedInput.expectedRevision ?? null,
      idempotencyKey: parsedInput.idempotencyKey,
    },
  });

  if (!result.ok) {
    redirectWithSafeResult(scopedClient.id, "denied");
  }

  revalidatePath(`/clients/${scopedClient.id}/deliverables`);
  redirectWithSafeResult(scopedClient.id, "cancelled");
}

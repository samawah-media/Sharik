"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { evaluatePermission } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import {
  r007WorkflowStepTargets,
  type R007WorkflowStep,
} from "@/modules/deliverables/r007-deliverable-lifecycle";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  updateDeliverableStatusSchema,
  type UpdateDeliverableStatusInput,
} from "@/server/commands/deliverables/deliverable-schemas";
import { resolveRuntimeContext, type RuntimeContext } from "@/server/auth/runtime-context";
import { updateDeliverableStatusViaRpc } from "./deliverable-write-rpc";
import { nullableFormValue } from "./deliverable-write-mappers";

type ReadyRuntimeContext = Extract<RuntimeContext, { ok: true }>;
type StatusUpdateResult = "status-updated" | "denied";

const r007WorkflowPermissions = {
  approve_internally: PERMISSIONS.DELIVERABLE_INTERNAL_APPROVE,
  request_internal_changes: PERMISSIONS.DELIVERABLE_INTERNAL_APPROVE,
  send_to_client: PERMISSIONS.DELIVERABLE_SEND_TO_CLIENT,
  approve_as_client: PERMISSIONS.DELIVERABLE_CLIENT_APPROVE,
  request_client_changes: PERMISSIONS.DELIVERABLE_CLIENT_APPROVE,
  deliver_after_client_approval: PERMISSIONS.DELIVERABLE_STATUS_UPDATE,
} as const satisfies Record<R007WorkflowStep, (typeof PERMISSIONS)[keyof typeof PERMISSIONS]>;

const resolveR007WorkflowStep = (
  value: FormDataEntryValue | null,
): R007WorkflowStep | undefined => {
  if (typeof value !== "string" || !(value in r007WorkflowStepTargets)) {
    return undefined;
  }

  return value as R007WorkflowStep;
};

const redirectWithSafeResult = (
  clientId: string,
  result: StatusUpdateResult,
): never => {
  redirect(`/clients/${clientId}/deliverables/board?saved=${result}`);
};

export async function updateDeliverableStatusAction(formData: FormData) {
  const workflowStep = resolveR007WorkflowStep(formData.get("workflowStep"));
  const workflowTarget = workflowStep
    ? r007WorkflowStepTargets[workflowStep]
    : undefined;
  const values = {
    clientId: String(formData.get("clientId") ?? ""),
    deliverableId: String(formData.get("deliverableId") ?? ""),
    toStatus: workflowTarget ?? String(formData.get("toStatus") ?? ""),
    expectedRevision: String(formData.get("expectedRevision") ?? ""),
    reason: String(formData.get("reason") ?? ""),
    idempotencyKey: String(formData.get("idempotencyKey") ?? ""),
  };
  const parsedInput = (() => {
    const parsed = updateDeliverableStatusSchema.safeParse({
      ...values,
      expectedRevision: values.expectedRevision || undefined,
    });

    if (parsed.data === undefined) {
      redirectWithSafeResult(values.clientId, "denied");
    }

    return parsed.data as UpdateDeliverableStatusInput;
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
    permission: workflowStep
      ? r007WorkflowPermissions[workflowStep]
      : PERMISSIONS.DELIVERABLE_STATUS_UPDATE,
    resource: { tenantId: scopedClient.tenantId, clientId: scopedClient.id },
  }).allowed;

  if (!allowed) {
    redirectWithSafeResult(scopedClient.id, "denied");
  }

  const result = await updateDeliverableStatusViaRpc({
    supabase,
    input: {
      deliverableId: parsedInput.deliverableId,
      auditEventId: crypto.randomUUID(),
      clientId: scopedClient.id,
      toStatus: parsedInput.toStatus,
      expectedRevision: parsedInput.expectedRevision ?? null,
      reason: nullableFormValue(parsedInput.reason),
      idempotencyKey: parsedInput.idempotencyKey,
    },
  });

  if (!result.ok) {
    redirectWithSafeResult(scopedClient.id, "denied");
  }

  revalidatePath(`/clients/${scopedClient.id}/deliverables`);
  revalidatePath(`/clients/${scopedClient.id}/deliverables/board`);
  redirectWithSafeResult(scopedClient.id, "status-updated");
}

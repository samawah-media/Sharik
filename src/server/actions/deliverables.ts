"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { evaluatePermission } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import type { DeliverableFormState } from "@/modules/deliverables/deliverable-form-state";
import { deliverableFormError } from "@/modules/deliverables/deliverable-form-state";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createApprovedExtraDeliverableSchema,
  createDeliverableSchema,
} from "@/server/commands/deliverables/deliverable-schemas";
import { resolveRuntimeContext } from "@/server/auth/runtime-context";
import {
  contributorIdsFromFormValue,
  deliverableValuesFromFormData,
  nullableFormValue,
  optionalFormValue,
} from "./deliverable-write-mappers";
import {
  createApprovedExtraDeliverableViaRpc,
  createDeliverableViaRpc,
} from "./deliverable-write-rpc";

const saveFailureMessage = "تعذر حفظ المخرج بأمان.";
const validationFailureMessage = "راجع بيانات المخرج ثم حاول مرة أخرى.";
const permissionFailureMessage = "لا يمكنك حفظ هذا المخرج.";
const capacityFailureMessage =
  "لا توجد سعة كافية لهذا السطر. اختر سطرًا آخر أو استخدم مسار المخرج الإضافي المعتمد.";

const mapWriteError = (error: { code?: string; message?: string }) => {
  const { code, message } = error;

  if (code === "23505") {
    return "تم تسجيل طلب إنشاء هذا المخرج مسبقًا.";
  }

  if (code === "42501" && message === "insufficient package capacity") {
    return capacityFailureMessage;
  }

  if (code === "42501") {
    return permissionFailureMessage;
  }

  if (code === "P0001") {
    return validationFailureMessage;
  }

  return saveFailureMessage;
};

export async function createDeliverableAction(
  _previousState: DeliverableFormState,
  formData: FormData,
): Promise<DeliverableFormState> {
  const values = deliverableValuesFromFormData(formData);
  const parsed = createDeliverableSchema.safeParse({
    clientId: values.clientId,
    contractId: values.contractId,
    packageId: values.packageId,
    packageLineId: values.packageLineId,
    name: values.name,
    description: values.description,
    type: values.type,
    priority: values.priority,
    ownerUserId: values.ownerUserId,
    contributorUserIds: contributorIdsFromFormValue(values.contributorUserIds),
    startDate: values.startDate,
    internalDueDate: values.internalDueDate,
    clientDueDate: values.clientDueDate,
    finalDueDate: values.finalDueDate,
    requiresInternalApproval: values.requiresInternalApproval === "true",
    requiresClientApproval: values.requiresClientApproval === "true",
    reservedQuantity: values.reservedQuantity,
    idempotencyKey: values.idempotencyKey,
  });

  if (!parsed.success) {
    return deliverableFormError({
      message: validationFailureMessage,
      values,
    });
  }

  const supabase = await createSupabaseServerClient();
  const runtime = await resolveRuntimeContext(supabase);

  if (!runtime.ok) {
    return deliverableFormError({ message: permissionFailureMessage, values });
  }

  const client = runtime.clients.find(
    (item) =>
      item.id === parsed.data.clientId &&
      item.tenantId === runtime.actor.tenantId &&
      item.status === "active",
  );

  if (!client) {
    return deliverableFormError({ message: permissionFailureMessage, values });
  }

  const allowed = evaluatePermission({
    actor: runtime.actor,
    permission: PERMISSIONS.DELIVERABLE_CREATE,
    resource: { tenantId: client.tenantId, clientId: client.id },
  }).allowed;

  if (!allowed) {
    return deliverableFormError({ message: permissionFailureMessage, values });
  }

  const result = await createDeliverableViaRpc({
    supabase,
    input: {
      deliverableId: crypto.randomUUID(),
      allocationId: crypto.randomUUID(),
      ledgerEntryId: crypto.randomUUID(),
      auditEventId: crypto.randomUUID(),
      clientId: client.id,
      contractId: parsed.data.contractId,
      packageId: parsed.data.packageId,
      packageLineId: parsed.data.packageLineId,
      name: parsed.data.name,
      description: nullableFormValue(parsed.data.description),
      type: parsed.data.type,
      priority: parsed.data.priority,
      ownerUserId: nullableFormValue(parsed.data.ownerUserId),
      contributorUserIds: parsed.data.contributorUserIds,
      startDate: nullableFormValue(parsed.data.startDate),
      internalDueDate: nullableFormValue(parsed.data.internalDueDate),
      clientDueDate: nullableFormValue(parsed.data.clientDueDate),
      finalDueDate: nullableFormValue(parsed.data.finalDueDate),
      requiresInternalApproval: parsed.data.requiresInternalApproval,
      requiresClientApproval: parsed.data.requiresClientApproval,
      reservedQuantity: parsed.data.reservedQuantity,
      idempotencyKey: parsed.data.idempotencyKey,
    },
  });

  if (!result.ok) {
    return deliverableFormError({
      message: mapWriteError(result.error),
      values,
    });
  }

  revalidatePath(`/clients/${client.id}/deliverables`);
  redirect(`/clients/${client.id}/deliverables?saved=created`);
}

export async function createApprovedExtraDeliverableAction(
  _previousState: DeliverableFormState,
  formData: FormData,
): Promise<DeliverableFormState> {
  const values = deliverableValuesFromFormData(formData);
  const parsed = createApprovedExtraDeliverableSchema.safeParse({
    clientId: values.clientId,
    name: values.name,
    description: values.description,
    type: values.type,
    priority: values.priority,
    ownerUserId: optionalFormValue(values.ownerUserId),
    contributorUserIds: contributorIdsFromFormValue(values.contributorUserIds),
    startDate: values.startDate,
    internalDueDate: values.internalDueDate,
    clientDueDate: values.clientDueDate,
    finalDueDate: values.finalDueDate,
    requiresInternalApproval: values.requiresInternalApproval === "true",
    requiresClientApproval: values.requiresClientApproval === "true",
    extraReason: values.extraReason,
    idempotencyKey: values.idempotencyKey,
  });

  if (!parsed.success) {
    return deliverableFormError({
      message: validationFailureMessage,
      values,
    });
  }

  const supabase = await createSupabaseServerClient();
  const runtime = await resolveRuntimeContext(supabase);

  if (!runtime.ok) {
    return deliverableFormError({ message: permissionFailureMessage, values });
  }

  const client = runtime.clients.find(
    (item) =>
      item.id === parsed.data.clientId &&
      item.tenantId === runtime.actor.tenantId &&
      item.status === "active",
  );

  if (!client) {
    return deliverableFormError({ message: permissionFailureMessage, values });
  }

  const allowed = evaluatePermission({
    actor: runtime.actor,
    permission: PERMISSIONS.DELIVERABLE_EXTRA_CREATE,
    resource: { tenantId: client.tenantId, clientId: client.id },
  }).allowed;

  if (!allowed) {
    return deliverableFormError({ message: permissionFailureMessage, values });
  }

  const result = await createApprovedExtraDeliverableViaRpc({
    supabase,
    input: {
      deliverableId: crypto.randomUUID(),
      auditEventId: crypto.randomUUID(),
      clientId: client.id,
      name: parsed.data.name,
      description: nullableFormValue(parsed.data.description),
      type: parsed.data.type,
      priority: parsed.data.priority,
      ownerUserId: nullableFormValue(parsed.data.ownerUserId),
      contributorUserIds: parsed.data.contributorUserIds,
      startDate: nullableFormValue(parsed.data.startDate),
      internalDueDate: nullableFormValue(parsed.data.internalDueDate),
      clientDueDate: nullableFormValue(parsed.data.clientDueDate),
      finalDueDate: nullableFormValue(parsed.data.finalDueDate),
      requiresInternalApproval: parsed.data.requiresInternalApproval,
      requiresClientApproval: parsed.data.requiresClientApproval,
      extraReason: parsed.data.extraReason,
      idempotencyKey: parsed.data.idempotencyKey,
    },
  });

  if (!result.ok) {
    return deliverableFormError({
      message: mapWriteError(result.error),
      values,
    });
  }

  revalidatePath(`/clients/${client.id}/deliverables`);
  redirect(`/clients/${client.id}/deliverables?saved=extra-created`);
}

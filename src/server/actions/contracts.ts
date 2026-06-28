"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { evaluatePermission } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import type { ContractFormState } from "@/modules/contracts/contract-form-state";
import { contractFormError } from "@/modules/contracts/contract-form-state";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveRuntimeContext } from "@/server/auth/runtime-context";
import { createContractSchema } from "@/server/commands/contracts/contract-schemas";
import {
  contractValuesFromFormData,
  nullableFormValue,
} from "./contract-write-mappers";
import { createContractViaRpc } from "./contract-write-rpc";

const saveFailureMessage = "تعذر حفظ العقد بأمان.";
const validationFailureMessage = "راجع بيانات العقد ثم حاول مرة أخرى.";
const permissionFailureMessage = "لا يمكنك حفظ هذا العقد.";

const mapWriteError = (code: string | undefined) => {
  if (code === "23505") {
    return "تم تسجيل طلب إنشاء هذا العقد مسبقًا.";
  }

  if (code === "42501") {
    return permissionFailureMessage;
  }

  return saveFailureMessage;
};

export async function createContractAction(
  _previousState: ContractFormState,
  formData: FormData,
): Promise<ContractFormState> {
  const values = contractValuesFromFormData(formData);
  const parsed = createContractSchema.safeParse(values);

  if (!parsed.success) {
    return contractFormError({
      message: validationFailureMessage,
      values,
    });
  }

  const supabase = await createSupabaseServerClient();
  const runtime = await resolveRuntimeContext(supabase);

  if (!runtime.ok) {
    return contractFormError({
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
    return contractFormError({
      message: permissionFailureMessage,
      values,
    });
  }

  const allowed = evaluatePermission({
    actor: runtime.actor,
    permission: PERMISSIONS.CONTRACT_CREATE,
    resource: { tenantId: client.tenantId, clientId: client.id },
  }).allowed;

  if (!allowed) {
    return contractFormError({
      message: permissionFailureMessage,
      values,
    });
  }

  const result = await createContractViaRpc({
    supabase,
    input: {
      contractId: crypto.randomUUID(),
      auditEventId: crypto.randomUUID(),
      clientId: client.id,
      name: parsed.data.name,
      reference: nullableFormValue(parsed.data.reference),
      summary: nullableFormValue(parsed.data.summary),
      periodStart: nullableFormValue(parsed.data.periodStart),
      periodEnd: nullableFormValue(parsed.data.periodEnd),
      status: parsed.data.status,
      idempotencyKey: parsed.data.idempotencyKey,
    },
  });

  if (!result.ok) {
    return contractFormError({
      message: mapWriteError(result.error.code),
      values,
    });
  }

  revalidatePath(`/clients/${client.id}/contracts`);
  redirect(`/clients/${client.id}/contracts?saved=created`);
}

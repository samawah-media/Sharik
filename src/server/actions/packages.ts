"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { evaluatePermission } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import type { PackageFormState } from "@/modules/packages/package-form-state";
import { packageFormError } from "@/modules/packages/package-form-state";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveRuntimeContext } from "@/server/auth/runtime-context";
import {
  adjustPackageSchema,
  createPackageSchema,
} from "@/server/commands/packages/package-schemas";
import {
  nullableFormValue,
  packageValuesFromFormData,
} from "./package-write-mappers";
import { createPackageViaRpc } from "./package-write-rpc";

export type PackageAdjustmentState = {
  status: "idle" | "error" | "success";
  message?: string;
};

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

export async function adjustPackageCommitmentAction(
  _previousState: PackageAdjustmentState,
  formData: FormData,
): Promise<PackageAdjustmentState> {
  const clientId = String(formData.get("clientId") ?? "");
  const contractId = String(formData.get("contractId") ?? "");
  const parsed = adjustPackageSchema.safeParse({
    packageLineId: formData.get("packageLineId"),
    adjustmentQuantity: formData.get("adjustmentQuantity"),
    reason: formData.get("reason"),
    idempotencyKey: formData.get("idempotencyKey"),
  });

  if (!parsed.success || !clientId || !contractId) {
    return {
      status: "error",
      message: "أدخل فرق الكمية وسبب التصحيح بوضوح.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const runtime = await resolveRuntimeContext(supabase);

  if (!runtime.ok) {
    return { status: "error", message: "لا يمكنك تعديل هذه الباقة." };
  }

  const client = runtime.clients.find(
    (item) =>
      item.id === clientId &&
      item.tenantId === runtime.actor.tenantId &&
      item.status === "active",
  );
  const allowed =
    client &&
    evaluatePermission({
      actor: runtime.actor,
      permission: PERMISSIONS.PACKAGE_ADJUST,
      resource: { tenantId: client.tenantId, clientId: client.id },
    }).allowed;

  if (!client || !allowed) {
    return { status: "error", message: "لا يمكنك تعديل هذه الباقة." };
  }

  const { data: scopedLine, error: scopeError } = await supabase
    .from("package_lines")
    .select("id, package_id, packages!inner(contract_id)")
    .eq("tenant_id", client.tenantId)
    .eq("client_id", client.id)
    .eq("id", parsed.data.packageLineId)
    .eq("packages.contract_id", contractId)
    .limit(1)
    .maybeSingle();

  if (scopeError || !scopedLine) {
    return { status: "error", message: "لا يمكنك تعديل هذه الباقة." };
  }

  const { error } = await supabase.rpc("f002_adjust_package_commitment", {
    ledger_entry_id: crypto.randomUUID(),
    audit_event_id: crypto.randomUUID(),
    target_package_line_id: parsed.data.packageLineId,
    adjustment_quantity: parsed.data.adjustmentQuantity,
    adjustment_reason: parsed.data.reason,
    idempotency_key: parsed.data.idempotencyKey,
  });

  if (error) {
    return {
      status: "error",
      message:
        error.code === "42501"
          ? "التصحيح غير مسموح أو سيجعل الرصيد سالبًا."
          : "تعذر تسجيل تصحيح الباقة بأمان.",
    };
  }

  revalidatePath(`/clients/${client.id}/contracts/${contractId}/packages`);
  return {
    status: "success",
    message: "تم تسجيل التصحيح في سجل الباقة والتدقيق.",
  };
}

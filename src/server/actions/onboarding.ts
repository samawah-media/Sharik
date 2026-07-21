"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { evaluatePermission } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import { toClientSlug } from "@/modules/clients/client-repository";
import type { ContractStatus } from "@/modules/contracts/contract-repository";
import type { PackageStatus } from "@/modules/packages/package-repository";
import type { DeliverablePriority } from "@/modules/deliverables/deliverable-repository";
import {
  onboardingFormError,
  type OnboardingFormState,
  type OnboardingFormValues,
} from "@/modules/onboarding/onboarding-form-state";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveRuntimeContext } from "@/server/auth/runtime-context";
import {
  onboardingSchema,
  parseOnboardingLinesJson,
} from "@/server/commands/onboarding/onboarding-schema";
import { createClientViaRpc } from "./client-write-rpc";
import { createContractViaRpc } from "./contract-write-rpc";
import { createPackageViaRpc } from "./package-write-rpc";
import { createDeliverableViaRpc } from "./deliverable-write-rpc";
import {
  asDeliverableWriteError,
  mapDeliverableWriteError,
  validateDeliverableIdentifierFields,
} from "./deliverable-write-errors";

const saveFailureMessage = "تعذر إكمال الإضافة بأمان. حاول مرة أخرى.";
const validationFailureMessage = "راجع البيانات ثم حاول مرة أخرى.";
const permissionFailureMessage = "لا يمكنك إضافة عميل جديد.";
const duplicateClientMessage = "يوجد عميل بنفس الاسم داخل هذا النطاق.";

const nullableFormValue = (value: string | undefined): string | null => {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
};

const mapOnboardingError = (error: { code?: string; message?: string }) => {
  const { code, message } = error;

  if (code === "23505") {
    return duplicateClientMessage;
  }

  if (code === "42501" && message === "insufficient package capacity") {
    return "لا توجد سعة كافية في سطر الباقة. راجع الكميات ثم حاول مرة أخرى.";
  }

  if (code === "42501") {
    return permissionFailureMessage;
  }

  if (code === "22P02" || code === "23502" || code === "23503" || code === "23514") {
    return validationFailureMessage;
  }

  return saveFailureMessage;
};

const valuesFromFormData = (formData: FormData): OnboardingFormValues => ({
  runId: String(formData.get("runId") ?? ""),
  clientName: String(formData.get("clientName") ?? ""),
  clientContactName: String(formData.get("clientContactName") ?? ""),
  clientContactEmail: String(formData.get("clientContactEmail") ?? ""),
  contractName: String(formData.get("contractName") ?? ""),
  contractReference: String(formData.get("contractReference") ?? ""),
  contractSummary: String(formData.get("contractSummary") ?? ""),
  contractPeriodStart: String(formData.get("contractPeriodStart") ?? ""),
  contractPeriodEnd: String(formData.get("contractPeriodEnd") ?? ""),
  packageName: String(formData.get("packageName") ?? ""),
  packagePeriodStart: String(formData.get("packagePeriodStart") ?? ""),
  packagePeriodEnd: String(formData.get("packagePeriodEnd") ?? ""),
  packageLinesJson: String(formData.get("packageLinesJson") ?? ""),
  deliverableName: String(formData.get("deliverableName") ?? ""),
  deliverableDescription: String(formData.get("deliverableDescription") ?? ""),
  deliverableType: String(formData.get("deliverableType") ?? ""),
  ownerUserId: String(formData.get("ownerUserId") ?? ""),
  contributorUserIds: (formData.getAll("contributorUserIds") as string[]).join(","),
  startDate: String(formData.get("startDate") ?? ""),
  internalDueDate: String(formData.get("internalDueDate") ?? ""),
  clientDueDate: String(formData.get("clientDueDate") ?? ""),
  finalDueDate: String(formData.get("finalDueDate") ?? ""),
  reservedQuantity: String(formData.get("reservedQuantity") ?? "1"),
});

export async function onboardFirstClientAction(
  _previousState: OnboardingFormState,
  formData: FormData,
): Promise<OnboardingFormState> {
  const values = valuesFromFormData(formData);
  const contributorUserIds = (formData.getAll("contributorUserIds") as string[]).filter(
    (id) => id.trim().length > 0,
  );
  const requiresInternalApproval = formData.get("requiresInternalApproval") === "true";
  const requiresClientApproval = formData.get("requiresClientApproval") === "true";
  const packageLines = parseOnboardingLinesJson(values.packageLinesJson);

  const parsed = onboardingSchema.safeParse({
    runId: values.runId,
    clientName: values.clientName,
    clientContactName: values.clientContactName,
    clientContactEmail: values.clientContactEmail,
    contractName: values.contractName,
    contractReference: values.contractReference,
    contractSummary: values.contractSummary,
    contractPeriodStart: values.contractPeriodStart,
    contractPeriodEnd: values.contractPeriodEnd,
    contractStatus: String(formData.get("contractStatus") ?? "active"),
    packageName: values.packageName,
    packagePeriodStart: values.packagePeriodStart,
    packagePeriodEnd: values.packagePeriodEnd,
    packageStatus: String(formData.get("packageStatus") ?? "active"),
    packageLines,
    deliverableName: values.deliverableName,
    deliverableDescription: values.deliverableDescription,
    deliverableType: values.deliverableType,
    deliverablePriority: String(formData.get("deliverablePriority") ?? "normal"),
    ownerUserId: values.ownerUserId,
    contributorUserIds,
    startDate: values.startDate,
    internalDueDate: values.internalDueDate,
    clientDueDate: values.clientDueDate,
    finalDueDate: values.finalDueDate,
    requiresInternalApproval,
    requiresClientApproval,
    reservedQuantity: values.reservedQuantity,
  });

  if (!parsed.success) {
    return onboardingFormError({
      message: validationFailureMessage,
      values,
    });
  }

  const data = parsed.data;

  const identifierError = validateDeliverableIdentifierFields({
    ownerUserId: data.ownerUserId,
    contributorUserIds: data.contributorUserIds,
  });

  if (identifierError) {
    return onboardingFormError({ message: identifierError, values });
  }

  const supabase = await createSupabaseServerClient();
  const runtime = await resolveRuntimeContext(supabase);

  if (!runtime.ok) {
    return onboardingFormError({ message: permissionFailureMessage, values });
  }

  const tenantId = runtime.actor.tenantId;
  const requiredPermissions = [
    PERMISSIONS.CLIENT_CREATE,
    PERMISSIONS.CONTRACT_CREATE,
    PERMISSIONS.PACKAGE_CREATE,
    PERMISSIONS.DELIVERABLE_CREATE,
  ];

  for (const permission of requiredPermissions) {
    const allowed = evaluatePermission({
      actor: runtime.actor,
      permission,
      resource: { tenantId },
    }).allowed;

    if (!allowed) {
      return onboardingFormError({ message: permissionFailureMessage, values });
    }
  }

  const slug = toClientSlug(data.clientName);
  const clientAuditEventId = crypto.randomUUID();
  const clientResult = await createClientViaRpc({
    supabase,
    input: {
      clientId: crypto.randomUUID(),
      auditEventId: clientAuditEventId,
      name: data.clientName,
      slug,
      primaryContactName: nullableFormValue(data.clientContactName),
      primaryContactEmail: nullableFormValue(data.clientContactEmail),
    },
  });

  let clientId: string;

  if (!clientResult.ok) {
    if (clientResult.error.code === "23505") {
      const { data: existingClient } = await supabase
        .from("clients")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("slug", slug)
        .limit(1);

      if (existingClient?.[0]?.id) {
        clientId = existingClient[0].id;
      } else {
        return onboardingFormError({
          message: duplicateClientMessage,
          values,
        });
      }
    } else {
      return onboardingFormError({
        message: mapOnboardingError(clientResult.error),
        values,
      });
    }
  } else {
    clientId = clientResult.value.id;
  }

  const contractIdempotencyKey = `${data.runId}:contract`;
  const contractResult = await createContractViaRpc({
    supabase,
    input: {
      contractId: crypto.randomUUID(),
      auditEventId: crypto.randomUUID(),
      clientId,
      name: data.contractName,
      reference: nullableFormValue(data.contractReference),
      summary: nullableFormValue(data.contractSummary),
      periodStart: nullableFormValue(data.contractPeriodStart),
      periodEnd: nullableFormValue(data.contractPeriodEnd),
      status: data.contractStatus as ContractStatus,
      idempotencyKey: contractIdempotencyKey,
    },
  });

  if (!contractResult.ok) {
    return onboardingFormError({
      message: mapOnboardingError(contractResult.error),
      values,
    });
  }

  const contractId = contractResult.value.id;
  const packageIdempotencyKey = `${data.runId}:package`;
  const packageLineInputs = data.packageLines.map((line) => ({
    id: crypto.randomUUID(),
    ledgerEntryId: crypto.randomUUID(),
    serviceLabel: line.serviceLabel,
    deliverableTypeHint: nullableFormValue(line.deliverableTypeHint),
    unitLabel: line.unitLabel,
    committedQuantity: line.committedQuantity,
  }));

  const packageResult = await createPackageViaRpc({
    supabase,
    input: {
      packageId: crypto.randomUUID(),
      auditEventId: crypto.randomUUID(),
      clientId,
      contractId,
      name: data.packageName,
      status: data.packageStatus as PackageStatus,
      periodStart: nullableFormValue(data.packagePeriodStart),
      periodEnd: nullableFormValue(data.packagePeriodEnd),
      idempotencyKey: packageIdempotencyKey,
      lines: packageLineInputs,
    },
  });

  if (!packageResult.ok) {
    return onboardingFormError({
      message: mapOnboardingError(packageResult.error),
      values,
    });
  }

  const packageId = packageResult.value.id;

  const { data: packageLineRows, error: packageLineError } = await supabase
    .from("package_lines")
    .select("id, committed_quantity")
    .eq("tenant_id", tenantId)
    .eq("client_id", clientId)
    .eq("package_id", packageId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1);

  if (packageLineError || !packageLineRows?.[0]?.id) {
    return onboardingFormError({
      message: saveFailureMessage,
      values,
    });
  }

  const packageLineId = packageLineRows[0].id;

  const deliverableIdempotencyKey = `${data.runId}:deliverable`;
  const deliverableResult = await createDeliverableViaRpc({
    supabase,
    input: {
      deliverableId: crypto.randomUUID(),
      allocationId: crypto.randomUUID(),
      ledgerEntryId: crypto.randomUUID(),
      auditEventId: crypto.randomUUID(),
      clientId,
      contractId,
      packageId,
      packageLineId,
      name: data.deliverableName,
      description: nullableFormValue(data.deliverableDescription),
      type: data.deliverableType,
      priority: data.deliverablePriority as DeliverablePriority,
      ownerUserId: nullableFormValue(data.ownerUserId),
      contributorUserIds: data.contributorUserIds,
      startDate: nullableFormValue(data.startDate),
      internalDueDate: nullableFormValue(data.internalDueDate),
      clientDueDate: nullableFormValue(data.clientDueDate),
      finalDueDate: nullableFormValue(data.finalDueDate),
      requiresInternalApproval: data.requiresInternalApproval,
      requiresClientApproval: data.requiresClientApproval,
      reservedQuantity: data.reservedQuantity,
      idempotencyKey: deliverableIdempotencyKey,
    },
  });

  if (!deliverableResult.ok) {
    return onboardingFormError({
      message: mapDeliverableWriteError(asDeliverableWriteError(deliverableResult.error)),
      values,
    });
  }

  revalidatePath("/clients");
  redirect(`/clients/${clientId}?onboarded=1`);
}

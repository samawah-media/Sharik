"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { evaluatePermission } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
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
import {
  asDeliverableWriteError,
  validateDeliverableIdentifierFields,
} from "./deliverable-write-errors";
import { onboardFirstClientViaRpc } from "./onboarding-write-rpc";

const saveFailureMessage = "تعذر إكمال الإضافة بأمان. حاول مرة أخرى.";
const validationFailureMessage = "راجع البيانات ثم حاول مرة أخرى.";
const permissionFailureMessage = "لا يمكنك إضافة عميل جديد.";
const duplicateClientMessage = "يوجد عميل بنفس الاسم داخل هذا النطاق.";

const mapOnboardingError = (error: { code?: string; message?: string }) => {
  const { code, message } = error;

  if (code === "23505") {
    return duplicateClientMessage;
  }

  if (code === "42501" && message === "insufficient package capacity") {
    return "لا توجد سعة كافية في سطر الباقة. راجع الكميات ثم حاول مرة أخرى.";
  }

  if (code === "42501" && message === "invalid onboarding team member") {
    return "تعذر إسناد أحد أعضاء الفريق. ارجع إلى خطوة الفريق واختر عضوًا متاحًا.";
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

  const onboardingResult = await onboardFirstClientViaRpc({ supabase, data });

  if (!onboardingResult.ok) {
    return onboardingFormError({
      message: mapOnboardingError(asDeliverableWriteError(onboardingResult.error)),
      values,
    });
  }

  const clientId = onboardingResult.value.result_client_id;
  revalidatePath("/clients");
  redirect(`/clients/${clientId}?onboarded=1`);
}

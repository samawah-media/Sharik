export type OnboardingFormValues = {
  runId?: string;
  clientName?: string;
  clientContactName?: string;
  clientContactEmail?: string;
  contractName?: string;
  contractReference?: string;
  contractSummary?: string;
  contractPeriodStart?: string;
  contractPeriodEnd?: string;
  packageName?: string;
  packagePeriodStart?: string;
  packagePeriodEnd?: string;
  packageLinesJson?: string;
  deliverableName?: string;
  deliverableDescription?: string;
  deliverableType?: string;
  ownerUserId?: string;
  contributorUserIds?: string;
  startDate?: string;
  internalDueDate?: string;
  clientDueDate?: string;
  finalDueDate?: string;
  reservedQuantity?: string;
};

export type OnboardingFormState = {
  status: "idle" | "error";
  message?: string;
  values?: OnboardingFormValues;
};

export const initialOnboardingFormState: OnboardingFormState = {
  status: "idle",
};

export const onboardingFormError = ({
  message,
  values,
}: {
  message: string;
  values?: OnboardingFormValues;
}): OnboardingFormState => ({
  status: "error",
  message,
  values,
});

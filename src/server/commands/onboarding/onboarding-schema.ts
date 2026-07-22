import { z } from "zod";
import { contractStatuses } from "@/modules/contracts/contract-repository";
import { packageStatuses } from "@/modules/packages/package-repository";
import { deliverablePriorities } from "@/modules/deliverables/deliverable-repository";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined));

const optionalDate = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  },
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
);

export const onboardingPackageLineSchema = z.object({
  serviceLabel: z.string().trim().min(2).max(120),
  deliverableTypeHint: optionalText(80),
  unitLabel: z.string().trim().min(1).max(60),
  committedQuantity: z.coerce.number().min(0).max(100000),
});

export const onboardingSchema = z
  .object({
    runId: z.string().trim().min(8).max(120),
    clientName: z.string().trim().min(2).max(120),
    clientContactName: optionalText(120),
    clientContactEmail: z
      .string()
      .trim()
      .email()
      .optional()
      .or(z.literal("")),
    contractName: z.string().trim().min(2).max(160),
    contractReference: optionalText(80),
    contractSummary: optionalText(500),
    contractPeriodStart: optionalDate,
    contractPeriodEnd: optionalDate,
    contractStatus: z.enum(contractStatuses).default("active"),
    packageName: z.string().trim().min(2).max(160),
    packagePeriodStart: optionalDate,
    packagePeriodEnd: optionalDate,
    packageStatus: z.enum(packageStatuses).default("active"),
    packageLines: z.array(onboardingPackageLineSchema).min(1).max(25),
    deliverableName: z.string().trim().min(2).max(160),
    deliverableDescription: optionalText(1000),
    deliverableType: z.string().trim().min(1).max(80),
    deliverablePriority: z.enum(deliverablePriorities).default("normal"),
    ownerUserId: optionalText(120),
    contributorUserIds: z
      .array(z.string().trim().min(1))
      .max(20)
      .default([]),
    startDate: optionalDate,
    internalDueDate: optionalDate,
    clientDueDate: optionalDate,
    finalDueDate: optionalDate,
    requiresInternalApproval: z.coerce.boolean().default(true),
    requiresClientApproval: z.coerce.boolean().default(true),
    reservedQuantity: z.coerce.number().min(1).max(100000).default(1),
  })
  .superRefine((value, context) => {
    if (
      value.contractPeriodStart &&
      value.contractPeriodEnd &&
      value.contractPeriodStart > value.contractPeriodEnd
    ) {
      context.addIssue({
        code: "custom",
        message: "contract_period_start_after_end",
        path: ["contractPeriodEnd"],
      });
    }

    if (
      value.packagePeriodStart &&
      value.packagePeriodEnd &&
      value.packagePeriodStart > value.packagePeriodEnd
    ) {
      context.addIssue({
        code: "custom",
        message: "package_period_start_after_end",
        path: ["packagePeriodEnd"],
      });
    }

    const dates = [
      value.startDate,
      value.internalDueDate,
      value.clientDueDate,
      value.finalDueDate,
    ].filter(Boolean) as string[];

    if (dates.some((date, index) => index > 0 && date < dates[index - 1])) {
      context.addIssue({
        code: "custom",
        message: "deliverable_dates_out_of_order",
        path: ["finalDueDate"],
      });
    }

    const firstLineQuantity = value.packageLines[0]?.committedQuantity ?? 0;
    if (value.reservedQuantity > firstLineQuantity) {
      context.addIssue({
        code: "custom",
        message: "reserved_quantity_exceeds_package_capacity",
        path: ["reservedQuantity"],
      });
    }
  });

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const parseOnboardingLinesJson = (
  raw: string | undefined,
): z.infer<typeof onboardingPackageLineSchema>[] => {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((line) => ({
      serviceLabel: String(line.serviceLabel ?? "").trim(),
      deliverableTypeHint: line.deliverableTypeHint
        ? String(line.deliverableTypeHint)
        : undefined,
      unitLabel: String(line.unitLabel ?? "").trim(),
      committedQuantity: Number(line.committedQuantity ?? 0),
    }));
  } catch {
    return [];
  }
};

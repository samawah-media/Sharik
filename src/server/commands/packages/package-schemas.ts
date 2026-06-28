import { z } from "zod";
import { packageStatuses } from "@/modules/packages/package-repository";

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

export const createPackageLineSchema = z.object({
  serviceLabel: z.string().trim().min(2).max(120),
  deliverableTypeHint: optionalText(80),
  unitLabel: z.string().trim().min(1).max(60),
  committedQuantity: z.coerce.number().min(0).max(100000),
});

export const createPackageSchema = z
  .object({
    clientId: z.string().trim().min(1),
    contractId: z.string().trim().min(1),
    name: z.string().trim().min(2).max(160),
    periodStart: optionalDate,
    periodEnd: optionalDate,
    status: z.enum(packageStatuses).default("draft"),
    lines: z.array(createPackageLineSchema).min(1).max(25),
    idempotencyKey: z.string().trim().min(8).max(120),
  })
  .superRefine((value, context) => {
    if (
      value.periodStart &&
      value.periodEnd &&
      value.periodStart > value.periodEnd
    ) {
      context.addIssue({
        code: "custom",
        message: "period_start_after_period_end",
        path: ["periodEnd"],
      });
    }
  });

export const adjustPackageSchema = z.object({
  packageLineId: z.string().trim().min(1),
  adjustmentQuantity: z.coerce.number().min(-100000).max(100000).refine(
    (value) => value !== 0,
    "adjustment_quantity_required",
  ),
  reason: z.string().trim().min(3).max(500),
  idempotencyKey: z.string().trim().min(8).max(120),
});

export type CreatePackageInput = z.infer<typeof createPackageSchema>;
export type AdjustPackageInput = z.infer<typeof adjustPackageSchema>;

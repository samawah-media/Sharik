import { z } from "zod";
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

const contributorUserIds = z
  .array(z.string().trim().min(1))
  .max(20)
  .default([]);

const deliverableBaseSchema = z
  .object({
    clientId: z.string().trim().min(1),
    name: z.string().trim().min(2).max(160),
    description: optionalText(1000),
    type: z.string().trim().min(1).max(80),
    priority: z.enum(deliverablePriorities).default("normal"),
    ownerUserId: optionalText(120),
    contributorUserIds,
    startDate: optionalDate,
    internalDueDate: optionalDate,
    clientDueDate: optionalDate,
    finalDueDate: optionalDate,
    requiresInternalApproval: z.coerce.boolean().default(true),
    requiresClientApproval: z.coerce.boolean().default(true),
    idempotencyKey: z.string().trim().min(8).max(120),
  })
  .superRefine((value, context) => {
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
  });

export const createDeliverableSchema = deliverableBaseSchema.extend({
  contractId: z.string().trim().min(1),
  packageId: z.string().trim().min(1),
  packageLineId: z.string().trim().min(1),
  reservedQuantity: z.coerce.number().min(1).max(100000),
});

export const createApprovedExtraDeliverableSchema = deliverableBaseSchema.extend({
  extraReason: z.string().trim().min(3).max(500),
});

export type CreateDeliverableInput = z.infer<typeof createDeliverableSchema>;
export type CreateApprovedExtraDeliverableInput = z.infer<
  typeof createApprovedExtraDeliverableSchema
>;

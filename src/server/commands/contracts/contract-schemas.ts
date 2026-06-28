import { z } from "zod";
import { contractStatuses } from "@/modules/contracts/contract-repository";

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

export const createContractSchema = z
  .object({
    clientId: z.string().trim().min(1),
    name: z.string().trim().min(2).max(160),
    reference: optionalText(80),
    summary: optionalText(500),
    periodStart: optionalDate,
    periodEnd: optionalDate,
    status: z.enum(contractStatuses).default("draft"),
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

export type CreateContractInput = z.infer<typeof createContractSchema>;

import { z } from "zod";

const approvalCommandBaseSchema = z.object({
  clientId: z.string().trim().min(1),
  deliverableId: z.string().trim().min(1),
  versionId: z.string().trim().min(1),
  expectedRevision: z.coerce.number().int().positive().optional(),
  reason: z.string().trim().max(500).optional().or(z.literal("")),
  idempotencyKey: z.string().trim().min(8).max(120),
});

export const internalApprovalCommandSchema = approvalCommandBaseSchema;
export const internalChangesCommandSchema = approvalCommandBaseSchema.extend({
  reason: z.string().trim().min(3).max(500),
});
export const sendToClientCommandSchema = approvalCommandBaseSchema;
export const clientApprovalCommandSchema = approvalCommandBaseSchema;
export const clientChangesCommandSchema = approvalCommandBaseSchema.extend({
  reason: z.string().trim().min(3).max(500),
});

export type InternalApprovalCommandInput = z.infer<
  typeof internalApprovalCommandSchema
>;
export type InternalChangesCommandInput = z.infer<
  typeof internalChangesCommandSchema
>;
export type SendToClientCommandInput = z.infer<typeof sendToClientCommandSchema>;
export type ClientApprovalCommandInput = z.infer<
  typeof clientApprovalCommandSchema
>;
export type ClientChangesCommandInput = z.infer<
  typeof clientChangesCommandSchema
>;


import { z } from "zod";

export const versionContentInputSchema = z.object({
  clientId: z.string().uuid(),
  deliverableId: z.string().uuid(),
  versionId: z.string().uuid(),
  versionNumber: z.number().int().positive(),
  submit: z.boolean(),
  brief: z.string().trim().max(20_000),
  contentBody: z.string().trim().max(20_000),
  caption: z.string().trim().max(20_000),
  channel: z.string().trim().max(120),
  format: z.string().trim().max(120),
  objective: z.string().trim().max(500),
  kpi: z.string().trim().max(500),
  sourceReference: z.string().trim().max(1_000),
  idempotencyKey: z.string().min(8).max(200),
});

export const workspaceCommentInputSchema = z.object({
  clientId: z.string().uuid(),
  deliverableId: z.string().uuid(),
  versionId: z.string().uuid(),
  visibility: z.enum(["internal_only", "client_visible"]),
  body: z.string().trim().min(1).max(10_000),
  bodyJson: z.unknown().optional(),
  idempotencyKey: z.string().min(8).max(200),
});

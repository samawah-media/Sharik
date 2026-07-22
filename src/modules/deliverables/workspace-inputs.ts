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

export const taskStatusSchema = z.enum(["todo", "in_progress", "done", "cancelled"]);
export const taskPrioritySchema = z.enum(["low", "normal", "high", "urgent"]);

export const deliverableTaskInputSchema = z.object({
  clientId: z.string().uuid(),
  deliverableId: z.string().uuid(),
  taskId: z.string().uuid().nullable(),
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(2_000).optional(),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  assigneeUserId: z.string().uuid().nullable().optional(),
  dueDate: z.string().date().nullable().optional(),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
  idempotencyKey: z.string().min(8).max(200),
});

export const deleteTaskInputSchema = z.object({
  clientId: z.string().uuid(),
  deliverableId: z.string().uuid(),
  taskId: z.string().uuid(),
  idempotencyKey: z.string().min(8).max(200),
});

export const qualityCheckStatusSchema = z.enum([
  "pending",
  "passed",
  "changes_required",
  "not_applicable",
]);

export const qualityCheckInputSchema = z.object({
  clientId: z.string().uuid(),
  deliverableId: z.string().uuid(),
  versionId: z.string().uuid(),
  checkId: z.string().uuid().nullable(),
  label: z.string().trim().min(2).max(200),
  status: qualityCheckStatusSchema,
  note: z.string().trim().max(2_000).optional(),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
  idempotencyKey: z.string().min(8).max(200),
});

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveRuntimeContext } from "@/server/auth/runtime-context";
import { evaluatePermission } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import {
  versionContentInputSchema,
  workspaceCommentInputSchema,
  deliverableTaskInputSchema,
  deleteTaskInputSchema,
  qualityCheckInputSchema,
} from "@/modules/deliverables/workspace-inputs";
import { listScopedDeliverableWorkspaces } from "./deliverable-workspace-read";
import { updateDeliverableStatusViaRpc } from "./deliverable-write-rpc";

const boardMoveSchema = z.object({
  clientId: z.string().uuid(),
  deliverableId: z.string().uuid(),
  toStatus: z.enum(["not_started", "in_progress"]),
  expectedRevision: z.number().int().positive(),
  idempotencyKey: z.string().min(8).max(200),
});

const registerFileSchema = z.object({
  fileId: z.string().uuid(),
  clientId: z.string().uuid(),
  deliverableId: z.string().uuid(),
  versionId: z.string().uuid(),
  bucketId: z.literal("deliverable-assets"),
  storagePath: z.string().min(10).max(1_000),
  fileName: z.string().trim().min(1).max(255),
  fileType: z.enum(["image/jpeg","image/png","image/webp","image/gif","video/mp4","video/webm","application/pdf","text/plain"]),
  fileSize: z.number().int().positive().max(104_857_600),
  visibility: z.enum(["internal_only","client_visible","client_uploaded","final_delivery"]),
  isFinal: z.boolean(),
  idempotencyKey: z.string().min(8).max(200),
});

export async function saveOrSubmitVersionContent(
  input: z.input<typeof versionContentInputSchema>,
) {
  const parsed = versionContentInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, reason: "invalid_input" as const };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("s015_save_or_submit_version", {
    target_client_id: parsed.data.clientId,
    target_deliverable_id: parsed.data.deliverableId,
    target_version_id: parsed.data.versionId,
    target_version_number: parsed.data.versionNumber,
    target_submit: parsed.data.submit,
    target_brief: parsed.data.brief,
    target_content_body: parsed.data.contentBody,
    target_caption: parsed.data.caption,
    target_channel: parsed.data.channel,
    target_format: parsed.data.format,
    target_objective: parsed.data.objective,
    target_kpi: parsed.data.kpi,
    target_source_reference: parsed.data.sourceReference,
    request_id: crypto.randomUUID(),
    audit_event_id: crypto.randomUUID(),
    request_idempotency_key: parsed.data.idempotencyKey,
  });
  if (error) return { ok: false as const, reason: "denied" as const };
  revalidatePath(`/clients/${parsed.data.clientId}/deliverables/board`);
  return { ok: true as const };
}

export async function addWorkspaceComment(
  input: z.input<typeof workspaceCommentInputSchema>,
) {
  const parsed = workspaceCommentInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, reason: "invalid_input" as const };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("s015_add_workspace_comment", {
    target_client_id: parsed.data.clientId,
    target_deliverable_id: parsed.data.deliverableId,
    target_version_id: parsed.data.versionId,
    target_visibility: parsed.data.visibility,
    target_body: parsed.data.body,
    target_body_json: parsed.data.bodyJson ?? null,
    request_id: crypto.randomUUID(),
    audit_event_id: crypto.randomUUID(),
    request_idempotency_key: parsed.data.idempotencyKey,
  });
  if (error) return { ok: false as const, reason: "denied" as const };
  revalidatePath(`/clients/${parsed.data.clientId}/deliverables/board`);
  revalidatePath("/client/pending");
  return { ok: true as const };
}

export async function moveDeliverableOnBoard(
  input: z.input<typeof boardMoveSchema>,
) {
  const parsed = boardMoveSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, reason: "invalid_input" as const };
  const supabase = await createSupabaseServerClient();
  const runtime = await resolveRuntimeContext(supabase);
  if (!runtime.ok) return { ok: false as const, reason: "denied" as const };
  const scopedClient = runtime.clients.find(
    (client) =>
      client.id === parsed.data.clientId &&
      client.tenantId === runtime.actor.tenantId &&
      client.status === "active",
  );
  if (
    !scopedClient ||
    !evaluatePermission({
      actor: runtime.actor,
      permission: PERMISSIONS.DELIVERABLE_STATUS_UPDATE,
      resource: { tenantId: scopedClient.tenantId, clientId: scopedClient.id },
    }).allowed
  ) {
    return { ok: false as const, reason: "denied" as const };
  }
  const result = await updateDeliverableStatusViaRpc({
    supabase,
    input: {
      deliverableId: parsed.data.deliverableId,
      auditEventId: crypto.randomUUID(),
      clientId: parsed.data.clientId,
      toStatus: parsed.data.toStatus,
      expectedRevision: parsed.data.expectedRevision,
      reason: "kanban_drag",
      idempotencyKey: parsed.data.idempotencyKey,
    },
  });
  if (!result.ok) return { ok: false as const, reason: "denied" as const };
  revalidatePath(`/clients/${parsed.data.clientId}/deliverables/board`);
  return { ok: true as const };
}

export async function registerWorkspaceFile(
  input: z.input<typeof registerFileSchema>,
) {
  const parsed = registerFileSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, reason: "invalid_input" as const };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("s015_register_file_asset", {
    target_file_id: parsed.data.fileId,
    target_client_id: parsed.data.clientId,
    target_deliverable_id: parsed.data.deliverableId,
    target_version_id: parsed.data.versionId,
    target_bucket_id: parsed.data.bucketId,
    target_storage_path: parsed.data.storagePath,
    target_file_name: parsed.data.fileName,
    target_file_type: parsed.data.fileType,
    target_file_size: parsed.data.fileSize,
    target_visibility: parsed.data.visibility,
    target_is_final: parsed.data.isFinal,
    request_id: crypto.randomUUID(),
    audit_event_id: crypto.randomUUID(),
    request_idempotency_key: parsed.data.idempotencyKey,
  });
  if (error) return { ok: false as const, reason: "denied" as const };
  revalidatePath(`/clients/${parsed.data.clientId}/deliverables/board`);
  revalidatePath("/client/pending");
  return { ok: true as const };
}

export async function createWorkspaceFileDownload(fileId: string) {
  const parsed = z.string().uuid().safeParse(fileId);
  if (!parsed.success) return { ok: false as const, reason: "invalid_input" as const };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("s015_authorize_file_download", {
    target_file_id: parsed.data,
  });
  const authorized = Array.isArray(data) ? data[0] : data;
  if (error || !authorized) return { ok: false as const, reason: "denied" as const };
  const signed = await supabase.storage
    .from(authorized.bucket_id)
    .createSignedUrl(authorized.storage_path, 60, {
      download: authorized.file_name || true,
    });
  if (signed.error || !signed.data?.signedUrl) {
    return { ok: false as const, reason: "denied" as const };
  }
  return { ok: true as const, url: signed.data.signedUrl };
}

export async function upsertDeliverableTask(
  input: z.input<typeof deliverableTaskInputSchema>,
) {
  const parsed = deliverableTaskInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, reason: "invalid_input" as const };
  const supabase = await createSupabaseServerClient();
  const trimmedAssignee = parsed.data.assigneeUserId?.trim();
  const { error } = await supabase.rpc("s015_upsert_deliverable_task", {
    target_client_id: parsed.data.clientId,
    target_deliverable_id: parsed.data.deliverableId,
    target_task_id: parsed.data.taskId,
    target_title: parsed.data.title,
    target_description: parsed.data.description ?? "",
    target_status: parsed.data.status,
    target_priority: parsed.data.priority,
    target_assignee_user_id: trimmedAssignee ? trimmedAssignee : null,
    target_due_date: parsed.data.dueDate?.trim() ? parsed.data.dueDate : null,
    target_sort_order: parsed.data.sortOrder ?? 0,
    request_id: crypto.randomUUID(),
    audit_event_id: crypto.randomUUID(),
    request_idempotency_key: parsed.data.idempotencyKey,
  });
  if (error) return { ok: false as const, reason: "denied" as const };
  revalidatePath(`/clients/${parsed.data.clientId}/deliverables/board`);
  return { ok: true as const };
}

export async function deleteDeliverableTask(
  input: z.input<typeof deleteTaskInputSchema>,
) {
  const parsed = deleteTaskInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, reason: "invalid_input" as const };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("s015_delete_deliverable_task", {
    target_client_id: parsed.data.clientId,
    target_deliverable_id: parsed.data.deliverableId,
    target_task_id: parsed.data.taskId,
    request_id: crypto.randomUUID(),
    audit_event_id: crypto.randomUUID(),
    request_idempotency_key: parsed.data.idempotencyKey,
  });
  if (error) return { ok: false as const, reason: "denied" as const };
  revalidatePath(`/clients/${parsed.data.clientId}/deliverables/board`);
  return { ok: true as const };
}

export async function upsertQualityCheck(
  input: z.input<typeof qualityCheckInputSchema>,
) {
  const parsed = qualityCheckInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, reason: "invalid_input" as const };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("s015_upsert_quality_check", {
    target_client_id: parsed.data.clientId,
    target_deliverable_id: parsed.data.deliverableId,
    target_version_id: parsed.data.versionId,
    target_check_id: parsed.data.checkId,
    target_label: parsed.data.label,
    target_status: parsed.data.status,
    target_note: parsed.data.note ?? "",
    target_sort_order: parsed.data.sortOrder ?? 0,
    request_id: crypto.randomUUID(),
    audit_event_id: crypto.randomUUID(),
    request_idempotency_key: parsed.data.idempotencyKey,
  });
  if (error) return { ok: false as const, reason: "denied" as const };
  revalidatePath(`/clients/${parsed.data.clientId}/deliverables/board`);
  return { ok: true as const };
}

const fetchWorkspaceSchema = z.object({
  clientId: z.string().uuid(),
  deliverableId: z.string().uuid(),
  currentVersionId: z.string().uuid().nullable().optional(),
});

export async function fetchDeliverableWorkspace(
  input: z.input<typeof fetchWorkspaceSchema>,
) {
  const parsed = fetchWorkspaceSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, reason: "invalid_input" as const };
  const supabase = await createSupabaseServerClient();
  const runtime = await resolveRuntimeContext(supabase);
  if (!runtime.ok) return { ok: false as const, reason: "denied" as const };
  const scopedClient = runtime.clients.find(
    (client) =>
      client.id === parsed.data.clientId &&
      client.tenantId === runtime.actor.tenantId &&
      client.status === "active",
  );
  if (!scopedClient) return { ok: false as const, reason: "denied" as const };
  const workspaces = await listScopedDeliverableWorkspaces({
    tenantId: scopedClient.tenantId,
    clientId: scopedClient.id,
    deliverables: [
      {
        id: parsed.data.deliverableId,
        currentVersionId: parsed.data.currentVersionId ?? undefined,
      },
    ],
    supabase,
    actorUserId: runtime.actor.userId,
  });
  const workspace = workspaces[parsed.data.deliverableId];
  if (!workspace) return { ok: false as const, reason: "denied" as const };
  return { ok: true as const, workspace };
}

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { ClientSafeDeliverableDetail } from "@/ui/client/client-deliverable-detail";

const decisionSchema = z.object({
  clientId: z.string().uuid(),
  deliverableId: z.string().uuid(),
  versionId: z.string().uuid(),
  decision: z.enum(["approved", "changes_requested"]),
  comment: z.string().trim().max(2000).optional(),
  idempotencyKey: z.string().trim().min(8).max(200),
});

export type PersistentClientDecisionInput = z.infer<typeof decisionSchema>;

export type PersistentClientApprovalInboxItem = ClientSafeDeliverableDetail;

const clientVisibleDeliverableStatuses = [
  "waiting_client_approval",
  "client_approved",
  "ready_for_delivery",
  "delivered",
] as const;

type ClientVisibleDeliverable = {
  id: string;
  client_id: string;
  name: string;
  type: string;
  status: string;
  progress_percentage: number;
  client_due_date: string | null;
  revision: number;
  current_version_id: string;
};

async function readClientApprovalDetails(
  supabase: SupabaseClient,
  tenantId: string,
  clientId: string,
  statuses: readonly string[],
) {
  const { data, error } = await supabase
    .from("deliverables")
    .select("id, client_id, name, type, status, progress_percentage, client_due_date, revision, current_version_id")
    .eq("tenant_id", tenantId)
    .eq("client_id", clientId)
    .in("status", statuses)
    .not("current_version_id", "is", null)
    .order("updated_at", { ascending: false });

  if (error) return [];

  return Promise.all(
    ((data ?? []) as ClientVisibleDeliverable[]).map((deliverable) =>
      readClientApprovalDetailForDeliverable(supabase, tenantId, clientId, deliverable),
    ),
  ).then((details) => details.filter((detail): detail is ClientSafeDeliverableDetail => Boolean(detail)));
}

async function readClientApprovalDetailForDeliverable(
  supabase: SupabaseClient,
  tenantId: string,
  clientId: string,
  deliverable: ClientVisibleDeliverable,
): Promise<ClientSafeDeliverableDetail | undefined> {
  const [{ data: version, error: versionError }, filesResult, commentsResult] = await Promise.all([
    supabase
      .from("deliverable_versions")
      .select("id, version_number, status, brief, content_body, caption, channel, format, objective, kpi")
      .eq("tenant_id", tenantId)
      .eq("client_id", clientId)
      .eq("deliverable_id", deliverable.id)
      .eq("id", deliverable.current_version_id)
      .in("status", ["client_visible", "client_approved", "final"])
      .maybeSingle(),
    supabase
      .from("file_assets")
      .select("id, visibility, file_type, file_size, version_number, is_final, created_at")
      .eq("tenant_id", tenantId)
      .eq("client_id", clientId)
      .eq("deliverable_id", deliverable.id)
      .eq("version_id", deliverable.current_version_id)
      .in("visibility", ["client_visible", "client_uploaded", "final_delivery"]),
    supabase
      .from("comments")
      .select("id, body, created_at")
      .eq("tenant_id", tenantId)
      .eq("client_id", clientId)
      .eq("deliverable_id", deliverable.id)
      .eq("version_id", deliverable.current_version_id)
      .eq("visibility", "client_visible")
      .order("created_at", { ascending: true }),
  ]);

  if (versionError || !version || filesResult.error || commentsResult.error) return undefined;

  const delivered = deliverable.status === "delivered";
  return {
    approvalItem: {
      clientId,
      deliverableId: deliverable.id,
      versionId: version.id,
      expectedRevision: deliverable.revision,
      isActionable: !delivered && deliverable.status === "waiting_client_approval",
      displayName: deliverable.name,
      typeLabel: deliverable.type,
      statusLabel: delivered ? "تم التسليم" : deliverable.status === "waiting_client_approval" ? "بانتظار موافقتك" : "قيد التسليم",
      versionLabel: `النسخة ${version.version_number}`,
      dueDateLabel: deliverable.client_due_date ?? undefined,
    },
    statusLabel: delivered ? "تم التسليم" : deliverable.status === "waiting_client_approval" ? "بانتظار موافقتك" : "قيد التسليم",
    progressPercentage: deliverable.progress_percentage,
    content: {
      brief: version.brief ?? undefined,
      body: version.content_body ?? undefined,
      caption: version.caption ?? undefined,
      channel: version.channel ?? undefined,
      format: version.format ?? undefined,
      objective: version.objective ?? undefined,
      kpi: version.kpi ?? undefined,
    },
    files: (filesResult.data ?? []).map((file) => ({
      id: file.id,
      tenantId,
      clientId,
      relatedDeliverableId: deliverable.id,
      visibility: file.visibility,
      label: file.is_final ? "ملف التسليم النهائي" : "ملف المراجعة",
      fileType: file.file_type,
      fileSize: file.file_size,
      versionNumber: file.version_number,
      isFinal: file.is_final,
      createdAt: file.created_at,
    })),
    comments: (commentsResult.data ?? []).map((comment) => ({ id: comment.id, body: comment.body, createdAt: comment.created_at })),
  };
}

export async function readPersistentClientApprovalInbox({
  supabase,
  tenantId,
  clientId,
}: {
  supabase: SupabaseClient;
  tenantId: string;
  clientId: string;
}): Promise<PersistentClientApprovalInboxItem[]> {
  return readClientApprovalDetails(supabase, tenantId, clientId, ["waiting_client_approval"]);
}

export async function readPersistentClientApprovalDetail({
  supabase,
  tenantId,
  clientId,
}: {
  supabase: SupabaseClient;
  tenantId: string;
  clientId: string;
}): Promise<ClientSafeDeliverableDetail | undefined> {
  const details = await readClientApprovalDetails(supabase, tenantId, clientId, clientVisibleDeliverableStatuses);
  return details[0];
}

export async function decidePersistentClientVersion({
  supabase,
  input,
}: {
  supabase: SupabaseClient;
  input: PersistentClientDecisionInput;
}) {
  const parsed = decisionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, reason: "invalid_input" as const };
  }

  const { error } = await supabase.rpc("s015_client_decide_version", {
    target_client_id: parsed.data.clientId,
    target_deliverable_id: parsed.data.deliverableId,
    target_version_id: parsed.data.versionId,
    target_decision: parsed.data.decision,
    decision_comment: parsed.data.comment ?? null,
    request_id: crypto.randomUUID(),
    audit_event_id: crypto.randomUUID(),
    request_idempotency_key: parsed.data.idempotencyKey,
  });

  return error
    ? { ok: false as const, reason: "denied" as const }
    : { ok: true as const };
}

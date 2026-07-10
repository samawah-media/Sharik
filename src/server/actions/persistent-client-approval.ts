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

export async function readPersistentClientApprovalDetail({
  supabase,
  tenantId,
  clientId,
}: {
  supabase: SupabaseClient;
  tenantId: string;
  clientId: string;
}): Promise<ClientSafeDeliverableDetail | undefined> {
  const { data: deliverable, error: deliverableError } = await supabase
    .from("deliverables")
    .select("id, client_id, name, type, status, progress_percentage, client_due_date, revision, current_version_id")
    .eq("tenant_id", tenantId)
    .eq("client_id", clientId)
    .in("status", ["waiting_client_approval", "delivered"])
    .not("current_version_id", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (deliverableError || !deliverable?.current_version_id) {
    return undefined;
  }

  const [{ data: version, error: versionError }, filesResult, commentsResult] =
    await Promise.all([
      supabase
        .from("deliverable_versions")
        .select("id, version_number, status")
        .eq("tenant_id", tenantId)
        .eq("client_id", clientId)
        .eq("deliverable_id", deliverable.id)
        .eq("id", deliverable.current_version_id)
        .in("status", ["client_visible", "final"])
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

  if (versionError || !version || filesResult.error || commentsResult.error) {
    return undefined;
  }

  const delivered = deliverable.status === "delivered";

  return {
    approvalItem: {
      clientId,
      deliverableId: deliverable.id,
      versionId: version.id,
      expectedRevision: deliverable.revision,
      isActionable: !delivered,
      displayName: deliverable.name,
      typeLabel: deliverable.type,
      statusLabel: delivered ? "تم التسليم" : "بانتظار موافقتك",
      versionLabel: `النسخة ${version.version_number}`,
      dueDateLabel: deliverable.client_due_date ?? undefined,
    },
    statusLabel: delivered ? "تم التسليم" : "بانتظار موافقتك",
    progressPercentage: deliverable.progress_percentage,
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
    comments: (commentsResult.data ?? []).map((comment) => ({
      id: comment.id,
      body: comment.body,
      createdAt: comment.created_at,
    })),
  };
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

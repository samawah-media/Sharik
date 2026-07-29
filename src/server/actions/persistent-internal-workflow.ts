import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

export const persistentInternalWorkflowSchema = z.object({
  clientId: z.string().uuid(),
  deliverableId: z.string().uuid(),
  versionId: z.string().uuid(),
  command: z.enum([
    "submit_version",
    "approve_internal",
    "request_internal_changes",
    "send_to_client",
    "prepare_delivery",
    "deliver",
  ]),
  versionNumber: z.number().int().positive().optional(),
  comment: z.string().trim().max(2000).optional(),
  idempotencyKey: z.string().trim().min(8).max(200),
});

export async function executePersistentInternalWorkflow({
  supabase,
  input,
}: {
  supabase: SupabaseClient;
  input: z.input<typeof persistentInternalWorkflowSchema>;
}) {
  const parsed = persistentInternalWorkflowSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, reason: "invalid_input" as const };
  }

  const shared = {
    target_client_id: parsed.data.clientId,
    target_deliverable_id: parsed.data.deliverableId,
    target_version_id: parsed.data.versionId,
    request_id: crypto.randomUUID(),
    audit_event_id: crypto.randomUUID(),
    request_idempotency_key: parsed.data.idempotencyKey,
  };
  const result =
    parsed.data.command === "prepare_delivery"
      ? await supabase.rpc("s015_prepare_delivery", shared)
      : parsed.data.command === "deliver"
        ? await supabase.rpc("s015_deliver_ready_version", shared)
        : await supabase.rpc("s015_execute_internal_workflow", {
            ...shared,
            target_command: parsed.data.command,
            target_version_number: parsed.data.versionNumber ?? null,
            command_comment: parsed.data.comment ?? null,
          });

  return result.error
    ? { ok: false as const, reason: "denied" as const }
    : { ok: true as const };
}

import type { SupabaseClient } from "@supabase/supabase-js";
import { toClientSlug } from "@/modules/clients/client-repository";
import type { OnboardingInput } from "@/server/commands/onboarding/onboarding-schema";

type OnboardingWriteRow = {
  result_client_id: string;
  result_contract_id: string;
  result_package_id: string;
  result_deliverable_id: string;
};

const selectSingleRow = (data: unknown): OnboardingWriteRow | undefined => {
  if (Array.isArray(data)) return data[0] as OnboardingWriteRow | undefined;
  return data as OnboardingWriteRow | undefined;
};

const nullable = (value: string | undefined) => value?.trim() || null;

export const onboardFirstClientViaRpc = async ({
  supabase,
  data,
}: {
  supabase: SupabaseClient;
  data: OnboardingInput;
}) => {
  const packageLines = data.packageLines.map((line) => ({
    id: crypto.randomUUID(),
    ledger_entry_id: crypto.randomUUID(),
    service_label: line.serviceLabel,
    deliverable_type_hint: nullable(line.deliverableTypeHint),
    unit_label: line.unitLabel,
    committed_quantity: line.committedQuantity,
  }));

  const { data: result, error } = await supabase.rpc(
    "s015_onboard_first_client",
    {
      request_idempotency_key: data.runId,
      client_id_input: crypto.randomUUID(),
      client_audit_event_id: crypto.randomUUID(),
      client_name_input: data.clientName,
      client_slug_input: toClientSlug(data.clientName),
      client_contact_name_input: nullable(data.clientContactName),
      client_contact_email_input: nullable(data.clientContactEmail),
      contract_id_input: crypto.randomUUID(),
      contract_audit_event_id: crypto.randomUUID(),
      contract_name_input: data.contractName,
      contract_reference_input: nullable(data.contractReference),
      contract_summary_input: nullable(data.contractSummary),
      contract_period_start_input: nullable(data.contractPeriodStart),
      contract_period_end_input: nullable(data.contractPeriodEnd),
      contract_status_input: data.contractStatus,
      package_id_input: crypto.randomUUID(),
      package_audit_event_id: crypto.randomUUID(),
      package_name_input: data.packageName,
      package_status_input: data.packageStatus,
      package_period_start_input: nullable(data.packagePeriodStart),
      package_period_end_input: nullable(data.packagePeriodEnd),
      package_line_items_input: packageLines,
      deliverable_id_input: crypto.randomUUID(),
      allocation_id_input: crypto.randomUUID(),
      deliverable_ledger_entry_id: crypto.randomUUID(),
      deliverable_audit_event_id: crypto.randomUUID(),
      deliverable_name_input: data.deliverableName,
      deliverable_description_input: nullable(data.deliverableDescription),
      deliverable_type_input: data.deliverableType,
      deliverable_priority_input: data.deliverablePriority,
      owner_user_id_input: nullable(data.ownerUserId),
      contributor_user_ids_input: data.contributorUserIds,
      start_on_input: nullable(data.startDate),
      internal_due_on_input: nullable(data.internalDueDate),
      client_due_on_input: nullable(data.clientDueDate),
      final_due_on_input: nullable(data.finalDueDate),
      requires_internal_approval_input: data.requiresInternalApproval,
      requires_client_approval_input: data.requiresClientApproval,
      reserved_quantity_input: data.reservedQuantity,
    },
  );

  if (error) return { ok: false as const, error };

  const row = selectSingleRow(result);
  if (!row?.result_client_id) {
    return { ok: false as const, error: { code: "PGRST116" } };
  }

  return { ok: true as const, value: row };
};

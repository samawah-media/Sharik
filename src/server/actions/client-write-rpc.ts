import type { SupabaseClient } from "@supabase/supabase-js";
import type { ClientRecord } from "@/modules/clients/client-repository";

type ClientWriteRow = {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  status: string;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  revision: number | null;
};

const selectSingleRow = (data: unknown): ClientWriteRow | undefined => {
  if (Array.isArray(data)) {
    return data[0] as ClientWriteRow | undefined;
  }

  return data as ClientWriteRow | undefined;
};

export const toClientRecordFromWriteRow = (row: ClientWriteRow): ClientRecord => ({
  id: row.id,
  tenantId: row.tenant_id,
  name: row.name,
  slug: row.slug,
  status: row.status === "archived" ? "archived" : "active",
  primaryContactName: row.primary_contact_name ?? undefined,
  primaryContactEmail: row.primary_contact_email ?? undefined,
  primaryContactPhone: row.primary_contact_phone ?? undefined,
  createdBy: row.created_by ?? "system",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  revision: row.revision ?? 1,
});

export const createClientViaRpc = async ({
  supabase,
  input,
}: {
  supabase: SupabaseClient;
  input: {
    clientId: string;
    auditEventId: string;
    name: string;
    slug: string;
    primaryContactName: string | null;
    primaryContactEmail: string | null;
    primaryContactPhone: string | null;
  };
}) => {
  const { data, error } = await supabase.rpc("f001_create_client_write", {
    client_id: input.clientId,
    audit_event_id: input.auditEventId,
    client_name: input.name,
    client_slug: input.slug,
    new_primary_contact_name: input.primaryContactName,
    new_primary_contact_email: input.primaryContactEmail,
    new_primary_contact_phone: input.primaryContactPhone,
  });

  if (error) {
    return { ok: false as const, error };
  }

  const row = selectSingleRow(data);

  if (!row) {
    return { ok: false as const, error: { code: "PGRST116" } };
  }

  return { ok: true as const, value: toClientRecordFromWriteRow(row) };
};

export const updateClientViaRpc = async ({
  supabase,
  input,
}: {
  supabase: SupabaseClient;
  input: {
    clientId: string;
    auditEventId: string;
    name: string;
    slug: string;
    primaryContactName: string | null;
    primaryContactEmail: string | null;
    primaryContactPhone: string | null;
    expectedRevision: number;
  };
}) => {
  const { data, error } = await supabase.rpc("f001_update_client_write", {
    target_client_id: input.clientId,
    audit_event_id: input.auditEventId,
    client_name: input.name,
    client_slug: input.slug,
    new_primary_contact_name: input.primaryContactName,
    new_primary_contact_email: input.primaryContactEmail,
    new_primary_contact_phone: input.primaryContactPhone,
    expected_revision: input.expectedRevision,
  });

  if (error) {
    return { ok: false as const, error };
  }

  const row = selectSingleRow(data);

  if (!row) {
    return { ok: false as const, error: { code: "PGRST116" } };
  }

  return { ok: true as const, value: toClientRecordFromWriteRow(row) };
};

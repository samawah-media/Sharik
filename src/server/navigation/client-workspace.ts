import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RuntimeContext } from "@/server/auth/runtime-context";
import type { ClientRecord } from "@/modules/clients/client-repository";
import { cookies } from "next/headers";
import {
  getClientWorkspaces,
  selectClientWorkspace,
} from "@/server/auth/client-workspace";

export const CLIENT_WORKSPACE_COOKIE = "samawah-client-workspace";

export async function readClientWorkspace(
  runtime: RuntimeContext,
): Promise<{
  clients: ClientRecord[];
  selectedClient: ClientRecord | undefined;
}> {
  const clients = getClientWorkspaces(runtime);
  if (!runtime.ok || clients.length === 0)
    return { clients, selectedClient: undefined };
  const stored = (await cookies())
    .get(CLIENT_WORKSPACE_COOKIE)
    ?.value.split(".");
  const preferredId =
    stored?.length === 3 &&
    stored[0] === runtime.actor.userId &&
    stored[1] === runtime.actor.tenantId
      ? stored[2]
      : undefined;
  return {
    clients,
    selectedClient: selectClientWorkspace(runtime, preferredId),
  };
}
export async function readClientForDeliverable({
  runtime,
  supabase,
  deliverableId,
}: {
  runtime: RuntimeContext;
  supabase: SupabaseClient;
  deliverableId: string;
}): Promise<ClientRecord | undefined> {
  const clients = getClientWorkspaces(runtime);
  if (!runtime.ok || clients.length === 0) return undefined;
  // The preference must not retarget a bookmarked detail or an already open form.
  const { data: deliverable, error } = await supabase
    .from("deliverables")
    .select("client_id")
    .eq("tenant_id", runtime.actor.tenantId)
    .eq("id", deliverableId)
    .in(
      "client_id",
      clients.map((client) => client.id),
    )
    .maybeSingle();
  if (error || !deliverable) return undefined;
  return clients.find((client) => client.id === deliverable.client_id);
}

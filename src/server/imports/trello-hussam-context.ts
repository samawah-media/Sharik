import "server-only";

import { evaluatePermission } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import {
  HUSSAM_TRELLO_BOARD_ID,
  HUSSAM_TRELLO_BOARD_SHORT_ID,
  HUSSAM_TRELLO_TARGET_CLIENT_ID,
  trelloHussamBoardSchema,
} from "@/modules/imports/trello-hussam";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveRuntimeContext } from "@/server/auth/runtime-context";

const MAX_TRELLO_RESPONSE_BYTES = 5_000_000;

export type HussamImportContext = {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  tenantId: string;
};

export async function authorizedHussamImportContext(): Promise<
  HussamImportContext | undefined
> {
  const supabase = await createSupabaseServerClient();
  const runtime = await resolveRuntimeContext(supabase);
  if (!runtime.ok) return undefined;

  const targetClient = runtime.clients.find(
    (client) =>
      client.id === HUSSAM_TRELLO_TARGET_CLIENT_ID &&
      client.tenantId === runtime.actor.tenantId &&
      client.status === "active",
  );
  const resource = {
    tenantId: runtime.actor.tenantId,
    clientId: HUSSAM_TRELLO_TARGET_CLIENT_ID,
  };
  const canCreate = evaluatePermission({
    actor: runtime.actor,
    permission: PERMISSIONS.DELIVERABLE_CREATE,
    resource,
  }).allowed;
  const canViewBalance = evaluatePermission({
    actor: runtime.actor,
    permission: PERMISSIONS.LEDGER_VIEW_SUMMARY,
    resource,
  }).allowed;
  return canCreate && canViewBalance && targetClient
    ? { supabase, tenantId: runtime.actor.tenantId }
    : undefined;
}

export async function fetchHussamTrelloBoard() {
  const response = await fetch(
    `https://trello.com/b/${HUSSAM_TRELLO_BOARD_SHORT_ID}.json`,
    {
      cache: "no-store",
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    },
  );
  if (!response.ok) throw new Error("TRELLO_BOARD_UNAVAILABLE");
  const declaredLength = Number(response.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_TRELLO_RESPONSE_BYTES) {
    throw new Error("TRELLO_BOARD_TOO_LARGE");
  }
  const payload = await response.text();
  if (Buffer.byteLength(payload, "utf8") > MAX_TRELLO_RESPONSE_BYTES) {
    throw new Error("TRELLO_BOARD_TOO_LARGE");
  }
  const board = trelloHussamBoardSchema.parse(JSON.parse(payload));
  if (board.id !== HUSSAM_TRELLO_BOARD_ID) {
    throw new Error("TRELLO_BOARD_ID_MISMATCH");
  }
  return board;
}

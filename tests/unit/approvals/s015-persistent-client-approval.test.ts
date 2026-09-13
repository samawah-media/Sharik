import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  decidePersistentClientVersion,
  readPersistentClientWorkDetail,
  readPersistentClientApprovalInbox,
} from "@/server/actions/persistent-client-approval";
import { readCommercialSummary } from "@/server/actions/commercial-summary-read";

const validInput = {
  clientId: "00000000-0000-4000-8000-000000000001",
  deliverableId: "00000000-0000-4000-8000-000000000002",
  versionId: "00000000-0000-4000-8000-000000000003",
  decision: "approved" as const,
  comment: "موافق",
  idempotencyKey: "s015-client-decision-1",
};

type ReadRow = Record<string, unknown>;
type ReadResponse = { data: ReadRow[] | ReadRow | null; error: { message: string } | null };

function retainedReadStore(status = "in_progress") {
  const scope = { tenant_id: "tenant", client_id: "client" };
  const work = {
    ...scope, id: "work", name: "Published work", type: "post", status,
    current_version_id: "v3", progress_percentage: 30, revision: 4,
    import_run_id: null, contract_id: null, package_id: null, package_line_id: null,
    description: null, priority: "normal", owner_user_id: null, contributor_user_ids: [],
    start_date: null, internal_due_date: null, client_due_date: null, final_due_date: null,
    requires_internal_approval: true, requires_client_approval: true, approved_extra: false,
    created_by: "admin", created_at: "2026-09-10", updated_at: "2026-09-10", cancelled_at: null,
  };
  // Table RLS may expose team history; only the RPC supplies client publication identity.
  // Database tests own the actual authorization and send-history predicate.
  const tables: Record<string, ReadRow[]> = {
    deliverables: [work],
    deliverable_versions: [{
      ...scope, id: "v2", deliverable_id: "work", version_number: 2, status: "client_visible",
      brief: null, content_body: "SENT_V2_BODY", caption: null, channel: null,
      format: null, objective: null, kpi: null,
    }],
    file_assets: [{
      ...scope, id: "file-v2", deliverable_id: "work", version_id: "v2",
      visibility: "client_visible", file_name: "SENT_V2_FILE", file_type: "application/pdf",
      file_size: 120, version_number: 2, is_final: false, created_at: "2026-09-10",
    }],
    comments: [{
      ...scope, id: "comment-v2", deliverable_id: "work", version_id: "v2",
      visibility: "client_visible", body: "SENT_V2_COMMENT", created_at: "2026-09-10",
      author_user_id: null, comment_type: "client_comment",
    }],
  };
  const reads: Array<{ table: string; filters: Record<string, unknown> }> = [];
  const readableVersions = [{ deliverable_id: "work", version_id: "v2" }];
  const rpcCalls: Array<{ name: string; args: Record<string, unknown> }> = [];
  let failingTable: string | undefined;
  const supabase = {
    async rpc(name: string, args: {
      target_tenant_id: string;
      target_client_id: string;
      target_deliverable_ids: string[];
    }) {
      rpcCalls.push({ name, args });
      if (name !== "s015_client_readable_versions") throw new Error(`Unexpected RPC: ${name}`);
      if (failingTable === name) return { data: null, error: { message: "read_failed" } };
      const mappings = args.target_tenant_id === scope.tenant_id && args.target_client_id === scope.client_id
        ? readableVersions.filter((mapping) => args.target_deliverable_ids.includes(mapping.deliverable_id) &&
          tables.deliverable_versions.some((version) => version.id === mapping.version_id &&
            version.deliverable_id === mapping.deliverable_id))
        : [];
      return { data: mappings, error: null };
    },
    from(table: string) {
      const filters: Record<string, unknown> = {};
      const predicates: Array<(row: ReadRow) => boolean> = [];
      let maximum = Infinity;
      function response(single = false): ReadResponse {
        reads.push({ table, filters: { ...filters } });
        if (table === failingTable) return { data: null, error: { message: "read_failed" } };
        const rows = (tables[table] ?? []).filter((row) => predicates.every((test) => test(row))).slice(0, maximum);
        return { data: single ? rows[0] ?? null : rows, error: null };
      }
      const query = {
        select: () => query,
        eq(key: string, expected: unknown) {
          filters[key] = expected; predicates.push((row) => row[key] === expected); return query;
        },
        in(key: string, expected: unknown[]) {
          filters[key] = expected; predicates.push((row) => expected.includes(row[key])); return query;
        },
        not(key: string, _operator: string, expected: unknown) {
          predicates.push((row) => row[key] !== expected); return query;
        },
        order: () => query,
        limit(count: number) { maximum = count; return query; },
        maybeSingle: async () => response(true),
        then(resolve: (value: ReadResponse) => unknown, reject?: (reason: unknown) => unknown) {
          return Promise.resolve(response()).then(resolve, reject);
        },
      };
      return query;
    },
  } as unknown as SupabaseClient;
  return { tables, reads, readableVersions, rpcCalls, supabase, fail(table: string) { failingTable = table; } };
}

const workScope = { tenantId: "tenant", clientId: "client", deliverableId: "work" };

function exposeTeamVersionHistory(store: ReturnType<typeof retainedReadStore>) {
  const sentVersion = store.tables.deliverable_versions[0];
  store.tables.deliverable_versions.unshift({
    ...sentVersion, id: "v1", version_number: 1, content_body: "OBSOLETE_V1_SECRET",
  });
  store.tables.deliverable_versions.push({
    ...sentVersion, id: "v3", version_number: 3, status: "draft", content_body: "UNSENT_V3_SECRET",
  });
  store.tables.comments.push({
    ...store.tables.comments[0], id: "comment-v1", version_id: "v1", body: "OBSOLETE_V1_COMMENT",
  });
  store.tables.file_assets.push({
    ...store.tables.file_assets[0], id: "file-v1", version_id: "v1", file_name: "OBSOLETE_V1_FILE",
  });
}

describe("SIL-52 retained published client reads", () => {
  it.each(["in_progress", "ready_for_internal_review", "internal_changes_requested", "internally_approved"])(
    "retains sent v2 during %s with v2-only files/comments and safe read-only state", async (status) => {
      const store = retainedReadStore(status);
      const detail = await readPersistentClientWorkDetail({ supabase: store.supabase, ...workScope });
      expect(detail).toMatchObject({
        status: "client_changes_requested", statusLabel: "قيد التعديل لدى فريق سماوة",
        progressPercentage: 65, canComment: false,
        approvalItem: { versionId: "v2", isActionable: false, status: "client_changes_requested" },
        content: { body: "SENT_V2_BODY" },
        files: [{ id: "file-v2" }], comments: [{ body: "SENT_V2_COMMENT" }],
      });
      expect(store.reads.filter((read) => ["deliverable_versions", "file_assets", "comments"].includes(read.table)))
        .toEqual(expect.arrayContaining([
          { table: "deliverable_versions", filters: expect.objectContaining({ tenant_id: "tenant", client_id: "client", deliverable_id: "work" }) },
          { table: "file_assets", filters: expect.objectContaining({ tenant_id: "tenant", client_id: "client", deliverable_id: "work", version_id: "v2" }) },
          { table: "comments", filters: expect.objectContaining({ tenant_id: "tenant", client_id: "client", deliverable_id: "work", version_id: "v2" }) },
        ]));
    },
  );

  it("keeps rework out of the pending decision inbox", async () => {
    const store = retainedReadStore();
    expect(await readPersistentClientApprovalInbox({ supabase: store.supabase, ...workScope })).toEqual([]);
  });

  it("does not grant writes from a waiting status when the readable version is not current", async () => {
    const store = retainedReadStore("waiting_client_approval");
    expect(await readPersistentClientWorkDetail({ supabase: store.supabase, ...workScope }))
      .toMatchObject({ canComment: false, approvalItem: { versionId: "v2", isActionable: false } });
  });

  it("uses the explicitly resent RLS snapshot and restores current-version actions", async () => {
    const store = retainedReadStore("waiting_client_approval");
    store.tables.deliverable_versions[0] = {
      ...store.tables.deliverable_versions[0], id: "v3", version_number: 3, content_body: "RESENT_V3_BODY",
    };
    store.readableVersions[0].version_id = "v3";
    const detail = await readPersistentClientWorkDetail({ supabase: store.supabase, ...workScope });
    expect(detail).toMatchObject({
      status: "waiting_client_approval", progressPercentage: 80, canComment: true,
      approvalItem: { versionId: "v3", isActionable: true }, content: { body: "RESENT_V3_BODY" },
      files: [], comments: [],
    });
    expect(JSON.stringify(detail)).not.toContain("SENT_V2");
  });

  it.each(["in_progress", "waiting_client_approval", "cancelled", "archived"])(
    "does not expose %s without an RLS-readable published version", async (status) => {
      const store = retainedReadStore(status);
      store.tables.deliverable_versions = [];
      expect(await readPersistentClientWorkDetail({ supabase: store.supabase, ...workScope })).toBeUndefined();
    },
  );

  it.each(["tenantId", "clientId", "deliverableId"] as const)("preserves exact %s detail scope", async (key) => {
    const store = retainedReadStore();
    expect(await readPersistentClientWorkDetail({ supabase: store.supabase, ...workScope, [key]: "other" })).toBeUndefined();
  });

  it.each(["deliverable_versions", "file_assets", "comments"])("fails closed on %s read error", async (table) => {
    const store = retainedReadStore("waiting_client_approval");
    store.tables.deliverables[0].current_version_id = "v2";
    store.fail(table);
    expect(await readPersistentClientWorkDetail({ supabase: store.supabase, ...workScope })).toBeUndefined();
  });

  it("keeps published rework in client summary but hides never-sent work even with a public-looking status", async () => {
    const store = retainedReadStore();
    store.tables.deliverables.push({
      ...store.tables.deliverables[0], id: "never-sent", name: "NEVER_SENT_SECRET",
      status: "waiting_client_approval", current_version_id: "unsent-v1",
    });
    const summary = await readCommercialSummary({ supabase: store.supabase, ...workScope, audience: "client" });
    expect(summary).toMatchObject({ ok: true, value: { audience: "client", deliverables: [
      { id: "work", status: "client_changes_requested", progressPercentage: 65 },
    ] } });
    if (summary.ok) expect(summary.value.deliverables).toHaveLength(1);
    expect(JSON.stringify(summary)).not.toContain("NEVER_SENT_SECRET");
    expect(store.rpcCalls).toEqual([{
      name: "s015_client_readable_versions",
      args: { target_tenant_id: "tenant", target_client_id: "client", target_deliverable_ids: ["work", "never-sent"] },
    }]);
  });

  it("does not turn a failed published-version summary read into success", async () => {
    const store = retainedReadStore("waiting_client_approval");
    store.fail("s015_client_readable_versions");
    expect(await readCommercialSummary({ supabase: store.supabase, ...workScope, audience: "client" })).toEqual({ ok: false });
  });

  it("mixed client/team roles read the RPC-selected v2, not the first table-readable historical version", async () => {
    const store = retainedReadStore();
    exposeTeamVersionHistory(store);
    const detail = await readPersistentClientWorkDetail({ supabase: store.supabase, ...workScope });
    expect(detail).toMatchObject({
      approvalItem: { versionId: "v2", isActionable: false }, canComment: false,
      content: { body: "SENT_V2_BODY" },
      files: [{ id: "file-v2" }], comments: [{ id: "comment-v2" }],
    });
    expect(JSON.stringify(detail)).not.toMatch(/OBSOLETE_V1|UNSENT_V3/);
    expect(store.rpcCalls).toEqual([{
      name: "s015_client_readable_versions",
      args: { target_tenant_id: "tenant", target_client_id: "client", target_deliverable_ids: ["work"] },
    }]);
    expect(store.reads.find((read) => read.table === "deliverable_versions")?.filters)
      .toMatchObject({ tenant_id: "tenant", client_id: "client", deliverable_id: "work", id: "v2" });
  });

  it("mixed-role summary keeps both works despite multiple team-readable versions of the first work", async () => {
    const store = retainedReadStore();
    exposeTeamVersionHistory(store);
    store.tables.deliverables.push({
      ...store.tables.deliverables[0], id: "work-two", current_version_id: "other-v1", status: "client_approved",
    });
    store.tables.deliverable_versions.push({
      ...store.tables.deliverable_versions[0], id: "other-v1", deliverable_id: "work-two", status: "client_approved",
    });
    store.readableVersions.push({ deliverable_id: "work-two", version_id: "other-v1" });
    const summary = await readCommercialSummary({ supabase: store.supabase, ...workScope, audience: "client" });
    expect(summary).toMatchObject({ ok: true, value: { deliverables: [
      { id: "work", status: "client_changes_requested", progressPercentage: 65 },
      { id: "work-two", status: "client_approved", progressPercentage: 90 },
    ] } });
    if (summary.ok) expect(summary.value.deliverables).toHaveLength(2);
    expect(store.rpcCalls).toEqual([{
      name: "s015_client_readable_versions",
      args: { target_tenant_id: "tenant", target_client_id: "client", target_deliverable_ids: ["work", "work-two"] },
    }]);
  });

  it.each(["no_mapping", "rpc_error"])("mixed-role detail fails closed on %s despite table-readable versions", async (failure) => {
    const store = retainedReadStore();
    exposeTeamVersionHistory(store);
    if (failure === "no_mapping") store.readableVersions.length = 0;
    else store.fail("s015_client_readable_versions");
    expect(await readPersistentClientWorkDetail({ supabase: store.supabase, ...workScope })).toBeUndefined();
    expect(store.reads.some((read) => ["deliverable_versions", "comments", "file_assets"].includes(read.table))).toBe(false);
  });

  it("mixed-role summary excludes work denied by publication RPC even when its current version is public-looking", async () => {
    const store = retainedReadStore("waiting_client_approval");
    store.tables.deliverables[0].current_version_id = "v2";
    exposeTeamVersionHistory(store);
    store.readableVersions.length = 0;
    expect(await readCommercialSummary({ supabase: store.supabase, ...workScope, audience: "client" }))
      .toMatchObject({ ok: true, value: { deliverables: [] } });
  });
});

describe("Spec 015 persistent client decision", () => {
  it("rejects malformed scoped identifiers before invoking the database", async () => {
    const rpc = vi.fn();
    const result = await decidePersistentClientVersion({
      supabase: { rpc } as unknown as SupabaseClient,
      input: { ...validInput, clientId: "client-a" },
    });

    expect(result).toEqual({ ok: false, reason: "invalid_input" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("binds the RPC decision to exact client, deliverable, version, and idempotency scopes", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });
    const result = await decidePersistentClientVersion({
      supabase: { rpc } as unknown as SupabaseClient,
      input: validInput,
    });

    expect(result).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith(
      "s015_client_decide_version",
      expect.objectContaining({
        target_client_id: validInput.clientId,
        target_deliverable_id: validInput.deliverableId,
        target_version_id: validInput.versionId,
        target_decision: "approved",
        request_idempotency_key: validInput.idempotencyKey,
      }),
    );
  });

  it("returns a safe denial when the database rejects stale or cross-scope input", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: { message: "denied" } });
    const result = await decidePersistentClientVersion({
      supabase: { rpc } as unknown as SupabaseClient,
      input: { ...validInput, decision: "changes_requested" },
    });

    expect(result).toEqual({ ok: false, reason: "denied" });
  });
});

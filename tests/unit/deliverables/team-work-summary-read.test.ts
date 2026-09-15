import type { SupabaseClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/navigation/route-guards", () => ({
  canUseRouteActorFixtures: () => false,
}));

afterEach(() => vi.clearAllMocks());

type QueryCall = { method: string; args: unknown[] };

const query = (
  table: string,
  rows: unknown[],
  calls: Record<string, QueryCall[]>,
) => {
  const chain = {
    select(...args: unknown[]) {
      calls[table].push({ method: "select", args });
      return chain;
    },
    eq(...args: unknown[]) {
      calls[table].push({ method: "eq", args });
      return chain;
    },
    in(...args: unknown[]) {
      calls[table].push({ method: "in", args });
      return chain;
    },
    then(
      resolve: (value: { data: unknown[]; error: null }) => unknown,
      reject?: (reason: unknown) => unknown,
    ) {
      return Promise.resolve({ data: rows, error: null }).then(resolve, reject);
    },
  };
  return chain;
};

describe("team work summary read", () => {
  it("counts all scoped tasks and flags only an open task assigned to the actor", async () => {
    const calls: Record<string, QueryCall[]> = {
      deliverable_versions: [],
      deliverable_tasks: [],
      file_assets: [],
      comments: [],
    };
    const rows: Record<string, unknown[]> = {
      deliverable_versions: [],
      deliverable_tasks: [
        {
          deliverable_id: "deliverable-a",
          status: "in_progress",
          assignee_user_id: "actor-a",
        },
        {
          deliverable_id: "deliverable-a",
          status: "done",
          assignee_user_id: "actor-a",
        },
        {
          deliverable_id: "deliverable-b",
          status: "todo",
          assignee_user_id: "someone-else",
        },
      ],
      file_assets: [],
      comments: [],
    };
    const from = vi.fn((table: string) => query(table, rows[table], calls));
    const { listScopedDeliverableWorkspaceSummaries } = await import(
      "@/server/actions/deliverable-workspace-read"
    );

    const summaries = await listScopedDeliverableWorkspaceSummaries({
      tenantId: "tenant-a",
      clientId: "client-a",
      actorUserId: "actor-a",
      deliverables: [
        { id: "deliverable-a" },
        { id: "deliverable-b" },
      ],
      supabase: { from } as unknown as SupabaseClient,
    });

    expect(summaries["deliverable-a"]).toMatchObject({
      hasOpenAssignedTask: true,
      counts: { tasks: 2 },
    });
    expect(summaries["deliverable-b"]).toMatchObject({
      hasOpenAssignedTask: false,
      counts: { tasks: 1 },
    });
    expect(calls.deliverable_tasks).toEqual([
      {
        method: "select",
        args: ["deliverable_id, status, assignee_user_id"],
      },
      { method: "eq", args: ["tenant_id", "tenant-a"] },
      { method: "eq", args: ["client_id", "client-a"] },
      {
        method: "in",
        args: ["deliverable_id", ["deliverable-a", "deliverable-b"]],
      },
    ]);
  });

  it("keeps the optional actor boundary fail-closed", async () => {
    const calls: Record<string, QueryCall[]> = {
      deliverable_versions: [],
      deliverable_tasks: [],
      file_assets: [],
      comments: [],
    };
    const rows: Record<string, unknown[]> = {
      deliverable_versions: [],
      deliverable_tasks: [
        {
          deliverable_id: "deliverable-a",
          status: "todo",
          assignee_user_id: "actor-a",
        },
      ],
      file_assets: [],
      comments: [],
    };
    const from = vi.fn((table: string) => query(table, rows[table], calls));
    const { listScopedDeliverableWorkspaceSummaries } = await import(
      "@/server/actions/deliverable-workspace-read"
    );

    const summaries = await listScopedDeliverableWorkspaceSummaries({
      tenantId: "tenant-a",
      clientId: "client-a",
      deliverables: [{ id: "deliverable-a" }],
      supabase: { from } as unknown as SupabaseClient,
    });

    expect(summaries["deliverable-a"].hasOpenAssignedTask).toBe(false);
    expect(summaries["deliverable-a"].counts.tasks).toBe(1);
  });
});

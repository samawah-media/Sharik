import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { cleanWorkspaceTenantId } from "@/modules/uat/clean-workspace";

type Row = Record<string, unknown>;
type Request = { table: string; operation: string; payload?: Row; rows: Row[] };
type Failure = { matches: (request: Request) => boolean; afterCommit?: boolean; thrown?: boolean };
const runId = "unit-recovery-11";
const sourceTenant = "11111111-1111-4111-8111-111111111111";
const personas = ["ADMIN", "ACCOUNT_MANAGER", "CONTENT_WRITER", "DESIGNER", "UNASSIGNED"];
const roles = ["tenant_administrator", "account_manager", "content_writer", "designer", "performance_specialist"];
const targetTenant = cleanWorkspaceTenantId(runId);
const sourceIds = personas.map((_, index) => `22222222-2222-4222-8222-22222222222${index}`);

// Only SDK/OS boundaries are replaced. Every CLI branch, query filter, binding
// check, recovery function and safety gate executes from the production file.
function memoryDatabase(sourceStatus = "active") {
  const tables: Record<string, Row[]> = {
    tenant_memberships: personas.map((_, index) => ({
      id: sourceIds[index], tenant_id: sourceTenant, auth_user_id: `user-${index}`,
      status: sourceStatus, disabled_at: sourceStatus === "active" ? null : "old",
    })),
    role_assignments: personas.map((_, index) => ({
      id: `role-${index}`, tenant_id: sourceTenant, membership_id: sourceIds[index],
      role_key: roles[index], scope_type: "tenant", scope_id: sourceTenant, status: "active",
    })),
    audit_events: [{ id: "source-audit", tenant_id: sourceTenant, action: "preserved" }],
    package_ledger_entries: [{ id: "source-ledger", tenant_id: sourceTenant }],
  };
  const failures: Failure[] = [];
  const from = (table: string) => {
    tables[table] ??= [];
    let operation = "select";
    let payload: Row | Row[] = {};
    let single = false;
    let conflict = "id";
    let ignoreDuplicates = false;
    const filters: ((row: Row) => boolean)[] = [];
    const query = {
      select: () => query,
      eq: (key: string, value: unknown) => { filters.push((row) => row[key] === value); return query; },
      in: (key: string, values: unknown[]) => { filters.push((row) => values.includes(row[key])); return query; },
      maybeSingle: () => { single = true; return query; },
      update: (changes: Row) => { operation = "update"; payload = changes; return query; },
      upsert: (changes: Row | Row[], options: { onConflict: string; ignoreDuplicates?: boolean }) => {
        operation = "upsert"; payload = changes; conflict = options.onConflict;
        ignoreDuplicates = options.ignoreDuplicates ?? false; return query;
      },
      then: (resolve: (response: unknown) => unknown, reject: (error: Error) => unknown) => {
        const rows = tables[table].filter((row) => filters.every((filter) => filter(row)));
        const request = { table, operation, payload: Array.isArray(payload) ? payload[0] : payload, rows };
        const index = failures.findIndex((failure) => failure.matches(request));
        const failure = index < 0 ? undefined : failures.splice(index, 1)[0];
        if (!failure || failure.afterCommit) {
          if (operation === "update") rows.forEach((row) => Object.assign(row, payload));
          if (operation === "upsert") {
            for (const changes of Array.isArray(payload) ? payload : [payload]) {
              const existing = tables[table].find((row) => conflict.split(",").every((key) => row[key] === changes[key]));
              if (!existing) tables[table].push({ ...changes });
              else if (!ignoreDuplicates) Object.assign(existing, changes);
            }
          }
        }
        if (failure?.thrown) return Promise.reject(new Error("transport lost")).then(resolve, reject);
        return Promise.resolve({
          data: single ? rows[0] ?? null : rows.map((row) => ({ ...row })),
          count: rows.length, error: failure ? { code: "INJECTED" } : null,
        }).then(resolve, reject);
      },
    };
    return query;
  };
  return { tables, failures, from };
}
type Database = ReturnType<typeof memoryDatabase>;
const membershipUpdate = (tenant: string, status: string) => (request: Request) =>
  request.table === "tenant_memberships" && request.operation === "update" &&
  request.payload?.status === status && request.rows.some((row) => row.tenant_id === tenant);

async function executeCli(database: Database, mode: string, overrides: Record<string, string> = {}) {
  const source = await readFile(path.resolve("scripts/prepare-s015-clean-workspace.mjs"), "utf8");
  const env: Record<string, string> = {
    S015_UAT_CLEAN_WORKSPACE_RUN_ID: runId, S015_UAT_TARGET_CATEGORY: "uat",
    S015_UAT_SUPABASE_URL: "https://unit-only.supabase.co", S015_UAT_SUPABASE_HOSTNAME: "unit-only.supabase.co",
    S015_UAT_PUBLISHABLE_KEY: "fake-public", S015_UAT_SERVICE_ROLE_KEY: "fake-service",
    S015_CLEAN_WORKSPACE_APPLY_CONFIRM: "1", S015_CLEAN_WORKSPACE_ROLLBACK_CONFIRM: "1",
    ...overrides,
  };
  personas.forEach((persona, index) => {
    env[`S015_${persona}_EMAIL`] = `person-${index}@example.invalid`;
    env[`S015_${persona}_PASSWORD`] = "fake-password";
  });
  const output: string[] = [];
  const exited = {};
  let error = "";
  try {
    await runInNewContext(`(async () => {${source.replace(/^import .*;\r?$/gm, "")}\n})()`, {
      Buffer, URL, createHash, path,
      readFile: async () => "", // Never read a real secure env file.
      process: { argv: ["node", "script", mode], env, cwd: () => "/in-memory", exit: () => { throw exited; } },
      console: { log: (message: string) => output.push(message) },
      createClient: () => ({ from: database.from, auth: {
        signInWithPassword: async ({ email }: { email: string }) => ({
          data: { user: { id: `user-${email.match(/person-(\d)/)?.[1]}` } }, error: null,
        }),
        signOut: async () => ({ error: null }),
      } }),
    });
  } catch (caught) {
    if (caught !== exited) error = String(caught);
  }
  return { error, output };
}
const activeCount = (db: Database, tenant: string) => db.tables.tenant_memberships.filter(
  (row) => row.tenant_id === tenant && row.status === "active",
).length;
async function appliedDatabase() {
  const db = memoryDatabase();
  expect((await executeCli(db, "--apply")).error).toBe("");
  expect(activeCount(db, targetTenant)).toBe(5);
  expect(activeCount(db, sourceTenant)).toBe(0);
  return db;
}

describe("X010-B-7C-11 actual CLI recovery", () => {
  it("a lost source-disable reply compensates without deleting audit or ledger", async () => {
    const db = memoryDatabase();
    db.failures.push({ matches: membershipUpdate(sourceTenant, "disabled"), afterCommit: true, thrown: true });
    const result = await executeCli(db, "--apply");
    expect(result.error).toContain("transport lost");
    expect(activeCount(db, sourceTenant)).toBe(5);
    expect(activeCount(db, targetTenant)).toBe(0);
    expect(db.tables.audit_events.filter((row) => row.action === "x010b7c9_clean_workspace_source_binding")).toHaveLength(1);
    expect(db.tables.package_ledger_entries).toEqual([{ id: "source-ledger", tenant_id: sourceTenant }]);
    expect(result.output).toEqual([]);
  });

  it("rollback audit failure leaves recovered membership state and retries append-only", async () => {
    const db = await appliedDatabase();
    db.failures.push({ matches: (r) => r.table === "audit_events" && r.payload?.action === "x009b_clean_workspace_rolled_back" });
    expect((await executeCli(db, "--rollback")).error).toContain("AUDIT_ROLLBACK_FAILED");
    expect(activeCount(db, sourceTenant)).toBe(5);
    expect(activeCount(db, targetTenant)).toBe(0);
    expect((await executeCli(db, "--rollback")).error).toBe("");
    expect(db.tables.audit_events.filter((row) => row.action === "x009b_clean_workspace_rolled_back")).toHaveLength(1);
  });

  it("an applied replay is mutation-free", async () => {
    const db = await appliedDatabase();
    const before = structuredClone(db.tables);
    expect((await executeCli(db, "--apply")).error).toBe("");
    expect(db.tables).toEqual(before);
  });

  it("client-only source role fails closed before provisioning", async () => {
    const db = memoryDatabase();
    db.tables.role_assignments[0].role_key = "client_admin";
    const membershipsBefore = structuredClone(db.tables.tenant_memberships);
    expect((await executeCli(db, "--apply")).error).toContain("INTERNAL_ROLE_MISSING");
    expect(db.tables.tenant_memberships).toEqual(membershipsBefore);
    expect(activeCount(db, targetTenant)).toBe(0);
  });

  it.each([
    { afterCommit: false, thrown: false },
    { afterCommit: true, thrown: false },
    { afterCommit: false, thrown: true },
    { afterCommit: true, thrown: true },
  ])("rollback target-disable failure restores unambiguous previous target: %j", async (failure) => {
    const db = await appliedDatabase();
    db.failures.push({ matches: membershipUpdate(targetTenant, "disabled"), ...failure });
    const result = await executeCli(db, "--rollback");
    expect(result.error).not.toBe("");
    expect(activeCount(db, targetTenant)).toBe(5);
    expect(activeCount(db, sourceTenant)).toBe(0);
    expect(result.output).toEqual([]);
    expect(db.tables.audit_events.filter((row) => row.action === "x009b_clean_workspace_rolled_back")).toHaveLength(0);
  });

  it("failed rollback fallback retains the verified source and reports incomplete recovery", async () => {
    const db = await appliedDatabase();
    db.failures.push(
      { matches: membershipUpdate(targetTenant, "disabled"), afterCommit: true },
      { matches: membershipUpdate(targetTenant, "active") },
    );
    const result = await executeCli(db, "--rollback");
    expect(result.error).toContain("RECOVERY_INCOMPLETE:ROLLBACK");
    expect(activeCount(db, sourceTenant)).toBe(5);
    expect(activeCount(db, targetTenant)).toBe(0);
    expect(result.output).toEqual([]);
  });

  it("rollback/replay preserve unrelated memberships, roles and append-only history", async () => {
    const db = await appliedDatabase();
    db.tables.tenant_memberships.push(
      { id: "client-only", tenant_id: sourceTenant, auth_user_id: "client-user", status: "active" },
      { id: "unrelated-target", tenant_id: targetTenant, auth_user_id: "unrelated-user", status: "active" },
      { id: "older-inactive", tenant_id: "old-tenant", auth_user_id: "user-0", status: "disabled" },
    );
    const membershipsBefore = structuredClone(db.tables.tenant_memberships.slice(-3));
    const rolesBefore = structuredClone(db.tables.role_assignments);
    const auditBefore = structuredClone(db.tables.audit_events);
    const ledgerBefore = structuredClone(db.tables.package_ledger_entries);
    expect((await executeCli(db, "--rollback")).error).toBe("");
    expect((await executeCli(db, "--rollback")).error).toBe("");
    expect(db.tables.tenant_memberships.slice(-3)).toEqual(membershipsBefore);
    expect(db.tables.role_assignments).toEqual(rolesBefore);
    expect(db.tables.package_ledger_entries).toEqual(ledgerBefore);
    expect(db.tables.audit_events.slice(0, auditBefore.length)).toEqual(auditBefore);
    expect(db.tables.audit_events.filter((row) => row.action === "x009b_clean_workspace_rolled_back")).toHaveLength(1);
  });

  it.each([
    ["--apply", { S015_UAT_TARGET_CATEGORY: "production" }, "NON_UAT_TARGET_REFUSED"],
    ["--apply", { S015_UAT_SUPABASE_HOSTNAME: "other.supabase.co" }, "SUPABASE_TARGET_REFUSED"],
    ["--apply", { S015_CLEAN_WORKSPACE_APPLY_CONFIRM: "0" }, "APPLY_CONFIRMATION_REQUIRED"],
    ["--rollback", { S015_CLEAN_WORKSPACE_ROLLBACK_CONFIRM: "0" }, "ROLLBACK_CONFIRMATION_REQUIRED"],
  ])("%s refuses unsafe input %j before database mutation", async (mode, overrides, error) => {
    const db = memoryDatabase();
    const before = structuredClone(db.tables);
    expect((await executeCli(db, mode, overrides)).error).toContain(error);
    expect(db.tables).toEqual(before);
  });

  it("a conflicting binding refuses rollback before mutation", async () => {
    const db = await appliedDatabase();
    const binding = db.tables.audit_events.find((row) => row.action === "x010b7c9_clean_workspace_source_binding")!;
    binding.reason = String(binding.reason).replace(sourceTenant, "33333333-3333-4333-8333-333333333333");
    const before = structuredClone(db.tables);
    expect((await executeCli(db, "--rollback")).error).toContain("BINDING_IDENTITY_INVALID");
    expect(db.tables).toEqual(before);
  });

  it.each([false, true])("rollback source restore failure preserves verified target (lost response=%s)", async (afterCommit) => {
    const db = await appliedDatabase();
    db.failures.push({ matches: membershipUpdate(sourceTenant, "active"), afterCommit });
    const result = await executeCli(db, "--rollback");
    expect(result.error).toContain("SOURCE_RESTORE_FAILED");
    expect(activeCount(db, targetTenant)).toBe(5);
    expect(activeCount(db, sourceTenant)).toBe(0);
    expect(db.tables.audit_events.filter((row) => row.action === "x009b_clean_workspace_rolled_back")).toHaveLength(0);
  });

  it("compensation reports failed target cleanup rather than only the original error", async () => {
    const db = memoryDatabase();
    db.failures.push(
      { matches: (r) => r.table === "member_profiles" && r.operation === "upsert" },
      { matches: membershipUpdate(targetTenant, "disabled") },
    );
    const result = await executeCli(db, "--apply");
    expect(result.error).toContain("RECOVERY_INCOMPLETE");
    expect(activeCount(db, sourceTenant)).toBe(5);
    // The error is actionable: cleanup failed and both memberships remain.
    // This is not a successful natural-entry recovery or a transaction.
    expect(activeCount(db, targetTenant)).toBe(5);
    expect(result.output).toEqual([]);
  });

  it("binding-present reapply compensates a profile write failure", async () => {
    const db = await appliedDatabase();
    expect((await executeCli(db, "--rollback")).error).toBe("");
    const auditBefore = structuredClone(db.tables.audit_events);
    db.failures.push({ matches: (r) => r.table === "member_profiles" && r.operation === "upsert" });
    expect((await executeCli(db, "--apply")).error).toContain("PROFILE_UPSERT_FAILED");
    expect(activeCount(db, sourceTenant)).toBe(5);
    expect(activeCount(db, targetTenant)).toBe(0);
    expect(db.tables.audit_events).toEqual(auditBefore);
  });

  it("failed compensation source restore does not disable the verified target", async () => {
    const db = memoryDatabase();
    db.failures.push(
      { matches: membershipUpdate(sourceTenant, "disabled"), afterCommit: true },
      { matches: membershipUpdate(sourceTenant, "active") },
    );
    const result = await executeCli(db, "--apply");
    expect(result.error).toContain("RECOVERY_INCOMPLETE");
    expect(activeCount(db, targetTenant)).toBe(5);
    expect(activeCount(db, sourceTenant)).toBe(0);
  });
});

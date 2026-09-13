import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CLEAN_WORKSPACE_INTERNAL_ROLE_KEYS,
  CLEAN_WORKSPACE_SOURCE_BINDING_ACTION,
  CLEAN_WORKSPACE_TENANT_NAME,
  assertCleanWorkspaceRunId,
  buildCleanWorkspaceSourceBindingReason,
  cleanWorkspaceAuditEventId,
  cleanWorkspaceMembershipId,
  cleanWorkspaceProfileSyncRunId,
  cleanWorkspaceRoleAssignmentId,
  cleanWorkspaceSourceBindingAuditEventId,
  cleanWorkspaceTenantId,
  cleanWorkspaceBindingsMatch,
  parseCleanWorkspaceSourceBindingReason,
  planCleanWorkspaceRolesForUser,
  planCleanWorkspaceSourceSelection,
} from "@/modules/uat/clean-workspace";

describe("clean owner-entry workspace identifiers", () => {
  it("derives stable deterministic UUIDs for the tenant and its resources", () => {
    const runId = "x009b-owner-trial-20260721";
    const userId = "30000000-0000-4000-8000-000000000002";

    const tenantId = cleanWorkspaceTenantId(runId);
    const membershipId = cleanWorkspaceMembershipId({
      runId,
      authUserId: userId,
    });
    const roleId = cleanWorkspaceRoleAssignmentId({
      runId,
      authUserId: userId,
      roleKey: "tenant_administrator",
    });
    const auditId = cleanWorkspaceAuditEventId({
      runId,
      suffix: "provisioned",
    });

    expect(tenantId).toMatch(/^[0-9a-f-]{36}$/u);
    expect(membershipId).toMatch(/^[0-9a-f-]{36}$/u);
    expect(roleId).toMatch(/^[0-9a-f-]{36}$/u);
    expect(auditId).toMatch(/^[0-9a-f-]{36}$/u);

    expect(cleanWorkspaceTenantId(runId)).toBe(tenantId);
    expect(
      cleanWorkspaceMembershipId({ runId, authUserId: userId }),
    ).toBe(membershipId);
    expect(
      cleanWorkspaceRoleAssignmentId({
        runId,
        authUserId: userId,
        roleKey: "tenant_administrator",
      }),
    ).toBe(roleId);

    const otherRun = "x009b-other-trial-20260721";
    expect(cleanWorkspaceTenantId(otherRun)).not.toBe(tenantId);
    expect(
      cleanWorkspaceMembershipId({ runId: otherRun, authUserId: userId }),
    ).not.toBe(membershipId);
  });

  it("rejects ambiguous or unsafe run IDs before any hosted mutation", () => {
    expect(() => cleanWorkspaceTenantId("ab")).toThrow(
      /CLEAN_WORKSPACE_RUN_ID_INVALID/u,
    );
    expect(() => cleanWorkspaceTenantId("has space")).toThrow(
      /CLEAN_WORKSPACE_RUN_ID_INVALID/u,
    );
    expect(() => cleanWorkspaceTenantId("")).toThrow(
      /CLEAN_WORKSPACE_RUN_ID_INVALID/u,
    );
    expect(() =>
      cleanWorkspaceMembershipId({ runId: "valid-run", authUserId: "" }),
    ).toThrow(/CLEAN_WORKSPACE_USER_REQUIRED/u);
    assertCleanWorkspaceRunId("x009b.2026-07-21_run");
  });

  it("exposes a single canonical workspace name and profile sync tag", () => {
    expect(CLEAN_WORKSPACE_TENANT_NAME).toBe("سماوة — مساحة المالك");
    expect(cleanWorkspaceProfileSyncRunId("trial-1")).toBe("x009b-profiles-trial-1");
  });
});

describe("clean owner-entry workspace role mirroring", () => {
  const runId = "x009b-owner-trial-20260721";
  const adminId = "30000000-0000-4000-8000-000000000002";
  const accountId = "30000000-0000-4000-8000-000000000003";
  const writerId = "30000000-0000-4000-8000-000000000004";
  const viewerId = "30000000-0000-4000-8000-000000000008";

  it("keeps tenant-scoped management roles unchanged", () => {
    const plan = planCleanWorkspaceRolesForUser({
      runId,
      authUserId: adminId,
      legacyRoles: [{ roleKey: "tenant_administrator", scopeType: "tenant" }],
    });

    expect(plan).toHaveLength(1);
    expect(plan[0]?.roleKey).toBe("tenant_administrator");
    expect(plan[0]?.scopeType).toBe("tenant");
    expect(plan[0]?.assignmentId).toBe(
      cleanWorkspaceRoleAssignmentId({
        runId,
        authUserId: adminId,
        roleKey: "tenant_administrator",
      }),
    );
  });

  it("mirrors client-scoped internal roles to tenant-scope entry assignments", () => {
    const plan = planCleanWorkspaceRolesForUser({
      runId,
      authUserId: accountId,
      legacyRoles: [{ roleKey: "account_manager", scopeType: "client" }],
    });

    expect(plan).toEqual([
      {
        roleKey: "account_manager",
        scopeType: "tenant",
        assignmentId: cleanWorkspaceRoleAssignmentId({
          runId,
          authUserId: accountId,
          roleKey: "account_manager",
        }),
      },
    ]);
  });

  it("deduplicates repeated internal role keys across scopes", () => {
    const plan = planCleanWorkspaceRolesForUser({
      runId,
      authUserId: writerId,
      legacyRoles: [
        { roleKey: "content_writer", scopeType: "client" },
        { roleKey: "content_writer", scopeType: "tenant" },
      ],
    });

    expect(plan).toHaveLength(1);
    expect(plan[0]?.roleKey).toBe("content_writer");
  });

  it("never mirrors client-only personas into the clean workspace", () => {
    const plan = planCleanWorkspaceRolesForUser({
      runId,
      authUserId: viewerId,
      legacyRoles: [{ roleKey: "client_viewer", scopeType: "client" }],
    });

    expect(plan).toEqual([]);
  });

  it("ignores unknown role keys that are not part of the internal team set", () => {
    const plan = planCleanWorkspaceRolesForUser({
      runId,
      authUserId: adminId,
      legacyRoles: [
        { roleKey: "intern", scopeType: "tenant" },
        { roleKey: "tenant_administrator", scopeType: "tenant" },
      ],
    });

    expect(plan.map((entry) => entry.roleKey)).toEqual(["tenant_administrator"]);
  });

  it("treats the internal role set as the documented Samawah team roster", () => {
    expect(Array.from(CLEAN_WORKSPACE_INTERNAL_ROLE_KEYS)).toEqual([
      "tenant_owner",
      "tenant_administrator",
      "project_manager",
      "marketing_manager",
      "account_manager",
      "content_writer",
      "designer",
      "performance_specialist",
    ]);
  });
});

describe("clean workspace source selection (X010-B-7C-9A)", () => {
  const targetTenantId = "target-tenant";

  it("selects the single active source while tolerating multiple historical inactive memberships", () => {
    // This is the exact second-rollover defect: the persona already has the
    // original legacy membership (disabled by the first rollover) plus another
    // historical inactive workspace, and exactly one active source. The
    // deterministic target of this new run has no membership yet.
    const plan = planCleanWorkspaceSourceSelection({
      targetTenantId,
      personas: [
        {
          key: "ADMIN",
          memberships: [
            { id: "legacy-1", tenantId: "legacy-tenant", status: "disabled" },
            { id: "history-1", tenantId: "history-tenant", status: "disabled" },
            { id: "active-source", tenantId: "legacy-tenant", status: "active" },
          ],
        },
      ],
    });

    expect(plan.sourceTenantId).toBe("legacy-tenant");
    expect(plan.selections).toHaveLength(1);
    expect(plan.selections[0]).toEqual({
      key: "ADMIN",
      membership: {
        id: "active-source",
        tenantId: "legacy-tenant",
        status: "active",
      },
    });
  });

  it("ignores a leftover inactive membership inside the deterministic target", () => {
    const plan = planCleanWorkspaceSourceSelection({
      targetTenantId,
      personas: [
        {
          key: "ADMIN",
          memberships: [
            { id: "target-old", tenantId: targetTenantId, status: "disabled" },
            { id: "active-source", tenantId: "legacy-tenant", status: "active" },
          ],
        },
      ],
    });

    expect(plan.selections[0]?.membership.id).toBe("active-source");
  });

  it("fails closed when a persona has zero active source memberships", () => {
    expect(() =>
      planCleanWorkspaceSourceSelection({
        targetTenantId,
        personas: [
          {
            key: "ADMIN",
            memberships: [
              { id: "legacy-1", tenantId: "legacy-tenant", status: "disabled" },
              { id: "history-1", tenantId: "history-tenant", status: "disabled" },
            ],
          },
        ],
      }),
    ).toThrow(/CLEAN_WORKSPACE_ACTIVE_SOURCE_MISSING/u);
  });

  it("fails closed when a persona has more than one active source membership", () => {
    expect(() =>
      planCleanWorkspaceSourceSelection({
        targetTenantId,
        personas: [
          {
            key: "ADMIN",
            memberships: [
              { id: "legacy-1", tenantId: "legacy-tenant", status: "active" },
              { id: "history-1", tenantId: "history-tenant", status: "active" },
            ],
          },
        ],
      }),
    ).toThrow(/CLEAN_WORKSPACE_ACTIVE_SOURCE_AMBIGUOUS:2/u);
  });

  it("fails closed when the only active membership is the deterministic target itself", () => {
    expect(() =>
      planCleanWorkspaceSourceSelection({
        targetTenantId,
        personas: [
          {
            key: "ADMIN",
            memberships: [
              { id: "legacy-1", tenantId: "legacy-tenant", status: "disabled" },
              { id: "target-active", tenantId: targetTenantId, status: "active" },
            ],
          },
        ],
      }),
    ).toThrow(/CLEAN_WORKSPACE_SOURCE_TENANT_COLLIDES_WITH_TARGET/u);
  });

  it("fails closed when persona sources do not share one tenant", () => {
    expect(() =>
      planCleanWorkspaceSourceSelection({
        targetTenantId,
        personas: [
          {
            key: "ADMIN",
            memberships: [
              { id: "source-admin", tenantId: "legacy-tenant", status: "active" },
            ],
          },
          {
            key: "DESIGNER",
            memberships: [
              {
                id: "source-designer",
                tenantId: "other-tenant",
                status: "active",
              },
            ],
          },
        ],
      }),
    ).toThrow(/CLEAN_WORKSPACE_SOURCE_TENANT_MISMATCH/u);
  });

  it("tolerates any number of inactive historical rows across all personas", () => {
    const plan = planCleanWorkspaceSourceSelection({
      targetTenantId,
      personas: [
        {
          key: "ADMIN",
          memberships: [
            { id: "a-old-1", tenantId: "t-2016", status: "disabled" },
            { id: "a-old-2", tenantId: "t-2017", status: "disabled" },
            { id: "a-old-3", tenantId: "t-2018", status: "disabled" },
            { id: "a-source", tenantId: "source-tenant", status: "active" },
          ],
        },
        {
          key: "DESIGNER",
          memberships: [
            { id: "d-old-1", tenantId: "t-2016", status: "disabled" },
            { id: "d-source", tenantId: "source-tenant", status: "active" },
          ],
        },
      ],
    });

    expect(plan.sourceTenantId).toBe("source-tenant");
    expect(plan.selections.map((entry) => entry.key)).toEqual([
      "ADMIN",
      "DESIGNER",
    ]);
  });
});

describe("clean workspace source binding (X010-B-7C-9A)", () => {
  it("derives a stable deterministic binding audit id per run", () => {
    const runId = "x010b7c9-rollover-20260903";
    const bindingId = cleanWorkspaceSourceBindingAuditEventId(runId);

    expect(bindingId).toMatch(/^[0-9a-f-]{36}$/u);
    expect(cleanWorkspaceSourceBindingAuditEventId(runId)).toBe(bindingId);
    expect(bindingId).toBe(
      cleanWorkspaceAuditEventId({ runId, suffix: "source-binding" }),
    );
    expect(cleanWorkspaceSourceBindingAuditEventId("other-run")).not.toBe(
      bindingId,
    );
  });

  it("builds and parses a canonical binding reason with sorted membership ids", () => {
    const reason = buildCleanWorkspaceSourceBindingReason({
      runId: "x010b7c9-rollover-20260903",
      sourceTenantId: "11111111-1111-4111-8111-111111111111",
      sourceMembershipIds: [
        "33333333-3333-4333-8333-333333333333",
        "22222222-2222-4222-8222-222222222222",
      ],
    });

    expect(reason).toBe(
      "run_id=x010b7c9-rollover-20260903;" +
        "source_tenant=11111111-1111-4111-8111-111111111111;" +
        "source_memberships=22222222-2222-4222-8222-222222222222,33333333-3333-4333-8333-333333333333",
    );

    expect(parseCleanWorkspaceSourceBindingReason(reason)).toEqual({
      runId: "x010b7c9-rollover-20260903",
      sourceTenantId: "11111111-1111-4111-8111-111111111111",
      sourceMembershipIds: [
        "22222222-2222-4222-8222-222222222222",
        "33333333-3333-4333-8333-333333333333",
      ],
    });
  });

  it("rejects malformed or foreign audit reasons instead of guessing", () => {
    expect(parseCleanWorkspaceSourceBindingReason(null)).toBeNull();
    expect(parseCleanWorkspaceSourceBindingReason("")).toBeNull();
    expect(
      parseCleanWorkspaceSourceBindingReason("run_id=abc;local_persistent_apply"),
    ).toBeNull();
    expect(
      parseCleanWorkspaceSourceBindingReason(
        "run_id=abc;source_tenant=not-a-uuid;source_memberships=x",
      ),
    ).toBeNull();
    expect(
      parseCleanWorkspaceSourceBindingReason(
        "run_id=abc;source_tenant=11111111-1111-4111-8111-111111111111",
      ),
    ).toBeNull();
  });

  it("compares bindings by canonical identity regardless of input order", () => {
    const tenantId = "11111111-1111-4111-8111-111111111111";
    expect(
      cleanWorkspaceBindingsMatch(
        {
          runId: "run-1",
          sourceTenantId: tenantId,
          sourceMembershipIds: ["b-id", "a-id"],
        },
        {
          runId: "run-1",
          sourceTenantId: tenantId,
          sourceMembershipIds: ["a-id", "b-id"],
        },
      ),
    ).toBe(true);

    expect(
      cleanWorkspaceBindingsMatch(
        {
          runId: "run-1",
          sourceTenantId: tenantId,
          sourceMembershipIds: ["a-id", "b-id"],
        },
        {
          runId: "run-1",
          sourceTenantId: tenantId,
          sourceMembershipIds: ["a-id", "c-id"],
        },
      ),
    ).toBe(false);
  });
});

describe("hosted script synchronization guard (X010-B-7C-9A)", () => {
  it("mirrors the module identifiers, binding format, and fail-closed codes", async () => {
    const script = await readFile(
      path.resolve(
        process.cwd(),
        "scripts/prepare-s015-clean-workspace.mjs",
      ),
      "utf8",
    );

    // Deterministic identifier namespace must stay identical.
    expect(script).toContain('toStableUuid(`x009b:tenant:${runId}`)');
    expect(script).toContain(
      'toStableUuid(`x009b:membership:${runId}:${authUserId}`)',
    );
    expect(script).toContain(
      'toStableUuid(`x009b:role:${runId}:${authUserId}:${roleKey}`)',
    );
    expect(script).toContain(
      'toStableUuid(`x009b:audit:${runId}:${suffix}`)',
    );
    expect(script).toContain('auditEventIdFor(runId, "source-binding")');

    // Binding action and canonical reason markers must match the module.
    expect(script).toContain(CLEAN_WORKSPACE_SOURCE_BINDING_ACTION);
    expect(script).toContain('"run_id="');
    expect(script).toContain('";source_tenant="');
    expect(script).toContain('";source_memberships="');

    // Hardened fail-closed codes must exist in the hosted tool.
    for (const code of [
      "CLEAN_WORKSPACE_ACTIVE_SOURCE_MISSING",
      "CLEAN_WORKSPACE_ACTIVE_SOURCE_AMBIGUOUS",
      "CLEAN_WORKSPACE_SOURCE_TENANT_MISMATCH",
      "CLEAN_WORKSPACE_SOURCE_TENANT_COLLIDES_WITH_TARGET",
      "CLEAN_WORKSPACE_BINDING_CONFLICT",
      "CLEAN_WORKSPACE_BINDING_IDENTITY_INVALID",
      "CLEAN_WORKSPACE_BINDING_REQUIRED_FOR_ROLLBACK",
      "CLEAN_WORKSPACE_TARGET_VERIFICATION_FAILED",
    ]) {
      expect(script).toContain(code);
    }
  });
});

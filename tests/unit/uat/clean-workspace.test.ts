import { describe, expect, it } from "vitest";
import {
  CLEAN_WORKSPACE_INTERNAL_ROLE_KEYS,
  CLEAN_WORKSPACE_TENANT_NAME,
  assertCleanWorkspaceRunId,
  cleanWorkspaceAuditEventId,
  cleanWorkspaceMembershipId,
  cleanWorkspaceProfileSyncRunId,
  cleanWorkspaceRoleAssignmentId,
  cleanWorkspaceTenantId,
  planCleanWorkspaceRolesForUser,
  selectLegacyWorkspaceMembership,
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

describe("clean workspace replay membership discovery", () => {
  const legacy = {
    id: "legacy-membership",
    tenantId: "legacy-tenant",
    status: "disabled",
  };
  const clean = {
    id: "clean-membership",
    tenantId: "clean-tenant",
    status: "active",
  };

  it("keeps selecting the disabled legacy membership after apply", () => {
    expect(
      selectLegacyWorkspaceMembership({
        cleanTenantId: clean.tenantId,
        memberships: [clean, legacy],
      }),
    ).toEqual(legacy);
  });

  it("selects the same legacy membership before apply", () => {
    expect(
      selectLegacyWorkspaceMembership({
        cleanTenantId: clean.tenantId,
        memberships: [{ ...legacy, status: "active" }],
      }),
    ).toEqual({ ...legacy, status: "active" });
  });

  it("fails closed when legacy identity is missing or ambiguous", () => {
    expect(() =>
      selectLegacyWorkspaceMembership({
        cleanTenantId: clean.tenantId,
        memberships: [clean],
      }),
    ).toThrow(/CLEAN_WORKSPACE_LEGACY_MEMBERSHIP_AMBIGUOUS:0/u);
    expect(() =>
      selectLegacyWorkspaceMembership({
        cleanTenantId: clean.tenantId,
        memberships: [
          legacy,
          { ...legacy, id: "legacy-2", tenantId: "legacy-tenant-2" },
        ],
      }),
    ).toThrow(/CLEAN_WORKSPACE_LEGACY_MEMBERSHIP_AMBIGUOUS:2/u);
  });
});

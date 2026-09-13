import { describe, expect, it } from "vitest";
import {
  createS015ClientPersonaScopeIds,
  createS015PersonaScopeJournalId,
  isS015ClientPersonaScopeRunId,
  planS015PersonaTenantMembership,
  S015_CLIENT_PERSONAS,
} from "../../../scripts/lib/s015-client-persona-scope.mjs";

describe("Spec 015 UAT client persona scope", () => {
  it("keeps the approved client personas and roles explicit", () => {
    expect(S015_CLIENT_PERSONAS).toEqual([
      { key: "CLIENT_APPROVER", roleKey: "client_approver" },
      { key: "CLIENT_VIEWER", roleKey: "client_viewer" },
    ]);
  });

  it("creates deterministic, distinct identifiers", () => {
    const first = createS015ClientPersonaScopeIds({
      runId: "owner-trial-20260726",
      userId: "11111111-1111-4111-8111-111111111111",
      roleKey: "client_approver",
    });
    const replay = createS015ClientPersonaScopeIds({
      runId: "owner-trial-20260726",
      userId: "11111111-1111-4111-8111-111111111111",
      roleKey: "client_approver",
    });

    expect(replay).toEqual(first);
    expect(new Set(Object.values(first))).toHaveLength(5);
    expect(Object.values(first)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
        ),
      ]),
    );
  });

  it("creates deterministic journal identifiers per suspended resource", () => {
    const first = createS015PersonaScopeJournalId({
      runId: "owner-trial-20260726",
      resourceType: "client_membership",
      resourceId: "resource-a",
    });
    expect(
      createS015PersonaScopeJournalId({
        runId: "owner-trial-20260726",
        resourceType: "client_membership",
        resourceId: "resource-a",
      }),
    ).toBe(first);
    expect(
      createS015PersonaScopeJournalId({
        runId: "owner-trial-20260726",
        resourceType: "role_assignment",
        resourceId: "resource-a",
      }),
    ).not.toBe(first);
  });

  it("rejects ambiguous or unsafe run identifiers", () => {
    expect(isS015ClientPersonaScopeRunId("owner-trial-20260726")).toBe(true);
    expect(isS015ClientPersonaScopeRunId("ab")).toBe(false);
    expect(isS015ClientPersonaScopeRunId("../production")).toBe(false);
    expect(isS015ClientPersonaScopeRunId("contains spaces")).toBe(false);
  });

  it("reuses the sole active target-tenant membership", () => {
    expect(
      planS015PersonaTenantMembership({
        memberships: [
          { id: "existing", tenant_id: "target", status: "active" },
          { id: "external", tenant_id: "other", status: "disabled" },
        ],
        targetTenantId: "target",
        generatedMembershipId: "generated",
      }),
    ).toEqual({
      tenantMembershipId: "existing",
      createsTenantMembership: false,
      activeExternalMembershipId: null,
    });
  });

  it("journals only an active external membership when creating scope", () => {
    expect(
      planS015PersonaTenantMembership({
        memberships: [
          { id: "external", tenant_id: "other", status: "active" },
        ],
        targetTenantId: "target",
        generatedMembershipId: "generated",
      }),
    ).toEqual({
      tenantMembershipId: "generated",
      createsTenantMembership: true,
      activeExternalMembershipId: "external",
    });
  });

  it("rejects multiple active target or external memberships", () => {
    expect(() =>
      planS015PersonaTenantMembership({
        memberships: [
          { id: "a", tenant_id: "target", status: "active" },
          { id: "b", tenant_id: "target", status: "active" },
        ],
        targetTenantId: "target",
        generatedMembershipId: "generated",
      }),
    ).toThrow("CLIENT_PERSONA_SCOPE_TARGET_MEMBERSHIP_AMBIGUOUS");
    expect(() =>
      planS015PersonaTenantMembership({
        memberships: [
          { id: "a", tenant_id: "other-a", status: "active" },
          { id: "b", tenant_id: "other-b", status: "active" },
        ],
        targetTenantId: "target",
        generatedMembershipId: "generated",
      }),
    ).toThrow("CLIENT_PERSONA_SCOPE_EXTERNAL_MEMBERSHIP_AMBIGUOUS");
  });
});

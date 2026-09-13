import { createHash } from "node:crypto";

// X009-B clean owner-entry UAT workspace contract.
//
// The clean workspace is a brand-new tenant inside the approved non-Production
// UAT environment. Approved internal Samawah team Auth identities receive a new
// active membership there (so it becomes their natural entry), while their
// legacy Glass/Hadna tenant membership is made inactive. Legacy audit and
// package-ledger history is never deleted; it is simply reachable only through
// the quarantined legacy tenant. The hosted tool
// (scripts/prepare-s015-clean-workspace.mjs) and the local persistent E2E seed
// both follow this contract so that dry-run/apply/replay/rollback produce
// stable identifiers and category-only evidence.

export const CLEAN_WORKSPACE_TENANT_NAME = "سماوة — مساحة المالك";
export const CLEAN_WORKSPACE_CATEGORY = "x009b_clean_owner_entry_workspace";
export const CLEAN_WORKSPACE_PROVISIONED_ACTION =
  "x009b_clean_workspace_provisioned";
export const CLEAN_WORKSPACE_ROLLBACK_ACTION =
  "x009b_clean_workspace_rolled_back";
// X010-B-7C-9: the apply path persists one deterministic append-only audit
// row that binds the run to the exact source tenant and membership set it
// quarantined. Later status/replay/rollback processes resolve this binding
// instead of re-deriving identity from whatever happens to be active.
export const CLEAN_WORKSPACE_SOURCE_BINDING_ACTION =
  "x010b7c9_clean_workspace_source_binding";

export const CLEAN_WORKSPACE_INTERNAL_ROLE_KEYS = [
  "tenant_owner",
  "tenant_administrator",
  "project_manager",
  "marketing_manager",
  "account_manager",
  "content_writer",
  "designer",
  "performance_specialist",
] as const;

const CLIENT_ONLY_ROLE_KEYS = new Set([
  "client_admin",
  "client_approver",
  "client_viewer",
]);

const RUN_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]{2,80}$/u;

export const assertCleanWorkspaceRunId = (runId: string): void => {
  if (!RUN_ID_PATTERN.test(runId)) {
    throw new Error("CLEAN_WORKSPACE_RUN_ID_INVALID");
  }
};

const toStableUuid = (value: string): string => {
  const bytes = Buffer.from(
    createHash("sha256").update(value).digest().subarray(0, 16),
  );
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

export const cleanWorkspaceTenantId = (runId: string): string => {
  assertCleanWorkspaceRunId(runId);
  return toStableUuid(`x009b:tenant:${runId}`);
};

export const cleanWorkspaceMembershipId = (input: {
  runId: string;
  authUserId: string;
}): string => {
  assertCleanWorkspaceRunId(input.runId);
  if (!input.authUserId) {
    throw new Error("CLEAN_WORKSPACE_USER_REQUIRED");
  }
  return toStableUuid(`x009b:membership:${input.runId}:${input.authUserId}`);
};

export const cleanWorkspaceProfileSyncRunId = (runId: string): string =>
  `x009b-profiles-${runId}`;

export type LegacyRoleReference = {
  roleKey: string;
  scopeType: "tenant" | "client";
};

export type CleanRolePlan = {
  roleKey: string;
  scopeType: "tenant";
  assignmentId: string;
};

export type WorkspaceMembershipReference = {
  id: string;
  tenantId: string;
  status: string;
};

// X010-B-7C-9 hardened source selection. The original X009-B selector treated
// every non-target membership as "legacy" and failed when a persona had more
// than one — which is exactly the world after a first rollover plus new owner
// trials: the original legacy membership stays behind as a disabled historical
// row. The rollover source is therefore defined by *activity*, not by history:
// every approved internal persona must have exactly one active membership
// outside the deterministic target, all personas must share that source
// tenant, and every deviation fails closed before any mutation.
export type CleanWorkspacePersonaSource = {
  key: string;
  membership: WorkspaceMembershipReference;
};

export type CleanWorkspaceSourceSelectionPlan = {
  sourceTenantId: string;
  selections: CleanWorkspacePersonaSource[];
};

export const planCleanWorkspaceSourceSelection = (input: {
  targetTenantId: string;
  personas: ReadonlyArray<{
    key: string;
    memberships: readonly WorkspaceMembershipReference[];
  }>;
}): CleanWorkspaceSourceSelectionPlan => {
  const selections: CleanWorkspacePersonaSource[] = [];
  const sourceTenantIds = new Set<string>();

  for (const persona of input.personas) {
    const activeMemberships = persona.memberships.filter(
      (membership) => membership.status === "active",
    );
    if (activeMemberships.length === 0) {
      throw new Error("CLEAN_WORKSPACE_ACTIVE_SOURCE_MISSING");
    }
    if (activeMemberships.length > 1) {
      throw new Error(
        `CLEAN_WORKSPACE_ACTIVE_SOURCE_AMBIGUOUS:${activeMemberships.length}`,
      );
    }
    const candidate = activeMemberships[0];
    if (candidate.tenantId === input.targetTenantId) {
      throw new Error("CLEAN_WORKSPACE_SOURCE_TENANT_COLLIDES_WITH_TARGET");
    }
    selections.push({ key: persona.key, membership: candidate });
    sourceTenantIds.add(candidate.tenantId);
  }

  if (selections.length === 0) {
    throw new Error("CLEAN_WORKSPACE_ACTIVE_SOURCE_MISSING");
  }
  if (sourceTenantIds.size !== 1) {
    throw new Error("CLEAN_WORKSPACE_SOURCE_TENANT_MISMATCH");
  }

  return { sourceTenantId: [...sourceTenantIds][0], selections };
};

// Deterministic append-only binding between one run and its exact quarantined
// source set. The canonical reason format is mirrored byte-for-byte by
// scripts/prepare-s015-clean-workspace.mjs (see the synchronization-guard
// unit test) so the hosted tool and local persistent journeys resolve the
// same binding rows.
export type CleanWorkspaceSourceBinding = {
  runId: string;
  sourceTenantId: string;
  sourceMembershipIds: readonly string[];
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

const canonicalizeSourceMembershipIds = (ids: readonly string[]): string[] =>
  [...ids].filter(Boolean).sort();

export const cleanWorkspaceSourceBindingAuditEventId = (runId: string): string =>
  cleanWorkspaceAuditEventId({ runId, suffix: "source-binding" });

export const buildCleanWorkspaceSourceBindingReason = (
  binding: CleanWorkspaceSourceBinding,
): string =>
  `run_id=${binding.runId};source_tenant=${binding.sourceTenantId};source_memberships=${canonicalizeSourceMembershipIds(
    binding.sourceMembershipIds,
  ).join(",")}`;

export const parseCleanWorkspaceSourceBindingReason = (
  reason: string | null | undefined,
): CleanWorkspaceSourceBinding | null => {
  if (!reason) return null;
  const segments = reason.split(";").map((segment) => segment.trim());
  const fields = new Map<string, string>();
  for (const segment of segments) {
    const separator = segment.indexOf("=");
    if (separator < 1) return null;
    fields.set(segment.slice(0, separator), segment.slice(separator + 1));
  }
  const runId = fields.get("run_id");
  const sourceTenantId = fields.get("source_tenant");
  const memberships = fields.get("source_memberships");
  if (!runId || !sourceTenantId || memberships === undefined) return null;
  if (!UUID_PATTERN.test(sourceTenantId)) return null;
  const sourceMembershipIds = memberships
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  if (sourceMembershipIds.length === 0) return null;
  if (sourceMembershipIds.some((id) => !UUID_PATTERN.test(id))) return null;
  return {
    runId,
    sourceTenantId,
    sourceMembershipIds: canonicalizeSourceMembershipIds(sourceMembershipIds),
  };
};

export const cleanWorkspaceBindingsMatch = (
  left: CleanWorkspaceSourceBinding,
  right: CleanWorkspaceSourceBinding,
): boolean =>
  left.runId === right.runId &&
  left.sourceTenantId === right.sourceTenantId &&
  canonicalizeSourceMembershipIds(left.sourceMembershipIds).join(",") ===
    canonicalizeSourceMembershipIds(right.sourceMembershipIds).join(",");

// Mirror a persona's legacy role assignments into the clean workspace at tenant
// scope. Management roles are already tenant-scoped and migrate unchanged.
// Client-scoped internal roles (account_manager/content_writer/designer/...)
// become tenant-scoped entry assignments because the clean workspace starts with
// zero clients; the owner adds proper client-scoped assignments later through
// the guided client setup (X009-C). Client-only roles are never mirrored: client
// personas do not enter the clean workspace until the owner creates a real
// client, so they never receive automatic access.
export const planCleanWorkspaceRolesForUser = (input: {
  runId: string;
  authUserId: string;
  legacyRoles: readonly LegacyRoleReference[];
}): CleanRolePlan[] => {
  assertCleanWorkspaceRunId(input.runId);
  if (!input.authUserId) {
    throw new Error("CLEAN_WORKSPACE_USER_REQUIRED");
  }
  const seen = new Set<string>();
  const planned: CleanRolePlan[] = [];
  for (const role of input.legacyRoles) {
    if (CLIENT_ONLY_ROLE_KEYS.has(role.roleKey)) {
      continue;
    }
    if (!CLEAN_WORKSPACE_INTERNAL_ROLE_KEYS.includes(role.roleKey as never)) {
      continue;
    }
    if (seen.has(role.roleKey)) {
      continue;
    }
    seen.add(role.roleKey);
    planned.push({
      roleKey: role.roleKey,
      scopeType: "tenant",
      assignmentId: cleanWorkspaceRoleAssignmentId({
        runId: input.runId,
        authUserId: input.authUserId,
        roleKey: role.roleKey,
      }),
    });
  }
  return planned;
};

export const cleanWorkspaceRoleAssignmentId = (input: {
  runId: string;
  authUserId: string;
  roleKey: string;
}): string => {
  assertCleanWorkspaceRunId(input.runId);
  if (!input.authUserId || !input.roleKey) {
    throw new Error("CLEAN_WORKSPACE_ROLE_INPUT_REQUIRED");
  }
  return toStableUuid(
    `x009b:role:${input.runId}:${input.authUserId}:${input.roleKey}`,
  );
};

export const cleanWorkspaceAuditEventId = (input: {
  runId: string;
  suffix: string;
}): string => {
  assertCleanWorkspaceRunId(input.runId);
  if (!input.suffix) {
    throw new Error("CLEAN_WORKSPACE_AUDIT_SUFFIX_REQUIRED");
  }
  return toStableUuid(`x009b:audit:${input.runId}:${input.suffix}`);
};

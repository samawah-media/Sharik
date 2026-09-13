import { createHash } from "node:crypto";

export const S015_CLIENT_PERSONAS = [
  { key: "CLIENT_APPROVER", roleKey: "client_approver" },
  { key: "CLIENT_VIEWER", roleKey: "client_viewer" },
];

const stableUuid = (value) => {
  const bytes = Buffer.from(
    createHash("sha256").update(value).digest().subarray(0, 16),
  );
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

export const createS015ClientPersonaScopeIds = ({
  runId,
  userId,
  roleKey,
}) => ({
  tenantMembershipId: stableUuid(`x009d:tenant-membership:${runId}:${userId}`),
  clientMembershipId: stableUuid(`x009d:client-membership:${runId}:${userId}`),
  roleAssignmentId: stableUuid(`x009d:role:${runId}:${userId}:${roleKey}`),
  applyAuditId: stableUuid(`x009d:audit:${runId}:${userId}:apply`),
  rollbackAuditId: stableUuid(`x009d:audit:${runId}:${userId}:rollback`),
});

export const createS015PersonaScopeJournalId = ({
  runId,
  resourceType,
  resourceId,
}) => stableUuid(`x009d:journal:${runId}:${resourceType}:${resourceId}`);

export const planS015PersonaTenantMembership = ({
  memberships,
  targetTenantId,
  generatedMembershipId,
}) => {
  const activeTargetMemberships = memberships.filter(
    (membership) =>
      membership.tenant_id === targetTenantId &&
      membership.status === "active",
  );
  if (activeTargetMemberships.length > 1) {
    throw new Error("CLIENT_PERSONA_SCOPE_TARGET_MEMBERSHIP_AMBIGUOUS");
  }
  const activeExternalMemberships = memberships.filter(
    (membership) =>
      membership.tenant_id !== targetTenantId &&
      membership.status === "active",
  );
  if (activeExternalMemberships.length > 1) {
    throw new Error("CLIENT_PERSONA_SCOPE_EXTERNAL_MEMBERSHIP_AMBIGUOUS");
  }

  return {
    tenantMembershipId:
      activeTargetMemberships[0]?.id ?? generatedMembershipId,
    createsTenantMembership: activeTargetMemberships.length === 0,
    activeExternalMembershipId: activeExternalMemberships[0]?.id ?? null,
  };
};

export const isS015ClientPersonaScopeRunId = (value) =>
  /^[a-zA-Z0-9][a-zA-Z0-9._-]{2,80}$/.test(value);

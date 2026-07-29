export const S015_CLIENT_PERSONAS: readonly [
  { readonly key: "CLIENT_APPROVER"; readonly roleKey: "client_approver" },
  { readonly key: "CLIENT_VIEWER"; readonly roleKey: "client_viewer" },
];

export function createS015ClientPersonaScopeIds(input: {
  runId: string;
  userId: string;
  roleKey: string;
}): {
  tenantMembershipId: string;
  clientMembershipId: string;
  roleAssignmentId: string;
  applyAuditId: string;
  rollbackAuditId: string;
};

export function createS015PersonaScopeJournalId(input: {
  runId: string;
  resourceType: string;
  resourceId: string;
}): string;

export function planS015PersonaTenantMembership(input: {
  memberships: Array<{
    id: string;
    tenant_id: string;
    status: string;
  }>;
  targetTenantId: string;
  generatedMembershipId: string;
}): {
  tenantMembershipId: string;
  createsTenantMembership: boolean;
  activeExternalMembershipId: string | null;
};

export function isS015ClientPersonaScopeRunId(value: string): boolean;

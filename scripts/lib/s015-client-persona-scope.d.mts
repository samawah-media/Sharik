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

export function isS015ClientPersonaScopeRunId(value: string): boolean;

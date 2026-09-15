import type { AuthorizationActor } from "@/modules/authorization/evaluator";
import type {
  RoleAssignment,
  RoleKey,
  TenantMembership,
} from "@/modules/memberships/membership";
import type { CommentRecord } from "@/modules/comments/comment-visibility-rules";
import type { FileAssetRecord } from "@/modules/files/file-visibility-rules";
import type {
  R008ApprovalEvidenceItem,
  R008IsolationProofActors,
  R008ScopedEvidenceRecord,
} from "@/modules/release/r008-isolation-proof";

export const r008SyntheticTenant = {
  id: "tenant_r008_local",
  name: "controlled_pilot_tenant",
} as const;

export const r008SyntheticClientA = {
  id: "client_r008_a",
  tenantId: r008SyntheticTenant.id,
  category: "authorized_hadna_scope",
} as const;

export const r008SyntheticClientB = {
  id: "client_r008_b",
  tenantId: r008SyntheticTenant.id,
  category: "synthetic_comparison_scope",
} as const;

const tenantMembership = ({
  id,
  userId,
  status = "active",
}: Pick<TenantMembership, "id" | "userId"> &
  Partial<Pick<TenantMembership, "status">>): TenantMembership => ({
  id,
  userId,
  tenantId: r008SyntheticTenant.id,
  status,
});

const roleAssignment = ({
  id,
  membershipId,
  roleKey,
  scopeType,
  scopeId,
}: Omit<RoleAssignment, "tenantId" | "status">): RoleAssignment => ({
  id,
  tenantId: r008SyntheticTenant.id,
  membershipId,
  roleKey,
  scopeType,
  scopeId,
  status: "active",
});

const actorFor = ({
  userId,
  roleKey,
  scopeType,
  scopeId,
}: {
  userId: string;
  roleKey?: RoleKey;
  scopeType?: RoleAssignment["scopeType"];
  scopeId?: string;
}): AuthorizationActor => {
  const membership = tenantMembership({
    id: `tm_${userId}`,
    userId,
  });
  const roleAssignments =
    roleKey && scopeType && scopeId
      ? [
          roleAssignment({
            id: `ra_${userId}`,
            membershipId: membership.id,
            roleKey,
            scopeType,
            scopeId,
          }),
        ]
      : [];

  return {
    userId,
    tenantId: r008SyntheticTenant.id,
    tenantMembership: membership,
    roleAssignments,
  };
};

export const r008Actors: R008IsolationProofActors = {
  management: actorFor({
    userId: "r008_management",
    roleKey: "tenant_administrator",
    scopeType: "tenant",
    scopeId: r008SyntheticTenant.id,
  }),
  assignedInternalA: actorFor({
    userId: "r008_assigned_internal_a",
    roleKey: "account_manager",
    scopeType: "client",
    scopeId: r008SyntheticClientA.id,
  }),
  clientViewerA: actorFor({
    userId: "r008_client_viewer_a",
    roleKey: "client_viewer",
    scopeType: "client",
    scopeId: r008SyntheticClientA.id,
  }),
  clientApproverA: actorFor({
    userId: "r008_client_approver_a",
    roleKey: "client_approver",
    scopeType: "client",
    scopeId: r008SyntheticClientA.id,
  }),
  unassignedClientUser: actorFor({
    userId: "r008_unassigned_client_user",
  }),
};

export const r008ClientIds = [
  r008SyntheticClientA.id,
  r008SyntheticClientB.id,
] as const;

export const r008ScopedDeliverables: R008ScopedEvidenceRecord[] = [
  {
    id: "r008_deliverable_client_a",
    tenantId: r008SyntheticTenant.id,
    clientId: r008SyntheticClientA.id,
    surface: "deliverable",
  },
  {
    id: "r008_deliverable_client_b",
    tenantId: r008SyntheticTenant.id,
    clientId: r008SyntheticClientB.id,
    surface: "deliverable",
  },
];

export const r008ScopedApprovalItems: R008ApprovalEvidenceItem[] = [
  {
    id: "r008_client_a_current_approval",
    tenantId: r008SyntheticTenant.id,
    clientId: r008SyntheticClientA.id,
    deliverableId: "r008_deliverable_client_a",
    versionState: "current_client_visible_version",
    visibleToClient: true,
  },
  {
    id: "r008_client_b_current_approval",
    tenantId: r008SyntheticTenant.id,
    clientId: r008SyntheticClientB.id,
    deliverableId: "r008_deliverable_client_b",
    versionState: "current_client_visible_version",
    visibleToClient: true,
  },
  {
    id: "r008_client_a_stale_approval",
    tenantId: r008SyntheticTenant.id,
    clientId: r008SyntheticClientA.id,
    deliverableId: "r008_deliverable_client_a",
    versionState: "stale_version",
    visibleToClient: true,
  },
];

export const r008FileAssets: FileAssetRecord[] = [
  {
    id: "r008_client_a_visible_file",
    tenantId: r008SyntheticTenant.id,
    clientId: r008SyntheticClientA.id,
    ownerUserId: "r008_assigned_internal_a",
    relatedDeliverableId: "r008_deliverable_client_a",
    visibility: "client_visible",
    fileType: "application/pdf",
    fileSize: 1000,
    storagePath: "r008/local/client-a-visible.pdf",
    versionNumber: 1,
    isFinal: false,
    createdAt: "2026-07-08T00:00:00.000Z",
  },
  {
    id: "r008_client_a_final_file",
    tenantId: r008SyntheticTenant.id,
    clientId: r008SyntheticClientA.id,
    ownerUserId: "r008_assigned_internal_a",
    relatedDeliverableId: "r008_deliverable_client_a",
    visibility: "final_delivery",
    fileType: "application/pdf",
    fileSize: 1200,
    storagePath: "r008/local/client-a-final.pdf",
    versionNumber: 2,
    isFinal: true,
    createdAt: "2026-07-08T00:00:00.000Z",
  },
  {
    id: "r008_client_a_internal_file",
    tenantId: r008SyntheticTenant.id,
    clientId: r008SyntheticClientA.id,
    ownerUserId: "r008_assigned_internal_a",
    relatedDeliverableId: "r008_deliverable_client_a",
    visibility: "internal_only",
    fileType: "text/plain",
    fileSize: 200,
    storagePath: "r008/local/client-a-internal.txt",
    versionNumber: 1,
    isFinal: false,
    createdAt: "2026-07-08T00:00:00.000Z",
  },
  {
    id: "r008_client_b_visible_file",
    tenantId: r008SyntheticTenant.id,
    clientId: r008SyntheticClientB.id,
    ownerUserId: "r008_assigned_internal_b",
    relatedDeliverableId: "r008_deliverable_client_b",
    visibility: "client_visible",
    fileType: "application/pdf",
    fileSize: 900,
    storagePath: "r008/local/client-b-visible.pdf",
    versionNumber: 1,
    isFinal: false,
    createdAt: "2026-07-08T00:00:00.000Z",
  },
];

export const r008Comments: CommentRecord[] = [
  {
    id: "r008_client_a_client_comment",
    tenantId: r008SyntheticTenant.id,
    clientId: r008SyntheticClientA.id,
    relatedEntityType: "deliverable",
    relatedEntityId: "r008_deliverable_client_a",
    commentType: "client_comment",
    visibility: "client_visible",
    body: "SAFE_CLIENT_VISIBLE_COMMENT_CATEGORY",
    authorUserId: "r008_client_approver_a",
    createdAt: "2026-07-08T00:00:00.000Z",
  },
  {
    id: "r008_client_a_internal_comment",
    tenantId: r008SyntheticTenant.id,
    clientId: r008SyntheticClientA.id,
    relatedEntityType: "deliverable",
    relatedEntityId: "r008_deliverable_client_a",
    commentType: "internal_comment",
    visibility: "internal_only",
    body: "SAFE_INTERNAL_COMMENT_CATEGORY",
    authorUserId: "r008_assigned_internal_a",
    createdAt: "2026-07-08T00:00:00.000Z",
  },
  {
    id: "r008_client_b_client_comment",
    tenantId: r008SyntheticTenant.id,
    clientId: r008SyntheticClientB.id,
    relatedEntityType: "deliverable",
    relatedEntityId: "r008_deliverable_client_b",
    commentType: "client_comment",
    visibility: "client_visible",
    body: "SAFE_OTHER_CLIENT_COMMENT_CATEGORY",
    authorUserId: "r008_client_approver_b",
    createdAt: "2026-07-08T00:00:00.000Z",
  },
];

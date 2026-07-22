import {
  evaluatePermission,
  type AuthorizationActor,
} from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";

export type R008PersonaCategory =
  | "management_project_admin"
  | "assigned_internal_user"
  | "client_approver"
  | "client_viewer"
  | "unassigned_client_user";

export type R008ClientScopedRecord = {
  tenantId: string;
  clientId: string;
};

export type R008PersonaScope = {
  persona: R008PersonaCategory;
  visibleClientIds: string[];
  deniedClientIds: string[];
  canViewAllTenantClients: boolean;
};

export type R008ApprovalAuthorityDecision =
  | { allowed: true }
  | {
      allowed: false;
      reason:
        | "membership_inactive"
        | "permission_not_granted"
        | "scope_mismatch"
        | "not_client_visible"
        | "stale_version_denied";
    };

const clientOnlyRoleKeys = new Set([
  "client_admin",
  "client_approver",
  "client_viewer",
]);

const internalAssignedRoleKeys = new Set([
  "account_manager",
  "content_writer",
  "designer",
]);

const activeRoleKeysFor = (actor: AuthorizationActor) =>
  actor.roleAssignments
    .filter((assignment) => assignment.status === "active")
    .map((assignment) => assignment.roleKey);

export const classifyR008PersonaCategory = ({
  actor,
  tenantId,
}: {
  actor: AuthorizationActor;
  tenantId: string;
}): R008PersonaCategory => {
  const hasTenantManagement = evaluatePermission({
    actor,
    permission: PERMISSIONS.CLIENT_VIEW_ALL_IN_TENANT,
    resource: { tenantId },
  }).allowed;

  if (hasTenantManagement) {
    return "management_project_admin";
  }

  const roleKeys = activeRoleKeysFor(actor);

  if (roleKeys.some((roleKey) => internalAssignedRoleKeys.has(roleKey))) {
    return "assigned_internal_user";
  }

  if (roleKeys.includes("client_approver") || roleKeys.includes("client_admin")) {
    return "client_approver";
  }

  if (roleKeys.some((roleKey) => clientOnlyRoleKeys.has(roleKey))) {
    return "client_viewer";
  }

  return "unassigned_client_user";
};

export const canR008ActorViewClient = ({
  actor,
  tenantId,
  clientId,
}: {
  actor: AuthorizationActor;
  tenantId: string;
  clientId: string;
}) =>
  evaluatePermission({
    actor,
    permission: PERMISSIONS.CLIENT_VIEW,
    resource: { tenantId, clientId },
  });

export const classifyR008PersonaScope = ({
  actor,
  tenantId,
  clientIds,
}: {
  actor: AuthorizationActor;
  tenantId: string;
  clientIds: readonly string[];
}): R008PersonaScope => {
  const visibleClientIds = clientIds.filter(
    (clientId) =>
      canR008ActorViewClient({ actor, tenantId, clientId }).allowed,
  );

  return {
    persona: classifyR008PersonaCategory({ actor, tenantId }),
    visibleClientIds,
    deniedClientIds: clientIds.filter(
      (clientId) => !visibleClientIds.includes(clientId),
    ),
    canViewAllTenantClients: evaluatePermission({
      actor,
      permission: PERMISSIONS.CLIENT_VIEW_ALL_IN_TENANT,
      resource: { tenantId },
    }).allowed,
  };
};

export const filterR008ClientScopedRecords = <
  TRecord extends R008ClientScopedRecord,
>({
  actor,
  records,
  clientId,
}: {
  actor: AuthorizationActor;
  records: readonly TRecord[];
  clientId?: string;
}) =>
  records.filter((record) => {
    if (clientId && record.clientId !== clientId) {
      return false;
    }

    return canR008ActorViewClient({
      actor,
      tenantId: record.tenantId,
      clientId: record.clientId,
    }).allowed;
  });

export const canR008ActorApproveClientItem = ({
  actor,
  tenantId,
  clientId,
  visibleToClient = true,
  versionState = "current_client_visible_version",
}: {
  actor: AuthorizationActor;
  tenantId: string;
  clientId: string;
  visibleToClient?: boolean;
  versionState?:
    | "current_client_visible_version"
    | "stale_version"
    | "superseded_version";
}): R008ApprovalAuthorityDecision => {
  if (actor.tenantId !== tenantId) {
    return { allowed: false, reason: "scope_mismatch" };
  }

  if (!visibleToClient) {
    return { allowed: false, reason: "not_client_visible" };
  }

  if (versionState !== "current_client_visible_version") {
    return { allowed: false, reason: "stale_version_denied" };
  }

  return evaluatePermission({
    actor,
    permission: PERMISSIONS.DELIVERABLE_CLIENT_APPROVE,
    resource: { tenantId, clientId },
  });
};

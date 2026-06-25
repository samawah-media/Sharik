import type { RoleKey } from "../memberships/membership";

export const PERMISSIONS = {
  CLIENT_CREATE: "PERM.CLIENT.CREATE",
  CLIENT_VIEW: "PERM.CLIENT.VIEW",
  CLIENT_VIEW_ALL_IN_TENANT: "PERM.CLIENT.VIEW_ALL_IN_TENANT",
  USER_VIEW: "PERM.USR.VIEW",
  USER_INVITE: "PERM.USR.INVITE",
  USER_INVITE_RESEND: "PERM.USR.INVITE_RESEND",
  USER_ROLE_UPDATE: "PERM.USR.ROLE_UPDATE",
  USER_SUSPEND: "PERM.USR.SUSPEND",
  USER_RESPONSIBILITY_TRANSFER: "PERM.USR.RESPONSIBILITY_TRANSFER",
  AUDIT_USER_VIEW: "PERM.AUDIT.USER_VIEW",
  AUDIT_CLIENT_VIEW: "PERM.AUDIT.CLIENT_VIEW",
} as const;

export type PermissionId = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const rolePermissions: Record<RoleKey, readonly PermissionId[]> = {
  tenant_owner: Object.values(PERMISSIONS),
  tenant_administrator: Object.values(PERMISSIONS),
  account_manager: [PERMISSIONS.CLIENT_VIEW],
  content_writer: [PERMISSIONS.CLIENT_VIEW],
  designer: [PERMISSIONS.CLIENT_VIEW],
  client_admin: [PERMISSIONS.CLIENT_VIEW],
  client_approver: [PERMISSIONS.CLIENT_VIEW],
  client_viewer: [PERMISSIONS.CLIENT_VIEW],
};

export const roleGrantsPermission = (
  roleKey: RoleKey,
  permission: PermissionId,
) => rolePermissions[roleKey].includes(permission);

import { isActive, type ClientMembership } from "../memberships/membership";

export type ClientScopeInput = {
  userId: string;
  tenantId: string;
  clientId: string;
  clientMemberships: ClientMembership[];
};

export const hasActiveClientMembership = ({
  userId,
  tenantId,
  clientId,
  clientMemberships,
}: ClientScopeInput) =>
  clientMemberships.some(
    (membership) =>
      membership.userId === userId &&
      membership.tenantId === tenantId &&
      membership.clientId === clientId &&
      isActive(membership.status),
  );

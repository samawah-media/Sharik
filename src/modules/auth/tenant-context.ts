import type { AuthSession } from "./session";
import { safeDeniedError, type UnsafeErrorInput } from "../errors/safe-errors";
import { isActive, type TenantMembership } from "../memberships/membership";

export type TenantContext = {
  tenantId: string;
  membershipId: string;
  userId: string;
  source: "membership";
};

export type TenantContextResult =
  | { ok: true; value: TenantContext }
  | { ok: false; error: UnsafeErrorInput };

export type ResolveTenantContextInput = {
  session: AuthSession | null;
  memberships: TenantMembership[];
  targetTenantId?: string;
  browserTenantId?: string;
};

export const resolveTenantContext = ({
  session,
  memberships,
  targetTenantId,
}: ResolveTenantContextInput): TenantContextResult => {
  if (!session) {
    return { ok: false, error: safeDeniedError("AUTH_REQUIRED") };
  }

  const userMemberships = memberships.filter(
    (membership) => membership.userId === session.userId,
  );
  const activeMemberships = userMemberships.filter((membership) =>
    isActive(membership.status),
  );

  if (userMemberships.length > 0 && activeMemberships.length === 0) {
    return { ok: false, error: safeDeniedError("MEMBERSHIP_DISABLED") };
  }

  if (activeMemberships.length === 0) {
    return { ok: false, error: safeDeniedError("ACCESS_DENIED") };
  }

  const membership = targetTenantId
    ? activeMemberships.find((candidate) => candidate.tenantId === targetTenantId)
    : activeMemberships.length === 1
      ? activeMemberships[0]
      : undefined;

  if (!membership) {
    return { ok: false, error: safeDeniedError("ACCESS_DENIED") };
  }

  return {
    ok: true,
    value: {
      tenantId: membership.tenantId,
      membershipId: membership.id,
      userId: session.userId,
      source: "membership",
    },
  };
};

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthorizationActor } from "@/modules/authorization/evaluator";
import type { ClientRecord } from "@/modules/clients/client-repository";
import type {
  ClientMembership,
  MembershipStatus,
  RoleAssignment,
  RoleKey,
  ScopeType,
  TenantMembership,
} from "@/modules/memberships/membership";
import { isActive } from "@/modules/memberships/membership";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type RuntimeContextReason =
  | "auth_required"
  | "session_expired"
  | "membership_disabled"
  | "access_denied"
  | "runtime_unavailable";

export type AuthClaims = {
  sub?: string;
  email?: string;
};

export type TenantMembershipRow = {
  id: string;
  tenant_id: string;
  auth_user_id: string;
  status: string;
};

export type ClientMembershipRow = {
  id: string;
  tenant_id: string;
  client_id: string;
  auth_user_id: string;
  status: string;
};

export type RoleAssignmentRow = {
  id: string;
  tenant_id: string;
  membership_id: string;
  role_key: string;
  scope_type: string;
  scope_id: string;
  status: string;
};

type ClientRow = {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  status: string;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type RuntimeContext =
  | {
      ok: true;
      actor: AuthorizationActor;
      clients: ClientRecord[];
      clientMemberships: ClientMembership[];
    }
  | { ok: false; reason: RuntimeContextReason };

const toMembershipStatus = (status: string): MembershipStatus =>
  status === "disabled" || status === "removed" ? status : "active";

const toTenantMembership = (row: TenantMembershipRow): TenantMembership => ({
  id: row.id,
  tenantId: row.tenant_id,
  userId: row.auth_user_id,
  status: toMembershipStatus(row.status),
});

const toClientMembership = (row: ClientMembershipRow): ClientMembership => ({
  id: row.id,
  tenantId: row.tenant_id,
  clientId: row.client_id,
  userId: row.auth_user_id,
  status: toMembershipStatus(row.status),
});

const toRoleAssignment = (row: RoleAssignmentRow): RoleAssignment => ({
  id: row.id,
  tenantId: row.tenant_id,
  membershipId: row.membership_id,
  roleKey: row.role_key as RoleKey,
  scopeType: row.scope_type as ScopeType,
  scopeId: row.scope_id,
  status: toMembershipStatus(row.status),
});

const toClientRecord = (row: ClientRow): ClientRecord => ({
  id: row.id,
  tenantId: row.tenant_id,
  name: row.name,
  slug: row.slug,
  status: row.status === "archived" ? "archived" : "active",
  primaryContactName: row.primary_contact_name ?? undefined,
  primaryContactEmail: row.primary_contact_email ?? undefined,
  createdBy: row.created_by ?? "system",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  revision: 1,
});

const selectActiveTenantMembership = ({
  claims,
  tenantMemberships,
}: {
  claims: AuthClaims;
  tenantMemberships: TenantMembershipRow[];
}):
  | { ok: true; membership: TenantMembership }
  | { ok: false; reason: RuntimeContextReason } => {
  if (!claims.sub) {
    return { ok: false, reason: "auth_required" };
  }

  const ownTenantMemberships = tenantMemberships
    .map(toTenantMembership)
    .filter((membership) => membership.userId === claims.sub);
  const activeTenantMembership = ownTenantMemberships.find((membership) =>
    isActive(membership.status),
  );

  if (ownTenantMemberships.length > 0 && !activeTenantMembership) {
    return { ok: false, reason: "membership_disabled" };
  }

  if (!activeTenantMembership) {
    return { ok: false, reason: "access_denied" };
  }

  return { ok: true, membership: activeTenantMembership };
};

const selectActorRoles = ({
  roleAssignments,
  tenantMembership,
}: {
  roleAssignments: RoleAssignmentRow[];
  tenantMembership: TenantMembership;
}) =>
  roleAssignments
    .map(toRoleAssignment)
    .filter(
      (assignment) =>
        assignment.tenantId === tenantMembership.tenantId &&
        assignment.membershipId === tenantMembership.id &&
        isActive(assignment.status),
    );

const selectClientMemberships = ({
  claims,
  clientMemberships,
  tenantMembership,
}: {
  claims: AuthClaims;
  clientMemberships: ClientMembershipRow[];
  tenantMembership: TenantMembership;
}) =>
  clientMemberships
    .map(toClientMembership)
    .filter(
      (membership) =>
        membership.userId === claims.sub &&
        membership.tenantId === tenantMembership.tenantId,
    );

export function deriveRuntimeActor({
  claims,
  tenantMemberships,
  clientMemberships,
  roleAssignments,
}: {
  claims: AuthClaims;
  tenantMemberships: TenantMembershipRow[];
  clientMemberships: ClientMembershipRow[];
  roleAssignments: RoleAssignmentRow[];
}):
  | {
      ok: true;
      actor: AuthorizationActor;
      clientMemberships: ClientMembership[];
    }
  | { ok: false; reason: RuntimeContextReason } {
  const tenantSelection = selectActiveTenantMembership({
    claims,
    tenantMemberships,
  });

  if (!tenantSelection.ok) {
    return tenantSelection;
  }

  const actorRoles = selectActorRoles({
    roleAssignments,
    tenantMembership: tenantSelection.membership,
  });

  if (actorRoles.length === 0) {
    return { ok: false, reason: "access_denied" };
  }

  return {
    ok: true,
    actor: {
      userId: tenantSelection.membership.userId,
      tenantId: tenantSelection.membership.tenantId,
      tenantMembership: tenantSelection.membership,
      roleAssignments: actorRoles,
    },
    clientMemberships: selectClientMemberships({
      claims,
      clientMemberships,
      tenantMembership: tenantSelection.membership,
    }),
  };
}

export async function resolveRuntimeContext(
  supabase?: SupabaseClient,
): Promise<RuntimeContext> {
  const client = supabase ?? (await createSupabaseServerClient());
  const { data: claimsData, error: claimsError } = await client.auth.getClaims();

  if (claimsError) {
    return { ok: false, reason: "session_expired" };
  }

  const claims = claimsData?.claims as AuthClaims | undefined;

  if (!claims?.sub) {
    return { ok: false, reason: "auth_required" };
  }

  const { data: tenantMemberships, error: tenantError } = await client
    .from("tenant_memberships")
    .select("id, tenant_id, auth_user_id, status")
    .eq("auth_user_id", claims.sub);

  if (tenantError || !tenantMemberships) {
    return { ok: false, reason: "runtime_unavailable" };
  }

  const tenantSelection = selectActiveTenantMembership({
    claims,
    tenantMemberships: tenantMemberships as TenantMembershipRow[],
  });

  if (!tenantSelection.ok) {
    return tenantSelection;
  }

  const [clientMembershipResponse, roleAssignmentResponse, clientResponse] =
    await Promise.all([
      client
        .from("client_memberships")
        .select("id, tenant_id, client_id, auth_user_id, status")
        .eq("tenant_id", tenantSelection.membership.tenantId)
        .eq("auth_user_id", claims.sub),
      client
        .from("role_assignments")
        .select("id, tenant_id, membership_id, role_key, scope_type, scope_id, status")
        .eq("tenant_id", tenantSelection.membership.tenantId),
      client
        .from("clients")
        .select(
          "id, tenant_id, name, slug, status, primary_contact_name, primary_contact_email, created_by, created_at, updated_at",
        )
        .eq("tenant_id", tenantSelection.membership.tenantId)
        .eq("status", "active")
        .order("name", { ascending: true }),
    ]);

  if (
    clientMembershipResponse.error ||
    roleAssignmentResponse.error ||
    clientResponse.error
  ) {
    return { ok: false, reason: "runtime_unavailable" };
  }

  const actorResult = deriveRuntimeActor({
    claims,
    tenantMemberships: tenantMemberships as TenantMembershipRow[],
    clientMemberships:
      (clientMembershipResponse.data as ClientMembershipRow[] | null) ?? [],
    roleAssignments: (roleAssignmentResponse.data as RoleAssignmentRow[] | null) ?? [],
  });

  if (!actorResult.ok) {
    return actorResult;
  }

  return {
    ok: true,
    actor: actorResult.actor,
    clientMemberships: actorResult.clientMemberships,
    clients: ((clientResponse.data as ClientRow[] | null) ?? []).map(toClientRecord),
  };
}

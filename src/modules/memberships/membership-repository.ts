import type {
  ClientMembership,
  MembershipKind,
  MembershipStatus,
  RoleKey,
  RoleAssignment,
  ScopeType,
  TenantMembership,
} from "./membership";

export type MembershipRepository = {
  findTenantMembership(input: {
    tenantId: string;
    userId: string;
  }): Promise<TenantMembership | undefined>;
  findTenantMembershipById(id: string): Promise<TenantMembership | undefined>;
  findClientMembershipById(id: string): Promise<ClientMembership | undefined>;
  findMembershipById(input: {
    membershipKind: MembershipKind;
    membershipId: string;
  }): Promise<TenantMembership | ClientMembership | undefined>;
  findRoleAssignmentById(id: string): Promise<RoleAssignment | undefined>;
  activateTenantMembership(input: {
    id: string;
    tenantId: string;
    userId: string;
  }): Promise<TenantMembership>;
  activateClientMembership(input: {
    id: string;
    tenantId: string;
    clientId: string;
    userId: string;
  }): Promise<ClientMembership>;
  assignRole(input: {
    id: string;
    tenantId: string;
    membershipId: string;
    roleKey: RoleKey;
    scopeType: ScopeType;
    scopeId: string;
  }): Promise<RoleAssignment>;
  updateRoleAssignment(input: {
    assignmentId: string;
    roleKey?: RoleKey;
    scopeType?: ScopeType;
    scopeId?: string;
    status?: MembershipStatus;
  }): Promise<RoleAssignment | undefined>;
  removeClientScope(input: {
    tenantId: string;
    membershipId: string;
    clientId: string;
  }): Promise<{
    clientMembership?: ClientMembership;
    revokedRoleAssignments: RoleAssignment[];
  }>;
  disableMembership(input: {
    membershipKind: MembershipKind;
    membershipId: string;
  }): Promise<TenantMembership | ClientMembership | undefined>;
  revokeRoleAssignmentsForMembership(input: {
    tenantId: string;
    membershipId: string;
  }): Promise<RoleAssignment[]>;
  listTenantMemberships(tenantId: string): Promise<TenantMembership[]>;
  listClientMemberships(tenantId: string): Promise<ClientMembership[]>;
  listRoleAssignments(tenantId: string): Promise<RoleAssignment[]>;
};

export class InMemoryMembershipRepository implements MembershipRepository {
  private readonly tenantMemberships = new Map<string, TenantMembership>();
  private readonly clientMemberships = new Map<string, ClientMembership>();
  private readonly roleAssignments = new Map<string, RoleAssignment>();

  constructor({
    tenantMemberships = [],
    clientMemberships = [],
    roleAssignments = [],
  }: {
    tenantMemberships?: TenantMembership[];
    clientMemberships?: ClientMembership[];
    roleAssignments?: RoleAssignment[];
  } = {}) {
    for (const membership of tenantMemberships) {
      this.tenantMemberships.set(membership.id, membership);
    }

    for (const membership of clientMemberships) {
      this.clientMemberships.set(membership.id, membership);
    }

    for (const assignment of roleAssignments) {
      this.roleAssignments.set(assignment.id, assignment);
    }
  }

  async findTenantMembership(input: { tenantId: string; userId: string }) {
    return Array.from(this.tenantMemberships.values()).find(
      (membership) =>
        membership.tenantId === input.tenantId &&
        membership.userId === input.userId,
    );
  }

  async findTenantMembershipById(id: string) {
    return this.tenantMemberships.get(id);
  }

  async findClientMembershipById(id: string) {
    return this.clientMemberships.get(id);
  }

  async findMembershipById(input: {
    membershipKind: MembershipKind;
    membershipId: string;
  }) {
    return input.membershipKind === "tenant"
      ? this.findTenantMembershipById(input.membershipId)
      : this.findClientMembershipById(input.membershipId);
  }

  async findRoleAssignmentById(id: string) {
    return this.roleAssignments.get(id);
  }

  async activateTenantMembership(input: {
    id: string;
    tenantId: string;
    userId: string;
  }) {
    const existing = await this.findTenantMembership(input);

    if (existing) {
      const activated: TenantMembership = { ...existing, status: "active" };
      this.tenantMemberships.set(activated.id, activated);
      return activated;
    }

    const membership: TenantMembership = {
      id: input.id,
      tenantId: input.tenantId,
      userId: input.userId,
      status: "active",
    };

    this.tenantMemberships.set(membership.id, membership);
    return membership;
  }

  async activateClientMembership(input: {
    id: string;
    tenantId: string;
    clientId: string;
    userId: string;
  }) {
    const existing = Array.from(this.clientMemberships.values()).find(
      (membership) =>
        membership.tenantId === input.tenantId &&
        membership.clientId === input.clientId &&
        membership.userId === input.userId,
    );

    if (existing) {
      const activated: ClientMembership = { ...existing, status: "active" };
      this.clientMemberships.set(activated.id, activated);
      return activated;
    }

    const membership: ClientMembership = {
      id: input.id,
      tenantId: input.tenantId,
      clientId: input.clientId,
      userId: input.userId,
      status: "active",
    };

    this.clientMemberships.set(membership.id, membership);
    return membership;
  }

  async assignRole(input: {
    id: string;
    tenantId: string;
    membershipId: string;
    roleKey: RoleKey;
    scopeType: ScopeType;
    scopeId: string;
  }) {
    const existing = Array.from(this.roleAssignments.values()).find(
      (assignment) =>
        assignment.tenantId === input.tenantId &&
        assignment.membershipId === input.membershipId &&
        assignment.roleKey === input.roleKey &&
        assignment.scopeType === input.scopeType &&
        assignment.scopeId === input.scopeId &&
        assignment.status === "active",
    );

    if (existing) {
      return existing;
    }

    const assignment: RoleAssignment = { ...input, status: "active" };
    this.roleAssignments.set(assignment.id, assignment);
    return assignment;
  }

  async updateRoleAssignment(input: {
    assignmentId: string;
    roleKey?: RoleKey;
    scopeType?: ScopeType;
    scopeId?: string;
    status?: MembershipStatus;
  }) {
    const existing = this.roleAssignments.get(input.assignmentId);

    if (!existing) {
      return undefined;
    }

    const updated: RoleAssignment = {
      ...existing,
      roleKey: input.roleKey ?? existing.roleKey,
      scopeType: input.scopeType ?? existing.scopeType,
      scopeId: input.scopeId ?? existing.scopeId,
      status: input.status ?? existing.status,
    };

    this.roleAssignments.set(updated.id, updated);
    return updated;
  }

  async removeClientScope(input: {
    tenantId: string;
    membershipId: string;
    clientId: string;
  }) {
    const clientMembership = Array.from(this.clientMemberships.values()).find(
      (membership) =>
        membership.tenantId === input.tenantId &&
        membership.id === input.membershipId &&
        membership.clientId === input.clientId,
    );

    const disabledClientMembership = clientMembership
      ? { ...clientMembership, status: "disabled" as const }
      : undefined;

    if (disabledClientMembership) {
      this.clientMemberships.set(
        disabledClientMembership.id,
        disabledClientMembership,
      );
    }

    const revokedRoleAssignments: RoleAssignment[] = [];

    for (const assignment of this.roleAssignments.values()) {
      if (
        assignment.tenantId === input.tenantId &&
        assignment.membershipId === input.membershipId &&
        assignment.scopeType === "client" &&
        assignment.scopeId === input.clientId &&
        assignment.status === "active"
      ) {
        const revoked = { ...assignment, status: "removed" as const };
        this.roleAssignments.set(revoked.id, revoked);
        revokedRoleAssignments.push(revoked);
      }
    }

    return {
      clientMembership: disabledClientMembership,
      revokedRoleAssignments,
    };
  }

  async disableMembership(input: {
    membershipKind: MembershipKind;
    membershipId: string;
  }) {
    if (input.membershipKind === "tenant") {
      const existing = this.tenantMemberships.get(input.membershipId);

      if (!existing) {
        return undefined;
      }

      const disabled = { ...existing, status: "disabled" as const };
      this.tenantMemberships.set(disabled.id, disabled);
      return disabled;
    }

    const existing = this.clientMemberships.get(input.membershipId);

    if (!existing) {
      return undefined;
    }

    const disabled = { ...existing, status: "disabled" as const };
    this.clientMemberships.set(disabled.id, disabled);
    return disabled;
  }

  async revokeRoleAssignmentsForMembership(input: {
    tenantId: string;
    membershipId: string;
  }) {
    const revoked: RoleAssignment[] = [];

    for (const assignment of this.roleAssignments.values()) {
      if (
        assignment.tenantId === input.tenantId &&
        assignment.membershipId === input.membershipId &&
        assignment.status === "active"
      ) {
        const updated = { ...assignment, status: "removed" as const };
        this.roleAssignments.set(updated.id, updated);
        revoked.push(updated);
      }
    }

    return revoked;
  }

  async listTenantMemberships(tenantId: string) {
    return Array.from(this.tenantMemberships.values()).filter(
      (membership) => membership.tenantId === tenantId,
    );
  }

  async listClientMemberships(tenantId: string) {
    return Array.from(this.clientMemberships.values()).filter(
      (membership) => membership.tenantId === tenantId,
    );
  }

  async listRoleAssignments(tenantId: string) {
    return Array.from(this.roleAssignments.values()).filter(
      (assignment) => assignment.tenantId === tenantId,
    );
  }
}

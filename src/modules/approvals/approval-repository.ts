import type { TransactionalResource } from "@/modules/audit/audit-service";
import type {
  R007ClientApprovalState,
  R007InternalApprovalState,
  R007VersionState,
} from "@/modules/deliverables/r007-deliverable-lifecycle";

export type ApprovalDecisionKind = "approved" | "changes_requested";
export type ApprovalDecisionType = "internal" | "client";

export type DeliverableVersionRecord = {
  id: string;
  tenantId: string;
  clientId: string;
  deliverableId: string;
  versionNumber: number;
  state: R007VersionState;
  internalApprovalState: R007InternalApprovalState;
  clientApprovalState: R007ClientApprovalState;
  submittedBy: string;
  submittedAt: string;
  superseded: boolean;
};

export type ApprovalDecisionRecord = {
  id: string;
  tenantId: string;
  clientId: string;
  deliverableId: string;
  versionId: string;
  approvalType: ApprovalDecisionType;
  decision: ApprovalDecisionKind;
  actorUserId: string;
  decidedAt: string;
  reason?: string;
  idempotencyKey: string;
};

export type DeliverableVersionUpdateInput = {
  tenantId: string;
  clientId: string;
  versionId: string;
  state?: R007VersionState;
  internalApprovalState?: R007InternalApprovalState;
  clientApprovalState?: R007ClientApprovalState;
};

export type ApprovalDecisionCreateInput = ApprovalDecisionRecord;

export type ApprovalRepository = TransactionalResource & {
  findVersion(
    tenantId: string,
    clientId: string,
    versionId: string,
  ): Promise<DeliverableVersionRecord | undefined>;
  findDecisionByTenantAndIdempotencyKey(
    tenantId: string,
    idempotencyKey: string,
  ): Promise<ApprovalDecisionRecord | undefined>;
  updateVersion(
    input: DeliverableVersionUpdateInput,
  ): Promise<DeliverableVersionRecord>;
  appendDecision(
    input: ApprovalDecisionCreateInput,
  ): Promise<ApprovalDecisionRecord>;
};

export class InMemoryApprovalRepository implements ApprovalRepository {
  private readonly versions = new Map<string, DeliverableVersionRecord>();
  private readonly decisions = new Map<string, ApprovalDecisionRecord>();

  constructor({
    versions = [],
    decisions = [],
  }: {
    versions?: DeliverableVersionRecord[];
    decisions?: ApprovalDecisionRecord[];
  } = {}) {
    for (const version of versions) {
      this.versions.set(version.id, version);
    }

    for (const decision of decisions) {
      this.decisions.set(decision.id, decision);
    }
  }

  async findVersion(tenantId: string, clientId: string, versionId: string) {
    const version = this.versions.get(versionId);

    return version?.tenantId === tenantId && version.clientId === clientId
      ? version
      : undefined;
  }

  async findDecisionByTenantAndIdempotencyKey(
    tenantId: string,
    idempotencyKey: string,
  ) {
    return Array.from(this.decisions.values()).find(
      (decision) =>
        decision.tenantId === tenantId &&
        decision.idempotencyKey === idempotencyKey,
    );
  }

  async updateVersion(input: DeliverableVersionUpdateInput) {
    const version = this.versions.get(input.versionId);

    if (
      !version ||
      version.tenantId !== input.tenantId ||
      version.clientId !== input.clientId
    ) {
      throw new Error("DELIVERABLE_VERSION_NOT_FOUND");
    }

    const updated = {
      ...version,
      state: input.state ?? version.state,
      internalApprovalState:
        input.internalApprovalState ?? version.internalApprovalState,
      clientApprovalState:
        input.clientApprovalState ?? version.clientApprovalState,
    };

    this.versions.set(updated.id, updated);
    return updated;
  }

  async appendDecision(input: ApprovalDecisionCreateInput) {
    this.decisions.set(input.id, input);
    return input;
  }

  snapshot() {
    return {
      versions: Array.from(this.versions.entries()).map(([key, version]) => [
        key,
        { ...version },
      ]),
      decisions: Array.from(this.decisions.entries()).map(([key, decision]) => [
        key,
        { ...decision },
      ]),
    };
  }

  restore(snapshot: unknown) {
    const state = snapshot as {
      versions: [string, DeliverableVersionRecord][];
      decisions: [string, ApprovalDecisionRecord][];
    };

    this.versions.clear();
    this.decisions.clear();

    for (const [key, version] of state.versions) {
      this.versions.set(key, { ...version });
    }

    for (const [key, decision] of state.decisions) {
      this.decisions.set(key, { ...decision });
    }
  }
}


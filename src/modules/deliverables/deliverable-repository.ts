import type { TransactionalResource } from "@/modules/audit/audit-service";
import {
  createInitialDeliverableState,
  type DeliverableLifecycleStatus,
} from "./deliverable-rules";

export const deliverablePriorities = ["low", "normal", "high", "urgent"] as const;

export const deliverableAllocationStatuses = [
  "reserved",
  "released",
  "consumed_later",
  "cancelled",
] as const;

export type DeliverablePriority = (typeof deliverablePriorities)[number];
export type DeliverableAllocationStatus =
  (typeof deliverableAllocationStatuses)[number];

export type DeliverableRecord = {
  id: string;
  tenantId: string;
  clientId: string;
  contractId?: string;
  packageId?: string;
  packageLineId?: string;
  currentVersionId?: string;
  name: string;
  description?: string;
  type: string;
  status: DeliverableLifecycleStatus;
  priority: DeliverablePriority;
  ownerUserId?: string;
  contributorUserIds: string[];
  startDate?: string;
  internalDueDate?: string;
  clientDueDate?: string;
  finalDueDate?: string;
  requiresInternalApproval: boolean;
  requiresClientApproval: boolean;
  progressPercentage: number;
  approvedExtra: boolean;
  extraReason?: string;
  idempotencyKey: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  revision: number;
};

export type DeliverableAllocationRecord = {
  id: string;
  tenantId: string;
  clientId: string;
  deliverableId: string;
  packageLineId: string;
  reservedQuantity: number;
  status: DeliverableAllocationStatus;
  reservationLedgerEntryId: string;
  releaseLedgerEntryId?: string;
  createdAt: string;
  releasedAt?: string;
};

export type DeliverableReservationSummary = {
  packageLineId: string;
  reservedQuantity: number;
};

export type DeliverableSafeSummary = Omit<
  DeliverableRecord,
  "idempotencyKey" | "createdBy" | "extraReason" | "cancelledAt"
> & {
  reservation?: DeliverableReservationSummary;
};

export type DeliverableCreateInput = {
  id: string;
  tenantId: string;
  clientId: string;
  contractId?: string;
  packageId?: string;
  packageLineId?: string;
  name: string;
  description?: string;
  type: string;
  priority: DeliverablePriority;
  ownerUserId?: string;
  contributorUserIds: string[];
  startDate?: string;
  internalDueDate?: string;
  clientDueDate?: string;
  finalDueDate?: string;
  requiresInternalApproval: boolean;
  requiresClientApproval: boolean;
  approvedExtra: boolean;
  extraReason?: string;
  idempotencyKey: string;
  createdBy: string;
};

export type DeliverableAllocationCreateInput = {
  id: string;
  tenantId: string;
  clientId: string;
  deliverableId: string;
  packageLineId: string;
  reservedQuantity: number;
  reservationLedgerEntryId: string;
};

export type DeliverableCancelInput = {
  tenantId: string;
  clientId: string;
  deliverableId: string;
};

export type DeliverableStatusUpdateInput = {
  tenantId: string;
  clientId: string;
  deliverableId: string;
  status: DeliverableLifecycleStatus;
  progressPercentage: number;
};

export type DeliverableAllocationReleaseInput = {
  tenantId: string;
  clientId: string;
  allocationId: string;
  releaseLedgerEntryId: string;
};

export type DeliverableRepository = TransactionalResource & {
  create(input: DeliverableCreateInput): Promise<DeliverableRecord>;
  createAllocation(
    input: DeliverableAllocationCreateInput,
  ): Promise<DeliverableAllocationRecord>;
  cancelNotStarted(input: DeliverableCancelInput): Promise<DeliverableRecord>;
  updateStatus(input: DeliverableStatusUpdateInput): Promise<DeliverableRecord>;
  releaseAllocation(
    input: DeliverableAllocationReleaseInput,
  ): Promise<DeliverableAllocationRecord>;
  findByTenantClientAndId(
    tenantId: string,
    clientId: string,
    deliverableId: string,
  ): Promise<DeliverableRecord | undefined>;
  findByTenantAndIdempotencyKey(
    tenantId: string,
    idempotencyKey: string,
  ): Promise<DeliverableRecord | undefined>;
  listByTenantClient(
    tenantId: string,
    clientId: string,
  ): Promise<DeliverableSafeSummary[]>;
  listAllocationsByDeliverable(
    tenantId: string,
    clientId: string,
    deliverableId: string,
  ): Promise<DeliverableAllocationRecord[]>;
  toSafeSummary(deliverable: DeliverableRecord): Promise<DeliverableSafeSummary>;
};

export class InMemoryDeliverableRepository implements DeliverableRepository {
  private readonly deliverables = new Map<string, DeliverableRecord>();
  private readonly allocations = new Map<string, DeliverableAllocationRecord>();

  constructor({
    deliverables = [],
    allocations = [],
  }: {
    deliverables?: DeliverableRecord[];
    allocations?: DeliverableAllocationRecord[];
  } = {}) {
    for (const deliverable of deliverables) {
      this.deliverables.set(deliverable.id, deliverable);
    }

    for (const allocation of allocations) {
      this.allocations.set(allocation.id, allocation);
    }
  }

  async create(input: DeliverableCreateInput) {
    const now = new Date().toISOString();
    const initialState = createInitialDeliverableState();
    const record: DeliverableRecord = {
      ...input,
      status: initialState.status,
      progressPercentage: initialState.progressPercentage,
      createdAt: now,
      updatedAt: now,
      revision: 1,
    };

    this.deliverables.set(record.id, record);
    return record;
  }

  async createAllocation(input: DeliverableAllocationCreateInput) {
    const record: DeliverableAllocationRecord = {
      ...input,
      status: "reserved",
      createdAt: new Date().toISOString(),
    };

    this.allocations.set(record.id, record);
    return record;
  }

  async cancelNotStarted(input: DeliverableCancelInput) {
    const deliverable = this.deliverables.get(input.deliverableId);

    if (
      !deliverable ||
      deliverable.tenantId !== input.tenantId ||
      deliverable.clientId !== input.clientId
    ) {
      throw new Error("DELIVERABLE_NOT_FOUND");
    }

    const now = new Date().toISOString();
    const updated: DeliverableRecord = {
      ...deliverable,
      status: "cancelled",
      progressPercentage: 0,
      cancelledAt: now,
      updatedAt: now,
      revision: deliverable.revision + 1,
    };

    this.deliverables.set(updated.id, updated);
    return updated;
  }

  async updateStatus(input: DeliverableStatusUpdateInput) {
    const deliverable = this.deliverables.get(input.deliverableId);

    if (
      !deliverable ||
      deliverable.tenantId !== input.tenantId ||
      deliverable.clientId !== input.clientId
    ) {
      throw new Error("DELIVERABLE_NOT_FOUND");
    }

    const updated: DeliverableRecord = {
      ...deliverable,
      status: input.status,
      progressPercentage: input.progressPercentage,
      updatedAt: new Date().toISOString(),
      revision: deliverable.revision + 1,
    };

    this.deliverables.set(updated.id, updated);
    return updated;
  }

  async releaseAllocation(input: DeliverableAllocationReleaseInput) {
    const allocation = this.allocations.get(input.allocationId);

    if (
      !allocation ||
      allocation.tenantId !== input.tenantId ||
      allocation.clientId !== input.clientId
    ) {
      throw new Error("ALLOCATION_NOT_FOUND");
    }

    const updated: DeliverableAllocationRecord = {
      ...allocation,
      status: "released",
      releaseLedgerEntryId: input.releaseLedgerEntryId,
      releasedAt: new Date().toISOString(),
    };

    this.allocations.set(updated.id, updated);
    return updated;
  }

  async findByTenantClientAndId(
    tenantId: string,
    clientId: string,
    deliverableId: string,
  ) {
    const deliverable = this.deliverables.get(deliverableId);

    return deliverable?.tenantId === tenantId && deliverable.clientId === clientId
      ? deliverable
      : undefined;
  }

  async findByTenantAndIdempotencyKey(
    tenantId: string,
    idempotencyKey: string,
  ) {
    return Array.from(this.deliverables.values()).find(
      (deliverable) =>
        deliverable.tenantId === tenantId &&
        deliverable.idempotencyKey === idempotencyKey,
    );
  }

  async listByTenantClient(tenantId: string, clientId: string) {
    const scopedDeliverables = Array.from(this.deliverables.values())
      .filter(
        (deliverable) =>
          deliverable.tenantId === tenantId && deliverable.clientId === clientId,
      )
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));

    return Promise.all(
      scopedDeliverables.map((deliverable) => this.toSafeSummary(deliverable)),
    );
  }

  async listAllocationsByDeliverable(
    tenantId: string,
    clientId: string,
    deliverableId: string,
  ) {
    return Array.from(this.allocations.values()).filter(
      (allocation) =>
        allocation.tenantId === tenantId &&
        allocation.clientId === clientId &&
        allocation.deliverableId === deliverableId,
    );
  }

  async toSafeSummary(deliverable: DeliverableRecord) {
    const reservation = (
      await this.listAllocationsByDeliverable(
        deliverable.tenantId,
        deliverable.clientId,
        deliverable.id,
      )
    ).find((allocation) => allocation.status === "reserved");

    return {
      id: deliverable.id,
      tenantId: deliverable.tenantId,
      clientId: deliverable.clientId,
      contractId: deliverable.contractId,
      packageId: deliverable.packageId,
      packageLineId: deliverable.packageLineId,
      currentVersionId: deliverable.currentVersionId,
      name: deliverable.name,
      description: deliverable.description,
      type: deliverable.type,
      status: deliverable.status,
      priority: deliverable.priority,
      ownerUserId: deliverable.ownerUserId,
      contributorUserIds: deliverable.contributorUserIds,
      startDate: deliverable.startDate,
      internalDueDate: deliverable.internalDueDate,
      clientDueDate: deliverable.clientDueDate,
      finalDueDate: deliverable.finalDueDate,
      requiresInternalApproval: deliverable.requiresInternalApproval,
      requiresClientApproval: deliverable.requiresClientApproval,
      progressPercentage: deliverable.progressPercentage,
      approvedExtra: deliverable.approvedExtra,
      revision: deliverable.revision,
      createdAt: deliverable.createdAt,
      updatedAt: deliverable.updatedAt,
      reservation: reservation
        ? {
            packageLineId: reservation.packageLineId,
            reservedQuantity: reservation.reservedQuantity,
          }
        : undefined,
    };
  }

  snapshot() {
    return {
      deliverables: Array.from(this.deliverables.entries()).map(
        ([key, value]) => [key, { ...value }],
      ),
      allocations: Array.from(this.allocations.entries()).map(([key, value]) => [
        key,
        { ...value },
      ]),
    };
  }

  restore(snapshot: unknown) {
    const state = snapshot as {
      deliverables: [string, DeliverableRecord][];
      allocations: [string, DeliverableAllocationRecord][];
    };

    this.deliverables.clear();
    this.allocations.clear();

    for (const [key, value] of state.deliverables) {
      this.deliverables.set(key, { ...value });
    }

    for (const [key, value] of state.allocations) {
      this.allocations.set(key, { ...value });
    }
  }
}

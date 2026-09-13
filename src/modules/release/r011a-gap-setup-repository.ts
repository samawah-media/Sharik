import type { TransactionalResource } from "@/modules/audit/audit-service";
import type {
  R011AGapSetupCategory,
  R011AGapSetupOperation,
} from "./r011a-gap-setup-plan";

export type R011AGapSetupRecordStatus =
  | "ready_for_later_hosted_execution"
  | "rollback_no_op_available";

export type R011AGapSetupRecord = {
  id: string;
  tenantId: string;
  clientId: string;
  category: R011AGapSetupCategory;
  operation: R011AGapSetupOperation;
  status: R011AGapSetupRecordStatus;
  idempotencyKey: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type R011AGapSetupCreateInput = Omit<
  R011AGapSetupRecord,
  "status" | "createdAt" | "updatedAt"
> & {
  occurredAt: string;
};

export type R011AGapSetupRepository = TransactionalResource & {
  create(input: R011AGapSetupCreateInput): Promise<R011AGapSetupRecord>;
  findByTenantClientCategory(
    tenantId: string,
    clientId: string,
    category: R011AGapSetupCategory,
  ): Promise<R011AGapSetupRecord | undefined>;
  findByTenantAndIdempotencyKey(
    tenantId: string,
    idempotencyKey: string,
  ): Promise<R011AGapSetupRecord | undefined>;
  listByTenantClient(
    tenantId: string,
    clientId: string,
  ): Promise<R011AGapSetupRecord[]>;
};

export class InMemoryR011AGapSetupRepository
  implements R011AGapSetupRepository
{
  private readonly records = new Map<string, R011AGapSetupRecord>();

  constructor(records: R011AGapSetupRecord[] = []) {
    for (const record of records) {
      this.records.set(record.id, { ...record });
    }
  }

  async create(input: R011AGapSetupCreateInput) {
    const record: R011AGapSetupRecord = {
      id: input.id,
      tenantId: input.tenantId,
      clientId: input.clientId,
      category: input.category,
      operation: input.operation,
      status: "ready_for_later_hosted_execution",
      idempotencyKey: input.idempotencyKey,
      createdBy: input.createdBy,
      createdAt: input.occurredAt,
      updatedAt: input.occurredAt,
    };

    this.records.set(record.id, record);
    return record;
  }

  async findByTenantClientCategory(
    tenantId: string,
    clientId: string,
    category: R011AGapSetupCategory,
  ) {
    return Array.from(this.records.values()).find(
      (record) =>
        record.tenantId === tenantId &&
        record.clientId === clientId &&
        record.category === category,
    );
  }

  async findByTenantAndIdempotencyKey(
    tenantId: string,
    idempotencyKey: string,
  ) {
    return Array.from(this.records.values()).find(
      (record) =>
        record.tenantId === tenantId &&
        record.idempotencyKey === idempotencyKey,
    );
  }

  async listByTenantClient(tenantId: string, clientId: string) {
    return Array.from(this.records.values())
      .filter(
        (record) => record.tenantId === tenantId && record.clientId === clientId,
      )
      .sort((left, right) => left.category.localeCompare(right.category));
  }

  snapshot() {
    return Array.from(this.records.entries()).map(([key, record]) => [
      key,
      { ...record },
    ]);
  }

  restore(snapshot: unknown) {
    const state = snapshot as [string, R011AGapSetupRecord][];

    this.records.clear();

    for (const [key, record] of state) {
      this.records.set(key, { ...record });
    }
  }
}

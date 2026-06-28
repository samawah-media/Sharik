import type { TransactionalResource } from "@/modules/audit/audit-service";

export const contractStatuses = [
  "draft",
  "active",
  "completed",
  "cancelled",
  "archived",
] as const;

export type ContractStatus = (typeof contractStatuses)[number];

export type ContractRecord = {
  id: string;
  tenantId: string;
  clientId: string;
  name: string;
  reference?: string;
  summary?: string;
  periodStart?: string;
  periodEnd?: string;
  status: ContractStatus;
  idempotencyKey: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
};

export type ContractSafeSummary = Omit<
  ContractRecord,
  "idempotencyKey" | "createdBy" | "archivedAt"
>;

export type ContractCreateInput = {
  id: string;
  tenantId: string;
  clientId: string;
  name: string;
  reference?: string;
  summary?: string;
  periodStart?: string;
  periodEnd?: string;
  status: ContractStatus;
  idempotencyKey: string;
  createdBy: string;
};

export type ContractRepository = TransactionalResource & {
  create(input: ContractCreateInput): Promise<ContractRecord>;
  findByTenantClientAndId(
    tenantId: string,
    clientId: string,
    id: string,
  ): Promise<ContractRecord | undefined>;
  findByTenantAndIdempotencyKey(
    tenantId: string,
    idempotencyKey: string,
  ): Promise<ContractRecord | undefined>;
  listByTenantAndClient(
    tenantId: string,
    clientId: string,
  ): Promise<ContractRecord[]>;
};

export class InMemoryContractRepository implements ContractRepository {
  private readonly contracts = new Map<string, ContractRecord>();

  constructor(initialContracts: ContractRecord[] = []) {
    for (const contract of initialContracts) {
      this.contracts.set(contract.id, contract);
    }
  }

  async create(input: ContractCreateInput) {
    const now = new Date().toISOString();
    const record: ContractRecord = {
      ...input,
      createdAt: now,
      updatedAt: now,
    };

    this.contracts.set(record.id, record);
    return record;
  }

  async findByTenantClientAndId(
    tenantId: string,
    clientId: string,
    id: string,
  ) {
    const contract = this.contracts.get(id);

    return contract?.tenantId === tenantId && contract.clientId === clientId
      ? contract
      : undefined;
  }

  async findByTenantAndIdempotencyKey(
    tenantId: string,
    idempotencyKey: string,
  ) {
    return Array.from(this.contracts.values()).find(
      (contract) =>
        contract.tenantId === tenantId &&
        contract.idempotencyKey === idempotencyKey,
    );
  }

  async listByTenantAndClient(tenantId: string, clientId: string) {
    return Array.from(this.contracts.values())
      .filter(
        (contract) =>
          contract.tenantId === tenantId && contract.clientId === clientId,
      )
      .sort((left, right) => left.name.localeCompare(right.name, "ar"));
  }

  snapshot() {
    return Array.from(this.contracts.entries()).map(([key, value]) => [
      key,
      { ...value },
    ]);
  }

  restore(snapshot: unknown) {
    this.contracts.clear();

    for (const [key, value] of snapshot as [string, ContractRecord][]) {
      this.contracts.set(key, { ...value });
    }
  }
}

export const toContractSafeSummary = (
  contract: ContractRecord,
): ContractSafeSummary => ({
  id: contract.id,
  tenantId: contract.tenantId,
  clientId: contract.clientId,
  name: contract.name,
  reference: contract.reference,
  summary: contract.summary,
  periodStart: contract.periodStart,
  periodEnd: contract.periodEnd,
  status: contract.status,
  createdAt: contract.createdAt,
  updatedAt: contract.updatedAt,
});

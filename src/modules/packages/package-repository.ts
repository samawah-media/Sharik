import type { TransactionalResource } from "@/modules/audit/audit-service";
import {
  projectPackageBalance,
  type PackageBalanceProjection,
  type PackageLedgerEntry,
  type PackageLedgerEntryType,
} from "./package-ledger";

export const packageStatuses = [
  "draft",
  "active",
  "completed",
  "cancelled",
  "archived",
] as const;

export const packageLineStatuses = [
  "active",
  "completed",
  "cancelled",
  "archived",
] as const;

export type PackageStatus = (typeof packageStatuses)[number];
export type PackageLineStatus = (typeof packageLineStatuses)[number];

export type PackageRecord = {
  id: string;
  tenantId: string;
  clientId: string;
  contractId: string;
  name: string;
  periodStart?: string;
  periodEnd?: string;
  status: PackageStatus;
  idempotencyKey: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type PackageLineRecord = {
  id: string;
  tenantId: string;
  clientId: string;
  packageId: string;
  serviceLabel: string;
  deliverableTypeHint?: string;
  unitLabel: string;
  committedQuantity: number;
  status: PackageLineStatus;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
};

export type PackageLedgerRecord = PackageLedgerEntry & {
  contractId: string;
  packageId: string;
  actorUserId?: string;
  idempotencyKey: string;
};

export type PackageLineSafeSummary = Omit<
  PackageLineRecord,
  "createdBy"
> & {
  balance: PackageBalanceProjection;
};

export type PackageBalanceSafeSummary = PackageBalanceProjection & {
  packageLineId: string;
};

export type PackageSafeSummary = Omit<
  PackageRecord,
  "idempotencyKey" | "createdBy"
> & {
  lines: PackageLineSafeSummary[];
  balances: PackageBalanceSafeSummary[];
};

export type PackageCreateInput = {
  id: string;
  tenantId: string;
  clientId: string;
  contractId: string;
  name: string;
  periodStart?: string;
  periodEnd?: string;
  status: PackageStatus;
  idempotencyKey: string;
  createdBy: string;
};

export type PackageLineCreateInput = {
  id: string;
  tenantId: string;
  clientId: string;
  packageId: string;
  serviceLabel: string;
  deliverableTypeHint?: string;
  unitLabel: string;
  committedQuantity: number;
  createdBy: string;
};

export type PackageLedgerCreateInput = {
  id: string;
  tenantId: string;
  clientId: string;
  contractId: string;
  packageId: string;
  packageLineId: string;
  entryType: PackageLedgerEntryType;
  quantity: number;
  deliverableId?: string;
  reason?: string;
  actorUserId?: string;
  idempotencyKey: string;
  occurredAt?: string;
};

export type PackageRepository = TransactionalResource & {
  createPackage(input: PackageCreateInput): Promise<PackageRecord>;
  createPackageLine(input: PackageLineCreateInput): Promise<PackageLineRecord>;
  appendLedgerEntry(input: PackageLedgerCreateInput): Promise<PackageLedgerRecord>;
  findPackageByTenantAndIdempotencyKey(
    tenantId: string,
    idempotencyKey: string,
  ): Promise<PackageRecord | undefined>;
  findPackageByTenantClientAndId(
    tenantId: string,
    clientId: string,
    packageId: string,
  ): Promise<PackageRecord | undefined>;
  findPackageLineByTenantAndId(
    tenantId: string,
    packageLineId: string,
  ): Promise<PackageLineRecord | undefined>;
  findLedgerByTenantAndIdempotencyKey(
    tenantId: string,
    idempotencyKey: string,
  ): Promise<PackageLedgerRecord | undefined>;
  listByTenantClientAndContract(
    tenantId: string,
    clientId: string,
    contractId: string,
  ): Promise<PackageSafeSummary[]>;
  listLinesByPackage(
    tenantId: string,
    clientId: string,
    packageId: string,
  ): Promise<PackageLineRecord[]>;
  listLedgerByPackage(
    tenantId: string,
    clientId: string,
    packageId: string,
  ): Promise<PackageLedgerRecord[]>;
  listLedgerByPackageLine(
    tenantId: string,
    clientId: string,
    packageLineId: string,
  ): Promise<PackageLedgerRecord[]>;
  toSafeSummary(packageRecord: PackageRecord): Promise<PackageSafeSummary>;
  toLineBalanceSummary(
    packageLine: PackageLineRecord,
  ): Promise<PackageLineSafeSummary>;
};

export class InMemoryPackageRepository implements PackageRepository {
  private readonly packages = new Map<string, PackageRecord>();
  private readonly lines = new Map<string, PackageLineRecord>();
  private readonly ledger = new Map<string, PackageLedgerRecord>();

  constructor({
    packages = [],
    lines = [],
    ledger = [],
  }: {
    packages?: PackageRecord[];
    lines?: PackageLineRecord[];
    ledger?: PackageLedgerRecord[];
  } = {}) {
    for (const packageRecord of packages) {
      this.packages.set(packageRecord.id, packageRecord);
    }

    for (const line of lines) {
      this.lines.set(line.id, line);
    }

    for (const entry of ledger) {
      this.ledger.set(entry.id, entry);
    }
  }

  async createPackage(input: PackageCreateInput) {
    const now = new Date().toISOString();
    const record: PackageRecord = {
      ...input,
      createdAt: now,
      updatedAt: now,
    };

    this.packages.set(record.id, record);
    return record;
  }

  async createPackageLine(input: PackageLineCreateInput) {
    const now = new Date().toISOString();
    const record: PackageLineRecord = {
      ...input,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };

    this.lines.set(record.id, record);
    return record;
  }

  async appendLedgerEntry(input: PackageLedgerCreateInput) {
    const record: PackageLedgerRecord = {
      ...input,
      occurredAt: input.occurredAt ?? new Date().toISOString(),
    };

    this.ledger.set(record.id, record);
    return record;
  }

  async findPackageByTenantAndIdempotencyKey(
    tenantId: string,
    idempotencyKey: string,
  ) {
    return Array.from(this.packages.values()).find(
      (packageRecord) =>
        packageRecord.tenantId === tenantId &&
        packageRecord.idempotencyKey === idempotencyKey,
    );
  }

  async findPackageByTenantClientAndId(
    tenantId: string,
    clientId: string,
    packageId: string,
  ) {
    const packageRecord = this.packages.get(packageId);

    return packageRecord?.tenantId === tenantId &&
      packageRecord.clientId === clientId
      ? packageRecord
      : undefined;
  }

  async findPackageLineByTenantAndId(tenantId: string, packageLineId: string) {
    const line = this.lines.get(packageLineId);
    return line?.tenantId === tenantId ? line : undefined;
  }

  async findLedgerByTenantAndIdempotencyKey(
    tenantId: string,
    idempotencyKey: string,
  ) {
    return Array.from(this.ledger.values()).find(
      (entry) =>
        entry.tenantId === tenantId && entry.idempotencyKey === idempotencyKey,
    );
  }

  async listByTenantClientAndContract(
    tenantId: string,
    clientId: string,
    contractId: string,
  ) {
    const scopedPackages = Array.from(this.packages.values())
      .filter(
        (packageRecord) =>
          packageRecord.tenantId === tenantId &&
          packageRecord.clientId === clientId &&
          packageRecord.contractId === contractId,
      )
      .sort((left, right) => left.name.localeCompare(right.name, "ar"));

    return Promise.all(
      scopedPackages.map((packageRecord) => this.toSafeSummary(packageRecord)),
    );
  }

  async listLinesByPackage(tenantId: string, clientId: string, packageId: string) {
    return Array.from(this.lines.values())
      .filter(
        (line) =>
          line.tenantId === tenantId &&
          line.clientId === clientId &&
          line.packageId === packageId,
      );
  }

  async listLedgerByPackage(tenantId: string, clientId: string, packageId: string) {
    return Array.from(this.ledger.values())
      .filter(
        (entry) =>
          entry.tenantId === tenantId &&
          entry.clientId === clientId &&
          entry.packageId === packageId,
      )
      .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));
  }

  async listLedgerByPackageLine(
    tenantId: string,
    clientId: string,
    packageLineId: string,
  ) {
    return Array.from(this.ledger.values())
      .filter(
        (entry) =>
          entry.tenantId === tenantId &&
          entry.clientId === clientId &&
          entry.packageLineId === packageLineId,
      )
      .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));
  }

  async toLineBalanceSummary(packageLine: PackageLineRecord) {
    const entries = await this.listLedgerByPackageLine(
      packageLine.tenantId,
      packageLine.clientId,
      packageLine.id,
    );

    return {
      id: packageLine.id,
      tenantId: packageLine.tenantId,
      clientId: packageLine.clientId,
      packageId: packageLine.packageId,
      serviceLabel: packageLine.serviceLabel,
      deliverableTypeHint: packageLine.deliverableTypeHint,
      unitLabel: packageLine.unitLabel,
      committedQuantity: packageLine.committedQuantity,
      status: packageLine.status,
      createdAt: packageLine.createdAt,
      updatedAt: packageLine.updatedAt,
      balance: projectPackageBalance(entries),
    };
  }

  async toSafeSummary(packageRecord: PackageRecord) {
    const lines = await this.listLinesByPackage(
      packageRecord.tenantId,
      packageRecord.clientId,
      packageRecord.id,
    );

    const safeLines = await Promise.all(
      lines.map((line) => this.toLineBalanceSummary(line)),
    );

    return {
      id: packageRecord.id,
      tenantId: packageRecord.tenantId,
      clientId: packageRecord.clientId,
      contractId: packageRecord.contractId,
      name: packageRecord.name,
      periodStart: packageRecord.periodStart,
      periodEnd: packageRecord.periodEnd,
      status: packageRecord.status,
      createdAt: packageRecord.createdAt,
      updatedAt: packageRecord.updatedAt,
      lines: safeLines,
      balances: safeLines.map((line) => ({
        packageLineId: line.id,
        ...line.balance,
      })),
    };
  }

  snapshot() {
    return {
      packages: Array.from(this.packages.entries()).map(([key, value]) => [
        key,
        { ...value },
      ]),
      lines: Array.from(this.lines.entries()).map(([key, value]) => [
        key,
        { ...value },
      ]),
      ledger: Array.from(this.ledger.entries()).map(([key, value]) => [
        key,
        { ...value },
      ]),
    };
  }

  restore(snapshot: unknown) {
    const state = snapshot as {
      packages: [string, PackageRecord][];
      lines: [string, PackageLineRecord][];
      ledger: [string, PackageLedgerRecord][];
    };

    this.packages.clear();
    this.lines.clear();
    this.ledger.clear();

    for (const [key, value] of state.packages) {
      this.packages.set(key, { ...value });
    }

    for (const [key, value] of state.lines) {
      this.lines.set(key, { ...value });
    }

    for (const [key, value] of state.ledger) {
      this.ledger.set(key, { ...value });
    }
  }
}

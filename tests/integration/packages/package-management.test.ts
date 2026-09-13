import { describe, expect, it } from "vitest";
import {
  FailingAuditSink,
  InMemoryAuditSink,
} from "@/modules/audit/audit-service";
import { InMemoryContractRepository } from "@/modules/contracts/contract-repository";
import { InMemoryPackageRepository } from "@/modules/packages/package-repository";
import { adjustPackageCommand } from "@/server/commands/packages/adjust-package";
import { createPackageCommand } from "@/server/commands/packages/create-package";
import {
  assignedInternalA,
  clientA,
  tenantAdminA,
} from "../../fixtures/f001-fixtures";
import { contractA } from "../../fixtures/f002-fixtures";

const activeContract = {
  ...contractA,
  reference: "CTR-A-2026",
  summary: "Safe Client A contract.",
  periodStart: "2026-07-01",
  periodEnd: "2026-12-31",
  status: "active" as const,
  idempotencyKey: "existing-contract-a",
  createdBy: "tenant_admin_a",
  createdAt: "2026-06-28T00:00:00.000Z",
  updatedAt: "2026-06-28T00:00:00.000Z",
};

const packageInput = {
  clientId: clientA.id,
  contractId: contractA.id,
  name: "باقة المحتوى الشهرية",
  periodStart: "2026-07-01",
  periodEnd: "2026-07-31",
  status: "draft",
  lines: [
    {
      serviceLabel: "منشورات",
      deliverableTypeHint: "post",
      unitLabel: "منشور",
      committedQuantity: 4,
    },
    {
      serviceLabel: "تقرير أداء",
      deliverableTypeHint: "report",
      unitLabel: "تقرير",
      committedQuantity: 1,
    },
  ],
  idempotencyKey: "f002b-package-client-a",
};

describe("F-002B package commitments command", () => {
  it("creates a scoped package, package lines, commitment ledger entries, and audit", async () => {
    const audit = new InMemoryAuditSink();
    const contracts = new InMemoryContractRepository([activeContract]);
    const packages = new InMemoryPackageRepository();

    const result = await createPackageCommand({
      actor: tenantAdminA.authorizationActor,
      contracts,
      packages,
      audit,
      input: packageInput,
      idFactory: () => "generated-package-a",
      lineIdFactory: (index) => `generated-package-line-${index}`,
      ledgerIdFactory: (index) => `generated-ledger-${index}`,
    });

    expect(result).toMatchObject({
      ok: true,
      value: {
        ok: true,
        value: {
          id: "generated-package-a",
          tenantId: clientA.tenantId,
          clientId: clientA.id,
          contractId: contractA.id,
          name: "باقة المحتوى الشهرية",
          balances: [
            {
              packageLineId: "generated-package-line-0",
              committed: 4,
              reserved: 0,
              available: 4,
            },
            {
              packageLineId: "generated-package-line-1",
              committed: 1,
              reserved: 0,
              available: 1,
            },
          ],
        },
      },
    });
    await expect(
      packages.listByTenantClientAndContract(
        clientA.tenantId,
        clientA.id,
        contractA.id,
      ),
    ).resolves.toHaveLength(1);
    await expect(
      packages
        .listLedgerByPackageLine(
          clientA.tenantId,
          clientA.id,
          "generated-package-line-0",
        )
        .then((entries) => entries.map((entry) => entry.entryType)),
    ).resolves.toEqual(["commitment_added"]);
    expect(audit.events).toContainEqual(
      expect.objectContaining({
        action: "PackageCreated",
        decision: "allowed",
        tenantId: clientA.tenantId,
        clientId: clientA.id,
        targetId: "generated-package-a",
      }),
    );
  });

  it("returns the existing package for a repeated idempotency key without duplicate ledger or audit entries", async () => {
    const audit = new InMemoryAuditSink();
    const contracts = new InMemoryContractRepository([activeContract]);
    const packages = new InMemoryPackageRepository();

    const first = await createPackageCommand({
      actor: tenantAdminA.authorizationActor,
      contracts,
      packages,
      audit,
      input: packageInput,
      idFactory: () => "generated-package-a",
      lineIdFactory: (index) => `generated-package-line-${index}`,
      ledgerIdFactory: (index) => `generated-ledger-${index}`,
    });
    const second = await createPackageCommand({
      actor: tenantAdminA.authorizationActor,
      contracts,
      packages,
      audit,
      input: { ...packageInput, name: "اسم آخر لا ينشئ باقة جديدة" },
      idFactory: () => "generated-package-b",
      lineIdFactory: (index) => `duplicate-line-${index}`,
      ledgerIdFactory: (index) => `duplicate-ledger-${index}`,
    });

    expect(first).toMatchObject({ ok: true });
    expect(second).toMatchObject({
      ok: true,
      value: { ok: true, value: { id: "generated-package-a" } },
    });
    await expect(
      packages.listByTenantClientAndContract(
        clientA.tenantId,
        clientA.id,
        contractA.id,
      ),
    ).resolves.toHaveLength(1);
    await expect(
      packages.listLedgerByPackage(clientA.tenantId, clientA.id, "generated-package-a"),
    ).resolves.toHaveLength(2);
    expect(
      audit.events.filter((event) => event.action === "PackageCreated"),
    ).toHaveLength(1);
  });

  it("denies package creation for actors without package create authority", async () => {
    const audit = new InMemoryAuditSink();
    const contracts = new InMemoryContractRepository([activeContract]);
    const packages = new InMemoryPackageRepository();

    const result = await createPackageCommand({
      actor: assignedInternalA.authorizationActor,
      contracts,
      packages,
      audit,
      input: packageInput,
      idFactory: () => "denied-package",
    });

    expect(result).toMatchObject({ ok: false });
    await expect(
      packages.listByTenantClientAndContract(
        clientA.tenantId,
        clientA.id,
        contractA.id,
      ),
    ).resolves.toEqual([]);
    expect(audit.events).toContainEqual(
      expect.objectContaining({
        action: "AuthorizationDenied",
        decision: "denied",
      }),
    );
  });

  it("requires at least one package line with a non-negative commitment", async () => {
    const audit = new InMemoryAuditSink();
    const contracts = new InMemoryContractRepository([activeContract]);
    const packages = new InMemoryPackageRepository();

    const result = await createPackageCommand({
      actor: tenantAdminA.authorizationActor,
      contracts,
      packages,
      audit,
      input: { ...packageInput, lines: [] },
      idFactory: () => "invalid-package",
    });

    expect(result).toEqual({ ok: false, error: "VALIDATION_FAILED" });
    await expect(
      packages.listByTenantClientAndContract(
        clientA.tenantId,
        clientA.id,
        contractA.id,
      ),
    ).resolves.toEqual([]);
  });

  it("rolls back package, lines, and ledger entries when required audit append fails", async () => {
    const contracts = new InMemoryContractRepository([activeContract]);
    const packages = new InMemoryPackageRepository();

    await expect(
      createPackageCommand({
        actor: tenantAdminA.authorizationActor,
        contracts,
        packages,
        audit: new FailingAuditSink(),
        input: packageInput,
        idFactory: () => "audit-fails-package",
      }),
    ).rejects.toThrow("AUDIT_APPEND_FAILED");
    await expect(
      packages.listByTenantClientAndContract(
        clientA.tenantId,
        clientA.id,
        contractA.id,
      ),
    ).resolves.toEqual([]);
  });

  it("adjusts a package commitment only with a reason and append-only ledger/audit", async () => {
    const audit = new InMemoryAuditSink();
    const contracts = new InMemoryContractRepository([activeContract]);
    const packages = new InMemoryPackageRepository();

    await createPackageCommand({
      actor: tenantAdminA.authorizationActor,
      contracts,
      packages,
      audit,
      input: packageInput,
      idFactory: () => "generated-package-a",
      lineIdFactory: (index) => `generated-package-line-${index}`,
      ledgerIdFactory: (index) => `generated-ledger-${index}`,
    });

    const result = await adjustPackageCommand({
      actor: tenantAdminA.authorizationActor,
      packages,
      audit,
      input: {
        packageLineId: "generated-package-line-0",
        adjustmentQuantity: 2,
        reason: "زيادة معتمدة من الإدارة",
        idempotencyKey: "f002b-adjust-posts",
      },
      ledgerIdFactory: () => "generated-adjustment-ledger",
    });

    expect(result).toMatchObject({
      ok: true,
      value: {
        ok: true,
        value: {
          packageLineId: "generated-package-line-0",
          committed: 4,
          adjustments: 2,
          available: 6,
        },
      },
    });
    await expect(
      packages.listLedgerByPackageLine(
        clientA.tenantId,
        clientA.id,
        "generated-package-line-0",
      ),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ entryType: "commitment_added", quantity: 4 }),
        expect.objectContaining({
          entryType: "administrative_adjustment",
          quantity: 2,
          reason: "زيادة معتمدة من الإدارة",
        }),
      ]),
    );
    expect(audit.events).toContainEqual(
      expect.objectContaining({
        action: "PackageCommitmentAdjusted",
        decision: "allowed",
        targetType: "package_line",
        targetId: "generated-package-line-0",
      }),
    );
  });

  it("denies package adjustment without a reason", async () => {
    const audit = new InMemoryAuditSink();
    const packages = new InMemoryPackageRepository();

    const result = await adjustPackageCommand({
      actor: tenantAdminA.authorizationActor,
      packages,
      audit,
      input: {
        packageLineId: "generated-package-line-0",
        adjustmentQuantity: 1,
        reason: "",
        idempotencyKey: "f002b-adjust-missing-reason",
      },
    });

    expect(result).toEqual({ ok: false, error: "VALIDATION_FAILED" });
  });

  it("fails closed when a negative adjustment would reduce availability below active reservations", async () => {
    const audit = new InMemoryAuditSink();
    const contracts = new InMemoryContractRepository([activeContract]);
    const packages = new InMemoryPackageRepository();

    await createPackageCommand({
      actor: tenantAdminA.authorizationActor,
      contracts,
      packages,
      audit,
      input: packageInput,
      idFactory: () => "generated-package-a",
      lineIdFactory: (index) => `generated-package-line-${index}`,
      ledgerIdFactory: (index) => `generated-ledger-${index}`,
    });
    await packages.appendLedgerEntry({
      id: "synthetic-reservation",
      tenantId: clientA.tenantId,
      clientId: clientA.id,
      contractId: contractA.id,
      packageId: "generated-package-a",
      packageLineId: "generated-package-line-0",
      entryType: "quantity_reserved",
      quantity: 4,
      idempotencyKey: "synthetic-reservation",
      occurredAt: "2026-06-28T00:00:00.000Z",
    });

    const result = await adjustPackageCommand({
      actor: tenantAdminA.authorizationActor,
      packages,
      audit,
      input: {
        packageLineId: "generated-package-line-0",
        adjustmentQuantity: -1,
        reason: "تقليل غير آمن",
        idempotencyKey: "f002b-adjust-negative-denied",
      },
      ledgerIdFactory: () => "unsafe-adjustment",
    });

    expect(result).toMatchObject({
      ok: true,
      value: {
        ok: false,
        error: { code: "ACCESS_DENIED", exposeResource: false },
      },
    });
    await expect(
      packages.listLedgerByPackageLine(
        clientA.tenantId,
        clientA.id,
        "generated-package-line-0",
      ),
    ).resolves.not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "unsafe-adjustment" }),
      ]),
    );
  });
});

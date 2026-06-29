import { describe, expect, it } from "vitest";
import { InMemoryContractRepository } from "@/modules/contracts/contract-repository";
import {
  buildCommercialSummary,
} from "@/modules/commercial/commercial-summary";
import {
  InMemoryDeliverableRepository,
  type DeliverableRecord,
} from "@/modules/deliverables/deliverable-repository";
import { InMemoryPackageRepository } from "@/modules/packages/package-repository";
import {
  clientA,
  clientB,
  clientC,
  clientViewerA,
  tenantAdminA,
} from "../../fixtures/f001-fixtures";
import { contractA, packageA, packageLinePostsA } from "../../fixtures/f002-fixtures";

const createdAt = "2026-06-28T00:00:00.000Z";

const activeContract = {
  ...contractA,
  reference: "CTR-A-2026",
  summary: "ملخص يظهر للعميل دون تفاصيل داخلية.",
  periodStart: "2026-07-01",
  periodEnd: "2026-12-31",
  status: "active" as const,
  idempotencyKey: "existing-contract-a",
  createdBy: "tenant_admin_a",
  createdAt,
  updatedAt: createdAt,
};

const clientCContract = {
  ...activeContract,
  id: "contract_c",
  clientId: clientC.id,
  name: "Client C Retainer",
  idempotencyKey: "existing-contract-c",
};

const activePackage = {
  ...packageA,
  periodStart: "2026-07-01",
  periodEnd: "2026-07-31",
  status: "active" as const,
  idempotencyKey: "existing-package-a",
  createdBy: "tenant_admin_a",
  createdAt,
  updatedAt: createdAt,
};

const activePackageLine = {
  ...packageLinePostsA,
  serviceLabel: "منشورات",
  deliverableTypeHint: "post",
  unitLabel: "منشور",
  status: "active" as const,
  createdBy: "tenant_admin_a",
  createdAt,
  updatedAt: createdAt,
};

const deliverableA: DeliverableRecord = {
  id: "deliverable_a",
  tenantId: clientA.tenantId,
  clientId: clientA.id,
  contractId: contractA.id,
  packageId: packageA.id,
  packageLineId: packageLinePostsA.id,
  name: "منشور إطلاق الحملة",
  description: "وصف آمن للعميل.",
  type: "post",
  priority: "normal",
  ownerUserId: "internal_owner_should_not_leak_to_client",
  contributorUserIds: ["internal_contributor_should_not_leak_to_client"],
  status: "not_started",
  progressPercentage: 0,
  requiresInternalApproval: true,
  requiresClientApproval: true,
  approvedExtra: false,
  idempotencyKey: "deliverable-a-created",
  createdBy: "tenant_admin_a",
  createdAt,
  updatedAt: createdAt,
  revision: 1,
};

const repositories = () => ({
  contracts: new InMemoryContractRepository([activeContract, clientCContract]),
  packages: new InMemoryPackageRepository({
    packages: [activePackage],
    lines: [activePackageLine],
    ledger: [
      {
        id: "commitment-posts",
        tenantId: clientA.tenantId,
        clientId: clientA.id,
        contractId: contractA.id,
        packageId: packageA.id,
        packageLineId: packageLinePostsA.id,
        entryType: "commitment_added",
        quantity: 4,
        reason: "internal package setup reason",
        actorUserId: "tenant_admin_a",
        idempotencyKey: "commitment-posts",
        occurredAt: createdAt,
      },
      {
        id: "reservation-post",
        tenantId: clientA.tenantId,
        clientId: clientA.id,
        contractId: contractA.id,
        packageId: packageA.id,
        packageLineId: packageLinePostsA.id,
        deliverableId: "deliverable_a",
        entryType: "quantity_reserved",
        quantity: 1,
        reason: "internal reservation reason",
        actorUserId: "tenant_admin_a",
        idempotencyKey: "reservation-post",
        occurredAt: createdAt,
      },
    ],
  }),
  deliverables: new InMemoryDeliverableRepository({
    deliverables: [deliverableA],
    allocations: [
      {
        id: "allocation-a",
        tenantId: clientA.tenantId,
        clientId: clientA.id,
        deliverableId: deliverableA.id,
        packageLineId: packageLinePostsA.id,
        reservedQuantity: 1,
        status: "reserved",
        reservationLedgerEntryId: "reservation-post",
        createdAt,
      },
    ],
  }),
});

describe("F-002D scope-safe commercial summaries", () => {
  it("builds a management summary scoped to one client without raw audit or ledger internals", async () => {
    const summary = await buildCommercialSummary({
      actor: tenantAdminA.authorizationActor,
      clientId: clientA.id,
      ...repositories(),
    });

    expect(summary).toMatchObject({
      ok: true,
      value: {
        audience: "management",
        clientId: clientA.id,
        contracts: [expect.objectContaining({ id: contractA.id })],
        packages: [
          expect.objectContaining({
            id: packageA.id,
            balances: [
              expect.objectContaining({
                committed: 4,
                reserved: 1,
                available: 3,
              }),
            ],
          }),
        ],
        deliverables: [
          expect.objectContaining({
            id: "deliverable_a",
            status: "not_started",
            progressPercentage: 0,
          }),
        ],
      },
    });
    expect(JSON.stringify(summary)).not.toContain("internal reservation reason");
    expect(JSON.stringify(summary)).not.toContain("audit");
    expect(JSON.stringify(summary)).not.toContain(clientB.id);
  });

  it("builds a client summary that omits tenant ids, internal actor ids, ledger reasons, and other-client identifiers", async () => {
    const summary = await buildCommercialSummary({
      actor: clientViewerA.authorizationActor,
      clientId: clientA.id,
      ...repositories(),
    });

    expect(summary).toMatchObject({
      ok: true,
      value: {
        audience: "client",
        contracts: [expect.objectContaining({ name: activeContract.name })],
        packages: [
          expect.objectContaining({
            name: activePackage.name,
            lines: [expect.objectContaining({ serviceLabel: "منشورات" })],
          }),
        ],
        deliverables: [
          expect.objectContaining({
            name: "منشور إطلاق الحملة",
            status: "not_started",
            progressPercentage: 0,
          }),
        ],
      },
    });
    const serialized = JSON.stringify(summary);
    expect(serialized).not.toContain("tenant_a");
    expect(serialized).not.toContain("tenant_b");
    expect(serialized).not.toContain("client_b");
    expect(serialized).not.toContain("client_c");
    expect(serialized).not.toContain("internal");
    expect(serialized).not.toContain("actorUserId");
    expect(serialized).not.toContain("audit");
  });

  it("denies unauthorized summary scope without revealing whether the target exists", async () => {
    const summary = await buildCommercialSummary({
      actor: clientViewerA.authorizationActor,
      clientId: clientC.id,
      ...repositories(),
    });

    expect(summary).toMatchObject({
      ok: false,
      error: { code: "ACCESS_DENIED", exposeResource: false },
    });
    expect(JSON.stringify(summary)).not.toContain(clientC.name);
  });
});

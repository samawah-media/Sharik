import { describe, expect, it } from "vitest";
import {
  FailingAuditSink,
  InMemoryAuditSink,
} from "@/modules/audit/audit-service";
import {
  InMemoryDeliverableRepository,
  type DeliverableRecord,
} from "@/modules/deliverables/deliverable-repository";
import { InMemoryPackageRepository } from "@/modules/packages/package-repository";
import { cancelNotStartedDeliverableCommand } from "@/server/commands/deliverables/cancel-not-started-deliverable";
import {
  assignedInternalA,
  clientA,
  clientC,
  tenantAdminA,
} from "../../fixtures/f001-fixtures";
import { contractA, packageA, packageLinePostsA } from "../../fixtures/f002-fixtures";

const createdAt = "2026-06-28T00:00:00.000Z";

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
  deliverableTypeHint: "post",
  status: "active" as const,
  createdBy: "tenant_admin_a",
  createdAt,
  updatedAt: createdAt,
};

const reservedDeliverable = (overrides: Partial<DeliverableRecord> = {}) => ({
  id: "reserved-deliverable-a",
  tenantId: clientA.tenantId,
  clientId: clientA.id,
  contractId: contractA.id,
  packageId: packageA.id,
  packageLineId: packageLinePostsA.id,
  name: "منشور قابل للإلغاء",
  description: "مخرج لم يبدأ بعد.",
  type: "post",
  priority: "normal" as const,
  ownerUserId: assignedInternalA.authorizationActor.userId,
  contributorUserIds: [],
  status: "not_started" as const,
  progressPercentage: 0,
  requiresInternalApproval: true,
  requiresClientApproval: true,
  approvedExtra: false,
  idempotencyKey: "f002c-created-reserved-deliverable",
  createdBy: tenantAdminA.authorizationActor.userId,
  createdAt,
  updatedAt: createdAt,
  revision: 1,
  ...overrides,
});

const repositoriesWithReservedDeliverable = (
  deliverableOverrides: Partial<DeliverableRecord> = {},
) => {
  const packages = new InMemoryPackageRepository({
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
        quantity: 1,
        actorUserId: tenantAdminA.authorizationActor.userId,
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
        deliverableId: "reserved-deliverable-a",
        entryType: "quantity_reserved",
        quantity: 1,
        actorUserId: assignedInternalA.authorizationActor.userId,
        idempotencyKey: "f002c-created-reserved-deliverable:reservation",
        occurredAt: createdAt,
      },
    ],
  });
  const deliverables = new InMemoryDeliverableRepository({
    deliverables: [reservedDeliverable(deliverableOverrides)],
    allocations: [
      {
        id: "allocation-post",
        tenantId: clientA.tenantId,
        clientId: clientA.id,
        deliverableId: "reserved-deliverable-a",
        packageLineId: packageLinePostsA.id,
        reservedQuantity: 1,
        status: "reserved",
        reservationLedgerEntryId: "reservation-post",
        createdAt,
      },
    ],
  });

  return { packages, deliverables };
};

const cancellationInput = {
  clientId: clientA.id,
  deliverableId: "reserved-deliverable-a",
  expectedStatus: "not_started",
  expectedRevision: 1,
  reason: "إلغاء قبل بدء التنفيذ وإعادة السعة للباقة",
  idempotencyKey: "f002d-cancel-reserved-deliverable",
};

describe("F-002D not-started deliverable cancellation and reservation release", () => {
  it("cancels an eligible not-started deliverable, releases reservation, and audits", async () => {
    const audit = new InMemoryAuditSink();
    const { packages, deliverables } = repositoriesWithReservedDeliverable();

    const result = await cancelNotStartedDeliverableCommand({
      actor: assignedInternalA.authorizationActor,
      packages,
      deliverables,
      audit,
      input: cancellationInput,
      ledgerIdFactory: () => "release-ledger-post",
    });

    expect(result).toMatchObject({
      ok: true,
      value: {
        ok: true,
        value: {
          id: "reserved-deliverable-a",
          status: "cancelled",
          reservation: undefined,
        },
      },
    });
    await expect(
      packages.listLedgerByPackageLine(
        clientA.tenantId,
        clientA.id,
        packageLinePostsA.id,
      ),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "release-ledger-post",
          entryType: "reservation_released",
          quantity: 1,
          deliverableId: "reserved-deliverable-a",
          reason: "إلغاء قبل بدء التنفيذ وإعادة السعة للباقة",
          idempotencyKey: "f002d-cancel-reserved-deliverable:reservation_release",
        }),
      ]),
    );
    await expect(
      deliverables.listAllocationsByDeliverable(
        clientA.tenantId,
        clientA.id,
        "reserved-deliverable-a",
      ),
    ).resolves.toEqual([
      expect.objectContaining({
        id: "allocation-post",
        status: "released",
        releaseLedgerEntryId: "release-ledger-post",
      }),
    ]);
    expect(audit.events).toContainEqual(
      expect.objectContaining({
        action: "DeliverableCancelled",
        decision: "allowed",
        tenantId: clientA.tenantId,
        clientId: clientA.id,
        targetId: "reserved-deliverable-a",
      }),
    );
  });

  it("returns the already-cancelled result for a repeated idempotency key without duplicate release or audit", async () => {
    const audit = new InMemoryAuditSink();
    const { packages, deliverables } = repositoriesWithReservedDeliverable();

    await cancelNotStartedDeliverableCommand({
      actor: assignedInternalA.authorizationActor,
      packages,
      deliverables,
      audit,
      input: cancellationInput,
      ledgerIdFactory: () => "release-ledger-post",
    });
    const retry = await cancelNotStartedDeliverableCommand({
      actor: assignedInternalA.authorizationActor,
      packages,
      deliverables,
      audit,
      input: { ...cancellationInput, reason: "إعادة محاولة لا تكرر السجل" },
      ledgerIdFactory: () => "duplicate-release-ledger",
    });

    expect(retry).toMatchObject({
      ok: true,
      value: { ok: true, value: { id: "reserved-deliverable-a", status: "cancelled" } },
    });
    await expect(
      packages.listLedgerByPackageLine(
        clientA.tenantId,
        clientA.id,
        packageLinePostsA.id,
      ),
    ).resolves.toHaveLength(3);
    expect(
      audit.events.filter((event) => event.action === "DeliverableCancelled"),
    ).toHaveLength(1);
  });

  it("denies progressed or stale-state cancellation without releasing reservation", async () => {
    const audit = new InMemoryAuditSink();
    const { packages, deliverables } = repositoriesWithReservedDeliverable({
      status: "in_progress",
      progressPercentage: 30,
      revision: 2,
    });

    const result = await cancelNotStartedDeliverableCommand({
      actor: assignedInternalA.authorizationActor,
      packages,
      deliverables,
      audit,
      input: cancellationInput,
      ledgerIdFactory: () => "unsafe-release-ledger",
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
        packageLinePostsA.id,
      ),
    ).resolves.not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "unsafe-release-ledger" })]),
    );
    expect(audit.events).toContainEqual(
      expect.objectContaining({
        action: "DeliverableCancellationDenied",
        decision: "denied",
        reason: "deliverable_already_progressed",
      }),
    );
  });

  it("denies cancellation outside the actor client scope without revealing the target", async () => {
    const audit = new InMemoryAuditSink();
    const { packages, deliverables } = repositoriesWithReservedDeliverable();

    const result = await cancelNotStartedDeliverableCommand({
      actor: assignedInternalA.authorizationActor,
      packages,
      deliverables,
      audit,
      input: { ...cancellationInput, clientId: clientC.id },
      ledgerIdFactory: () => "cross-client-release",
    });

    expect(result).toMatchObject({ ok: false });
    expect(audit.events).toContainEqual(
      expect.objectContaining({
        action: "AuthorizationDenied",
        decision: "denied",
      }),
    );
  });

  it("rolls back cancellation and release when audit append fails", async () => {
    const { packages, deliverables } = repositoriesWithReservedDeliverable();

    await expect(
      cancelNotStartedDeliverableCommand({
        actor: assignedInternalA.authorizationActor,
        packages,
        deliverables,
        audit: new FailingAuditSink(),
        input: cancellationInput,
        ledgerIdFactory: () => "audit-fails-release",
      }),
    ).rejects.toThrow("AUDIT_APPEND_FAILED");
    await expect(
      deliverables.listByTenantClient(clientA.tenantId, clientA.id),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "reserved-deliverable-a",
          status: "not_started",
          reservation: expect.objectContaining({ reservedQuantity: 1 }),
        }),
      ]),
    );
    await expect(
      packages.listLedgerByPackageLine(
        clientA.tenantId,
        clientA.id,
        packageLinePostsA.id,
      ),
    ).resolves.toHaveLength(2);
  });
});

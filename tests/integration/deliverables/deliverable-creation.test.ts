import { describe, expect, it } from "vitest";
import {
  FailingAuditSink,
  InMemoryAuditSink,
} from "@/modules/audit/audit-service";
import { InMemoryClientRepository } from "@/modules/clients/client-repository";
import {
  InMemoryDeliverableRepository,
} from "@/modules/deliverables/deliverable-repository";
import { InMemoryPackageRepository } from "@/modules/packages/package-repository";
import {
  createApprovedExtraDeliverableCommand,
} from "@/server/commands/deliverables/create-approved-extra-deliverable";
import {
  createDeliverableCommand,
} from "@/server/commands/deliverables/create-deliverable";
import {
  assignedInternalA,
  clientA,
  clientViewerA,
  tenantAdminA,
} from "../../fixtures/f001-fixtures";
import { contractA, packageA, packageLinePostsA } from "../../fixtures/f002-fixtures";

const activePackage = {
  ...packageA,
  periodStart: "2026-07-01",
  periodEnd: "2026-07-31",
  status: "active" as const,
  idempotencyKey: "existing-package-a",
  createdBy: "tenant_admin_a",
  createdAt: "2026-06-28T00:00:00.000Z",
  updatedAt: "2026-06-28T00:00:00.000Z",
};

const activePackageLine = {
  ...packageLinePostsA,
  deliverableTypeHint: "post",
  status: "active" as const,
  createdBy: "tenant_admin_a",
  createdAt: "2026-06-28T00:00:00.000Z",
  updatedAt: "2026-06-28T00:00:00.000Z",
};

const packagesWithCapacity = () =>
  new InMemoryPackageRepository({
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
        quantity: 2,
        actorUserId: tenantAdminA.authorizationActor.userId,
        idempotencyKey: "commitment-posts",
        occurredAt: "2026-06-28T00:00:00.000Z",
      },
    ],
  });

const activeClientA = {
  id: clientA.id,
  tenantId: clientA.tenantId,
  name: "Client A",
  slug: "client-a",
  status: "active" as const,
  createdBy: tenantAdminA.authorizationActor.userId,
  createdAt: "2026-06-28T00:00:00.000Z",
  updatedAt: "2026-06-28T00:00:00.000Z",
  revision: 1,
};

const baseDeliverableInput = {
  clientId: clientA.id,
  contractId: contractA.id,
  packageId: packageA.id,
  packageLineId: packageLinePostsA.id,
  name: "منشور إطلاق الحملة",
  description: "مخرج متفق عليه ضمن باقة المحتوى.",
  type: "post",
  priority: "normal",
  ownerUserId: assignedInternalA.authorizationActor.userId,
  contributorUserIds: [tenantAdminA.authorizationActor.userId],
  startDate: "2026-07-01",
  internalDueDate: "2026-07-03",
  clientDueDate: "2026-07-05",
  finalDueDate: "2026-07-07",
  requiresInternalApproval: true,
  requiresClientApproval: true,
  reservedQuantity: 1,
  idempotencyKey: "f002c-deliverable-client-a",
};

describe("F-002C deliverable creation and package reservation", () => {
  it("creates an in-package deliverable, allocation, reservation ledger entry, and audit", async () => {
    const audit = new InMemoryAuditSink();
    const packages = packagesWithCapacity();
    const deliverables = new InMemoryDeliverableRepository();

    const result = await createDeliverableCommand({
      actor: assignedInternalA.authorizationActor,
      packages,
      deliverables,
      audit,
      input: baseDeliverableInput,
      deliverableIdFactory: () => "generated-deliverable-a",
      allocationIdFactory: () => "generated-allocation-a",
      ledgerIdFactory: () => "generated-reservation-ledger",
    });

    expect(result).toMatchObject({
      ok: true,
      value: {
        ok: true,
        value: {
          id: "generated-deliverable-a",
          tenantId: clientA.tenantId,
          clientId: clientA.id,
          contractId: contractA.id,
          packageId: packageA.id,
          packageLineId: packageLinePostsA.id,
          status: "not_started",
          progressPercentage: 0,
          approvedExtra: false,
          reservation: {
            packageLineId: packageLinePostsA.id,
            reservedQuantity: 1,
          },
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
          id: "generated-reservation-ledger",
          entryType: "quantity_reserved",
          quantity: 1,
          deliverableId: "generated-deliverable-a",
        }),
      ]),
    );
    await expect(
      deliverables.listAllocationsByDeliverable(
        clientA.tenantId,
        clientA.id,
        "generated-deliverable-a",
      ),
    ).resolves.toEqual([
      expect.objectContaining({
        id: "generated-allocation-a",
        status: "reserved",
        reservedQuantity: 1,
        reservationLedgerEntryId: "generated-reservation-ledger",
      }),
    ]);
    expect(audit.events).toContainEqual(
      expect.objectContaining({
        action: "DeliverableCreated",
        decision: "allowed",
        tenantId: clientA.tenantId,
        clientId: clientA.id,
        targetId: "generated-deliverable-a",
      }),
    );
  });

  it("returns the existing deliverable for a repeated idempotency key without duplicate reservation side effects", async () => {
    const audit = new InMemoryAuditSink();
    const packages = packagesWithCapacity();
    const deliverables = new InMemoryDeliverableRepository();

    await createDeliverableCommand({
      actor: assignedInternalA.authorizationActor,
      packages,
      deliverables,
      audit,
      input: baseDeliverableInput,
      deliverableIdFactory: () => "generated-deliverable-a",
      allocationIdFactory: () => "generated-allocation-a",
      ledgerIdFactory: () => "generated-reservation-ledger",
    });
    const retry = await createDeliverableCommand({
      actor: assignedInternalA.authorizationActor,
      packages,
      deliverables,
      audit,
      input: { ...baseDeliverableInput, name: "اسم لا ينشئ نسخة ثانية" },
      deliverableIdFactory: () => "duplicate-deliverable",
      allocationIdFactory: () => "duplicate-allocation",
      ledgerIdFactory: () => "duplicate-ledger",
    });

    expect(retry).toMatchObject({
      ok: true,
      value: { ok: true, value: { id: "generated-deliverable-a" } },
    });
    await expect(
      deliverables.listByTenantClient(clientA.tenantId, clientA.id),
    ).resolves.toHaveLength(1);
    await expect(
      packages.listLedgerByPackageLine(
        clientA.tenantId,
        clientA.id,
        packageLinePostsA.id,
      ),
    ).resolves.toHaveLength(2);
    expect(
      audit.events.filter((event) => event.action === "DeliverableCreated"),
    ).toHaveLength(1);
  });

  it("denies normal deliverable creation when package capacity is insufficient", async () => {
    const audit = new InMemoryAuditSink();
    const packages = packagesWithCapacity();
    const deliverables = new InMemoryDeliverableRepository();

    const result = await createDeliverableCommand({
      actor: assignedInternalA.authorizationActor,
      packages,
      deliverables,
      audit,
      input: { ...baseDeliverableInput, reservedQuantity: 3 },
      deliverableIdFactory: () => "over-capacity-deliverable",
      allocationIdFactory: () => "over-capacity-allocation",
      ledgerIdFactory: () => "over-capacity-ledger",
    });

    expect(result).toMatchObject({
      ok: true,
      value: {
        ok: false,
        error: { code: "ACCESS_DENIED", exposeResource: false },
      },
    });
    await expect(
      deliverables.listByTenantClient(clientA.tenantId, clientA.id),
    ).resolves.toEqual([]);
    await expect(
      packages.listLedgerByPackageLine(
        clientA.tenantId,
        clientA.id,
        packageLinePostsA.id,
      ),
    ).resolves.not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "over-capacity-ledger" }),
      ]),
    );
    expect(audit.events).toContainEqual(
      expect.objectContaining({
        action: "DeliverableReservationDenied",
        decision: "denied",
        reason: "insufficient_capacity",
      }),
    );
  });

  it("creates an approved extra deliverable only for administrative authority and without package reservation", async () => {
    const audit = new InMemoryAuditSink();
    const clients = new InMemoryClientRepository([activeClientA]);
    const packages = packagesWithCapacity();
    const deliverables = new InMemoryDeliverableRepository();

    const result = await createApprovedExtraDeliverableCommand({
      actor: tenantAdminA.authorizationActor,
      clients,
      packages,
      deliverables,
      audit,
      input: {
        clientId: clientA.id,
        name: "مخرج إضافي معتمد",
        description: "خارج الباقة وباعتماد إداري.",
        type: "post",
        priority: "high",
        ownerUserId: assignedInternalA.authorizationActor.userId,
        contributorUserIds: [],
        startDate: "2026-07-08",
        internalDueDate: "2026-07-09",
        clientDueDate: "2026-07-10",
        finalDueDate: "2026-07-11",
        requiresInternalApproval: true,
        requiresClientApproval: true,
        extraReason: "اعتماد إداري لطلب إضافي من العميل",
        idempotencyKey: "f002c-approved-extra-client-a",
      },
      deliverableIdFactory: () => "generated-extra-deliverable",
    });

    expect(result).toMatchObject({
      ok: true,
      value: {
        ok: true,
        value: {
          id: "generated-extra-deliverable",
          approvedExtra: true,
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
    ).resolves.toHaveLength(1);
    expect(audit.events).toContainEqual(
      expect.objectContaining({
        action: "ApprovedExtraDeliverableCreated",
        decision: "allowed",
        targetId: "generated-extra-deliverable",
      }),
    );
  });

  it("denies approved extra deliverables without administrative authority or a clear reason", async () => {
    const audit = new InMemoryAuditSink();
    const clients = new InMemoryClientRepository([activeClientA]);
    const packages = packagesWithCapacity();
    const deliverables = new InMemoryDeliverableRepository();

    await expect(
      createApprovedExtraDeliverableCommand({
        actor: assignedInternalA.authorizationActor,
        clients,
        packages,
        deliverables,
        audit,
        input: {
          clientId: clientA.id,
          name: "مخرج إضافي مرفوض",
          type: "post",
          priority: "normal",
          ownerUserId: assignedInternalA.authorizationActor.userId,
          contributorUserIds: [],
          requiresInternalApproval: true,
          requiresClientApproval: true,
          extraReason: "سبب واضح لكن الصلاحية غير كافية",
          idempotencyKey: "f002c-approved-extra-denied-role",
        },
      }),
    ).resolves.toMatchObject({ ok: false });

    await expect(
      createApprovedExtraDeliverableCommand({
        actor: tenantAdminA.authorizationActor,
        clients,
        packages,
        deliverables,
        audit,
        input: {
          clientId: clientA.id,
          name: "مخرج إضافي بلا سبب",
          type: "post",
          priority: "normal",
          ownerUserId: assignedInternalA.authorizationActor.userId,
          contributorUserIds: [],
          requiresInternalApproval: true,
          requiresClientApproval: true,
          extraReason: "",
          idempotencyKey: "f002c-approved-extra-denied-reason",
        },
      }),
    ).resolves.toEqual({ ok: false, error: "VALIDATION_FAILED" });
  });

  it("denies client users from creating deliverables", async () => {
    const audit = new InMemoryAuditSink();
    const packages = packagesWithCapacity();
    const deliverables = new InMemoryDeliverableRepository();

    const result = await createDeliverableCommand({
      actor: clientViewerA.authorizationActor,
      packages,
      deliverables,
      audit,
      input: baseDeliverableInput,
      deliverableIdFactory: () => "client-created-deliverable",
    });

    expect(result).toMatchObject({ ok: false });
    expect(audit.events).toContainEqual(
      expect.objectContaining({
        action: "AuthorizationDenied",
        decision: "denied",
      }),
    );
  });

  it("rolls back deliverable, allocation, and reservation when audit append fails", async () => {
    const packages = packagesWithCapacity();
    const deliverables = new InMemoryDeliverableRepository();

    await expect(
      createDeliverableCommand({
        actor: assignedInternalA.authorizationActor,
        packages,
        deliverables,
        audit: new FailingAuditSink(),
        input: baseDeliverableInput,
        deliverableIdFactory: () => "audit-fails-deliverable",
        allocationIdFactory: () => "audit-fails-allocation",
        ledgerIdFactory: () => "audit-fails-ledger",
      }),
    ).rejects.toThrow("AUDIT_APPEND_FAILED");
    await expect(
      deliverables.listByTenantClient(clientA.tenantId, clientA.id),
    ).resolves.toEqual([]);
    await expect(
      packages.listLedgerByPackageLine(
        clientA.tenantId,
        clientA.id,
        packageLinePostsA.id,
      ),
    ).resolves.toHaveLength(1);
  });
});

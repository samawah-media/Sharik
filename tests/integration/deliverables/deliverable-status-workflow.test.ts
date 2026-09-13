import { describe, expect, it } from "vitest";
import {
  FailingAuditSink,
  InMemoryAuditSink,
} from "@/modules/audit/audit-service";
import {
  InMemoryDeliverableRepository,
  type DeliverableRecord,
} from "@/modules/deliverables/deliverable-repository";
import { updateDeliverableStatusCommand } from "@/server/commands/deliverables/update-deliverable-status";
import {
  assignedInternalA,
  clientA,
  clientViewerA,
  tenantAdminA,
} from "../../fixtures/f001-fixtures";

const deliverableRecord = (
  overrides: Partial<DeliverableRecord> = {},
): DeliverableRecord => ({
  id: "deliverable_status_a",
  tenantId: clientA.tenantId,
  clientId: clientA.id,
  contractId: "contract_a",
  packageId: "package_a",
  packageLineId: "package_line_posts_a",
  name: "لوحة حالة المخرج",
  description: "مخرج لاختبار لوحة كانبان.",
  type: "post",
  status: "not_started",
  priority: "normal",
  ownerUserId: assignedInternalA.authorizationActor.userId,
  contributorUserIds: [tenantAdminA.authorizationActor.userId],
  startDate: "2026-07-01",
  internalDueDate: "2026-07-03",
  clientDueDate: "2026-07-05",
  finalDueDate: "2026-07-07",
  requiresInternalApproval: true,
  requiresClientApproval: true,
  progressPercentage: 0,
  approvedExtra: false,
  idempotencyKey: "existing-deliverable-status-a",
  createdBy: tenantAdminA.authorizationActor.userId,
  createdAt: "2026-07-01T08:00:00.000Z",
  updatedAt: "2026-07-01T08:00:00.000Z",
  revision: 1,
  ...overrides,
});

describe("F-004 deliverable status workflow command", () => {
  it("updates status, derives progress, increments revision, and appends audit", async () => {
    const audit = new InMemoryAuditSink();
    const deliverables = new InMemoryDeliverableRepository({
      deliverables: [deliverableRecord()],
    });

    const result = await updateDeliverableStatusCommand({
      actor: assignedInternalA.authorizationActor,
      deliverables,
      audit,
      input: {
        clientId: clientA.id,
        deliverableId: "deliverable_status_a",
        toStatus: "in_progress",
        expectedRevision: 1,
        reason: "بدء التنفيذ",
        idempotencyKey: "status-update-in-progress",
      },
    });

    expect(result).toMatchObject({
      ok: true,
      value: {
        ok: true,
        value: {
          id: "deliverable_status_a",
          status: "in_progress",
          progressPercentage: 30,
          revision: 2,
        },
      },
    });
    expect(audit.events).toContainEqual(
      expect.objectContaining({
        action: "DeliverableStatusChanged",
        decision: "allowed",
        tenantId: clientA.tenantId,
        clientId: clientA.id,
        targetId: "deliverable_status_a",
        reason: "بدء التنفيذ",
      }),
    );
  });

  it("denies waiting_client_approval before internal approval and leaves the record unchanged", async () => {
    const audit = new InMemoryAuditSink();
    const deliverables = new InMemoryDeliverableRepository({
      deliverables: [deliverableRecord({ status: "ready_for_internal_review" })],
    });

    const result = await updateDeliverableStatusCommand({
      actor: tenantAdminA.authorizationActor,
      deliverables,
      audit,
      input: {
        clientId: clientA.id,
        deliverableId: "deliverable_status_a",
        toStatus: "waiting_client_approval",
        expectedRevision: 1,
        idempotencyKey: "status-update-waiting-denied",
      },
    });

    expect(result).toMatchObject({
      ok: true,
      value: { ok: false, error: { code: "ACCESS_DENIED" } },
    });
    await expect(
      deliverables.findByTenantClientAndId(
        clientA.tenantId,
        clientA.id,
        "deliverable_status_a",
      ),
    ).resolves.toMatchObject({
      status: "ready_for_internal_review",
      progressPercentage: 0,
      revision: 1,
    });
    expect(audit.events).toContainEqual(
      expect.objectContaining({
        action: "DeliverableStatusChangeDenied",
        decision: "denied",
        reason: "protected_status_requires_command",
      }),
    );
  });

  it("denies delivery before client approval when client approval is required", async () => {
    const audit = new InMemoryAuditSink();
    const deliverables = new InMemoryDeliverableRepository({
      deliverables: [
        deliverableRecord({
          status: "ready_for_delivery",
          progressPercentage: 95,
        }),
      ],
    });

    const result = await updateDeliverableStatusCommand({
      actor: tenantAdminA.authorizationActor,
      deliverables,
      audit,
      input: {
        clientId: clientA.id,
        deliverableId: "deliverable_status_a",
        toStatus: "delivered",
        expectedRevision: 1,
        idempotencyKey: "status-update-delivered-denied",
      },
    });

    expect(result).toMatchObject({
      ok: true,
      value: { ok: false, error: { code: "ACCESS_DENIED" } },
    });
    expect(audit.events).toContainEqual(
      expect.objectContaining({
        action: "DeliverableStatusChangeDenied",
        decision: "denied",
        reason: "protected_status_requires_command",
      }),
    );
  });

  it("denies generic delivery even when client approval is not required", async () => {
    const audit = new InMemoryAuditSink();
    const deliverables = new InMemoryDeliverableRepository({
      deliverables: [
        deliverableRecord({
          status: "ready_for_delivery",
          progressPercentage: 95,
          requiresClientApproval: false,
        }),
      ],
    });

    const result = await updateDeliverableStatusCommand({
      actor: tenantAdminA.authorizationActor,
      deliverables,
      audit,
      input: {
        clientId: clientA.id,
        deliverableId: "deliverable_status_a",
        toStatus: "delivered",
        expectedRevision: 1,
        idempotencyKey: "status-update-delivered-no-client",
      },
    });

    expect(result).toMatchObject({
      ok: true,
      value: { ok: false, error: { code: "ACCESS_DENIED" } },
    });
    expect(audit.events).toContainEqual(
      expect.objectContaining({
        action: "DeliverableStatusChangeDenied",
        decision: "denied",
        reason: "protected_status_requires_command",
      }),
    );
  });

  it("denies stale revision updates with an audit denial", async () => {
    const audit = new InMemoryAuditSink();
    const deliverables = new InMemoryDeliverableRepository({
      deliverables: [deliverableRecord({ revision: 3 })],
    });

    const result = await updateDeliverableStatusCommand({
      actor: tenantAdminA.authorizationActor,
      deliverables,
      audit,
      input: {
        clientId: clientA.id,
        deliverableId: "deliverable_status_a",
        toStatus: "in_progress",
        expectedRevision: 1,
        idempotencyKey: "status-update-stale",
      },
    });

    expect(result).toMatchObject({
      ok: true,
      value: { ok: false, error: { code: "ACCESS_DENIED" } },
    });
    expect(audit.events).toContainEqual(
      expect.objectContaining({
        action: "DeliverableStatusChangeDenied",
        decision: "denied",
        reason: "expected_state_mismatch",
      }),
    );
  });

  it("denies client viewers from changing internal deliverable status", async () => {
    const audit = new InMemoryAuditSink();
    const deliverables = new InMemoryDeliverableRepository({
      deliverables: [deliverableRecord()],
    });

    const result = await updateDeliverableStatusCommand({
      actor: clientViewerA.authorizationActor,
      deliverables,
      audit,
      input: {
        clientId: clientA.id,
        deliverableId: "deliverable_status_a",
        toStatus: "in_progress",
        expectedRevision: 1,
        idempotencyKey: "status-update-client-denied",
      },
    });

    expect(result).toMatchObject({ ok: false });
    expect(audit.events).toContainEqual(
      expect.objectContaining({
        action: "AuthorizationDenied",
        decision: "denied",
        targetId: "PERM.DELIVERABLE.STATUS_UPDATE",
      }),
    );
  });

  it("rolls back status changes when audit append fails", async () => {
    const deliverables = new InMemoryDeliverableRepository({
      deliverables: [deliverableRecord()],
    });

    await expect(
      updateDeliverableStatusCommand({
        actor: tenantAdminA.authorizationActor,
        deliverables,
        audit: new FailingAuditSink(),
        input: {
          clientId: clientA.id,
          deliverableId: "deliverable_status_a",
          toStatus: "in_progress",
          expectedRevision: 1,
          idempotencyKey: "status-update-audit-fails",
        },
      }),
    ).rejects.toThrow("AUDIT_APPEND_FAILED");
    await expect(
      deliverables.findByTenantClientAndId(
        clientA.tenantId,
        clientA.id,
        "deliverable_status_a",
      ),
    ).resolves.toMatchObject({ status: "not_started", progressPercentage: 0 });
  });
});

import { describe, expect, it } from "vitest";
import { InMemoryAuditSink } from "@/modules/audit/audit-service";
import {
  InMemoryDeliverableRepository,
  type DeliverableRecord,
} from "@/modules/deliverables/deliverable-repository";
import { listManagementSlaSummariesCommand } from "@/server/commands/sla/list-management-sla-summaries";
import {
  assignedInternalA,
  clientA,
  clientC,
  clientViewerA,
  tenantA,
  tenantAdminA,
} from "../../fixtures/f001-fixtures";

const deliverableRecord = (
  overrides: Partial<DeliverableRecord>,
): DeliverableRecord => ({
  id: "deliverable_a",
  tenantId: tenantA.id,
  clientId: clientA.id,
  name: "Launch post",
  type: "post",
  status: "in_progress",
  priority: "normal",
  contributorUserIds: [],
  startDate: "2026-07-01",
  internalDueDate: "2026-07-10T12:00:00.000Z",
  requiresInternalApproval: true,
  requiresClientApproval: true,
  progressPercentage: 30,
  approvedExtra: false,
  idempotencyKey: "deliverable-a-idempotency",
  createdBy: tenantAdminA.authorizationActor.userId,
  createdAt: "2026-06-29T00:00:00.000Z",
  updatedAt: "2026-06-29T00:00:00.000Z",
  revision: 1,
  ...overrides,
});

describe("F-003 management SLA summaries", () => {
  it("returns management-visible SLA status only inside the actor client scope", async () => {
    const audit = new InMemoryAuditSink();
    const deliverables = new InMemoryDeliverableRepository({
      deliverables: [
        deliverableRecord({}),
        deliverableRecord({
          id: "deliverable_c",
          clientId: clientC.id,
          name: "Client C report",
        }),
      ],
    });

    await expect(
      listManagementSlaSummariesCommand({
        actor: assignedInternalA.authorizationActor,
        deliverables,
        audit,
        input: { clientId: clientA.id },
        now: "2026-07-09T12:00:00.000Z",
      }),
    ).resolves.toMatchObject({
      ok: true,
      value: [
        {
          deliverableId: "deliverable_a",
          tenantId: tenantA.id,
          clientId: clientA.id,
          sla: { status: "at_risk" },
        },
      ],
    });

    const denied = await listManagementSlaSummariesCommand({
      actor: assignedInternalA.authorizationActor,
      deliverables,
      audit,
      input: { clientId: clientC.id },
      now: "2026-07-09T12:00:00.000Z",
    });

    expect(denied).toMatchObject({
      ok: false,
      error: { code: "ACCESS_DENIED", exposeResource: false },
    });
    expect(audit.events).toContainEqual(
      expect.objectContaining({
        action: "SlaSummaryReadDenied",
        decision: "denied",
        tenantId: tenantA.id,
        clientId: clientC.id,
        reason: "permission_not_granted",
      }),
    );
  });

  it("denies client-facing users from management SLA summaries", async () => {
    const audit = new InMemoryAuditSink();
    const deliverables = new InMemoryDeliverableRepository({
      deliverables: [deliverableRecord({})],
    });

    await expect(
      listManagementSlaSummariesCommand({
        actor: clientViewerA.authorizationActor,
        deliverables,
        audit,
        input: { clientId: clientA.id },
        now: "2026-07-09T12:00:00.000Z",
      }),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "ACCESS_DENIED", exposeResource: false },
    });

    expect(audit.events).toContainEqual(
      expect.objectContaining({
        action: "SlaSummaryReadDenied",
        decision: "denied",
        clientId: clientA.id,
        reason: "management_scope_required",
      }),
    );
  });

  it("uses actor tenant scope for reads instead of trusting browser-supplied tenant data", async () => {
    const audit = new InMemoryAuditSink();
    const deliverables = new InMemoryDeliverableRepository({
      deliverables: [deliverableRecord({})],
    });

    await expect(
      listManagementSlaSummariesCommand({
        actor: tenantAdminA.authorizationActor,
        deliverables,
        audit,
        input: { clientId: clientA.id, tenantId: "attacker_tenant" },
        now: "2026-07-08T00:00:00.000Z",
      }),
    ).resolves.toMatchObject({
      ok: true,
      value: [
        {
          tenantId: tenantA.id,
          clientId: clientA.id,
          sla: { status: "on_track" },
        },
      ],
    });
  });
});

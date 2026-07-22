import { describe, expect, it } from "vitest";
import {
  FailingAuditSink,
  InMemoryAuditSink,
} from "@/modules/audit/audit-service";
import {
  InMemoryApprovalRepository,
  type DeliverableVersionRecord,
} from "@/modules/approvals/approval-repository";
import {
  InMemoryDeliverableRepository,
  type DeliverableRecord,
} from "@/modules/deliverables/deliverable-repository";
import { approveInternallyCommand } from "@/server/commands/approvals/approve-internally";
import { requestInternalChangesCommand } from "@/server/commands/approvals/request-internal-changes";
import { clientA, tenantAdminA } from "../../fixtures/f001-fixtures";

const deliverable: DeliverableRecord = {
  id: "r007_audit_deliverable",
  tenantId: clientA.tenantId,
  clientId: clientA.id,
  name: "R-007 audit item",
  type: "post",
  status: "ready_for_internal_review",
  priority: "normal",
  contributorUserIds: [],
  requiresInternalApproval: true,
  requiresClientApproval: true,
  progressPercentage: 50,
  approvedExtra: false,
  idempotencyKey: "r007-audit-deliverable",
  createdBy: tenantAdminA.authorizationActor.userId,
  createdAt: "2026-07-08T08:00:00.000Z",
  updatedAt: "2026-07-08T08:00:00.000Z",
  revision: 1,
};

const version: DeliverableVersionRecord = {
  id: "r007_audit_version",
  tenantId: clientA.tenantId,
  clientId: clientA.id,
  deliverableId: deliverable.id,
  versionNumber: 1,
  state: "ready_for_internal_review",
  internalApprovalState: "pending",
  clientApprovalState: "not_sent",
  submittedBy: tenantAdminA.authorizationActor.userId,
  submittedAt: "2026-07-08T08:10:00.000Z",
  superseded: false,
};

describe("R-007 workflow audit requirements", () => {
  it("records audit evidence for internal change requests", async () => {
    const audit = new InMemoryAuditSink();
    const approvals = new InMemoryApprovalRepository({ versions: [version] });
    const deliverables = new InMemoryDeliverableRepository({
      deliverables: [deliverable],
    });

    const result = await requestInternalChangesCommand({
      actor: tenantAdminA.authorizationActor,
      approvals,
      deliverables,
      audit,
      input: {
        clientId: clientA.id,
        deliverableId: deliverable.id,
        versionId: version.id,
        expectedRevision: 1,
        reason: "safe internal change request",
        idempotencyKey: "internal-changes",
      },
    });

    expect(result).toMatchObject({
      ok: true,
      value: {
        ok: true,
        value: { status: "internal_changes_requested" },
      },
    });
    expect(audit.events).toContainEqual(
      expect.objectContaining({
        action: "InternalChangesRequested",
        decision: "allowed",
        targetId: deliverable.id,
      }),
    );
  });

  it("rolls back approval state and deliverable status when audit append fails", async () => {
    const approvals = new InMemoryApprovalRepository({ versions: [version] });
    const deliverables = new InMemoryDeliverableRepository({
      deliverables: [deliverable],
    });

    await expect(
      approveInternallyCommand({
        actor: tenantAdminA.authorizationActor,
        approvals,
        deliverables,
        audit: new FailingAuditSink(),
        input: {
          clientId: clientA.id,
          deliverableId: deliverable.id,
          versionId: version.id,
          expectedRevision: 1,
          idempotencyKey: "audit-fails",
        },
      }),
    ).rejects.toThrow("AUDIT_APPEND_FAILED");

    await expect(
      deliverables.findByTenantClientAndId(
        clientA.tenantId,
        clientA.id,
        deliverable.id,
      ),
    ).resolves.toMatchObject({
      status: "ready_for_internal_review",
      progressPercentage: 50,
    });
    await expect(
      approvals.findVersion(clientA.tenantId, clientA.id, version.id),
    ).resolves.toMatchObject({
      state: "ready_for_internal_review",
      internalApprovalState: "pending",
    });
  });
});


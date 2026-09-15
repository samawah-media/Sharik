import { describe, expect, it } from "vitest";
import { InMemoryAuditSink } from "@/modules/audit/audit-service";
import {
  InMemoryApprovalRepository,
  type DeliverableVersionRecord,
} from "@/modules/approvals/approval-repository";
import type { AuthorizationActor } from "@/modules/authorization/evaluator";
import {
  InMemoryDeliverableRepository,
  type DeliverableRecord,
} from "@/modules/deliverables/deliverable-repository";
import { approveAsClientCommand } from "@/server/commands/approvals/approve-as-client";
import { approveInternallyCommand } from "@/server/commands/approvals/approve-internally";
import { requestClientChangesCommand } from "@/server/commands/approvals/request-client-changes";
import { sendToClientCommand } from "@/server/commands/approvals/send-to-client";
import {
  assignedInternalA,
  clientA,
  clientViewerA,
  tenantAdminA,
} from "../../fixtures/f001-fixtures";

const clientApproverActor: AuthorizationActor = {
  userId: "client_approver_actor",
  tenantId: clientA.tenantId,
  tenantMembership: {
    id: "tm_client_approver_actor",
    tenantId: clientA.tenantId,
    userId: "client_approver_actor",
    status: "active",
  },
  roleAssignments: [
    {
      id: "ra_client_approver_actor",
      tenantId: clientA.tenantId,
      membershipId: "tm_client_approver_actor",
      roleKey: "client_approver",
      scopeType: "client",
      scopeId: clientA.id,
      status: "active",
    },
  ],
};

const deliverableRecord = (
  overrides: Partial<DeliverableRecord> = {},
): DeliverableRecord => ({
  id: "r007_deliverable",
  tenantId: clientA.tenantId,
  clientId: clientA.id,
  contractId: "r007_contract",
  packageId: "r007_package",
  packageLineId: "r007_package_line",
  name: "R-007 safe workflow item",
  type: "post",
  status: "ready_for_internal_review",
  priority: "normal",
  ownerUserId: assignedInternalA.authorizationActor.userId,
  contributorUserIds: [],
  startDate: "2026-07-08",
  internalDueDate: "2026-07-09",
  clientDueDate: "2026-07-10",
  finalDueDate: "2026-07-11",
  requiresInternalApproval: true,
  requiresClientApproval: true,
  progressPercentage: 50,
  approvedExtra: false,
  idempotencyKey: "r007-deliverable",
  createdBy: tenantAdminA.authorizationActor.userId,
  createdAt: "2026-07-08T08:00:00.000Z",
  updatedAt: "2026-07-08T08:00:00.000Z",
  revision: 1,
  ...overrides,
});

const versionRecord = (
  overrides: Partial<DeliverableVersionRecord> = {},
): DeliverableVersionRecord => ({
  id: "r007_version_current",
  tenantId: clientA.tenantId,
  clientId: clientA.id,
  deliverableId: "r007_deliverable",
  versionNumber: 1,
  state: "ready_for_internal_review",
  internalApprovalState: "pending",
  clientApprovalState: "not_sent",
  submittedBy: assignedInternalA.authorizationActor.userId,
  submittedAt: "2026-07-08T08:15:00.000Z",
  superseded: false,
  ...overrides,
});

const workflowRepositories = (
  deliverableOverrides: Partial<DeliverableRecord> = {},
  versionOverrides: Partial<DeliverableVersionRecord> = {},
) => ({
  audit: new InMemoryAuditSink(),
  approvals: new InMemoryApprovalRepository({
    versions: [versionRecord(versionOverrides)],
  }),
  deliverables: new InMemoryDeliverableRepository({
    deliverables: [deliverableRecord(deliverableOverrides)],
  }),
});

describe("R-007 approval workflow commands", () => {
  it("records internal approval against a specific current version", async () => {
    const { audit, approvals, deliverables } = workflowRepositories();

    const result = await approveInternallyCommand({
      actor: tenantAdminA.authorizationActor,
      approvals,
      deliverables,
      audit,
      input: {
        clientId: clientA.id,
        deliverableId: "r007_deliverable",
        versionId: "r007_version_current",
        expectedRevision: 1,
        idempotencyKey: "internal-approval",
      },
      nowFactory: () => "2026-07-08T09:00:00.000Z",
    });

    expect(result).toMatchObject({
      ok: true,
      value: {
        ok: true,
        value: {
          status: "internally_approved",
          progressPercentage: 70,
          revision: 2,
        },
      },
    });
    await expect(
      approvals.findVersion(clientA.tenantId, clientA.id, "r007_version_current"),
    ).resolves.toMatchObject({
      state: "internally_approved",
      internalApprovalState: "approved",
    });
    expect(audit.events).toContainEqual(
      expect.objectContaining({
        action: "InternalApprovalRecorded",
        decision: "allowed",
        targetId: "r007_deliverable",
      }),
    );
  });

  it("denies send-to-client before internal approval and writes denial audit", async () => {
    const { audit, approvals, deliverables } = workflowRepositories();

    const result = await sendToClientCommand({
      actor: tenantAdminA.authorizationActor,
      approvals,
      deliverables,
      audit,
      input: {
        clientId: clientA.id,
        deliverableId: "r007_deliverable",
        versionId: "r007_version_current",
        expectedRevision: 1,
        idempotencyKey: "send-denied",
      },
    });

    expect(result).toMatchObject({
      ok: true,
      value: { ok: false, error: { code: "ACCESS_DENIED" } },
    });
    expect(audit.events).toContainEqual(
      expect.objectContaining({
        action: "SendToClientDenied",
        decision: "denied",
        reason: "internal_approval_required_before_client_exposure",
      }),
    );
  });

  it("sends an internally approved version to client and pauses SLA", async () => {
    const { audit, approvals, deliverables } = workflowRepositories(
      {
        status: "internally_approved",
        progressPercentage: 70,
      },
      {
        state: "internally_approved",
        internalApprovalState: "approved",
      },
    );

    const result = await sendToClientCommand({
      actor: tenantAdminA.authorizationActor,
      approvals,
      deliverables,
      audit,
      input: {
        clientId: clientA.id,
        deliverableId: "r007_deliverable",
        versionId: "r007_version_current",
        expectedRevision: 1,
        idempotencyKey: "send-allowed",
      },
      nowFactory: () => "2026-07-08T10:00:00.000Z",
    });

    expect(result).toMatchObject({
      ok: true,
      value: {
        ok: true,
        value: { status: "waiting_client_approval", progressPercentage: 80 },
      },
    });
    await expect(
      approvals.findVersion(clientA.tenantId, clientA.id, "r007_version_current"),
    ).resolves.toMatchObject({
      state: "client_visible",
      clientApprovalState: "pending",
    });
    expect(audit.events).toContainEqual(
      expect.objectContaining({ action: "SLAPaused", decision: "allowed" }),
    );
  });

  it("allows client approver decision but denies client viewer approval", async () => {
    const visibleVersion = {
      state: "client_visible",
      internalApprovalState: "approved",
      clientApprovalState: "pending",
    } as const;
    const readyDeliverable = {
      status: "waiting_client_approval",
      progressPercentage: 80,
    } as const;
    const allowed = workflowRepositories(readyDeliverable, visibleVersion);

    const result = await approveAsClientCommand({
      actor: clientApproverActor,
      approvals: allowed.approvals,
      deliverables: allowed.deliverables,
      audit: allowed.audit,
      input: {
        clientId: clientA.id,
        deliverableId: "r007_deliverable",
        versionId: "r007_version_current",
        expectedRevision: 1,
        idempotencyKey: "client-approval",
      },
    });

    expect(result).toMatchObject({
      ok: true,
      value: {
        ok: true,
        value: { status: "client_approved", progressPercentage: 90 },
      },
    });

    const denied = workflowRepositories(readyDeliverable, visibleVersion);
    const deniedResult = await approveAsClientCommand({
      actor: clientViewerA.authorizationActor,
      approvals: denied.approvals,
      deliverables: denied.deliverables,
      audit: denied.audit,
      input: {
        clientId: clientA.id,
        deliverableId: "r007_deliverable",
        versionId: "r007_version_current",
        expectedRevision: 1,
        idempotencyKey: "client-viewer-denied",
      },
    });

    expect(deniedResult).toMatchObject({ ok: false });
    expect(denied.audit.events).toContainEqual(
      expect.objectContaining({
        action: "AuthorizationDenied",
        decision: "denied",
      }),
    );
  });

  it("returns client change requests to the team and resumes SLA", async () => {
    const { audit, approvals, deliverables } = workflowRepositories(
      {
        status: "waiting_client_approval",
        progressPercentage: 80,
      },
      {
        state: "client_visible",
        internalApprovalState: "approved",
        clientApprovalState: "pending",
      },
    );

    const result = await requestClientChangesCommand({
      actor: clientApproverActor,
      approvals,
      deliverables,
      audit,
      input: {
        clientId: clientA.id,
        deliverableId: "r007_deliverable",
        versionId: "r007_version_current",
        expectedRevision: 1,
        reason: "safe change request",
        idempotencyKey: "client-change-request",
      },
      nowFactory: () => "2026-07-08T12:00:00.000Z",
    });

    expect(result).toMatchObject({
      ok: true,
      value: {
        ok: true,
        value: { status: "client_changes_requested", progressPercentage: 65 },
      },
    });
    expect(audit.events).toContainEqual(
      expect.objectContaining({ action: "SLAResumed", decision: "allowed" }),
    );
  });
});

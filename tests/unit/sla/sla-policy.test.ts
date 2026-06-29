import { describe, expect, it } from "vitest";
import {
  buildSlaPauseAuditEvent,
  buildSlaResumeAuditEvent,
  deriveSlaStatus,
  selectApplicableDueBoundary,
  summarizeSlaTimeline,
} from "@/modules/sla/sla-policy";

describe("F-003 SLA policy", () => {
  it("derives on_track, deterministic at_risk, and overdue from the applicable due boundary", () => {
    const base = {
      status: "in_progress" as const,
      startDate: "2026-07-01",
      internalDueDate: "2026-07-10T12:00:00.000Z",
    };

    expect(
      deriveSlaStatus({
        ...base,
        now: "2026-07-08T11:59:59.000Z",
      }),
    ).toMatchObject({
      status: "on_track",
      dueBoundary: {
        field: "internalDueDate",
        value: "2026-07-10T12:00:00.000Z",
      },
      atRiskThresholdHours: 24,
    });

    expect(
      deriveSlaStatus({
        ...base,
        now: "2026-07-09T12:00:00.000Z",
      }),
    ).toMatchObject({
      status: "at_risk",
      atRiskThresholdHours: 24,
    });

    expect(
      deriveSlaStatus({
        ...base,
        now: "2026-07-10T12:00:01.000Z",
      }),
    ).toMatchObject({
      status: "overdue",
    });
  });

  it("uses deterministic date-only due boundaries at the end of the UTC day", () => {
    expect(
      deriveSlaStatus({
        status: "in_progress",
        internalDueDate: "2026-07-10",
        now: "2026-07-10T22:00:00.000Z",
      }),
    ).toMatchObject({
      status: "at_risk",
      dueBoundary: {
        value: "2026-07-10T23:59:59.999Z",
      },
    });

    expect(
      deriveSlaStatus({
        status: "in_progress",
        internalDueDate: "2026-07-10",
        now: "2026-07-11T00:00:00.000Z",
      }),
    ).toMatchObject({
      status: "overdue",
    });
  });

  it("selects due-date boundaries by Samawah-owned work phase", () => {
    expect(
      selectApplicableDueBoundary({
        status: "ready_for_internal_review",
        internalDueDate: "2026-07-03",
        clientDueDate: "2026-07-05",
        finalDueDate: "2026-07-07",
      }),
    ).toMatchObject({ field: "internalDueDate" });

    expect(
      selectApplicableDueBoundary({
        status: "ready_for_delivery",
        internalDueDate: "2026-07-03",
        clientDueDate: "2026-07-05",
        finalDueDate: "2026-07-07",
      }),
    ).toMatchObject({ field: "finalDueDate" });
  });

  it("returns paused_waiting_client and excludes client waiting time from Samawah running time", () => {
    expect(
      deriveSlaStatus({
        status: "waiting_client_approval",
        internalDueDate: "2026-07-05",
        now: "2026-07-10T00:00:00.000Z",
      }),
    ).toMatchObject({
      status: "paused_waiting_client",
      delayOwner: "client",
    });

    expect(
      summarizeSlaTimeline({
        now: "2026-07-07T00:00:00.000Z",
        segments: [
          {
            kind: "running",
            startedAt: "2026-07-01T00:00:00.000Z",
            endedAt: "2026-07-03T00:00:00.000Z",
          },
          {
            kind: "paused_waiting_client",
            startedAt: "2026-07-03T00:00:00.000Z",
            endedAt: "2026-07-07T00:00:00.000Z",
          },
        ],
      }),
    ).toEqual({
      samawahRunningMs: 2 * 24 * 60 * 60 * 1000,
      clientWaitingMs: 4 * 24 * 60 * 60 * 1000,
      internalDecisionMs: 0,
    });
  });

  it("keeps internal-decision pause distinct from client waiting", () => {
    expect(
      deriveSlaStatus({
        status: "ready_for_internal_review",
        internalDueDate: "2026-07-05",
        now: "2026-07-04T00:00:00.000Z",
        segments: [
          {
            kind: "paused_waiting_internal_decision",
            startedAt: "2026-07-03T00:00:00.000Z",
          },
        ],
      }),
    ).toMatchObject({
      status: "paused_waiting_internal_decision",
      delayOwner: "internal_decision",
    });

    expect(
      summarizeSlaTimeline({
        now: "2026-07-05T00:00:00.000Z",
        segments: [
          {
            kind: "paused_waiting_internal_decision",
            startedAt: "2026-07-03T00:00:00.000Z",
          },
        ],
      }),
    ).toEqual({
      samawahRunningMs: 0,
      clientWaitingMs: 0,
      internalDecisionMs: 2 * 24 * 60 * 60 * 1000,
    });
  });

  it("closes active SLA delay for completed and cancelled deliverables", () => {
    expect(
      deriveSlaStatus({
        status: "delivered",
        finalDueDate: "2026-07-01",
        now: "2026-07-10T00:00:00.000Z",
      }),
    ).toMatchObject({ status: "completed", delayOwner: "none" });

    expect(
      deriveSlaStatus({
        status: "cancelled",
        finalDueDate: "2026-07-01",
        now: "2026-07-10T00:00:00.000Z",
      }),
    ).toMatchObject({ status: "cancelled", delayOwner: "none" });
  });

  it("represents pause and resume audit expectations with scope, actor, states, reason, and timestamp", () => {
    expect(
      buildSlaPauseAuditEvent({
        tenantId: "tenant_a",
        clientId: "client_a",
        deliverableId: "deliverable_a",
        actorUserId: "manager_a",
        previousStatus: "on_track",
        newStatus: "paused_waiting_client",
        reason: "sent_to_client_for_review",
        occurredAt: "2026-07-03T00:00:00.000Z",
      }),
    ).toMatchObject({
      tenantId: "tenant_a",
      clientId: "client_a",
      actorUserId: "manager_a",
      action: "SLAPaused",
      decision: "allowed",
      targetType: "deliverable",
      targetId: "deliverable_a",
      reason: "sent_to_client_for_review",
      occurredAt: "2026-07-03T00:00:00.000Z",
      metadata: {
        previousSlaStatus: "on_track",
        newSlaStatus: "paused_waiting_client",
      },
    });

    expect(
      buildSlaResumeAuditEvent({
        tenantId: "tenant_a",
        clientId: "client_a",
        deliverableId: "deliverable_a",
        actorUserId: "manager_a",
        previousStatus: "paused_waiting_client",
        newStatus: "on_track",
        reason: "client_requested_changes",
        occurredAt: "2026-07-07T00:00:00.000Z",
      }),
    ).toMatchObject({
      action: "SLAResumed",
      metadata: {
        previousSlaStatus: "paused_waiting_client",
        newSlaStatus: "on_track",
      },
    });
  });
});

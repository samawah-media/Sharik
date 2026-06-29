import type { AuditEvent } from "@/modules/audit/audit-service";
import type { DeliverableLifecycleStatus } from "@/modules/deliverables/deliverable-rules";

export const slaStatuses = [
  "on_track",
  "at_risk",
  "overdue",
  "paused_waiting_client",
  "paused_waiting_internal_decision",
  "completed",
  "cancelled",
] as const;

export type SlaStatus = (typeof slaStatuses)[number];
export type SlaDelayOwner = "samawah" | "client" | "internal_decision" | "none";
export type SlaTimelineSegmentKind =
  | "running"
  | "paused_waiting_client"
  | "paused_waiting_internal_decision";

export type SlaTimelineSegment = {
  kind: SlaTimelineSegmentKind;
  startedAt: string;
  endedAt?: string;
};

export type SlaDueBoundaryField =
  | "internalDueDate"
  | "clientDueDate"
  | "finalDueDate";

export type SlaDueBoundary = {
  field: SlaDueBoundaryField;
  value: string;
  epochMs: number;
};

export type SlaDateBoundaries = {
  startDate?: string;
  internalDueDate?: string;
  clientDueDate?: string;
  finalDueDate?: string;
};

export type SlaEvaluationInput = SlaDateBoundaries & {
  status: DeliverableLifecycleStatus;
  now: string | Date;
  segments?: SlaTimelineSegment[];
};

export type SlaEvaluation = {
  status: SlaStatus;
  delayOwner: SlaDelayOwner;
  dueBoundary?: Omit<SlaDueBoundary, "epochMs">;
  basis: string;
  atRiskThresholdHours: 24;
};

export type SlaTimelineSummary = {
  samawahRunningMs: number;
  clientWaitingMs: number;
  internalDecisionMs: number;
};

const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const atRiskThresholdMs = 24 * 60 * 60 * 1000;

const normalizeBoundaryEpochMs = (value: string | undefined) => {
  if (!value) {
    return undefined;
  }

  const dateOnly = dateOnlyPattern.exec(value);

  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    return Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      23,
      59,
      59,
      999,
    );
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const normalizeBoundary = (
  field: SlaDueBoundaryField,
  value: string | undefined,
): SlaDueBoundary | undefined => {
  const epochMs = normalizeBoundaryEpochMs(value);

  if (epochMs === undefined) {
    return undefined;
  }

  return {
    field,
    value: new Date(epochMs).toISOString(),
    epochMs,
  };
};

const firstBoundary = (
  boundaries: SlaDateBoundaries,
  fields: SlaDueBoundaryField[],
) => {
  for (const field of fields) {
    const boundary = normalizeBoundary(field, boundaries[field]);

    if (boundary) {
      return boundary;
    }
  }

  return undefined;
};

export const selectApplicableDueBoundary = ({
  status,
  internalDueDate,
  clientDueDate,
  finalDueDate,
}: SlaDateBoundaries & {
  status: DeliverableLifecycleStatus;
}): SlaDueBoundary | undefined => {
  const boundaries = { internalDueDate, clientDueDate, finalDueDate };

  if (
    status === "client_changes_requested" ||
    status === "client_approved" ||
    status === "ready_for_delivery" ||
    status === "delivered" ||
    status === "archived"
  ) {
    return firstBoundary(boundaries, [
      "finalDueDate",
      "clientDueDate",
      "internalDueDate",
    ]);
  }

  if (status === "waiting_client_approval") {
    return firstBoundary(boundaries, [
      "clientDueDate",
      "finalDueDate",
      "internalDueDate",
    ]);
  }

  return firstBoundary(boundaries, [
    "internalDueDate",
    "clientDueDate",
    "finalDueDate",
  ]);
};

const getOpenPauseSegment = (segments: SlaTimelineSegment[] = []) =>
  [...segments]
    .reverse()
    .find(
      (segment) =>
        !segment.endedAt &&
        (segment.kind === "paused_waiting_client" ||
          segment.kind === "paused_waiting_internal_decision"),
    );

const normalizeNow = (now: string | Date) =>
  now instanceof Date ? now.getTime() : Date.parse(now);

const slaEvaluation = ({
  status,
  delayOwner,
  basis,
  dueBoundary,
}: {
  status: SlaStatus;
  delayOwner: SlaDelayOwner;
  basis: string;
  dueBoundary?: SlaDueBoundary;
}): SlaEvaluation => ({
  status,
  delayOwner,
  dueBoundary: dueBoundary
    ? { field: dueBoundary.field, value: dueBoundary.value }
    : undefined,
  basis,
  atRiskThresholdHours: 24,
});

const terminalSlaEvaluation = (
  status: DeliverableLifecycleStatus,
): SlaEvaluation | undefined => {
  if (status === "cancelled") {
    return {
      status: "cancelled",
      delayOwner: "none",
      basis: "deliverable_cancelled",
      atRiskThresholdHours: 24,
    };
  }

  if (status === "delivered" || status === "archived") {
    return {
      status: "completed",
      delayOwner: "none",
      basis: "deliverable_completed",
      atRiskThresholdHours: 24,
    };
  }

  return undefined;
};

const pausedSlaEvaluation = (
  input: SlaEvaluationInput,
): SlaEvaluation | undefined => {
  const openPause = getOpenPauseSegment(input.segments);

  if (openPause?.kind === "paused_waiting_client") {
    return {
      status: "paused_waiting_client",
      delayOwner: "client",
      basis: "open_client_waiting_pause_segment",
      atRiskThresholdHours: 24,
    };
  }

  if (openPause?.kind === "paused_waiting_internal_decision") {
    return {
      status: "paused_waiting_internal_decision",
      delayOwner: "internal_decision",
      basis: "open_internal_decision_pause_segment",
      atRiskThresholdHours: 24,
    };
  }

  if (input.status === "waiting_client_approval") {
    return {
      status: "paused_waiting_client",
      delayOwner: "client",
      basis: "deliverable_waiting_client_approval",
      atRiskThresholdHours: 24,
    };
  }

  return undefined;
};

const activeSlaEvaluation = (input: SlaEvaluationInput): SlaEvaluation => {
  const dueBoundary = selectApplicableDueBoundary(input);
  const nowMs = normalizeNow(input.now);

  if (!dueBoundary || Number.isNaN(nowMs)) {
    return slaEvaluation({
      status: "on_track",
      delayOwner: "samawah",
      basis: "no_applicable_due_boundary",
    });
  }

  if (nowMs > dueBoundary.epochMs) {
    return slaEvaluation({
      status: "overdue",
      delayOwner: "samawah",
      dueBoundary,
      basis: "now_after_due_boundary",
    });
  }

  if (dueBoundary.epochMs - nowMs <= atRiskThresholdMs) {
    return slaEvaluation({
      status: "at_risk",
      delayOwner: "samawah",
      dueBoundary,
      basis: "within_24h_at_risk_threshold",
    });
  }

  return slaEvaluation({
    status: "on_track",
    delayOwner: "samawah",
    dueBoundary,
    basis: "before_24h_at_risk_threshold",
  });
};

export const deriveSlaStatus = (input: SlaEvaluationInput): SlaEvaluation =>
  terminalSlaEvaluation(input.status) ??
  pausedSlaEvaluation(input) ??
  activeSlaEvaluation(input);

const durationMs = ({
  startedAt,
  endedAt,
  now,
}: {
  startedAt: string;
  endedAt?: string;
  now: string | Date;
}) => {
  const startMs = Date.parse(startedAt);
  const endMs = endedAt ? Date.parse(endedAt) : normalizeNow(now);

  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) {
    return 0;
  }

  return endMs - startMs;
};

export const summarizeSlaTimeline = ({
  segments,
  now,
}: {
  segments: SlaTimelineSegment[];
  now: string | Date;
}): SlaTimelineSummary =>
  segments.reduce<SlaTimelineSummary>(
    (summary, segment) => {
      const segmentDurationMs = durationMs({
        startedAt: segment.startedAt,
        endedAt: segment.endedAt,
        now,
      });

      if (segment.kind === "running") {
        summary.samawahRunningMs += segmentDurationMs;
      }

      if (segment.kind === "paused_waiting_client") {
        summary.clientWaitingMs += segmentDurationMs;
      }

      if (segment.kind === "paused_waiting_internal_decision") {
        summary.internalDecisionMs += segmentDurationMs;
      }

      return summary;
    },
    { samawahRunningMs: 0, clientWaitingMs: 0, internalDecisionMs: 0 },
  );

export const buildSlaPauseAuditEvent = ({
  tenantId,
  clientId,
  deliverableId,
  actorUserId,
  previousStatus,
  newStatus,
  reason,
  occurredAt,
}: {
  tenantId: string;
  clientId: string;
  deliverableId: string;
  actorUserId?: string;
  previousStatus: SlaStatus;
  newStatus: Extract<
    SlaStatus,
    "paused_waiting_client" | "paused_waiting_internal_decision"
  >;
  reason: string;
  occurredAt: string;
}): AuditEvent => ({
  tenantId,
  clientId,
  actorUserId,
  action: "SLAPaused",
  decision: "allowed",
  targetType: "deliverable",
  targetId: deliverableId,
  reason,
  occurredAt,
  metadata: {
    previousSlaStatus: previousStatus,
    newSlaStatus: newStatus,
  },
});

export const buildSlaResumeAuditEvent = ({
  tenantId,
  clientId,
  deliverableId,
  actorUserId,
  previousStatus,
  newStatus,
  reason,
  occurredAt,
}: {
  tenantId: string;
  clientId: string;
  deliverableId: string;
  actorUserId?: string;
  previousStatus: Extract<
    SlaStatus,
    "paused_waiting_client" | "paused_waiting_internal_decision"
  >;
  newStatus: Exclude<
    SlaStatus,
    "paused_waiting_client" | "paused_waiting_internal_decision"
  >;
  reason: string;
  occurredAt: string;
}): AuditEvent => ({
  tenantId,
  clientId,
  actorUserId,
  action: "SLAResumed",
  decision: "allowed",
  targetType: "deliverable",
  targetId: deliverableId,
  reason,
  occurredAt,
  metadata: {
    previousSlaStatus: previousStatus,
    newSlaStatus: newStatus,
  },
});

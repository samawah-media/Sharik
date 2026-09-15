import type { DeliverableLifecycleStatus } from "@/modules/deliverables/deliverable-rules";
import {
  deriveSlaStatus,
  summarizeSlaTimeline,
  type SlaStatus,
  type SlaTimelineSegment,
} from "./sla-policy";

export type R008SlaReportingCaseId =
  | "running_work"
  | "waiting_client_pause"
  | "resumed_after_client_change_request"
  | "internal_decision_pause"
  | "at_risk"
  | "overdue"
  | "completed"
  | "cancelled";

export type R008SlaReportingCase = {
  caseId: R008SlaReportingCaseId;
  status: SlaStatus;
  delayOwner: "samawah" | "client" | "internal_decision" | "none";
  samawahRunningMs: number;
  clientWaitingMs: number;
  internalDecisionMs: number;
  clientWaitingCountsAgainstSamawah: false;
  customerDataExposed: false;
};

export type R008SlaReportingReadiness = {
  cases: R008SlaReportingCase[];
  customerDataExposed: false;
};

export type R008SlaReportingSummary = {
  caseCount: number;
  clientWaitingSeparated: boolean;
  internalDecisionSeparated: boolean;
  atRiskCovered: boolean;
  overdueCovered: boolean;
  completedCovered: boolean;
  cancelledCovered: boolean;
  customerDataExposed: false;
};

const now = "2026-07-08T13:00:00.000Z";

const readinessCase = ({
  caseId,
  status,
  internalDueDate,
  finalDueDate,
  segments = [],
}: {
  caseId: R008SlaReportingCaseId;
  status: DeliverableLifecycleStatus;
  internalDueDate?: string;
  finalDueDate?: string;
  segments?: SlaTimelineSegment[];
}): R008SlaReportingCase => {
  const evaluation = deriveSlaStatus({
    status,
    now,
    internalDueDate,
    finalDueDate,
    segments,
  });
  const summary = summarizeSlaTimeline({ segments, now });

  return {
    caseId,
    status: evaluation.status,
    delayOwner: evaluation.delayOwner,
    samawahRunningMs: summary.samawahRunningMs,
    clientWaitingMs: summary.clientWaitingMs,
    internalDecisionMs: summary.internalDecisionMs,
    clientWaitingCountsAgainstSamawah: false,
    customerDataExposed: false,
  };
};

export const buildR008SlaReportingReadiness =
  (): R008SlaReportingReadiness => ({
    customerDataExposed: false,
    cases: [
      readinessCase({
        caseId: "running_work",
        status: "in_progress",
        internalDueDate: "2026-07-10T00:00:00.000Z",
        segments: [
          {
            kind: "running",
            startedAt: "2026-07-08T08:00:00.000Z",
          },
        ],
      }),
      readinessCase({
        caseId: "waiting_client_pause",
        status: "waiting_client_approval",
        segments: [
          {
            kind: "running",
            startedAt: "2026-07-08T08:00:00.000Z",
            endedAt: "2026-07-08T10:00:00.000Z",
          },
          {
            kind: "paused_waiting_client",
            startedAt: "2026-07-08T10:00:00.000Z",
          },
        ],
      }),
      readinessCase({
        caseId: "resumed_after_client_change_request",
        status: "client_changes_requested",
        finalDueDate: "2026-07-10T00:00:00.000Z",
        segments: [
          {
            kind: "running",
            startedAt: "2026-07-08T08:00:00.000Z",
            endedAt: "2026-07-08T10:00:00.000Z",
          },
          {
            kind: "paused_waiting_client",
            startedAt: "2026-07-08T10:00:00.000Z",
            endedAt: "2026-07-08T12:00:00.000Z",
          },
          {
            kind: "running",
            startedAt: "2026-07-08T12:00:00.000Z",
          },
        ],
      }),
      readinessCase({
        caseId: "internal_decision_pause",
        status: "ready_for_internal_review",
        segments: [
          {
            kind: "running",
            startedAt: "2026-07-08T08:00:00.000Z",
            endedAt: "2026-07-08T09:00:00.000Z",
          },
          {
            kind: "paused_waiting_internal_decision",
            startedAt: "2026-07-08T09:00:00.000Z",
          },
        ],
      }),
      readinessCase({
        caseId: "at_risk",
        status: "in_progress",
        internalDueDate: "2026-07-08T20:00:00.000Z",
      }),
      readinessCase({
        caseId: "overdue",
        status: "in_progress",
        internalDueDate: "2026-07-08T09:00:00.000Z",
      }),
      readinessCase({
        caseId: "completed",
        status: "delivered",
      }),
      readinessCase({
        caseId: "cancelled",
        status: "cancelled",
      }),
    ],
  });

export const summarizeR008SlaReportingReadiness = (
  readiness: R008SlaReportingReadiness,
): R008SlaReportingSummary => ({
  caseCount: readiness.cases.length,
  clientWaitingSeparated: readiness.cases.some(
    (item) =>
      item.caseId === "resumed_after_client_change_request" &&
      item.clientWaitingMs > 0 &&
      item.clientWaitingCountsAgainstSamawah === false,
  ),
  internalDecisionSeparated: readiness.cases.some(
    (item) =>
      item.caseId === "internal_decision_pause" &&
      item.internalDecisionMs > 0 &&
      item.delayOwner === "internal_decision",
  ),
  atRiskCovered: readiness.cases.some((item) => item.status === "at_risk"),
  overdueCovered: readiness.cases.some((item) => item.status === "overdue"),
  completedCovered: readiness.cases.some((item) => item.status === "completed"),
  cancelledCovered: readiness.cases.some((item) => item.status === "cancelled"),
  customerDataExposed: false,
});

import type { SlaTimelineSegment } from "./sla-policy";

export type SlaTimelineTransitionDecision =
  | { allowed: true; segments: SlaTimelineSegment[] }
  | {
      allowed: false;
      reason:
        | "timeline_already_paused"
        | "no_open_running_segment"
        | "no_open_client_pause_segment";
    };

const closeOpenSegment = (
  segment: SlaTimelineSegment,
  at: string,
): SlaTimelineSegment =>
  segment.endedAt
    ? segment
    : {
        ...segment,
        endedAt: at,
      };

const openSegment = (segments: readonly SlaTimelineSegment[]) =>
  [...segments].reverse().find((segment) => !segment.endedAt);

export const startSlaTimeline = (at: string): SlaTimelineSegment[] => [
  { kind: "running", startedAt: at },
];

export const pauseSlaForClientApproval = ({
  segments,
  at,
}: {
  segments: readonly SlaTimelineSegment[];
  at: string;
}): SlaTimelineTransitionDecision => {
  const currentOpenSegment = openSegment(segments);

  if (!currentOpenSegment) {
    return { allowed: false, reason: "no_open_running_segment" };
  }

  if (currentOpenSegment.kind !== "running") {
    return { allowed: false, reason: "timeline_already_paused" };
  }

  return {
    allowed: true,
    segments: [
      ...segments.map((segment) =>
        segment === currentOpenSegment ? closeOpenSegment(segment, at) : segment,
      ),
      { kind: "paused_waiting_client", startedAt: at },
    ],
  };
};

export const resumeSlaAfterClientChangeRequest = ({
  segments,
  at,
}: {
  segments: readonly SlaTimelineSegment[];
  at: string;
}): SlaTimelineTransitionDecision => {
  const currentOpenSegment = openSegment(segments);

  if (currentOpenSegment?.kind !== "paused_waiting_client") {
    return { allowed: false, reason: "no_open_client_pause_segment" };
  }

  return {
    allowed: true,
    segments: [
      ...segments.map((segment) =>
        segment === currentOpenSegment ? closeOpenSegment(segment, at) : segment,
      ),
      { kind: "running", startedAt: at },
    ],
  };
};

export const completeSlaTimeline = ({
  segments,
  at,
}: {
  segments: readonly SlaTimelineSegment[];
  at: string;
}): SlaTimelineSegment[] =>
  segments.map((segment) => (segment.endedAt ? segment : closeOpenSegment(segment, at)));


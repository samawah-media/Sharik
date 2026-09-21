import { describe, expect, it } from "vitest";
import {
  completeSlaTimeline,
  pauseSlaForClientApproval,
  resumeSlaAfterClientChangeRequest,
  startSlaTimeline,
} from "@/modules/sla/sla-timeline";
import { summarizeSlaTimeline } from "@/modules/sla/sla-policy";

describe("R-007 SLA timeline segment rules", () => {
  it("pauses Samawah time while waiting for client approval", () => {
    const started = startSlaTimeline("2026-07-08T08:00:00.000Z");
    const paused = pauseSlaForClientApproval({
      segments: started,
      at: "2026-07-08T10:00:00.000Z",
    });

    expect(paused).toMatchObject({
      allowed: true,
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
    });

    expect(
      summarizeSlaTimeline({
        segments: paused.allowed ? paused.segments : [],
        now: "2026-07-08T14:00:00.000Z",
      }),
    ).toEqual({
      samawahRunningMs: 2 * 60 * 60 * 1000,
      clientWaitingMs: 4 * 60 * 60 * 1000,
      internalDecisionMs: 0,
    });
  });

  it("resumes Samawah time when the client requests changes", () => {
    const paused = pauseSlaForClientApproval({
      segments: startSlaTimeline("2026-07-08T08:00:00.000Z"),
      at: "2026-07-08T10:00:00.000Z",
    });
    const resumed = resumeSlaAfterClientChangeRequest({
      segments: paused.allowed ? paused.segments : [],
      at: "2026-07-08T12:00:00.000Z",
    });

    expect(resumed).toMatchObject({
      allowed: true,
      segments: [
        { kind: "running" },
        {
          kind: "paused_waiting_client",
          endedAt: "2026-07-08T12:00:00.000Z",
        },
        {
          kind: "running",
          startedAt: "2026-07-08T12:00:00.000Z",
        },
      ],
    });
  });

  it("fails closed when pausing or resuming from the wrong timeline state", () => {
    const started = startSlaTimeline("2026-07-08T08:00:00.000Z");

    expect(
      resumeSlaAfterClientChangeRequest({
        segments: started,
        at: "2026-07-08T09:00:00.000Z",
      }),
    ).toEqual({ allowed: false, reason: "no_open_client_pause_segment" });

    const paused = pauseSlaForClientApproval({
      segments: started,
      at: "2026-07-08T09:00:00.000Z",
    });

    expect(
      pauseSlaForClientApproval({
        segments: paused.allowed ? paused.segments : [],
        at: "2026-07-08T10:00:00.000Z",
      }),
    ).toEqual({ allowed: false, reason: "timeline_already_paused" });
  });

  it("completes the open segment at delivery", () => {
    expect(
      completeSlaTimeline({
        segments: startSlaTimeline("2026-07-08T08:00:00.000Z"),
        at: "2026-07-08T11:00:00.000Z",
      }),
    ).toEqual([
      {
        kind: "running",
        startedAt: "2026-07-08T08:00:00.000Z",
        endedAt: "2026-07-08T11:00:00.000Z",
      },
    ]);
  });
});


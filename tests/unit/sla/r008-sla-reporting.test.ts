import { describe, expect, it } from "vitest";
import {
  buildR008SlaReportingReadiness,
  summarizeR008SlaReportingReadiness,
} from "@/modules/sla/r008-sla-reporting";

describe("R-008 SLA reporting readiness", () => {
  it("separates client waiting time from Samawah-owned work time", () => {
    const readiness = buildR008SlaReportingReadiness();
    const resumed = readiness.cases.find(
      (item) => item.caseId === "resumed_after_client_change_request",
    );

    expect(resumed).toMatchObject({
      status: "on_track",
      delayOwner: "samawah",
      samawahRunningMs: 3 * 60 * 60 * 1000,
      clientWaitingMs: 2 * 60 * 60 * 1000,
      clientWaitingCountsAgainstSamawah: false,
    });
  });

  it("covers running, paused, resumed, risk, terminal, and cancelled states", () => {
    const summary = summarizeR008SlaReportingReadiness(
      buildR008SlaReportingReadiness(),
    );

    expect(summary).toEqual({
      caseCount: 8,
      clientWaitingSeparated: true,
      internalDecisionSeparated: true,
      atRiskCovered: true,
      overdueCovered: true,
      completedCovered: true,
      cancelledCovered: true,
      customerDataExposed: false,
    });
  });
});

import { describe, expect, it } from "vitest";
import {
  canCancelDeliverableReservation,
  createInitialDeliverableState,
  getProgressForDeliverableStatus,
  shouldReservePackageCapacity,
  type DeliverableLifecycleStatus,
} from "@/modules/deliverables/deliverable-rules";

describe("deliverable rules", () => {
  it("creates deliverables as not_started with derived 0 percent progress", () => {
    expect(createInitialDeliverableState()).toEqual({
      status: "not_started",
      progressPercentage: 0,
    });
  });

  it("keeps progress derived from status rather than a manual override", () => {
    const progressByStatus: Record<DeliverableLifecycleStatus, number> = {
      not_started: 0,
      in_progress: 30,
      ready_for_internal_review: 50,
      internal_changes_requested: 45,
      internally_approved: 70,
      waiting_client_approval: 80,
      client_changes_requested: 65,
      client_approved: 90,
      ready_for_delivery: 95,
      delivered: 100,
      cancelled: 0,
      archived: 100,
    };

    for (const [status, progress] of Object.entries(progressByStatus)) {
      expect(getProgressForDeliverableStatus(status as DeliverableLifecycleStatus)).toBe(
        progress,
      );
    }
  });

  it("does not reserve package capacity for approved extra deliverables by default", () => {
    expect(shouldReservePackageCapacity({ approvedExtra: true })).toBe(false);
    expect(shouldReservePackageCapacity({ approvedExtra: false })).toBe(true);
  });

  it("allows reservation release only while a deliverable is not_started", () => {
    expect(canCancelDeliverableReservation("not_started")).toEqual({
      allowed: true,
    });
    expect(canCancelDeliverableReservation("in_progress")).toEqual({
      allowed: false,
      reason: "deliverable_already_progressed",
    });
    expect(canCancelDeliverableReservation("delivered")).toEqual({
      allowed: false,
      reason: "deliverable_already_progressed",
    });
    expect(canCancelDeliverableReservation("cancelled")).toEqual({
      allowed: false,
      reason: "deliverable_already_cancelled",
    });
  });
});


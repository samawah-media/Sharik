import { describe, expect, it } from "vitest";
import {
  activeKanbanStatuses,
  canChangeDeliverableStatus,
  canCancelDeliverableReservation,
  createInitialDeliverableState,
  getProgressForDeliverableStatus,
  isActiveKanbanStatus,
  shouldReservePackageCapacity,
  type DeliverableLifecycleStatus,
} from "@/modules/deliverables/deliverable-rules";
import { updateDeliverableStatusSchema } from "@/server/commands/deliverables/deliverable-schemas";

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

  it("defines the active Kanban statuses without adding lifecycle states", () => {
    expect(activeKanbanStatuses).toEqual([
      "not_started",
      "in_progress",
      "ready_for_internal_review",
      "internal_changes_requested",
      "internally_approved",
      "waiting_client_approval",
      "client_changes_requested",
      "client_approved",
      "ready_for_delivery",
      "delivered",
    ]);
    expect(isActiveKanbanStatus("in_progress")).toBe(true);
    expect(isActiveKanbanStatus("cancelled")).toBe(false);
    expect(isActiveKanbanStatus("archived")).toBe(false);
  });

  it("reserves approval-derived statuses for exact-version commands", () => {
    expect(
      canChangeDeliverableStatus({
        currentStatus: "ready_for_internal_review",
        targetStatus: "waiting_client_approval",
        requiresClientApproval: true,
      }),
    ).toEqual({
      allowed: false,
      reason: "protected_status_requires_command",
    });

    expect(
      canChangeDeliverableStatus({
        currentStatus: "internally_approved",
        targetStatus: "waiting_client_approval",
        requiresClientApproval: true,
      }),
    ).toEqual({ allowed: false, reason: "protected_status_requires_command" });
  });

  it("reserves delivery for the audited exact-version command", () => {
    expect(
      canChangeDeliverableStatus({
        currentStatus: "ready_for_delivery",
        targetStatus: "delivered",
        requiresClientApproval: true,
      }),
    ).toEqual({
      allowed: false,
      reason: "protected_status_requires_command",
    });

    expect(
      canChangeDeliverableStatus({
        currentStatus: "client_approved",
        targetStatus: "delivered",
        requiresClientApproval: true,
      }),
    ).toEqual({ allowed: false, reason: "protected_status_requires_command" });

    expect(
      canChangeDeliverableStatus({
        currentStatus: "ready_for_delivery",
        targetStatus: "delivered",
        requiresClientApproval: false,
      }),
    ).toEqual({ allowed: false, reason: "protected_status_requires_command" });
  });

  it("denies status changes from every terminal state", () => {
    expect(
      canChangeDeliverableStatus({
        currentStatus: "delivered",
        targetStatus: "in_progress",
        requiresClientApproval: true,
      }),
    ).toEqual({ allowed: false, reason: "terminal_status_locked" });
    expect(
      canChangeDeliverableStatus({
        currentStatus: "cancelled",
        targetStatus: "in_progress",
        requiresClientApproval: true,
      }),
    ).toEqual({ allowed: false, reason: "terminal_status_locked" });
    expect(
      canChangeDeliverableStatus({
        currentStatus: "archived",
        targetStatus: "in_progress",
        requiresClientApproval: true,
      }),
    ).toEqual({ allowed: false, reason: "terminal_status_locked" });
  });

  it("validates status update command input against board statuses", () => {
    expect(
      updateDeliverableStatusSchema.parse({
        clientId: "client_a",
        deliverableId: "deliverable_a",
        toStatus: "in_progress",
        expectedRevision: "1",
        reason: "بدء التنفيذ",
        idempotencyKey: "status-update-a",
      }),
    ).toMatchObject({
      clientId: "client_a",
      deliverableId: "deliverable_a",
      toStatus: "in_progress",
      expectedRevision: 1,
    });

    expect(
      updateDeliverableStatusSchema.safeParse({
        clientId: "client_a",
        deliverableId: "deliverable_a",
        toStatus: "cancelled",
        idempotencyKey: "status-update-a",
      }).success,
    ).toBe(false);
  });
});


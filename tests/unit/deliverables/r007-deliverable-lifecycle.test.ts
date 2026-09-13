import { describe, expect, it } from "vitest";
import {
  canPerformR007WorkflowStep,
  r007WorkflowStepTargets,
} from "@/modules/deliverables/r007-deliverable-lifecycle";

const currentVersion = {
  id: "version_current",
  state: "ready_for_internal_review",
  internalApprovalState: "pending",
  clientApprovalState: "not_sent",
  superseded: false,
} as const;

describe("R-007 deliverable lifecycle readiness rules", () => {
  it("allows internal approval only for a current reviewable version", () => {
    expect(
      canPerformR007WorkflowStep({
        step: "approve_internally",
        status: "ready_for_internal_review",
        requiresClientApproval: true,
        version: currentVersion,
      }),
    ).toEqual({ allowed: true });

    expect(
      canPerformR007WorkflowStep({
        step: "approve_internally",
        status: "ready_for_internal_review",
        requiresClientApproval: true,
        version: { ...currentVersion, superseded: true },
      }),
    ).toEqual({ allowed: false, reason: "version_superseded" });
  });

  it("denies client exposure before internal approval", () => {
    expect(
      canPerformR007WorkflowStep({
        step: "send_to_client",
        status: "ready_for_internal_review",
        requiresClientApproval: true,
        version: currentVersion,
      }),
    ).toEqual({
      allowed: false,
      reason: "internal_approval_required_before_client_exposure",
    });
  });

  it("allows client decisions only for the current visible pending version", () => {
    const clientVisibleVersion = {
      ...currentVersion,
      state: "client_visible",
      internalApprovalState: "approved",
      clientApprovalState: "pending",
    } as const;

    expect(
      canPerformR007WorkflowStep({
        step: "approve_as_client",
        status: "waiting_client_approval",
        requiresClientApproval: true,
        version: clientVisibleVersion,
      }),
    ).toEqual({ allowed: true });

    expect(
      canPerformR007WorkflowStep({
        step: "approve_as_client",
        status: "waiting_client_approval",
        requiresClientApproval: true,
        version: { ...clientVisibleVersion, clientApprovalState: "approved" },
      }),
    ).toEqual({ allowed: false, reason: "client_decision_not_pending" });
  });

  it("maps workflow steps to safe lifecycle targets", () => {
    expect(r007WorkflowStepTargets).toEqual({
      approve_internally: "internally_approved",
      request_internal_changes: "internal_changes_requested",
      send_to_client: "waiting_client_approval",
      approve_as_client: "client_approved",
      request_client_changes: "client_changes_requested",
      return_internal_rework: "internal_changes_requested",
      prepare_for_delivery: "ready_for_delivery",
      deliver_after_client_approval: "delivered",
    });
  });

  it("requires the explicit post-approval delivery checkpoint", () => {
    const approvedVersion = {
      ...currentVersion,
      state: "client_visible",
      internalApprovalState: "approved",
      clientApprovalState: "approved",
    } as const;

    expect(
      canPerformR007WorkflowStep({
        step: "prepare_for_delivery",
        status: "client_approved",
        requiresClientApproval: true,
        version: approvedVersion,
      }),
    ).toEqual({ allowed: true });
    expect(
      canPerformR007WorkflowStep({
        step: "deliver_after_client_approval",
        status: "client_approved",
        requiresClientApproval: true,
        version: approvedVersion,
      }),
    ).toEqual({
      allowed: false,
      reason: "client_approval_required_before_delivery",
    });
    expect(
      canPerformR007WorkflowStep({
        step: "deliver_after_client_approval",
        status: "ready_for_delivery",
        requiresClientApproval: true,
        version: approvedVersion,
      }),
    ).toEqual({ allowed: true });
  });
});

import { describe, expect, it } from "vitest";
import {
  canUpdateTaskStatus,
  type TaskCapabilities,
} from "@/modules/deliverables/deliverable-workspace";

const capabilities = (
  overrides: Partial<TaskCapabilities> = {},
): TaskCapabilities => ({
  canCreateTask: false,
  canAssignOthers: false,
  canReassignTask: false,
  canUpdateOwnTaskStatus: false,
  canDeleteTask: false,
  canEditTaskFields: false,
  ...overrides,
});

describe("task status capabilities", () => {
  it("allows a scoped assignee to update only their own task", () => {
    const workspace = {
      currentActorUserId: "actor-a",
      taskCapabilities: capabilities({ canUpdateOwnTaskStatus: true }),
    };

    expect(canUpdateTaskStatus(workspace, { assigneeUserId: "actor-a" })).toBe(
      true,
    );
    expect(canUpdateTaskStatus(workspace, { assigneeUserId: "actor-b" })).toBe(
      false,
    );
  });

  it("allows management or an authorized owner to update visible tasks", () => {
    const workspace = {
      currentActorUserId: "manager",
      taskCapabilities: capabilities({ canEditTaskFields: true }),
    };

    expect(canUpdateTaskStatus(workspace, { assigneeUserId: "actor-b" })).toBe(
      true,
    );
  });

  it("fails closed when actor identity is unavailable", () => {
    const workspace = {
      taskCapabilities: capabilities({ canUpdateOwnTaskStatus: true }),
    };

    expect(canUpdateTaskStatus(workspace, { assigneeUserId: "actor-a" })).toBe(
      false,
    );
  });
});

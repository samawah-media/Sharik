import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";
import { TaskForm } from "@/ui/deliverables/workspace-forms";

afterEach(() => cleanup());

vi.mock("@/server/actions/deliverable-workspace-actions", () => ({
  upsertDeliverableTask: vi.fn().mockResolvedValue({ ok: true }),
  deleteDeliverableTask: vi.fn().mockResolvedValue({ ok: true }),
  saveOrSubmitVersionContent: vi.fn().mockResolvedValue({ ok: true }),
  addWorkspaceComment: vi.fn().mockResolvedValue({ ok: true }),
  upsertQualityCheck: vi.fn().mockResolvedValue({ ok: true }),
  registerWorkspaceFile: vi.fn().mockResolvedValue({ ok: true }),
  createWorkspaceFileDownload: vi.fn().mockResolvedValue({ ok: true }),
  moveDeliverableOnBoard: vi.fn().mockResolvedValue({ ok: true }),
  fetchDeliverableWorkspace: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const baseDeliverable: DeliverableSafeSummary = {
  id: "d1",
  tenantId: "t1",
  clientId: "c1",
  name: "مخرج اختبار",
  type: "post",
  status: "in_progress",
  priority: "normal",
  ownerUserId: "user_a",
  ownerDisplay: undefined,
  contributorUserIds: [],
  internalDueDate: undefined,
  clientDueDate: undefined,
  finalDueDate: undefined,
  requiresInternalApproval: true,
  requiresClientApproval: true,
  progressPercentage: 30,
  approvedExtra: false,
  revision: 1,
  currentVersionId: undefined,
} as DeliverableSafeSummary;

const managementCaps = {
  canCreateTask: true,
  canAssignOthers: true,
  canReassignTask: true,
  canUpdateOwnTaskStatus: true,
  canDeleteTask: true,
  canEditTaskFields: true,
};

const teamCaps = {
  canCreateTask: true,
  canAssignOthers: false,
  canReassignTask: false,
  canUpdateOwnTaskStatus: true,
  canDeleteTask: false,
  canEditTaskFields: true,
};

const noCreateCaps = {
  canCreateTask: false,
  canAssignOthers: false,
  canReassignTask: false,
  canUpdateOwnTaskStatus: false,
  canDeleteTask: false,
  canEditTaskFields: false,
};

const assignees = [
  { userId: "user_b", displayName: "سارة", initial: "س" },
  { userId: "user_c", displayName: "رائد", initial: "ر" },
];

describe("TaskForm capabilities", () => {
  it("shows assignee selector for management with eligible assignees", () => {
    render(
      <TaskForm
        deliverable={baseDeliverable}
        eligibleAssignees={assignees}
        taskCapabilities={managementCaps}
      />,
    );
    expect(screen.getByText("المسند إليه")).toBeTruthy();
    expect(screen.getByText("سارة")).toBeTruthy();
    expect(screen.getByText("رائد")).toBeTruthy();
  });

  it("hides assignee selector for team members without canAssignOthers", () => {
    render(
      <TaskForm
        deliverable={baseDeliverable}
        eligibleAssignees={assignees}
        taskCapabilities={teamCaps}
      />,
    );
    expect(screen.queryByText("المسند إليه")).toBeNull();
    expect(screen.queryByText("سارة")).toBeNull();
  });

  it("hides assignee selector when no eligible assignees provided", () => {
    render(
      <TaskForm
        deliverable={baseDeliverable}
        eligibleAssignees={[]}
        taskCapabilities={managementCaps}
      />,
    );
    expect(screen.queryByText("المسند إليه")).toBeNull();
  });

  it("shows denial message when canCreateTask is false", () => {
    render(
      <TaskForm
        deliverable={baseDeliverable}
        eligibleAssignees={assignees}
        taskCapabilities={noCreateCaps}
      />,
    );
    expect(screen.queryByText("عنوان المهمة")).toBeNull();
    expect(screen.queryByText("إضافة مهمة")).toBeNull();
  });

  it("does not infer authority from eligible assignees alone", () => {
    render(
      <TaskForm
        deliverable={baseDeliverable}
        eligibleAssignees={assignees}
        taskCapabilities={teamCaps}
      />,
    );
    expect(screen.queryByText("المسند إليه")).toBeNull();
    expect(screen.getByText("إضافة مهمة")).toBeTruthy();
  });

  it("renders empty/null assignee option correctly", () => {
    render(
      <TaskForm
        deliverable={baseDeliverable}
        eligibleAssignees={assignees}
        taskCapabilities={managementCaps}
      />,
    );
    expect(screen.getByText("بدون إسناد")).toBeTruthy();
  });

  it("shows edit submit label when editingTask is provided", () => {
    render(
      <TaskForm
        deliverable={baseDeliverable}
        eligibleAssignees={assignees}
        taskCapabilities={managementCaps}
        editingTask={{
          id: "task-1",
          title: "مهمة موجودة",
          description: "وصف",
          status: "todo",
          priority: "high",
          assigneeUserId: "user_b",
          dueDate: undefined,
          sortOrder: 0,
        }}
      />,
    );
    expect(screen.getByText("حفظ التعديلات")).toBeTruthy();
    expect(screen.getByDisplayValue("مهمة موجودة")).toBeTruthy();
  });
});

import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";
import type { DeliverableWorkspace, TaskCapabilities } from "@/modules/deliverables/deliverable-workspace";
import { UniversalDeliverableDrawer } from "@/ui/deliverables/universal-deliverable-drawer";

const { saveTask, fetchWorkspace } = vi.hoisted(() => ({ saveTask: vi.fn(), fetchWorkspace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/server/actions/deliverable-workspace-actions", () => ({
  upsertDeliverableTask: saveTask,
  fetchDeliverableWorkspace: fetchWorkspace,
  addWorkspaceComment: vi.fn(), saveOrSubmitVersionContent: vi.fn(),
  saveQualityChecklist: vi.fn(), upsertQualityCheck: vi.fn(),
}));

const deliverable: DeliverableSafeSummary = {
  id: "10000000-0000-4000-8000-000000000001",
  tenantId: "10000000-0000-4000-8000-000000000002",
  clientId: "10000000-0000-4000-8000-000000000003",
  name: "مخرج اختبار", type: "post", status: "in_progress", priority: "normal",
  contributorUserIds: [], requiresInternalApproval: true, requiresClientApproval: true,
  progressPercentage: 30, approvedExtra: false, revision: 1,
  createdAt: "2026-09-07T00:00:00Z", updatedAt: "2026-09-07T00:00:00Z",
};
const assignee = {
  userId: "10000000-0000-4000-8000-000000000005",
  displayName: "عبدالرحمن مسؤول التنسيق والتصميم للحملات المشتركة Samawah Studio",
  roleLabel: "المصمم", initial: "ع",
};
const capabilities: TaskCapabilities = {
  canCreateTask: true, canAssignOthers: false, canReassignTask: false,
  canUpdateOwnTaskStatus: true, canDeleteTask: false, canEditTaskFields: true,
};
function workspaceWith(overrides: Partial<TaskCapabilities> = {}): DeliverableWorkspace {
  return {
    deliverableId: deliverable.id, currentActorUserId: assignee.userId,
    versions: [], files: [], uploadAttempts: [], comments: [], qualityChecks: [], activity: [],
    eligibleAssignees: [assignee], taskCapabilities: { ...capabilities, ...overrides },
    tasks: [{
      id: "10000000-0000-4000-8000-000000000004", title: "مراجعة التصميم",
      description: "ملاحظات يجب الاحتفاظ بها", status: "in_progress", priority: "high",
      assigneeUserId: assignee.userId, assignee, dueDate: "2026-09-10", sortOrder: 3,
    }],
    counts: { versions: 0, tasks: 1, files: 0, comments: 0 },
  };
}
async function openExecution(workspace: DeliverableWorkspace) {
  fetchWorkspace.mockResolvedValue({ ok: true, workspace });
  render(<UniversalDeliverableDrawer deliverable={deliverable} workspace={workspace} />);
  await userEvent.click(screen.getByRole("button", { name: "فتح مساحة المخرج" }));
  await userEvent.click(screen.getByRole("tab", { name: /مهام التنفيذ/ }));
  return within(screen.getByRole("tabpanel", { name: "مهام التنفيذ" })).getByRole("listitem");
}
beforeEach(() => { saveTask.mockReset().mockResolvedValue({ ok: false }); fetchWorkspace.mockReset(); });
afterEach(cleanup);

describe("D18 real drawer execution rows", () => {
  it.each([
    ["edit", { canReassignTask: false }, "تعديل المهمة", true],
    ["reassign", { canEditTaskFields: false, canReassignTask: true, canAssignOthers: true }, "تعديل المهمة أو إعادة إسنادها", true],
    ["own status", { canCreateTask: false, canEditTaskFields: false }, null, true],
    ["read only", { canCreateTask: false, canEditTaskFields: false, canUpdateOwnTaskStatus: false }, null, false],
  ] as const)("preserves %s capability controls inside the actual row", async (_name, overrides, summary, status) => {
    const row = await openExecution(workspaceWith(overrides));
    expect(within(row).getByText("مراجعة التصميم", { exact: true })).toBeVisible();
    expect(row).toHaveTextContent(assignee.displayName);
    expect(row).toHaveTextContent("١٠ سبتمبر ٢٠٢٦");
    expect(row).not.toHaveTextContent(/10000000-0000|2026-09-10/);
    expect(within(row).queryByRole("combobox", { name: "حالة المهمة: مراجعة التصميم" }) !== null).toBe(status);
    if (status) {
      expect(within(row).getByRole("combobox", { name: "حالة المهمة: مراجعة التصميم" })).toHaveValue("in_progress");
    } else {
      expect(within(row).getByText("قيد التنفيذ", { exact: true })).toBeVisible();
    }
    const disclosure = row.querySelector("summary");
    if (summary) {
      expect(disclosure).toHaveTextContent(summary);
      fireEvent.click(disclosure!);
      expect(within(row).getByLabelText("عنوان المهمة")).toBeVisible();
      if ("canAssignOthers" in overrides && overrides.canAssignOthers) expect(within(row).getByLabelText("المسند إليه")).toHaveValue(assignee.userId);
    } else {
      expect(disclosure).toBeNull();
    }
  });

  it("keeps editor errors focused and failed values/retry identity when disclosure closes and reopens", async () => {
    const row = await openExecution(workspaceWith());
    const summary = row.querySelector("summary")!;
    fireEvent.click(summary);
    const title = within(row).getByLabelText("عنوان المهمة");
    fireEvent.change(title, { target: { value: " " } });
    fireEvent.click(within(row).getByRole("button", { name: "حفظ التعديلات" }));
    await waitFor(() => expect(title).toHaveFocus());
    expect(title).toHaveAttribute("aria-invalid", "true");
    expect(saveTask).not.toHaveBeenCalled();
    fireEvent.change(title, { target: { value: "عنوان المهمة المعدل مع الاحتفاظ بالبيانات" } });
    fireEvent.click(within(row).getByRole("button", { name: "حفظ التعديلات" }));
    await waitFor(() => expect(within(row).getByText(/راجع الصلاحية والحالة/)).toBeVisible());
    const firstPayload = saveTask.mock.calls[0][0];
    fireEvent.click(summary);
    fireEvent.click(summary);
    expect(title).toHaveValue("عنوان المهمة المعدل مع الاحتفاظ بالبيانات");
    expect(within(row).getByLabelText("الوصف")).toHaveValue("ملاحظات يجب الاحتفاظ بها");
    expect(within(row).getByLabelText("الأولوية")).toHaveValue("high");
    expect(within(row).getByLabelText("تاريخ الاستحقاق")).toHaveValue("2026-09-10");
    fireEvent.click(within(row).getByRole("button", { name: "حفظ التعديلات" }));
    await waitFor(() => expect(saveTask).toHaveBeenCalledTimes(2));
    expect(saveTask.mock.calls[1][0]).toEqual(firstPayload);
  });

  it("keeps long Arabic task identity and missing-assignee fallback in the row", async () => {
    const workspace = workspaceWith();
    workspace.tasks[0] = { ...workspace.tasks[0], title: "متابعة تنفيذ الحملة الإبداعية متعددة القنوات والعملاء مع مراجعة جميع الملاحظات", assignee: undefined, assigneeUserId: undefined };
    const row = await openExecution(workspace);
    expect(within(row).getByText(workspace.tasks[0].title, { exact: true })).toBeVisible();
    expect(row).toHaveTextContent("غير مسند");
  });
});

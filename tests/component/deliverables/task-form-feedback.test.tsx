import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";
import { TaskForm } from "@/ui/deliverables/workspace-forms";

const { saveTask, refresh } = vi.hoisted(() => ({
  saveTask: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/server/actions/deliverable-workspace-actions", () => ({
  upsertDeliverableTask: saveTask,
  addWorkspaceComment: vi.fn(),
  saveOrSubmitVersionContent: vi.fn(),
  saveQualityChecklist: vi.fn(),
  upsertQualityCheck: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

beforeEach(() => {
  saveTask.mockReset().mockResolvedValue({ ok: true });
  refresh.mockReset();
});
afterEach(cleanup);

const deliverable: DeliverableSafeSummary = {
  id: "10000000-0000-4000-8000-000000000001",
  tenantId: "10000000-0000-4000-8000-000000000002",
  clientId: "10000000-0000-4000-8000-000000000003",
  name: "مخرج اختبار",
  type: "post",
  status: "in_progress",
  priority: "normal",
  contributorUserIds: [],
  requiresInternalApproval: true,
  requiresClientApproval: true,
  progressPercentage: 30,
  approvedExtra: false,
  revision: 1,
  createdAt: "2026-09-07T00:00:00Z",
  updatedAt: "2026-09-07T00:00:00Z",
};

const capabilities = {
  canCreateTask: true,
  canAssignOthers: false,
  canReassignTask: false,
  canUpdateOwnTaskStatus: true,
  canDeleteTask: false,
  canEditTaskFields: true,
};

const editingTask = {
  id: "10000000-0000-4000-8000-000000000004",
  title: "مراجعة التصميم",
  description: "ملاحظات يجب الاحتفاظ بها",
  status: "in_progress",
  priority: "high",
  dueDate: "2026-09-10",
  sortOrder: 3,
};

const renderTask = () =>
  render(
    <TaskForm
      deliverable={deliverable}
      taskCapabilities={capabilities}
      editingTask={editingTask}
    />,
  );

const submit = () =>
  fireEvent.click(screen.getByRole("button", { name: "حفظ التعديلات" }));

describe("X010-B-7C-12 execution-task feedback", () => {
  it.each([
    ["عنوان المهمة", " ", /حرفين|[٢2]/],
    ["عنوان المهمة", "س".repeat(201), /٢٠٠|200/],
    ["الوصف", "س".repeat(2001), /٢٠٠٠|2000|٢٬٠٠٠|2,000/],
  ])(
    "explains the actual constraint for %s and focuses the invalid input",
    async (label, value, message) => {
      renderTask();
      const input = screen.getByLabelText(label);
      fireEvent.change(input, { target: { value } });

      submit();

      await waitFor(() =>
        expect(input).toHaveAttribute("aria-invalid", "true"),
      );
      expect(input).toHaveAccessibleDescription(message);
      expect(input).toHaveFocus();
      expect(input).toHaveValue(value);
      expect(saveTask).not.toHaveBeenCalled();
    },
  );

  it("focuses title before description, then clears only the corrected error", async () => {
    renderTask();
    const title = screen.getByLabelText("عنوان المهمة");
    const description = screen.getByLabelText("الوصف");
    fireEvent.change(title, { target: { value: "س" } });
    fireEvent.change(description, { target: { value: "س".repeat(2001) } });
    submit();

    await waitFor(() => expect(title).toHaveAttribute("aria-invalid", "true"));
    expect(title).toHaveFocus();
    const descriptionErrorId = description.getAttribute("aria-describedby");
    expect(descriptionErrorId).toBeTruthy();

    fireEvent.change(title, { target: { value: "عنوان مصحح" } });

    await waitFor(() =>
      expect(title).not.toHaveAttribute("aria-invalid", "true"),
    );
    expect(description).toHaveAttribute("aria-invalid", "true");
    expect(description).toHaveAttribute("aria-describedby", descriptionErrorId);
    expect(description).toHaveAccessibleDescription(/٢٠٠٠|2000|٢٬٠٠٠|2,000/);
    submit();
    await waitFor(() => expect(description).toHaveFocus());
    expect(title).toHaveValue("عنوان مصحح");
  });

  it("uses distinct error IDs for two forms and preserves them through revalidation", async () => {
    renderTask();
    renderTask();
    const titles = screen.getAllByLabelText("عنوان المهمة");
    titles.forEach((title) =>
      fireEvent.change(title, { target: { value: "س" } }),
    );
    const buttons = screen.getAllByRole("button", { name: "حفظ التعديلات" });
    buttons.forEach((button) => fireEvent.click(button));

    await waitFor(() =>
      titles.forEach((title) =>
        expect(title).toHaveAttribute("aria-invalid", "true"),
      ),
    );
    const ids = titles.map((title) => title.getAttribute("aria-describedby"));
    expect(ids.every(Boolean)).toBe(true);
    expect(new Set(ids).size).toBe(2);
    titles.forEach((title) =>
      expect(title).toHaveAccessibleDescription(/حرفين|[٢2]/),
    );

    fireEvent.change(titles[0], { target: { value: "ص" } });
    fireEvent.click(buttons[0]);
    await waitFor(() =>
      expect(titles[0]).toHaveAttribute("aria-describedby", ids[0]),
    );
  });

  it("skips a hidden description error when focusing the first invalid visible input", async () => {
    render(
      <TaskForm
        deliverable={deliverable}
        taskCapabilities={{ ...capabilities, canEditTaskFields: false }}
        editingTask={{
          ...editingTask,
          description: "س".repeat(2001),
          dueDate: "2026-02-30",
        }}
      />,
    );
    const dueDate = screen.getByLabelText("تاريخ الاستحقاق");
    submit();

    await waitFor(() =>
      expect(dueDate).toHaveAttribute("aria-invalid", "true"),
    );
    expect(dueDate).toHaveFocus();
    expect(dueDate).toHaveAccessibleDescription(/تاريخ/);
    expect(screen.queryByLabelText("الوصف")).not.toBeInTheDocument();
    expect(saveTask).not.toHaveBeenCalled();
  });

  it.each(["denied", "thrown"])(
    "preserves entries after a %s save and allows a successful retry",
    async (failure) => {
      if (failure === "denied")
        saveTask.mockResolvedValueOnce({ ok: false, reason: "denied" });
      else saveTask.mockRejectedValueOnce(new Error("private-server-detail"));
      renderTask();
      fireEvent.change(screen.getByLabelText("عنوان المهمة"), {
        target: { value: "عنوان معدل" },
      });
      fireEvent.change(screen.getByLabelText("الوصف"), {
        target: { value: "تفاصيل معدلة" },
      });
      submit();

      expect(await screen.findByText(/تعذر حفظ المهمة/)).toHaveTextContent(
        /حاول مرة أخرى|إعادة المحاولة/,
      );
      expect(screen.getByLabelText("عنوان المهمة")).toHaveValue("عنوان معدل");
      expect(screen.getByLabelText("الوصف")).toHaveValue("تفاصيل معدلة");
      expect(screen.getByLabelText("تاريخ الاستحقاق")).toHaveValue(
        editingTask.dueDate,
      );
      expect(screen.getByLabelText("الأولوية")).toHaveValue("high");
      expect(
        screen.queryByText("private-server-detail"),
      ).not.toBeInTheDocument();
      expect(screen.queryByText("تم تحديث المهمة.")).not.toBeInTheDocument();
      expect(refresh).not.toHaveBeenCalled();
      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: "حفظ التعديلات" }),
        ).toBeEnabled(),
      );

      submit();

      expect(await screen.findByText("تم تحديث المهمة.")).toBeInTheDocument();
      expect(screen.queryByText(/تعذر حفظ المهمة/)).not.toBeInTheDocument();
      expect(saveTask).toHaveBeenLastCalledWith(
        expect.objectContaining({
          title: "عنوان معدل",
          description: "تفاصيل معدلة",
          status: "in_progress",
          priority: "high",
          dueDate: editingTask.dueDate,
          clientId: deliverable.clientId,
          deliverableId: deliverable.id,
          taskId: editingTask.id,
          assigneeUserId: null,
        }),
      );
    },
  );

  it("normalizes cleared optional date and assignee controls to null without weakening validation", async () => {
    const assigneeUserId = "10000000-0000-4000-8000-000000000005";
    render(
      <TaskForm
        deliverable={deliverable}
        taskCapabilities={{ ...capabilities, canAssignOthers: true }}
        eligibleAssignees={[
          { userId: assigneeUserId, displayName: "سارة", initial: "س" },
        ]}
        editingTask={{ ...editingTask, assigneeUserId }}
      />,
    );
    fireEvent.change(screen.getByLabelText("تاريخ الاستحقاق"), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByLabelText("المسند إليه"), {
      target: { value: "" },
    });
    submit();

    expect(await screen.findByText("تم تحديث المهمة.")).toBeInTheDocument();
    expect(saveTask).toHaveBeenCalledWith(
      expect.objectContaining({ dueDate: null, assigneeUserId: null }),
    );
  });

  it("reuses the logical creation key after a lost response and rotates it after confirmed success", async () => {
    saveTask.mockRejectedValueOnce(new Error("response lost"));
    render(
      <TaskForm deliverable={deliverable} taskCapabilities={capabilities} />,
    );
    const title = screen.getByLabelText("عنوان المهمة");
    const button = screen.getByRole("button", { name: "إضافة مهمة" });
    fireEvent.change(title, { target: { value: "مهمة جديدة" } });
    fireEvent.click(button);

    expect(await screen.findByText(/تعذر حفظ المهمة/)).toBeInTheDocument();
    const firstAttempt = saveTask.mock.calls[0][0];
    expect(firstAttempt.idempotencyKey).toEqual(expect.any(String));
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);

    expect(await screen.findByText("تمت إضافة المهمة.")).toBeInTheDocument();
    expect(saveTask.mock.calls[1][0]).toEqual(firstAttempt);
    expect(title).toHaveValue("");
    await waitFor(() => expect(button).toBeEnabled());
    // An intentionally new task can have identical content after a confirmed save.
    fireEvent.change(title, { target: { value: "مهمة جديدة" } });
    fireEvent.click(button);

    await waitFor(() => expect(saveTask).toHaveBeenCalledTimes(3));
    expect(saveTask.mock.calls[2][0].idempotencyKey).not.toBe(
      firstAttempt.idempotencyKey,
    );
    expect(saveTask.mock.calls[2][0]).toEqual({
      ...firstAttempt,
      idempotencyKey: expect.any(String),
    });
  });

  it("starts a new logical attempt when the payload changes after a lost response", async () => {
    saveTask.mockRejectedValueOnce(new Error("response lost"));
    renderTask();
    submit();
    expect(await screen.findByText(/تعذر حفظ المهمة/)).toBeInTheDocument();
    const firstKey = saveTask.mock.calls[0][0].idempotencyKey;
    fireEvent.change(screen.getByLabelText("الوصف"), {
      target: { value: "محتوى مختلف" },
    });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "حفظ التعديلات" }),
      ).toBeEnabled(),
    );
    submit();

    expect(await screen.findByText("تم تحديث المهمة.")).toBeInTheDocument();
    expect(saveTask.mock.calls[1][0].idempotencyKey).not.toBe(firstKey);
    expect(saveTask.mock.calls[1][0].description).toBe("محتوى مختلف");
  });
});

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";
import { TeamWorkspace } from "@/ui/management/team-workspace";

afterEach(() => cleanup());

const { previewFile } = vi.hoisted(() => ({ previewFile: vi.fn() }));
vi.mock(
  "@/server/actions/deliverable-workspace-actions",
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import("@/server/actions/deliverable-workspace-actions")
    >()),
    createWorkspaceFilePreview: previewFile,
  }),
);

const waitingDeliverable: DeliverableSafeSummary = {
  id: "deliverable_waiting",
  tenantId: "tenant_a",
  clientId: "client_a",
  name: "أدوات التسويق",
  description: "وصف إداري لا يجب عرضه على أنه كابشن",
  contentStage: "مراجعة المحتوى",
  type: "marketing_coordination",
  status: "waiting_client_approval",
  priority: "normal",
  contributorUserIds: [],
  clientDueDate: "2026-07-20",
  requiresInternalApproval: true,
  requiresClientApproval: true,
  progressPercentage: 80,
  approvedExtra: false,
  revision: 1,
  createdAt: "2026-07-16T00:00:00.000Z",
  updatedAt: "2026-07-16T00:00:00.000Z",
};

describe("team workspace", () => {
  it("retains three labeled filters and one native primary trigger per row", () => {
    render(
      <TeamWorkspace
        clientNames={{}}
        deliverables={[waitingDeliverable]}
        now="2026-07-16T10:00:00Z"
        workspaces={{}}
      />,
    );
    const filters = within(screen.getByRole("group", { name: "فلاتر مهامي" }));
    expect(filters.getByRole("searchbox", { name: "بحث" })).toBeVisible();
    expect(filters.getByRole("combobox", { name: "الأولوية" })).toBeVisible();
    expect(filters.getByRole("combobox", { name: "SLA" })).toBeVisible();
    const row = screen.getByRole("article");
    const trigger = within(row).getByRole("button", {
      name: "فتح مساحة المخرج",
    });
    expect(within(row).getAllByRole("button")).toHaveLength(1);
    expect(trigger).toHaveClass("after:absolute", "after:inset-0");
    expect(trigger).toHaveAttribute("type", "button");
    expect(
      trigger.querySelector("button, a, input, select, textarea"),
    ).toBeNull();
    expect(row).not.toHaveAttribute("tabindex");
    expect(
      within(row).getByRole("heading", { name: waitingDeliverable.name }),
    ).toBeVisible();
  });

  it("preserves a human-authored mixed-language content stage", () => {
    render(
      <TeamWorkspace
        clientNames={{}}
        deliverables={[
          { ...waitingDeliverable, contentStage: "مراجعة حملة September" },
        ]}
        now="2026-07-16T10:00:00Z"
        workspaces={{}}
      />,
    );
    expect(screen.getByText("المرحلة: مراجعة حملة September")).toBeVisible();
  });
  it("explains an initially empty assignment list without suggesting failed filters", () => {
    render(
      <TeamWorkspace
        clientNames={{}}
        deliverables={[]}
        now="2026-07-16T10:00:00Z"
        workspaces={{}}
      />,
    );
    expect(screen.getByText("لا توجد مخرجات مسندة إليك حالياً")).toBeVisible();
    expect(
      screen.queryByText("جرّب تعديل البحث أو فلاتر الأولوية وSLA."),
    ).not.toBeInTheDocument();
  });

  it.each([true, false])(
    "uses only the authorized image preview and reports unavailable preview honestly: %s",
    async (allowed) => {
      previewFile
        .mockReset()
        .mockResolvedValue(
          allowed ? { ok: true, url: "/authorized-preview" } : { ok: false },
        );
      render(
        <TeamWorkspace
          clientNames={{}}
          deliverables={[waitingDeliverable]}
          now="2026-07-16T10:00:00Z"
          workspaces={{
            deliverable_waiting: {
              deliverableId: waitingDeliverable.id,
              previewFile: {
                id: "authorized_file",
                name: "صورة",
                fileType: "image/png",
              },
              counts: { versions: 1, tasks: 0, files: 1, comments: 0 },
            },
          }}
        />,
      );
      if (allowed)
        expect(
          await screen.findByRole("img", { name: "معاينة المخرج" }),
        ).toHaveAttribute("src", "/authorized-preview");
      else
        expect(
          await screen.findByText("تعذرت معاينة الأصل المرئي بأمان."),
        ).toBeVisible();
      expect(previewFile).toHaveBeenCalledWith("authorized_file");
    },
  );

  it("keeps video as a generic tile without requesting a preview or mounting tiny video controls", () => {
    previewFile.mockReset();
    const { container } = render(
      <TeamWorkspace
        clientNames={{}}
        deliverables={[waitingDeliverable]}
        now="2026-07-16T10:00:00Z"
        workspaces={{
          deliverable_waiting: {
            deliverableId: waitingDeliverable.id,
            previewFile: {
              id: "video_file",
              name: "فيديو",
              fileType: "video/mp4",
            },
            counts: { versions: 1, tasks: 0, files: 1, comments: 0 },
          },
        }}
      />,
    );
    expect(
      screen.getByRole("img", { name: "معاينة رمزية للمخرج" }),
    ).toBeVisible();
    expect(container.querySelector("video")).toBeNull();
    expect(previewFile).not.toHaveBeenCalled();
  });
  it("localizes hosted UAT deliverable metadata without exposing enum values", () => {
    render(
      <TeamWorkspace
        clientNames={{ client_a: "جلاس" }}
        deliverables={[waitingDeliverable]}
        now="2026-07-16T10:00:00.000Z"
        workspaces={{
          deliverable_waiting: {
            deliverableId: "deliverable_waiting",
            currentVersionId: "version_2",
            currentVersion: {
              id: "version_2",
              versionNumber: 2,
              caption: "الكابشن الحقيقي للنسخة",
              channel: "Instagram",
              format: "Post",
            },
            counts: { versions: 2, tasks: 1, files: 0, comments: 1 },
          },
        }}
      />,
    );

    const workList = within(screen.getByTestId("team-work-list"));
    expect(workList.getAllByText("أدوات التسويق")).toHaveLength(1);
    expect(
      workList.queryByText("الكابشن الحقيقي للنسخة"),
    ).not.toBeInTheDocument();
    expect(workList.getAllByText("جلاس")).toHaveLength(1);
    expect(workList.getByText("المرحلة: مراجعة المحتوى")).toBeVisible();
    expect(workList.getByTestId("team-work-thumbnail")).toBeVisible();
    expect(workList.getAllByText("إنستغرام")).toHaveLength(1);
    expect(workList.getAllByText("بانتظار الإسناد")).toHaveLength(1);
    expect(workList.getAllByText("٢٠ يوليو ٢٠٢٦")).toHaveLength(1);
    expect(
      workList.getByRole("img", { name: "معاينة رمزية للمخرج" }),
    ).toBeVisible();
    expect(
      workList.getByRole("button", { name: "فتح مساحة المخرج" }),
    ).toBeVisible();
    expect(
      workList.getByText("2 نسخ · 1 مهام · 0 ملفات · 1 تعليقات"),
    ).toBeVisible();
    expect(
      workList.queryByText("وصف إداري لا يجب عرضه على أنه كابشن"),
    ).not.toBeInTheDocument();
    expect(workList.getByText("متوقف بانتظار العميل")).toBeInTheDocument();
    expect(workList.getByText("عادية")).toBeInTheDocument();
    expect(
      workList.queryByText("marketing_coordination"),
    ).not.toBeInTheDocument();
    expect(
      workList.queryByText("waiting_client_approval"),
    ).not.toBeInTheDocument();
    expect(
      workList.queryByText("paused_waiting_client"),
    ).not.toBeInTheDocument();
  });

  it.each([
    [
      {
        internalDueDate: "2026-07-03T21:00:00Z",
        finalDueDate: "2026-07-25",
        plannedPublishDate: "2026-07-26",
      },
      "٤ يوليو ٢٠٢٦",
    ],
    [
      {
        clientDueDate: undefined,
        finalDueDate: "2026-07-25",
        plannedPublishDate: "2026-07-26",
      },
      "٢٥ يوليو ٢٠٢٦",
    ],
    [
      { clientDueDate: undefined, plannedPublishDate: "2026-07-26" },
      "٢٦ يوليو ٢٠٢٦",
    ],
  ] as const)(
    "preserves date source precedence and Arabic display for %s",
    (dates, expected) => {
      render(
        <TeamWorkspace
          clientNames={{}}
          deliverables={[{ ...waitingDeliverable, ...dates }]}
          now="2026-07-16T10:00:00Z"
          workspaces={{}}
        />,
      );
      expect(
        within(screen.getByTestId("team-work-list")).getByText(expected),
      ).toBeVisible();
    },
  );

  it("shows a recoverable empty filtered list and preserves search and priority filters", () => {
    render(
      <TeamWorkspace
        clientNames={{ client_a: "جلاس" }}
        deliverables={[waitingDeliverable]}
        now="2026-07-16T10:00:00Z"
        workspaces={{}}
      />,
    );
    fireEvent.change(screen.getByLabelText("بحث"), {
      target: { value: "غير موجود" },
    });
    expect(
      screen.getByText("لا توجد مخرجات تطابق الفلاتر الحالية."),
    ).toBeVisible();
    expect(
      screen.getByText("جرّب تعديل البحث أو فلاتر الأولوية وSLA."),
    ).toBeVisible();
    expect(screen.getByText("0 مخرج ضمن العمل المسند")).toBeVisible();
    fireEvent.change(screen.getByLabelText("بحث"), {
      target: { value: "جلاس" },
    });
    expect(screen.getByText("أدوات التسويق")).toBeVisible();
    fireEvent.change(screen.getByLabelText("الأولوية"), {
      target: { value: "urgent" },
    });
    expect(screen.queryByText("أدوات التسويق")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("الأولوية"), {
      target: { value: "all" },
    });
    fireEvent.change(screen.getByLabelText("SLA"), {
      target: { value: "overdue" },
    });
    expect(screen.queryByText("أدوات التسويق")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("SLA"), {
      target: { value: "paused_waiting_client" },
    });
    expect(screen.getByText("أدوات التسويق")).toBeVisible();
  });

  it("uses safe unknown-channel text and keeps the list summary free of version bodies", () => {
    render(
      <TeamWorkspace
        clientNames={{}}
        deliverables={[waitingDeliverable]}
        now="2026-07-16T10:00:00Z"
        workspaces={{
          deliverable_waiting: {
            deliverableId: waitingDeliverable.id,
            currentVersion: {
              id: "v1",
              versionNumber: 1,
              channel: "future_network",
              body: "نص طويل مخصص للتفاصيل",
            },
            counts: { versions: 1, tasks: 0, files: 0, comments: 0 },
          },
        }}
      />,
    );
    const list = within(screen.getByTestId("team-work-list"));
    expect(list.getAllByText("قناة رقمية")).toHaveLength(1);
    expect(list.queryByText("future_network")).not.toBeInTheDocument();
    expect(list.queryByText("نص طويل مخصص للتفاصيل")).not.toBeInTheDocument();
  });
});

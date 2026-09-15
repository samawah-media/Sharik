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

const noCapabilities = {
  canApproveInternally: false,
  canManageDelivery: false,
  canSendToClient: false,
  canSubmitVersion: false,
  canUpdateStatus: false,
};

describe("team workspace", () => {
  it("defaults to actor actions and preserves assigned and all-authorized reachability", () => {
    const actorOwned = {
      ...waitingDeliverable,
      id: "actor-owned",
      name: "نسخة الكاتب",
      ownerUserId: "actor-a",
      status: "in_progress" as const,
    };
    const actorTask = {
      ...waitingDeliverable,
      id: "actor-task",
      name: "مهمة داخل مخرج",
      ownerUserId: "someone-else",
    };
    const roleContext = {
      ...waitingDeliverable,
      id: "role-context",
      name: "سياق العميل",
      ownerUserId: "someone-else",
    };
    render(
      <TeamWorkspace
        actorUserId="actor-a"
        capabilitiesByDeliverable={{
          "actor-owned": { ...noCapabilities, canSubmitVersion: true },
          "actor-task": noCapabilities,
          "role-context": noCapabilities,
        }}
        clientNames={{ client_a: "جلاس" }}
        deliverables={[roleContext, actorOwned, actorTask]}
        now="2026-07-16T10:00:00Z"
        workspaces={{
          "actor-task": {
            deliverableId: "actor-task",
            hasOpenAssignedTask: true,
            counts: { versions: 0, tasks: 1, files: 0, comments: 0 },
          },
        }}
      />,
    );

    const scope = screen.getByRole("combobox", { name: "عرض العمل" });
    expect(scope).toHaveValue("needs_action");
    expect(screen.getByText("نسخة الكاتب")).toBeVisible();
    expect(screen.getByText("مهمة داخل مخرج")).toBeVisible();
    expect(screen.queryByText("سياق العميل")).not.toBeInTheDocument();

    fireEvent.change(scope, { target: { value: "assigned" } });
    expect(screen.getByText("نسخة الكاتب")).toBeVisible();
    expect(screen.getByText("مهمة داخل مخرج")).toBeVisible();
    expect(screen.queryByText("سياق العميل")).not.toBeInTheDocument();

    fireEvent.change(scope, { target: { value: "all_authorized" } });
    expect(screen.getByText("نسخة الكاتب")).toBeVisible();
    expect(screen.getByText("مهمة داخل مخرج")).toBeVisible();
    expect(screen.getByText("سياق العميل")).toBeVisible();
    expect(screen.getByText("أنت المسؤول")).toBeVisible();
    expect(screen.getByText("عندك مهمة داخل المخرج")).toBeVisible();
    expect(screen.getByText("ظاهر لك بحكم دورك")).toBeVisible();
  });

  it("shares the actor-aware non-action message between the row and Drawer", () => {
    render(
      <TeamWorkspace
        actorUserId="actor-a"
        capabilitiesByDeliverable={{ deliverable_waiting: noCapabilities }}
        clientNames={{ client_a: "جلاس" }}
        deliverables={[
          {
            ...waitingDeliverable,
            ownerUserId: "someone-else",
            contributorUserIds: ["actor-a"],
          },
        ]}
        now="2026-07-16T10:00:00Z"
        workspaces={{}}
      />,
    );

    fireEvent.change(screen.getByRole("combobox", { name: "عرض العمل" }), {
      target: { value: "assigned" },
    });
    expect(screen.getByText("أنت مشارك في المخرج")).toBeVisible();
    expect(
      screen.getByText("بانتظار قرار العميل — ما عليك إجراء الآن"),
    ).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: "فتح مساحة المخرج" }),
    );
    expect(
      screen.getAllByText(/بانتظار قرار العميل — ما عليك إجراء الآن/),
    ).toHaveLength(2);
  });

  it("preserves the actor-aware next action when switching from list to board Drawer", () => {
    const actorWork = {
      ...waitingDeliverable,
      id: "actor-board-work",
      ownerUserId: "actor-a",
      status: "in_progress" as const,
    };
    const actorNextAction =
      "أكمل العمل وارفع النسخة للمراجعة الداخلية.";
    render(
      <TeamWorkspace
        actorUserId="actor-a"
        capabilitiesByDeliverable={{
          "actor-board-work": {
            ...noCapabilities,
            canSubmitVersion: true,
          },
        }}
        clientNames={{ client_a: "جلاس" }}
        deliverables={[actorWork]}
        now="2026-07-16T10:00:00Z"
        workspaces={{}}
      />,
    );

    expect(screen.getByText(actorNextAction)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "لوحة العمل" }));
    fireEvent.click(
      screen.getByRole("button", { name: "فتح مساحة المخرج" }),
    );

    expect(screen.getByText(new RegExp(actorNextAction))).toBeVisible();
    expect(screen.queryByText("إكمال المحتوى ورفع نسخة")).not.toBeInTheDocument();
  });

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
          await screen.findByText("تعذرت المعاينة المرئية. يمكنك تنزيل الملف مباشرة."),
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

  it("finds deliverables by Arabic type label instead of raw enum values", () => {
    // Production break: a team member searching "حملة" or "تقرير" got an
    // empty list because the workspace matched the raw English enum
    // ("campaign") instead of the Arabic label shown on the row.
    render(
      <TeamWorkspace
        clientNames={{ client_a: "شَركة القِمّة" }}
        deliverables={[
          { ...waitingDeliverable, id: "deliverable_report", type: "report" },
          {
            ...waitingDeliverable,
            id: "deliverable_other",
            name: "مهمة أخرى",
            type: "campaign",
          },
        ]}
        now="2026-07-16T10:00:00Z"
        workspaces={{}}
      />,
    );
    fireEvent.change(screen.getByLabelText("بحث"), {
      target: { value: "تقرير" },
    });
    expect(screen.getByText("أدوات التسويق")).toBeVisible();
    expect(screen.queryByText("مهمة أخرى")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("بحث"), {
      target: { value: "حملة" },
    });
    expect(screen.getByText("مهمة أخرى")).toBeVisible();
    expect(screen.queryByText("أدوات التسويق")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("بحث"), {
      target: { value: "campaign" },
    });
    expect(
      screen.getByText("لا توجد مخرجات تطابق الفلاتر الحالية."),
    ).toBeVisible();
  });

  it("matches diacritized deliverable and client names from plain typing", () => {
    // Production break: deliverables and client names stored with harakat
    // or hamza carriers ("تَقرير أداء رَمضان", "شَركة القِمّة") never match
    // the plain typed query "تقرير اداء" or "شركة القمة".
    const diacritizedDeliverable: DeliverableSafeSummary = {
      ...waitingDeliverable,
      id: "deliverable_diacritized",
      name: "تَقرير أداء رَمضان",
      type: "report",
    };
    render(
      <TeamWorkspace
        clientNames={{ client_a: "شَركة القِمّة" }}
        deliverables={[diacritizedDeliverable]}
        now="2026-07-16T10:00:00Z"
        workspaces={{}}
      />,
    );
    fireEvent.change(screen.getByLabelText("بحث"), {
      target: { value: "تقرير اداء" },
    });
    expect(screen.getByText("تَقرير أداء رَمضان")).toBeVisible();
    fireEvent.change(screen.getByLabelText("بحث"), {
      target: { value: "شركة القمة" },
    });
    expect(screen.getByText("تَقرير أداء رَمضان")).toBeVisible();
    fireEvent.change(screen.getByLabelText("بحث"), {
      target: { value: "شركة القمه" },
    });
    expect(
      screen.getByText("لا توجد مخرجات تطابق الفلاتر الحالية."),
    ).toBeVisible();
  });

  it("keeps description out of search and preserves priority and SLA filters with normalized Arabic", () => {
    // Production break: searching internal descriptions would leak
    // non-searchable content, while a diacritized name like "تَقرير أداء
    // رَمضان" must still match the plain query "تقرير" without weakening
    // the priority/SLA filters that run alongside the Arabic search.
    const diacritizedDeliverable: DeliverableSafeSummary = {
      ...waitingDeliverable,
      id: "deliverable_norm_filters",
      name: "تَقرير أداء رَمضان",
      type: "report",
    };
    render(
      <TeamWorkspace
        clientNames={{ client_a: "شَركة القِمّة" }}
        deliverables={[diacritizedDeliverable]}
        now="2026-07-16T10:00:00Z"
        workspaces={{}}
      />,
    );
    fireEvent.change(screen.getByLabelText("بحث"), {
      target: { value: "كابشن" },
    });
    expect(
      screen.getByText("لا توجد مخرجات تطابق الفلاتر الحالية."),
    ).toBeVisible();
    fireEvent.change(screen.getByLabelText("بحث"), {
      target: { value: "تقرير" },
    });
    expect(screen.getByText("تَقرير أداء رَمضان")).toBeVisible();
    fireEvent.change(screen.getByLabelText("الأولوية"), {
      target: { value: "urgent" },
    });
    expect(screen.queryByText("تَقرير أداء رَمضان")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("الأولوية"), {
      target: { value: "normal" },
    });
    expect(screen.getByText("تَقرير أداء رَمضان")).toBeVisible();
    fireEvent.change(screen.getByLabelText("SLA"), {
      target: { value: "overdue" },
    });
    expect(screen.queryByText("تَقرير أداء رَمضان")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("SLA"), {
      target: { value: "paused_waiting_client" },
    });
    expect(screen.getByText("تَقرير أداء رَمضان")).toBeVisible();
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

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";
import type { DeliverableWorkspace } from "@/modules/deliverables/deliverable-workspace";
import { UniversalDeliverableDrawer } from "@/ui/deliverables/universal-deliverable-drawer";
import { TeamWorkspace } from "@/ui/management/team-workspace";

const deliverable: DeliverableSafeSummary = {
  id: "deliverable_a",
  tenantId: "tenant_a",
  clientId: "client_a",
  name: "منشور إطلاق الحملة",
  type: "post",
  status: "internally_approved",
  priority: "normal",
  ownerUserId: "assigned_internal_a",
  ownerDisplay: {
    userId: "assigned_internal_a",
    displayName: "أحمد العتيبي",
    roleLabel: "كاتب المحتوى",
    initial: "أ",
  },
  contributorUserIds: [],
  internalDueDate: "2026-07-03",
  clientDueDate: "2026-07-05",
  finalDueDate: "2026-07-07",
  requiresInternalApproval: true,
  requiresClientApproval: true,
  progressPercentage: 70,
  approvedExtra: false,
  revision: 2,
  createdAt: "2026-06-28T00:00:00.000Z",
  updatedAt: "2026-06-29T00:00:00.000Z",
};

const { fetchDeliverableWorkspace, workspace } = vi.hoisted(() => {
  const workspace: DeliverableWorkspace = {
    deliverableId: "deliverable_a",
    currentVersionId: "version_1",
    versions: [
      {
        id: "version_1",
        versionNumber: 1,
        status: "internally_approved",
        submittedAt: "2026-07-02T00:00:00.000Z",
        brief: "موجز النسخة",
        body: "محتوى النسخة",
        caption: "كابشن النسخة",
        channel: "Instagram",
        format: "Post",
        kpi: "نمو التفاعل",
      },
    ],
    tasks: [
      {
        id: "task_1",
        title: "كتابة المحتوى",
        status: "in_progress",
        priority: "normal",
        sortOrder: 0,
      },
    ],
    files: [
      {
        id: "file_1",
        name: "asset.png",
        fileType: "image/png",
        fileSize: 1024,
        visibility: "internal_only",
        versionId: "version_1",
        versionNumber: 1,
        isFinal: false,
        createdAt: "2026-07-02T00:00:00.000Z",
      },
    ],
    uploadAttempts: [],
    comments: [],
    qualityChecks: [
      {
        id: "qc_1",
        versionId: "version_1",
        label: "مراجعة اللغة",
        status: "changes_required",
        checkedBy: {
          userId: "reviewer_1",
          displayName: "مدير المشروع",
          roleLabel: "مدير المشروع",
          initial: "م",
        },
        checkedAt: "2026-07-03T01:00:00.000Z",
        sortOrder: 0,
      },
    ],
    activity: [
      {
        id: "approval_1",
        kind: "approval",
        label: "قرار العميل: مقبول",
        createdAt: "2026-07-03T00:00:00.000Z",
      },
      {
        id: "sla_1",
        kind: "sla",
        label: "توقف الوقت بانتظار العميل",
        createdAt: "2026-07-02T00:00:00.000Z",
      },
    ],
    eligibleAssignees: [],
    taskCapabilities: {
      canCreateTask: false,
      canAssignOthers: false,
      canReassignTask: false,
      canUpdateOwnTaskStatus: false,
      canDeleteTask: false,
      canEditTaskFields: false,
    },
    counts: { versions: 1, tasks: 1, files: 1, comments: 0 },
  };
  return {
    fetchDeliverableWorkspace: vi
      .fn()
      .mockResolvedValue({ ok: true, workspace }),
    workspace,
  };
});

const rawEnumTokens = [
  "internally_approved",
  "social_content",
  "internal_only",
  "changes_required",
  "in_progress",
  "normal",
  "approved",
  "paused_waiting_client",
];

vi.mock("@/server/actions/deliverable-workspace-actions", () => ({
  fetchDeliverableWorkspace,
}));

vi.mock("@/ui/deliverables/workspace-forms", () => ({
  VersionContentForm: function VersionContentFormStub({
    onMutationStarted,
    onMutated,
  }: {
    onMutationStarted?: () => void;
    onMutated?: (versionId: string, feedback: string) => void;
  }) {
    const [feedback, setFeedback] = useState<string>();
    return (
      <div>
        <label>
          مسودة اختبار
          <input data-testid="stub-version-input" />
        </label>
        <button
          type="button"
          onClick={() =>
            onMutated?.(
              "version_2",
              "تم إرسال النسخة للمراجعة الداخلية.",
            )
          }
        >
          محاكاة حفظ النسخة
        </button>
        <button
          type="button"
          onClick={() => {
            onMutationStarted?.();
            setFeedback(
              "تعذر حفظ النسخة. راجع الصلاحية والحالة ثم حاول مجددًا.",
            );
          }}
        >
          محاكاة فشل حفظ النسخة
        </button>
        {feedback ? <p>{feedback}</p> : null}
      </div>
    );
  },
  WorkspaceCommentForm: () => <div data-testid="stub-comment-form" />,
  TaskForm: () => <div data-testid="stub-task-form" />,
  TaskStatusControl: () => <div data-testid="stub-task-status" />,
  QualityCheckForm: () => <div data-testid="stub-quality-form" />,
  QualityCheckStatusControl: () => <div data-testid="stub-quality-status" />,
}));

vi.mock("@/ui/deliverables/workspace-files", () => ({
  WorkspaceFileDownload: () => <div data-testid="stub-file-download" />,
  WorkspaceFilePreview: () => <div data-testid="stub-file-preview" />,
  WorkspaceFileUpload: () => <div data-testid="stub-file-upload" />,
  WorkspaceInlineMedia: ({ fileId, fit }: { fileId: string; fit?: string }) => (
    <div data-fit={fit} data-testid={`stub-inline-media-${fileId}`} />
  ),
  WorkspaceFileClientReviewControl: ({
    canStage,
    file,
    versionId,
  }: {
    canStage: boolean;
    file: { id: string };
    versionId: string;
  }) => (
    <div
      data-can-stage={String(canStage)}
      data-testid={`stub-client-review-file-${file.id}`}
      data-version-id={versionId}
    />
  ),
}));

vi.mock("@/ui/management/deliverable-actions", () => ({
  DeliverableApprovalWorkflowControl: ({
    clientReviewReady,
    uploadBlocked,
  }: {
    clientReviewReady?: boolean;
    uploadBlocked?: boolean;
  }) => (
    <div
      data-client-review-ready={String(clientReviewReady)}
      data-upload-blocked={String(uploadBlocked)}
      data-testid="stub-approval-control"
    />
  ),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("universal deliverable drawer localization", () => {
  it("refreshes the open drawer with the newly persisted version ID", async () => {
    const updatedWorkspace: DeliverableWorkspace = {
      ...workspace,
      currentVersionId: "version_2",
      versions: [
        {
          id: "version_2",
          versionNumber: 2,
          status: "internal_only",
          submittedAt: "2026-07-04T00:00:00.000Z",
          brief: "موجز النسخة الجديدة",
          body: "محتوى النسخة الجديدة",
          caption: "كابشن النسخة الجديدة",
        },
        ...workspace.versions,
      ],
      counts: { ...workspace.counts, versions: 2 },
    };
    fetchDeliverableWorkspace.mockResolvedValueOnce({
      ok: true,
      workspace: updatedWorkspace,
    });
    render(
      <UniversalDeliverableDrawer
        deliverable={deliverable}
        summary={{
          deliverableId: deliverable.id,
          currentVersionId: "version_1",
          counts: workspace.counts,
        }}
        workspace={workspace}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "فتح مساحة المخرج" }));
    fireEvent.click(screen.getByRole("tab", { name: /المحتوى والنسخ/ }));
    expect(screen.getByText("محتوى النسخة")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "محاكاة حفظ النسخة" }));

    await waitFor(() =>
      expect(fetchDeliverableWorkspace).toHaveBeenCalledExactlyOnceWith({
        clientId: deliverable.clientId,
        deliverableId: deliverable.id,
        currentVersionId: "version_2",
      }),
    );
    expect(await screen.findByText("محتوى النسخة الجديدة")).toBeVisible();
    expect(screen.getAllByText("النسخة 2").length).toBeGreaterThan(0);
    expect(screen.getByText(/مرسلة للمراجعة الداخلية/)).toBeVisible();
    expect(screen.queryByText("محتوى النسخة")).not.toBeInTheDocument();
    expect(
      screen.getByText("تم إرسال النسخة للمراجعة الداخلية."),
    ).toBeVisible();

    fireEvent.click(
      screen.getByRole("button", { name: "محاكاة فشل حفظ النسخة" }),
    );

    expect(
      screen.getByText(
        "تعذر حفظ النسخة. راجع الصلاحية والحالة ثم حاول مجددًا.",
      ),
    ).toBeVisible();
    expect(
      screen.queryByText("تم إرسال النسخة للمراجعة الداخلية."),
    ).not.toBeInTheDocument();
    expect(fetchDeliverableWorkspace).toHaveBeenCalledTimes(1);
  });

  it("clears version success when the drawer closes and reopens", async () => {
    render(
      <UniversalDeliverableDrawer
        deliverable={deliverable}
        workspace={workspace}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "فتح مساحة المخرج" }));
    fireEvent.click(screen.getByRole("tab", { name: /المحتوى والنسخ/ }));
    fireEvent.click(screen.getByRole("button", { name: "محاكاة حفظ النسخة" }));
    expect(
      screen.getByText("تم إرسال النسخة للمراجعة الداخلية."),
    ).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "إغلاق" }));
    fireEvent.click(screen.getByRole("button", { name: "فتح مساحة المخرج" }));

    expect(
      screen.queryByText("تم إرسال النسخة للمراجعة الداخلية."),
    ).not.toBeInTheDocument();
  });

  it("names the available content actions as the next step for new work", () => {
    render(
      <UniversalDeliverableDrawer
        clientName="شركة ألف"
        deliverable={{ ...deliverable, status: "not_started" }}
        workspace={{ ...workspace, deliverableId: deliverable.id }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "فتح مساحة المخرج" }));

    const header = screen.getByRole("dialog").querySelector("header")!;
    expect(
      within(header).getByText(
        "الخطوة التالية: ابدأ بالمحتوى، ثم احفظ مسودة أو أرسلها للمراجعة",
      ),
    ).toBeVisible();
  });

  it.each([undefined, "", "   "])(
    "shows a safe header fallback for unavailable client name: %s",
    (clientName) => {
      render(
        <UniversalDeliverableDrawer
          clientName={clientName}
          deliverable={deliverable}
          workspace={workspace}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: "فتح مساحة المخرج" }));
      const header = screen.getByRole("dialog").querySelector("header")!;
      expect(within(header).getByText("العميل غير متاح")).toBeVisible();
      expect(header).not.toHaveTextContent(deliverable.clientId);
    },
  );

  it("distinguishes identical work titles by client in a wrapping RTL header", () => {
    const names = ["شركة ألف للحلول التسويقية والمحتوى الإبداعي", "شركة باء"];
    const { rerender } = render(
      <UniversalDeliverableDrawer
        clientName={names[0]}
        deliverable={deliverable}
        workspace={workspace}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "فتح مساحة المخرج" }));
    let header = screen.getByRole("dialog").querySelector("header")!;
    const identity = within(header).getByText(names[0]);
    expect(identity).toBeVisible();
    expect(identity).toHaveClass("break-words");
    expect(identity.closest('[dir="rtl"]')).not.toBeNull();
    expect(within(header).getByRole("button", { name: "إغلاق" })).toHaveClass("shrink-0");
    rerender(
      <UniversalDeliverableDrawer
        clientName={names[1]}
        deliverable={{ ...deliverable, id: "deliverable_b", clientId: "client_b" }}
        workspace={{ ...workspace, deliverableId: "deliverable_b" }}
      />,
    );
    header = screen.getByRole("dialog").querySelector("header")!;
    expect(within(header).getByText(names[1])).toBeVisible();
    expect(within(header).queryByText(names[0])).not.toBeInTheDocument();
    expect(within(header).getByRole("heading", { name: deliverable.name })).toBeVisible();
  });

  it("opens My Tasks with the actual deliverable client name for identical work titles", async () => {
    render(
      <TeamWorkspace
        clientNames={{ client_a: "شركة ألف", client_b: "شركة باء" }}
        deliverables={[
          deliverable,
          { ...deliverable, id: "deliverable_b", clientId: "client_b" },
        ]}
        now="2026-07-03T00:00:00Z"
        workspaces={{}}
      />,
    );
    const rows = screen.getAllByRole("article");
    for (const [index, name] of ["شركة ألف", "شركة باء"].entries()) {
      fireEvent.click(within(rows[index]).getByRole("button", { name: "فتح مساحة المخرج" }));
      const dialog = screen.getByRole("dialog");
      const header = dialog.querySelector("header")!;
      expect(within(header).getByText(name)).toBeVisible();
      expect(within(header).getByRole("heading", { name: deliverable.name })).toBeVisible();
      await within(dialog).findByRole("heading", { name: "نظرة عامة" });
      fireEvent.click(within(header).getByRole("button", { name: "إغلاق" }));
    }
  });

  it.each(["{Enter}", " "])(
    "retains native activation and focus return with a stretched trigger: %s",
    async (key) => {
      const user = userEvent.setup();
      render(
        <UniversalDeliverableDrawer
          deliverable={deliverable}
          workspace={workspace}
          triggerClassName="after:absolute after:inset-0"
        />,
      );
      const trigger = screen.getByRole("button", { name: "فتح مساحة المخرج" });
      expect(trigger).toHaveClass("after:absolute", "after:inset-0");
      expect(trigger).toHaveAttribute("type", "button");
      expect(screen.getAllByRole("button")).toHaveLength(1);
      trigger.focus();
      await user.keyboard(key);
      const drawer = await screen.findByTestId("deliverable-drawer");
      expect(
        within(drawer).getByRole("button", { name: "إغلاق" }),
      ).toHaveFocus();
      await user.keyboard("{Escape}");
      await waitFor(() =>
        expect(
          screen.queryByTestId("deliverable-drawer"),
        ).not.toBeInTheDocument(),
      );
      expect(trigger).toHaveFocus();
      expect(trigger).toHaveAttribute("aria-expanded", "false");
    },
  );

  it("shows an honest load error and recovers when the user retries", async () => {
    fetchDeliverableWorkspace.mockResolvedValueOnce({
      ok: false,
      reason: "denied",
    });
    render(<UniversalDeliverableDrawer deliverable={deliverable} />);

    fireEvent.click(screen.getByRole("button", { name: "فتح مساحة المخرج" }));

    expect(
      await screen.findByText(
        "تعذر تحميل مساحة المخرج. تحقق من الاتصال ثم حاول مجددًا.",
      ),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "إعادة المحاولة" }));

    expect(
      await screen.findByRole("heading", { name: "نظرة عامة" }),
    ).toBeVisible();
    expect(fetchDeliverableWorkspace).toHaveBeenCalledTimes(2);
  });

  it("organizes the drawer into keyboard-accessible tabs and preserves form values", async () => {
    render(<UniversalDeliverableDrawer deliverable={deliverable} />);

    fireEvent.click(screen.getByRole("button", { name: "فتح مساحة المخرج" }));

    const drawer = await screen.findByTestId("deliverable-drawer");
    const tabs = within(drawer).getAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent?.replace(/\d+$/, ""))).toEqual([
      "نظرة عامة",
      "المحتوى والنسخ",
      "الملفات",
      "مهام التنفيذ",
      "التعليقات",
      "الجودة الداخلية",
      "النشاط",
    ]);

    expect(
      within(drawer).getByRole("heading", { name: "نظرة عامة" }),
    ).toBeVisible();
    expect(within(drawer).queryByText("الأولوية")).toBeNull();

    fireEvent.click(
      within(drawer).getByRole("tab", { name: /المحتوى والنسخ/ }),
    );
    const draftInput = within(drawer).getByTestId("stub-version-input");
    fireEvent.change(draftInput, {
      target: { value: "قيمة محفوظة أثناء التنقل" },
    });

    fireEvent.click(
      within(drawer).getByRole("tab", { name: /الجودة الداخلية/ }),
    );
    expect(
      within(drawer).getByRole("heading", { name: "مراجعة الجودة الداخلية" }),
    ).toBeVisible();
    expect(within(drawer).getByText(/لا يراها العميل/)).toBeVisible();

    fireEvent.keyDown(
      within(drawer).getByRole("tab", { name: /الجودة الداخلية/ }),
      {
        key: "ArrowLeft",
      },
    );
    await waitFor(() => {
      expect(within(drawer).getByRole("tab", { name: /النشاط/ })).toHaveFocus();
    });

    fireEvent.click(
      within(drawer).getByRole("tab", { name: /المحتوى والنسخ/ }),
    );
    expect(within(drawer).getByTestId("stub-version-input")).toHaveValue(
      "قيمة محفوظة أثناء التنقل",
    );
  });

  it("renders Arabic domain labels and never surfaces raw technical enums", async () => {
    render(<UniversalDeliverableDrawer deliverable={deliverable} />);

    fireEvent.click(screen.getByRole("button", { name: "فتح مساحة المخرج" }));

    await waitFor(() => {
      expect(screen.getByText("معتمد داخليًا")).toBeInTheDocument();
    });

    const drawer = document.querySelector("[data-testid='deliverable-drawer']");
    expect(drawer).not.toBeNull();
    const drawerText = drawer?.textContent ?? "";

    const expectedArabicLabels = [
      "مساحة المخرج",
      "معتمد داخليًا",
      "منشور",
      "إنستغرام",
      "قيد التنفيذ",
      "ملف داخلي",
      "يحتاج تعديلًا",
      "معتمدة داخليًا",
      "قرار العميل: مقبول",
      "توقف الوقت بانتظار العميل",
      "راجعها مدير المشروع",
    ];
    for (const label of expectedArabicLabels) {
      expect(
        drawerText,
        `expected Arabic label "${label}" in drawer`,
      ).toContain(label);
    }

    for (const token of rawEnumTokens) {
      expect(
        drawerText,
        `raw enum "${token}" leaked into drawer`,
      ).not.toContain(token);
    }
    expect(drawerText).not.toContain("Instagram");
    expect(drawerText).not.toContain("Post");
    expect(drawerText).not.toContain("2026-07-03");
    expect(drawerText).toContain("يوليو");
    expect(drawerText).toContain("مؤشر النجاح");
  });

  it("renders the exact current-version media and client-review readiness", async () => {
    render(
      <UniversalDeliverableDrawer
        approvalAction={vi.fn()}
        deliverable={deliverable}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "فتح مساحة المخرج" }));

    const media = await screen.findByTestId("stub-inline-media-file_1");
    expect(media).toHaveAttribute("data-fit", "contain");
    expect(
      screen.getByTestId("stub-client-review-file-file_1"),
    ).toHaveAttribute("data-version-id", "version_1");
    expect(
      screen.getByTestId("stub-client-review-file-file_1"),
    ).toHaveAttribute("data-can-stage", "true");
    expect(screen.getByTestId("stub-approval-control")).toHaveAttribute(
      "data-client-review-ready",
      "true",
    );
  });

  it("explains missing current-version media without replacing the saved content", async () => {
    render(
      <UniversalDeliverableDrawer
        deliverable={deliverable}
        workspace={{ ...workspace, files: [] }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "فتح مساحة المخرج" }));
    fireEvent.click(screen.getByRole("tab", { name: /المحتوى والنسخ/ }));

    expect(screen.getByText("لا توجد صورة أو فيديو في النسخة الحالية")).toBeVisible();
    expect(screen.getByText("محتوى النسخة")).toBeVisible();
    expect(screen.getByText("كابشن النسخة")).toBeVisible();
  });

  it("reports an image-only internal file as not ready until it is staged", async () => {
    const imageOnlyWorkspace: DeliverableWorkspace = {
      ...workspace,
      versions: [
        {
          ...workspace.versions[0],
          body: undefined,
          caption: undefined,
        },
      ],
      files: [{ ...workspace.files[0], visibility: "internal_only" }],
    };
    render(
      <UniversalDeliverableDrawer
        approvalAction={vi.fn()}
        deliverable={deliverable}
        workspace={imageOnlyWorkspace}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "فتح مساحة المخرج" }));

    await waitFor(() => {
      expect(screen.getByTestId("stub-approval-control")).toHaveAttribute(
        "data-client-review-ready",
        "false",
      );
    });
  });

  it("restores a failed durable upload attempt and blocks client send after reload", async () => {
    const restoredWorkspace: DeliverableWorkspace = {
      ...workspace,
      uploadAttempts: [
        {
          id: "attempt_failed",
          fileId: "replacement_file",
          name: "replacement.png",
          fileType: "image/png",
          fileSize: 2048,
          storagePath: "tenant/client/deliverable/version/replacement.png",
          visibility: "client_visible",
          status: "failed",
          progressPercentage: 40,
          versionId: "version_1",
          runId: "s015-restored-attempt",
          failureCode: "storage_transfer_failed",
          createdAt: "2026-07-29T00:00:00.000Z",
          updatedAt: "2026-07-29T00:01:00.000Z",
        },
      ],
    };
    render(
      <UniversalDeliverableDrawer
        approvalAction={vi.fn()}
        deliverable={deliverable}
        workspace={restoredWorkspace}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "فتح مساحة المخرج" }));

    await waitFor(() => {
      expect(screen.getByTestId("stub-approval-control")).toHaveAttribute(
        "data-upload-blocked",
        "true",
      );
    });
  });
});

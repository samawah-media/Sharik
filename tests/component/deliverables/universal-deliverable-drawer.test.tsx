import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";
import type { DeliverableWorkspace } from "@/modules/deliverables/deliverable-workspace";
import { UniversalDeliverableDrawer } from "@/ui/deliverables/universal-deliverable-drawer";

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

const { workspace } = vi.hoisted(() => {
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
        versionNumber: 1,
        isFinal: false,
        createdAt: "2026-07-02T00:00:00.000Z",
      },
    ],
    comments: [],
    qualityChecks: [
      {
        id: "qc_1",
        versionId: "version_1",
        label: "مراجعة اللغة",
        status: "changes_required",
        sortOrder: 0,
      },
    ],
    activity: [],
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
  return { workspace };
});

const rawEnumTokens = [
  "internally_approved",
  "social_content",
  "internal_only",
  "changes_required",
  "in_progress",
  "normal",
];

vi.mock("@/server/actions/deliverable-workspace-actions", () => ({
  fetchDeliverableWorkspace: vi.fn().mockResolvedValue({ ok: true, workspace }),
}));

vi.mock("@/ui/deliverables/workspace-forms", () => ({
  VersionContentForm: () => <div data-testid="stub-version-form" />,
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
}));

vi.mock("@/ui/management/deliverable-actions", () => ({
  DeliverableApprovalWorkflowControl: () => (
    <div data-testid="stub-approval-control" />
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
      "معتمد داخليًا",
      "منشور",
      "عادية",
      "قيد التنفيذ",
      "ملف داخلي",
      "تطلب تعديلًا",
      "معتمدة داخليًا",
    ];
    for (const label of expectedArabicLabels) {
      expect(drawerText, `expected Arabic label "${label}" in drawer`).toContain(label);
    }

    for (const token of rawEnumTokens) {
      expect(drawerText, `raw enum "${token}" leaked into drawer`).not.toContain(token);
    }
  });
});

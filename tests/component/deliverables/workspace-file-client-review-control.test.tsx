import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";
import type { DeliverableFileWorkspace } from "@/modules/deliverables/deliverable-workspace";
import { WorkspaceFileClientReviewControl } from "@/ui/deliverables/workspace-files";

const { stageFile } = vi.hoisted(() => ({
  stageFile: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("@/server/actions/deliverable-workspace-actions", () => ({
  createWorkspaceFileDownload: vi.fn(),
  createWorkspaceFilePreview: vi.fn(),
  registerWorkspaceFile: vi.fn(),
  stageWorkspaceFileForClientReview: stageFile,
}));

const deliverable: DeliverableSafeSummary = {
  id: "21000000-0000-4000-8000-000000009501",
  tenantId: "21000000-0000-4000-8000-000000000001",
  clientId: "21000000-0000-4000-8000-000000000301",
  name: "منشور مصوّر",
  type: "post",
  status: "internally_approved",
  priority: "normal",
  contributorUserIds: [],
  requiresInternalApproval: true,
  requiresClientApproval: true,
  progressPercentage: 70,
  approvedExtra: false,
  revision: 3,
  currentVersionId: "21000000-0000-4000-8000-000000009502",
  createdAt: "2026-07-26T00:00:00.000Z",
  updatedAt: "2026-07-26T00:00:00.000Z",
};

const file: DeliverableFileWorkspace = {
  id: "21000000-0000-4000-8000-000000009504",
  name: "current.png",
  fileType: "image/png",
  fileSize: 2048,
  visibility: "internal_only",
  versionId: "21000000-0000-4000-8000-000000009502",
  versionNumber: 1,
  isFinal: false,
  createdAt: "2026-07-26T00:00:00.000Z",
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("workspace file client-review control", () => {
  it("stages only the selected exact current-version file", async () => {
    const onMutated = vi.fn();
    render(
      <WorkspaceFileClientReviewControl
        canStage
        deliverable={deliverable}
        file={file}
        onMutated={onMutated}
        versionId={deliverable.currentVersionId!}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "تجهيز للعميل" }));

    await waitFor(() => {
      expect(stageFile).toHaveBeenCalledWith({
        clientId: deliverable.clientId,
        deliverableId: deliverable.id,
        versionId: deliverable.currentVersionId,
        fileId: file.id,
        idempotencyKey: `s015-stage-review-${deliverable.id}-${deliverable.currentVersionId}-${file.id}`,
      });
      expect(onMutated).toHaveBeenCalledTimes(1);
    });
  });

  it("does not offer staging for a stale-version file", () => {
    render(
      <WorkspaceFileClientReviewControl
        canStage
        deliverable={deliverable}
        file={{ ...file, versionId: crypto.randomUUID() }}
        onMutated={vi.fn()}
        versionId={deliverable.currentVersionId!}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "تجهيز للعميل" }),
    ).not.toBeInTheDocument();
  });
});

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";
import type { DeliverableUploadAttemptWorkspace } from "@/modules/deliverables/deliverable-workspace";
import { WorkspaceFileUpload } from "@/ui/deliverables/workspace-files";

type MockUppyFile = {
  id: string;
  name: string;
  type: string;
  size: number;
  meta: Record<string, string>;
};

const { cancelUpload, uppyInstances, routerRefresh } = vi.hoisted(() => ({
  cancelUpload: vi.fn(),
  uppyInstances: [] as Array<{
    files: Record<string, MockUppyFile>;
    handlers: Record<string, (...args: unknown[]) => void>;
    preProcessors: Array<(fileIds: string[]) => Promise<void>>;
  }>,
  routerRefresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: routerRefresh }),
}));

vi.mock("@/lib/supabase/browser", () => ({
  createSupabaseBrowserClient: () => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: "test-token" } },
      }),
    },
  }),
}));

vi.mock("@uppy/core", () => ({
  default: class MockUppy {
    files: Record<string, MockUppyFile> = {};
    handlers: Record<string, (...args: unknown[]) => void> = {};
    preProcessors: Array<(fileIds: string[]) => Promise<void>> = [];
    constructor() {
      uppyInstances.push(this);
    }
    use() {
      return this;
    }
    addPreProcessor(processor: (fileIds: string[]) => Promise<void>) {
      this.preProcessors.push(processor);
      return this;
    }
    getFile(fileId: string) {
      return this.files[fileId];
    }
    on(event: string, handler: (...args: unknown[]) => void) {
      this.handlers[event] = handler;
      return this;
    }
    destroy() {}
  },
}));

vi.mock("@uppy/tus", () => ({ default: class MockTus {} }));

vi.mock("@uppy/react/dashboard", () => ({
  default: () => <div data-testid="uppy-dashboard" />,
}));

vi.mock("@/server/actions/deliverable-workspace-actions", () => ({
  beginWorkspaceFileUpload: vi.fn().mockResolvedValue({ ok: true }),
  cancelWorkspaceFileUpload: cancelUpload,
  createWorkspaceFileDownload: vi.fn(),
  createWorkspaceFilePreview: vi.fn(),
  failWorkspaceFileUpload: vi.fn(),
  listWorkspaceFileUploadAttempts: vi.fn().mockResolvedValue({ ok: true, attempts: [] }),
  registerWorkspaceFile: vi.fn(),
  retryWorkspaceFileUpload: vi.fn().mockResolvedValue({ ok: true }),
  stageWorkspaceFileForClientReview: vi.fn(),
  updateWorkspaceFileUploadProgress: vi.fn(),
}));

const deliverable: DeliverableSafeSummary = {
  id: "21000000-0000-4000-8000-000000009501",
  tenantId: "21000000-0000-4000-8000-000000000001",
  clientId: "21000000-0000-4000-8000-000000000301",
  name: "منشور مصوّر",
  type: "post",
  status: "in_progress",
  priority: "normal",
  contributorUserIds: [],
  requiresInternalApproval: true,
  requiresClientApproval: true,
  progressPercentage: 30,
  approvedExtra: false,
  revision: 3,
  currentVersionId: "21000000-0000-4000-8000-000000009502",
  createdAt: "2026-07-26T00:00:00.000Z",
  updatedAt: "2026-07-26T00:00:00.000Z",
};

const pendingAttempt: DeliverableUploadAttemptWorkspace = {
  id: "21000000-0000-4000-8000-000000009599",
  fileId: "21000000-0000-4000-8000-000000009598",
  name: "stale-upload.png",
  fileType: "image/png",
  fileSize: 1024,
  storagePath: "tenant/client/deliverable/version/stale-upload.png",
  visibility: "internal_only",
  status: "pending",
  progressPercentage: 40,
  versionId: deliverable.currentVersionId!,
  runId: "s015-upload-run-test",
  createdAt: "2026-07-26T00:00:00.000Z",
  updatedAt: "2026-07-26T00:00:00.000Z",
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  uppyInstances.length = 0;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
});

describe("WorkspaceFileUpload cancellation feedback", () => {
  it("warns when explicit cancellation succeeds but Storage cleanup fails", async () => {
    cancelUpload.mockResolvedValue({ ok: true, cleanup: "failed" });

    render(
      <WorkspaceFileUpload
        canPublishClientFile
        currentVersionId={deliverable.currentVersionId!}
        deliverable={deliverable}
        uploadAttempts={[pendingAttempt]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "إلغاء المحاولة وتسجيل القرار" }));

    expect(
      await screen.findByText(/تنظيف الملف المؤقت يحتاج متابعة يدوية/),
    ).toBeInTheDocument();
  });

  it("warns when Uppy removal cancellation leaves cleanup failed", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "public-key";
    cancelUpload.mockResolvedValue({ ok: true, cleanup: "failed" });

    render(
      <WorkspaceFileUpload
        canPublishClientFile
        currentVersionId={deliverable.currentVersionId!}
        deliverable={deliverable}
      />,
    );

    await waitFor(() => expect(uppyInstances.length).toBe(1));
    const file = {
      id: "uppy-file-1",
      name: "removed.png",
      type: "image/png",
      size: 1024,
      meta: {
        attemptId: pendingAttempt.id,
        fileId: pendingAttempt.fileId,
        objectName: pendingAttempt.storagePath,
        runId: pendingAttempt.runId,
        idempotencyKey: "s015-upload-test-idempotency",
        retryOfId: "",
        replacesFileId: "",
      },
    };
    uppyInstances[0].files[file.id] = file;
    uppyInstances[0].handlers["file-added"]?.(file);
    await waitFor(() =>
      expect(screen.getByText("removed.png")).toBeInTheDocument(),
    );
    await uppyInstances[0].preProcessors[0]([file.id]);
    uppyInstances[0].handlers["upload"]?.();
    uppyInstances[0].handlers["file-removed"]?.(file);

    expect(
      await screen.findByText(/تنظيف الملف المؤقت يحتاج متابعة يدوية/),
    ).toBeInTheDocument();
  });
});

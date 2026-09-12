"use client";

import { FileText, X } from "lucide-react";
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { hasClientReviewPayload } from "@/modules/approvals/client-review-readiness";
import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";
import type {
  DeliverableTaskWorkspace,
  DeliverableWorkspace,
  DeliverableWorkspaceSummary,
} from "@/modules/deliverables/deliverable-workspace";
import { canUpdateTaskStatus } from "@/modules/deliverables/deliverable-workspace";
import {
  contentChannelLabel,
  contentFormatLabel,
  deliverableStatusLabel,
  fileVisibilityLabel,
  qualityCheckStatusLabel,
  taskStatusLabel,
  versionStatusLabel,
} from "@/modules/deliverables/domain-labels";
import {
  formatArabicDate,
  formatArabicDateTime,
} from "@/modules/localization/arabic-display";
import { fetchDeliverableWorkspace } from "@/server/actions/deliverable-workspace-actions";
import { groupTeamFiles, type GroupedFile } from "@/modules/files/file-groups";
import { Badge } from "@/ui/core/badge";
import { buttonStyles } from "@/ui/core/button";
import {
  VersionContentForm,
  WorkspaceCommentForm,
  TaskForm,
  TaskStatusControl,
  QualityCheckForm,
  QualityCheckStatusControl,
} from "./workspace-forms";
import {
  WorkspaceFileDownload,
  WorkspaceFileClientReviewControl,
  WorkspaceFilePreview,
  WorkspaceFileUpload,
  WorkspaceInlineMedia,
  type WorkspaceUploadSafetyState,
} from "./workspace-files";
import { DeliverableApprovalWorkflowControl } from "@/ui/management/deliverable-actions";

const nextAction: Record<string, string> = {
  not_started: "ابدأ بالمحتوى، ثم احفظ مسودة أو أرسلها للمراجعة",
  in_progress: "إكمال المحتوى ورفع نسخة",
  ready_for_internal_review: "مراجعة النسخة الحالية",
  internal_changes_requested: "تنفيذ التعديلات الداخلية",
  internally_approved: "إرسال النسخة المعتمدة للعميل",
  waiting_client_approval: "بانتظار قرار العميل",
  client_changes_requested: "تنفيذ تعديلات العميل",
  client_approved: "تجهيز التسليم النهائي",
  ready_for_delivery: "تسليم المخرج",
  delivered: "مكتمل",
};

const drawerTabs = [
  { id: "overview", label: "نظرة عامة" },
  { id: "content", label: "المحتوى والنسخ" },
  { id: "files", label: "الملفات" },
  { id: "execution", label: "مهام التنفيذ" },
  { id: "comments", label: "التعليقات" },
  { id: "quality", label: "الجودة الداخلية" },
  { id: "activity", label: "النشاط" },
] as const;

type DrawerTabId = (typeof drawerTabs)[number]["id"];

function EmptySection({ children }: { children: string }) {
  return (
    <p className="rounded-lg border border-dashed border-border bg-background px-3 py-4 text-sm text-muted">
      {children}
    </p>
  );
}

function SectionPanel({
  activeTab,
  children,
  id,
  labelledBy,
}: {
  activeTab: DrawerTabId;
  children: ReactNode;
  id: DrawerTabId;
  labelledBy: string;
}) {
  return (
    <section
      aria-labelledby={labelledBy}
      className="grid gap-3"
      hidden={activeTab !== id}
      id={`drawer-panel-${id}`}
      role="tabpanel"
    >
      {children}
    </section>
  );
}

function MemberSummary({
  label,
  member,
}: {
  label: string;
  member?: { displayName: string; roleLabel?: string };
}) {
  return (
    <div className="rounded-lg bg-background p-3">
      <dt className="font-semibold">{label}</dt>
      <dd className="mt-1 text-muted">
        {member?.displayName ?? "عضو فريق"}
        {member?.roleLabel ? (
          <span className="block text-xs text-muted">{member.roleLabel}</span>
        ) : null}
      </dd>
    </div>
  );
}

function TeamFilesGroups({
  approvalAction,
  deliverable,
  files,
  handleMutated,
  versionId,
}: {
  approvalAction: boolean;
  deliverable: DeliverableSafeSummary;
  files: import("@/modules/deliverables/deliverable-workspace").DeliverableFileWorkspace[];
  handleMutated: () => void;
  versionId?: string;
}) {
  const grouped: GroupedFile[] = files.map((file) => ({
    id: file.id,
    name: file.name,
    fileType: file.fileType,
    fileSize: file.fileSize,
    visibility: file.visibility as GroupedFile["visibility"],
    versionNumber: file.versionNumber,
    isFinal: file.isFinal,
    createdAt: file.createdAt,
  }));
  const groups = groupTeamFiles(grouped);
  return (
    <div className="grid gap-4">
      {groups.map((group) => (
        <div className="grid gap-2" key={group.key}>
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-xs font-semibold text-foreground">
              {group.title}
            </p>
            <span className="text-xs text-muted">{group.files.length} ملف</span>
          </div>
          <ul className="grid gap-2">
            {group.files.map((file) => {
              const source = files.find((entry) => entry.id === file.id);
              return (
                <li
                  className="grid min-h-11 gap-3 rounded-lg bg-background px-3 py-2"
                  key={file.id}
                >
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
                    <span
                      className="min-w-0 break-all text-sm font-semibold"
                      dir="auto"
                    >
                      {file.name}
                    </span>
                    <span className="shrink-0 text-xs text-muted">
                      {source &&
                      source.visibility === "client_visible" &&
                      deliverable.status === "internally_approved"
                        ? "جاهز للإرسال للعميل"
                        : fileVisibilityLabel(file.visibility)}
                    </span>
                    <WorkspaceFileDownload fileId={file.id} />
                  </div>
                  {source && versionId ? (
                    <WorkspaceFileClientReviewControl
                      canStage={approvalAction}
                      deliverable={deliverable}
                      file={source}
                      onMutated={handleMutated}
                      versionId={versionId}
                    />
                  ) : null}
                  <WorkspaceFilePreview
                    fileId={file.id}
                    fileType={file.fileType}
                    label={file.name}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

function TaskWorkspaceCard({
  deliverable,
  task,
  workspace,
  onMutated,
}: {
  deliverable: DeliverableSafeSummary;
  task: DeliverableTaskWorkspace;
  workspace: DeliverableWorkspace;
  onMutated: () => void;
}) {
  const canEditTask =
    workspace.taskCapabilities.canEditTaskFields ||
    workspace.taskCapabilities.canReassignTask;
  const canUpdateStatus = canUpdateTaskStatus(workspace, task);

  return (
    <li className="grid min-w-0 gap-1 rounded-lg border border-border bg-background px-3 py-2">
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
        <div className="min-w-0 [overflow-wrap:anywhere] [unicode-bidi:plaintext]">
          <p className="font-semibold">{task.title}</p>
          <p className="mt-1 text-xs text-muted">
            {task.assignee?.displayName ?? "غير مسند"}
            {task.dueDate ? ` · ${formatArabicDate(task.dueDate)}` : ""}
          </p>
        </div>
        {canUpdateStatus ? (
          <TaskStatusControl
            deliverable={deliverable}
            onMutated={onMutated}
            task={task}
          />
        ) : (
          <Badge tone="muted">{taskStatusLabel(task.status)}</Badge>
        )}
      </div>
      {canEditTask ? (
        <details className="min-w-0">
          <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold">
            {workspace.taskCapabilities.canReassignTask
              ? "تعديل المهمة أو إعادة إسنادها"
              : "تعديل المهمة"}
          </summary>
          <div className="border-t border-border pt-3">
            <TaskForm
              deliverable={deliverable}
              editingTask={task}
              eligibleAssignees={workspace.eligibleAssignees}
              onMutated={onMutated}
              taskCapabilities={workspace.taskCapabilities}
            />
          </div>
        </details>
      ) : null}
    </li>
  );
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function UniversalDeliverableDrawer({
  deliverable,
  summary,
  workspace: preloadedWorkspace,
  canPublishClientComment = false,
  approvalAction,
  buttonLabel = "فتح مساحة المخرج",
  triggerClassName,
  clientName,
}: {
  deliverable: DeliverableSafeSummary;
  summary?: DeliverableWorkspaceSummary;
  workspace?: DeliverableWorkspace;
  canPublishClientComment?: boolean;
  approvalAction?: (formData: FormData) => void | Promise<void>;
  buttonLabel?: string;
  triggerClassName?: string;
  clientName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [workspace, setWorkspace] = useState<DeliverableWorkspace | undefined>(
    preloadedWorkspace,
  );
  const [loading, setLoading] = useState(false);
  const [workspaceError, setWorkspaceError] = useState<string>();
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<DrawerTabId>("overview");
  const [uploadSafety, setUploadSafety] =
    useState<WorkspaceUploadSafetyState>("settled");
  const [closeFeedback, setCloseFeedback] = useState<string>();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  const handleMutated = useCallback(() => {
    setWorkspaceError(undefined);
    setLoading(true);
    setRefreshKey((key) => key + 1);
  }, []);
  const retryWorkspaceLoad = useCallback(() => {
    setWorkspaceError(undefined);
    setLoading(true);
    setRefreshKey((key) => key + 1);
  }, []);
  const handleUploadAttemptCancelled = useCallback((attemptId: string) => {
    setWorkspace((currentWorkspace) =>
      currentWorkspace
        ? {
            ...currentWorkspace,
            uploadAttempts: currentWorkspace.uploadAttempts.filter(
              (attempt) => attempt.id !== attemptId,
            ),
          }
        : currentWorkspace,
    );
  }, []);

  const handleOpen = () => {
    if (!workspace) {
      setWorkspaceError(undefined);
      setLoading(true);
    }
    setActiveTab("overview");
    setOpen(true);
  };

  const onTabKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    const currentIndex = drawerTabs.findIndex((tab) => tab.id === activeTab);
    const lastIndex = drawerTabs.length - 1;
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight") nextIndex = Math.max(0, currentIndex - 1);
    if (event.key === "ArrowLeft")
      nextIndex = Math.min(lastIndex, currentIndex + 1);
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = lastIndex;
    if (nextIndex !== currentIndex) {
      event.preventDefault();
      const nextTab = drawerTabs[nextIndex];
      setActiveTab(nextTab.id);
      requestAnimationFrame(() => {
        document.getElementById(`drawer-tab-${nextTab.id}`)?.focus();
      });
    }
  };

  const requestClose = useCallback(() => {
    if (uploadSafety === "uploading" || uploadSafety === "failed") {
      setCloseFeedback(
        uploadSafety === "uploading"
          ? "الرفع ما زال جاريًا. انتظر اكتماله أو ألغِه بوضوح قبل الإغلاق."
          : "يوجد ملف فشل رفعه. أعد المحاولة أو ألغِ الملف قبل الإغلاق.",
      );
      return;
    }
    setCloseFeedback(undefined);
    setOpen(false);
  }, [uploadSafety]);

  useEffect(() => {
    if (!open) return;
    if (preloadedWorkspace && refreshKey === 0) return;
    let cancelled = false;
    fetchDeliverableWorkspace({
      clientId: deliverable.clientId,
      deliverableId: deliverable.id,
      currentVersionId: summary?.currentVersionId ?? null,
    })
      .then((result) => {
        if (cancelled) return;
        if (result.ok) {
          setWorkspace(result.workspace);
          setWorkspaceError(undefined);
        } else {
          setWorkspaceError(
            "تعذر تحميل مساحة المخرج. تحقق من الاتصال ثم حاول مجددًا.",
          );
        }
      })
      .catch(() => {
        if (!cancelled)
          setWorkspaceError(
            "تعذر تحميل مساحة المخرج. تحقق من الاتصال ثم حاول مجددًا.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    open,
    refreshKey,
    deliverable.clientId,
    deliverable.id,
    summary?.currentVersionId,
    preloadedWorkspace,
  ]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const trigger = triggerRef.current;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        requestClose();
        return;
      }
      if (event.key === "Tab" && panelRef.current) {
        const focusable = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
        ).filter(
          (el) => el.offsetParent !== null || el === document.activeElement,
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      trigger?.focus();
    };
  }, [open, requestClose]);

  const currentVersion =
    workspace?.versions.find(
      (version) => version.id === workspace.currentVersionId,
    ) ?? workspace?.versions[0];
  const currentVersionFiles =
    currentVersion && workspace
      ? workspace.files.filter((file) => file.versionId === currentVersion.id)
      : [];
  const currentVersionMedia = currentVersionFiles.find(
    (file) =>
      file.fileSize > 0 &&
      (file.fileType.startsWith("image/") ||
        file.fileType.startsWith("video/")),
  );
  const persistedUploadBlocked = Boolean(
    currentVersion &&
    workspace?.uploadAttempts.some(
      (attempt) =>
        attempt.versionId === currentVersion.id &&
        (attempt.status === "pending" || attempt.status === "failed"),
    ),
  );
  const clientReviewReady = hasClientReviewPayload({
    caption: currentVersion?.caption,
    body: currentVersion?.body,
    files: currentVersionFiles,
  });
  const dueDate =
    deliverable.internalDueDate ??
    deliverable.clientDueDate ??
    deliverable.finalDueDate;
  const nextActionLabel = nextAction[deliverable.status] ?? "راجع حالة المخرج";
  const tabCounts: Partial<Record<DrawerTabId, number>> = {
    content: workspace?.versions.length,
    files: workspace?.files.length,
    execution: workspace?.tasks.length,
    comments: workspace?.comments.length,
    quality: workspace?.qualityChecks.length,
    activity: workspace?.activity.length,
  };

  return (
    <>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`${buttonStyles({ variant: "secondary", size: "sm" })} ${triggerClassName ?? ""}`}
        onClick={handleOpen}
        ref={triggerRef}
        type="button"
      >
        {buttonLabel}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50" dir="rtl">
          <button
            aria-label="إغلاق مساحة المخرج"
            className="absolute inset-0 bg-foreground/30 motion-reduce:transition-none"
            onClick={requestClose}
            type="button"
          />
          <aside
            aria-label={`مساحة المخرج ${deliverable.name}`}
            aria-describedby="drawer-overview"
            aria-modal="true"
            className="absolute inset-y-0 end-0 grid w-full max-w-2xl grid-rows-[auto_1fr] overflow-hidden border-s border-border bg-surface shadow-xl sm:w-[min(92vw,48rem)]"
            data-testid="deliverable-drawer"
            ref={panelRef}
            role="dialog"
          >
            <header className="flex items-start justify-between gap-3 border-b border-border p-3 sm:p-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-accent">
                  مساحة المخرج
                </p>
                <h2 className="mt-1 break-words text-lg font-semibold">
                  {deliverable.name}
                </h2>
                <p className="mt-1 break-words text-sm text-muted">
                  {clientName?.trim() || "العميل غير متاح"}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge tone="muted">
                    {deliverableStatusLabel(deliverable.status)}
                  </Badge>
                  <span className="text-xs text-muted">
                    الخطوة التالية: {nextActionLabel}
                  </span>
                </div>
              </div>
              <button
                aria-label="إغلاق"
                className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-lg border border-border bg-background text-foreground hover:bg-border/30"
                onClick={requestClose}
                ref={closeRef}
                type="button"
              >
                <X aria-hidden="true" size={20} />
              </button>
            </header>
            {closeFeedback ? (
              <p
                aria-live="assertive"
                className="border-b border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger"
              >
                {closeFeedback}
              </p>
            ) : null}

            <div className="overflow-y-auto overscroll-contain p-4 sm:p-5">
              {loading ? (
                <div className="grid gap-3" aria-live="polite" aria-busy="true">
                  <p className="text-sm text-muted">
                    جارٍ تحميل تفاصيل المخرج…
                  </p>
                  <div className="h-32 animate-pulse rounded-lg bg-border/30" />
                  <div className="h-32 animate-pulse rounded-lg bg-border/30" />
                </div>
              ) : workspaceError && !workspace ? (
                <div
                  className="grid gap-3 rounded-xl border border-danger/30 bg-danger/10 p-4"
                  role="alert"
                >
                  <p className="text-sm font-semibold text-danger">
                    {workspaceError}
                  </p>
                  <button
                    className={buttonStyles({ variant: "primary" })}
                    onClick={retryWorkspaceLoad}
                    type="button"
                  >
                    إعادة المحاولة
                  </button>
                </div>
              ) : (
                <div className="grid gap-6 pb-8">
                  {workspaceError ? (
                    <div
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger/10 p-3"
                      role="alert"
                    >
                      <p className="text-sm font-semibold text-danger">
                        تعذر تحديث التفاصيل. البيانات المعروضة هي آخر نسخة
                        محملة.
                      </p>
                      <button
                        className={buttonStyles({ variant: "secondary" })}
                        onClick={retryWorkspaceLoad}
                        type="button"
                      >
                        إعادة المحاولة
                      </button>
                    </div>
                  ) : null}
                  <div
                    aria-label="أقسام مساحة المخرج"
                    className="sticky top-0 z-20 -mx-4 grid grid-cols-3 gap-2 border-y border-border bg-surface/95 px-4 py-2 shadow-xs backdrop-blur sm:-mx-5 sm:grid-cols-4 sm:px-5"
                    role="tablist"
                  >
                    {drawerTabs.map((tab) => {
                      const active = activeTab === tab.id;
                      const count = tabCounts[tab.id];
                      return (
                        <button
                          aria-controls={`drawer-panel-${tab.id}`}
                          aria-selected={active}
                          className={`min-h-11 min-w-0 w-full whitespace-normal rounded-lg px-2 py-1 text-xs font-semibold leading-5 transition-colors sm:px-3 sm:text-sm ${
                            active
                              ? "bg-accent text-white"
                              : "bg-background text-muted hover:bg-accent-soft hover:text-foreground"
                          }`}
                          id={`drawer-tab-${tab.id}`}
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          onKeyDown={onTabKeyDown}
                          role="tab"
                          tabIndex={active ? 0 : -1}
                          type="button"
                        >
                          {tab.label}
                          {typeof count === "number" && count > 0 ? (
                            <span className="ms-1 text-xs opacity-80">
                              {count}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                  <SectionPanel
                    activeTab={activeTab}
                    id="overview"
                    labelledBy="drawer-overview"
                  >
                    <h3
                      className="text-base font-semibold"
                      id="drawer-overview"
                    >
                      نظرة عامة
                    </h3>
                    <dl className="grid gap-2 text-sm sm:grid-cols-2">
                      <div className="rounded-lg bg-background p-3">
                        <dt className="font-semibold">الحالة</dt>
                        <dd className="mt-1 text-muted">
                          {deliverableStatusLabel(deliverable.status)}
                        </dd>
                      </div>
                      <div className="rounded-lg bg-background p-3">
                        <dt className="font-semibold">التقدم</dt>
                        <dd className="mt-1 text-muted">
                          {deliverable.progressPercentage}%
                        </dd>
                      </div>
                      <div className="rounded-lg bg-background p-3">
                        <dt className="font-semibold">الخطوة التالية</dt>
                        <dd className="mt-1 text-muted">{nextActionLabel}</dd>
                      </div>
                      <div className="rounded-lg bg-background p-3">
                        <dt className="font-semibold">الموعد</dt>
                        <dd className="mt-1 text-muted">
                          {formatArabicDate(dueDate)}
                        </dd>
                      </div>
                      <MemberSummary
                        label="المسؤول الرئيسي"
                        member={deliverable.ownerDisplay}
                      />
                    </dl>
                  </SectionPanel>

                  <SectionPanel
                    activeTab={activeTab}
                    id="content"
                    labelledBy="drawer-content"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3
                        className="text-base font-semibold"
                        id="drawer-content"
                      >
                        المحتوى والنسخة
                      </h3>
                      {currentVersion ? (
                        <Badge tone="neutral">
                          النسخة {currentVersion.versionNumber}
                        </Badge>
                      ) : null}
                    </div>
                    {currentVersion ? (
                      <div className="grid gap-4 rounded-xl border border-border bg-background p-4">
                        {currentVersionMedia ? (
                          <div className="overflow-hidden rounded-lg border border-border bg-surface">
                            <WorkspaceInlineMedia
                              fileId={currentVersionMedia.id}
                              fileType={currentVersionMedia.fileType}
                              fit="contain"
                              label={currentVersionMedia.name}
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-surface px-3 py-3 text-muted">
                            <FileText aria-hidden="true" className="shrink-0" size={20} />
                            <p className="text-sm">
                              لا توجد صورة أو فيديو في النسخة الحالية
                            </p>
                          </div>
                        )}
                        {currentVersion.brief ? (
                          <div>
                            <p className="text-xs font-semibold text-muted">
                              الموجز
                            </p>
                            <p className="mt-1 whitespace-pre-wrap text-sm leading-7">
                              {currentVersion.brief}
                            </p>
                          </div>
                        ) : null}
                        {currentVersion.body ? (
                          <div>
                            <p className="text-xs font-semibold text-muted">
                              المحتوى
                            </p>
                            <p className="mt-1 whitespace-pre-wrap text-sm leading-7">
                              {currentVersion.body}
                            </p>
                          </div>
                        ) : null}
                        {currentVersion.caption ? (
                          <div>
                            <p className="text-xs font-semibold text-muted">
                              الكابشن
                            </p>
                            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-7">
                              {currentVersion.caption}
                            </p>
                          </div>
                        ) : null}
                        <dl className="grid gap-2 text-xs sm:grid-cols-2">
                          {[
                            [
                              "القناة",
                              currentVersion.channel
                                ? contentChannelLabel(currentVersion.channel)
                                : undefined,
                            ],
                            [
                              "الصيغة",
                              currentVersion.format
                                ? contentFormatLabel(currentVersion.format)
                                : undefined,
                            ],
                            ["الهدف", currentVersion.objective],
                            ["مؤشر النجاح", currentVersion.kpi],
                          ]
                            .filter(([, value]) => value)
                            .map(([label, value]) => (
                              <div
                                className="rounded-md bg-surface p-2"
                                key={label}
                              >
                                <dt className="font-semibold">{label}</dt>
                                <dd className="mt-1 break-words text-muted">
                                  {value}
                                </dd>
                              </div>
                            ))}
                        </dl>
                      </div>
                    ) : (
                      <EmptySection>
                        لم تُحفظ نسخة بعد. استخدم نموذج المحتوى لإنشاء النسخة
                        الأولى.
                      </EmptySection>
                    )}
                    {workspace && workspace.versions.length > 0 ? (
                      <ol className="grid gap-2" aria-label="سجل النسخ">
                        {workspace.versions.map((version) => (
                          <li
                            className="flex min-h-11 items-center justify-between rounded-lg bg-background px-3 py-2 text-sm"
                            key={version.id}
                          >
                            <span>النسخة {version.versionNumber}</span>
                            <span className="text-muted">
                              {versionStatusLabel(version.status)} ·{" "}
                              {formatArabicDateTime(version.submittedAt)}
                            </span>
                          </li>
                        ))}
                      </ol>
                    ) : null}
                    <VersionContentForm
                      currentVersion={currentVersion}
                      deliverable={deliverable}
                    />
                    <DeliverableApprovalWorkflowControl
                      action={approvalAction}
                      clientReviewReady={clientReviewReady}
                      clientName={clientName}
                      currentVersion={currentVersion}
                      deliverable={deliverable}
                      files={currentVersionFiles}
                      uploadBlocked={
                        persistedUploadBlocked || uploadSafety !== "settled"
                      }
                    />
                  </SectionPanel>

                  <SectionPanel
                    activeTab={activeTab}
                    id="execution"
                    labelledBy="drawer-execution"
                  >
                    <h3
                      className="text-base font-semibold"
                      id="drawer-execution"
                    >
                      مهام التنفيذ
                    </h3>
                    {deliverable.contributorDisplays?.length ? (
                      <div className="grid gap-2 rounded-lg border border-border bg-background p-3">
                        <p className="text-sm font-semibold">
                          أعضاء الفريق المشاركون
                        </p>
                        <ul className="flex flex-wrap gap-2">
                          {deliverable.contributorDisplays.map((member) => (
                            <li
                              className="rounded-lg bg-surface px-3 py-2 text-xs"
                              key={member.userId}
                            >
                              <span className="font-semibold">
                                {member.displayName}
                              </span>
                              {member.roleLabel ? (
                                <span className="block text-muted">
                                  {member.roleLabel}
                                </span>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {workspace?.tasks.length ? (
                      <ul className="grid gap-2">
                        {workspace.tasks.map((task) => (
                          <TaskWorkspaceCard
                            deliverable={deliverable}
                            key={task.id}
                            onMutated={handleMutated}
                            task={task}
                            workspace={workspace}
                          />
                        ))}
                      </ul>
                    ) : (
                      <EmptySection>
                        لا توجد مهام تنفيذ مضافة لهذا المخرج.
                      </EmptySection>
                    )}
                    <TaskForm
                      deliverable={deliverable}
                      eligibleAssignees={workspace?.eligibleAssignees}
                      taskCapabilities={workspace?.taskCapabilities}
                      onMutated={handleMutated}
                    />
                  </SectionPanel>

                  <SectionPanel
                    activeTab={activeTab}
                    id="files"
                    labelledBy="drawer-files"
                  >
                    <h3 className="text-base font-semibold" id="drawer-files">
                      الملفات
                    </h3>
                    {workspace?.files.length ? (
                      <TeamFilesGroups
                        approvalAction={Boolean(approvalAction)}
                        deliverable={deliverable}
                        files={workspace.files}
                        handleMutated={handleMutated}
                        versionId={workspace.currentVersionId}
                      />
                    ) : (
                      <EmptySection>لا توجد ملفات مرتبطة بعد.</EmptySection>
                    )}
                    <WorkspaceFileUpload
                      canPublishClientFile={canPublishClientComment}
                      currentVersionId={workspace?.currentVersionId}
                      deliverable={deliverable}
                      files={workspace?.files}
                      onMutated={handleMutated}
                      onSafetyStateChange={setUploadSafety}
                      onUploadAttemptCancelled={handleUploadAttemptCancelled}
                      uploadAttempts={workspace?.uploadAttempts}
                    />
                  </SectionPanel>

                  <SectionPanel
                    activeTab={activeTab}
                    id="comments"
                    labelledBy="drawer-comments"
                  >
                    <h3
                      className="text-base font-semibold"
                      id="drawer-comments"
                    >
                      التعليقات
                    </h3>
                    {workspace?.comments.length ? (
                      <ol className="grid gap-2">
                        {workspace.comments.map((comment) => (
                          <li
                            className="rounded-lg border border-border bg-background p-3"
                            data-comment-visibility={comment.visibility}
                            key={comment.id}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                              <span className="font-semibold">
                                {comment.author?.displayName ??
                                  "عضو فريق سماوة"}
                              </span>
                              <Badge
                                tone={
                                  comment.visibility === "internal_only"
                                    ? "warning"
                                    : "accent"
                                }
                              >
                                {comment.visibility === "internal_only"
                                  ? "داخلي"
                                  : "ظاهر للعميل"}
                              </Badge>
                            </div>
                            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7">
                              {comment.body}
                            </p>
                            <time className="mt-1 block text-xs text-muted">
                              {formatArabicDateTime(comment.createdAt)}
                            </time>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <EmptySection>لا توجد تعليقات بعد.</EmptySection>
                    )}
                    <WorkspaceCommentForm
                      canPublishClientComment={canPublishClientComment}
                      currentVersionId={workspace?.currentVersionId}
                      target={deliverable}
                    />
                  </SectionPanel>

                  <SectionPanel
                    activeTab={activeTab}
                    id="quality"
                    labelledBy="drawer-quality"
                  >
                    <h3 className="text-base font-semibold" id="drawer-quality">
                      مراجعة الجودة الداخلية
                    </h3>
                    <p className="text-sm leading-6 text-muted">
                      قائمة داخلية تساعد فريق سماوة على التأكد من جاهزية العمل
                      قبل إرساله للعميل. لا يراها العميل.
                    </p>
                    {workspace?.qualityChecks.length ? (
                      <ul className="grid gap-2">
                        {workspace.qualityChecks.map((check) => (
                          <li
                            className="grid gap-2 rounded-lg bg-background px-3 py-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                            key={check.id}
                          >
                            <div className="min-w-0">
                              <span className="text-sm font-semibold">
                                {check.label}
                              </span>
                              {check.note ? (
                                <p className="mt-1 break-words text-xs text-muted">
                                  {check.note}
                                </p>
                              ) : null}
                              {check.checkedBy && check.checkedAt ? (
                                <p className="mt-1 text-xs text-muted">
                                  راجعها {check.checkedBy.displayName} ·{" "}
                                  {formatArabicDateTime(check.checkedAt)}
                                </p>
                              ) : null}
                            </div>
                            {canPublishClientComment &&
                            workspace.currentVersionId ? (
                              <QualityCheckStatusControl
                                deliverable={deliverable}
                                versionId={check.versionId}
                                check={check}
                                onMutated={handleMutated}
                              />
                            ) : (
                              <Badge
                                tone={
                                  check.status === "passed"
                                    ? "success"
                                    : "muted"
                                }
                              >
                                {qualityCheckStatusLabel(check.status)}
                              </Badge>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <EmptySection>
                        لم تُضف عناصر جودة للنسخة الحالية.
                      </EmptySection>
                    )}
                    {canPublishClientComment ? (
                      <QualityCheckForm
                        defaultChecklist={!workspace?.qualityChecks.length}
                        deliverable={deliverable}
                        versionId={workspace?.currentVersionId}
                        onMutated={handleMutated}
                      />
                    ) : null}
                  </SectionPanel>

                  <SectionPanel
                    activeTab={activeTab}
                    id="activity"
                    labelledBy="drawer-activity"
                  >
                    <h3
                      className="text-base font-semibold"
                      id="drawer-activity"
                    >
                      النشاط
                    </h3>
                    {workspace?.activity.length ? (
                      <ol className="grid gap-2">
                        {workspace.activity.slice(0, 30).map((item) => (
                          <li
                            className="rounded-lg bg-background px-3 py-2 text-sm"
                            key={item.id}
                          >
                            <p>{item.label}</p>
                            <p className="mt-1 text-xs text-muted">
                              {item.actor?.displayName
                                ? `${item.actor.displayName} · `
                                : ""}
                              {formatArabicDateTime(item.createdAt)}
                            </p>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <EmptySection>
                        لا يوجد نشاط ظاهر لهذا الدور بعد.
                      </EmptySection>
                    )}
                  </SectionPanel>
                </div>
              )}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}

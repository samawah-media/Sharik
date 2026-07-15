"use client";

import { FileText, Image as ImageIcon, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";
import type {
  DeliverableWorkspace,
  DeliverableWorkspaceSummary,
} from "@/modules/deliverables/deliverable-workspace";
import { fetchDeliverableWorkspace } from "@/server/actions/deliverable-workspace-actions";
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
  WorkspaceFilePreview,
  WorkspaceFileUpload,
} from "./workspace-files";
import { DeliverableApprovalWorkflowControl } from "@/ui/management/deliverable-actions";

const dateFormatter = new Intl.DateTimeFormat("ar-SA", {
  dateStyle: "medium",
  timeStyle: "short",
});

const formatDate = (value?: string) =>
  value ? dateFormatter.format(new Date(value)) : "غير محدد";

const nextAction: Record<string, string> = {
  not_started: "بدء التنفيذ",
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

function EmptySection({ children }: { children: string }) {
  return (
    <p className="rounded-lg border border-dashed border-border bg-background px-3 py-4 text-sm text-muted">
      {children}
    </p>
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
}: {
  deliverable: DeliverableSafeSummary;
  summary?: DeliverableWorkspaceSummary;
  workspace?: DeliverableWorkspace;
  canPublishClientComment?: boolean;
  approvalAction?: (formData: FormData) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [workspace, setWorkspace] = useState<DeliverableWorkspace | undefined>(
    preloadedWorkspace,
  );
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  const handleMutated = useCallback(() => {
    setLoading(true);
    setRefreshKey((key) => key + 1);
  }, []);

  const handleOpen = () => {
    if (!workspace) setLoading(true);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    if (preloadedWorkspace && refreshKey === 0) return;
    let cancelled = false;
    fetchDeliverableWorkspace({
      clientId: deliverable.clientId,
      deliverableId: deliverable.id,
      currentVersionId: summary?.currentVersionId ?? null,
    }).then((result) => {
      if (!cancelled) {
        if (result.ok) setWorkspace(result.workspace);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open, refreshKey, deliverable.clientId, deliverable.id, summary?.currentVersionId, preloadedWorkspace]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const trigger = triggerRef.current;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key === "Tab" && panelRef.current) {
        const focusable = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
        ).filter((el) => el.offsetParent !== null || el === document.activeElement);
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
  }, [open]);

  const currentVersion =
    workspace?.versions.find(
      (version) => version.id === workspace.currentVersionId,
    ) ?? workspace?.versions[0];

  return (
    <>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        className={buttonStyles({ variant: "secondary", size: "sm" })}
        onClick={handleOpen}
        ref={triggerRef}
        type="button"
      >
        فتح مساحة المخرج
      </button>
      {open ? (
        <div className="fixed inset-0 z-50" dir="rtl">
          <button
            aria-label="إغلاق مساحة المخرج"
            className="absolute inset-0 bg-foreground/30 motion-reduce:transition-none"
            onClick={() => setOpen(false)}
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
            <header className="flex items-start justify-between gap-3 border-b border-border p-4 sm:p-5">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-accent">مساحة تنفيذ مشتركة</p>
                <h2 className="mt-1 break-words text-xl font-semibold">
                  {deliverable.name}
                </h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone="accent">{deliverable.progressPercentage}%</Badge>
                  <Badge tone="muted">{deliverable.status}</Badge>
                  <Badge tone="neutral">{deliverable.type}</Badge>
                </div>
              </div>
              <button
                aria-label="إغلاق"
                className="grid min-h-11 min-w-11 place-items-center rounded-lg border border-border bg-background text-foreground hover:bg-border/30"
                onClick={() => setOpen(false)}
                ref={closeRef}
                type="button"
              >
                <X aria-hidden="true" size={20} />
              </button>
            </header>

            <div className="overflow-y-auto overscroll-contain p-4 sm:p-5">
              {loading ? (
                <div className="grid gap-3" aria-live="polite" aria-busy="true">
                  <p className="text-sm text-muted">جارٍ تحميل تفاصيل المخرج…</p>
                  <div className="h-32 animate-pulse rounded-lg bg-border/30" />
                  <div className="h-32 animate-pulse rounded-lg bg-border/30" />
                </div>
              ) : (
                <div className="grid gap-6 pb-8">
                  <section aria-labelledby="drawer-overview" className="grid gap-3">
                    <h3 className="text-base font-semibold" id="drawer-overview">نظرة عامة والخطوة التالية</h3>
                    <dl className="grid gap-2 text-sm sm:grid-cols-2">
                      <div className="rounded-lg bg-background p-3">
                        <dt className="font-semibold">الخطوة التالية</dt>
                        <dd className="mt-1 text-muted">{nextAction[deliverable.status] ?? "راجع حالة المخرج"}</dd>
                      </div>
                      <div className="rounded-lg bg-background p-3">
                        <dt className="font-semibold">الموعد الداخلي</dt>
                        <dd className="mt-1 text-muted">{deliverable.internalDueDate ?? "غير محدد"}</dd>
                      </div>
                      <div className="rounded-lg bg-background p-3">
                        <dt className="font-semibold">الأولوية</dt>
                        <dd className="mt-1 text-muted">{deliverable.priority}</dd>
                      </div>
                      <div className="rounded-lg bg-background p-3">
                        <dt className="font-semibold">المسؤول</dt>
                        <dd className="mt-1 text-muted">{deliverable.ownerDisplay?.displayName ?? "فريق سماوة"}</dd>
                      </div>
                    </dl>
                    {deliverable.description ? <p className="whitespace-pre-wrap text-sm leading-7 text-muted">{deliverable.description}</p> : null}
                  </section>

                  <section aria-labelledby="drawer-content" className="grid gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-base font-semibold" id="drawer-content">المحتوى والنسخة</h3>
                      {currentVersion ? <Badge tone="neutral">النسخة {currentVersion.versionNumber}</Badge> : null}
                    </div>
                    {currentVersion ? (
                      <div className="grid gap-4 rounded-xl border border-border bg-background p-4">
                        <div className="grid min-h-36 place-items-center rounded-lg border border-dashed border-border bg-surface text-center text-muted">
                          {workspace?.files.some((file) => file.fileType.startsWith("image/")) ? <ImageIcon aria-hidden="true" size={32} /> : <FileText aria-hidden="true" size={32} />}
                          <p className="text-sm">معاينة {currentVersion.format ?? deliverable.type}</p>
                        </div>
                        {currentVersion.brief ? <div><p className="text-xs font-semibold text-muted">الموجز</p><p className="mt-1 whitespace-pre-wrap text-sm leading-7">{currentVersion.brief}</p></div> : null}
                        {currentVersion.body ? <div><p className="text-xs font-semibold text-muted">المحتوى</p><p className="mt-1 whitespace-pre-wrap text-sm leading-7">{currentVersion.body}</p></div> : null}
                        {currentVersion.caption ? <div><p className="text-xs font-semibold text-muted">الكابشن</p><p className="mt-1 whitespace-pre-wrap break-words text-sm leading-7">{currentVersion.caption}</p></div> : null}
                        <dl className="grid gap-2 text-xs sm:grid-cols-2">
                          {[["القناة", currentVersion.channel], ["الصيغة", currentVersion.format], ["الهدف", currentVersion.objective], ["KPI", currentVersion.kpi]].filter(([, value]) => value).map(([label, value]) => <div className="rounded-md bg-surface p-2" key={label}><dt className="font-semibold">{label}</dt><dd className="mt-1 break-words text-muted">{value}</dd></div>)}
                        </dl>
                      </div>
                    ) : <EmptySection>لم تُحفظ نسخة بعد. استخدم نموذج المحتوى لإنشاء النسخة الأولى.</EmptySection>}
                    {workspace && workspace.versions.length > 0 ? (
                      <ol className="grid gap-2" aria-label="سجل النسخ">
                        {workspace.versions.map((version) => <li className="flex min-h-11 items-center justify-between rounded-lg bg-background px-3 py-2 text-sm" key={version.id}><span>النسخة {version.versionNumber}</span><span className="text-muted">{version.status} · {formatDate(version.submittedAt)}</span></li>)}
                      </ol>
                    ) : null}
                    <VersionContentForm
                      currentVersion={currentVersion}
                      deliverable={deliverable}
                    />
                    <DeliverableApprovalWorkflowControl
                      action={approvalAction}
                      deliverable={deliverable}
                    />
                  </section>

                  <section aria-labelledby="drawer-execution" className="grid gap-3">
                    <h3 className="text-base font-semibold" id="drawer-execution">مهام التنفيذ</h3>
                    {workspace?.tasks.length ? <ul className="grid gap-2">{workspace.tasks.map((task) => <li className="rounded-lg border border-border bg-background p-3" key={task.id}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-semibold">{task.title}</p><p className="mt-1 text-xs text-muted">{task.assignee?.displayName ?? "غير مسند"}{task.dueDate ? ` · ${task.dueDate}` : ""}</p></div>{(workspace.taskCapabilities.canUpdateOwnTaskStatus || workspace.taskCapabilities.canEditTaskFields) ? <TaskStatusControl deliverable={deliverable} task={task} onMutated={handleMutated} /> : <Badge tone="muted">{task.status}</Badge>}</div></li>)}</ul> : <EmptySection>لا توجد مهام تنفيذ مضافة لهذا المخرج.</EmptySection>}
                    <TaskForm deliverable={deliverable} eligibleAssignees={workspace?.eligibleAssignees} taskCapabilities={workspace?.taskCapabilities} onMutated={handleMutated} />
                  </section>

                  <section aria-labelledby="drawer-files" className="grid gap-3">
                    <h3 className="text-base font-semibold" id="drawer-files">الملفات</h3>
                    {workspace?.files.length ? <ul className="grid gap-2">{workspace.files.map((file) => <li className="grid min-h-11 gap-3 rounded-lg bg-background px-3 py-2" key={file.id}><div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"><span className="min-w-0 break-all text-sm font-semibold" dir="auto">{file.name}</span><span className="shrink-0 text-xs text-muted">{file.visibility}</span><WorkspaceFileDownload fileId={file.id} /></div><WorkspaceFilePreview fileId={file.id} fileType={file.fileType} label={file.name} /></li>)}</ul> : <EmptySection>لا توجد ملفات مرتبطة بعد.</EmptySection>}
                    <WorkspaceFileUpload
                      canPublishClientFile={canPublishClientComment}
                      currentVersionId={workspace?.currentVersionId}
                      deliverable={deliverable}
                    />
                  </section>

                  <section aria-labelledby="drawer-comments" className="grid gap-3">
                    <h3 className="text-base font-semibold" id="drawer-comments">التعليقات</h3>
                    {workspace?.comments.length ? <ol className="grid gap-2">{workspace.comments.map((comment) => <li className="rounded-lg border border-border bg-background p-3" data-comment-visibility={comment.visibility} key={comment.id}><div className="flex flex-wrap items-center justify-between gap-2 text-xs"><span className="font-semibold">{comment.author?.displayName ?? "عضو فريق سماوة"}</span><Badge tone={comment.visibility === "internal_only" ? "warning" : "accent"}>{comment.visibility === "internal_only" ? "داخلي" : "ظاهر للعميل"}</Badge></div><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7">{comment.body}</p><time className="mt-1 block text-xs text-muted">{formatDate(comment.createdAt)}</time></li>)}</ol> : <EmptySection>لا توجد تعليقات بعد.</EmptySection>}
                    <WorkspaceCommentForm
                      canPublishClientComment={canPublishClientComment}
                      currentVersionId={workspace?.currentVersionId}
                      target={deliverable}
                    />
                  </section>

                  <section aria-labelledby="drawer-quality" className="grid gap-3">
                    <h3 className="text-base font-semibold" id="drawer-quality">قائمة الجودة الداخلية</h3>
                    {workspace?.qualityChecks.length ? <ul className="grid gap-2">{workspace.qualityChecks.map((check) => <li className="flex min-h-11 items-center justify-between gap-3 rounded-lg bg-background px-3 py-2" key={check.id}><span className="text-sm">{check.label}</span>{canPublishClientComment && workspace.currentVersionId ? <QualityCheckStatusControl deliverable={deliverable} versionId={check.versionId} check={check} onMutated={handleMutated} /> : <Badge tone={check.status === "passed" ? "success" : "muted"}>{check.status}</Badge>}</li>)}</ul> : <EmptySection>لم تُضف عناصر جودة للنسخة الحالية.</EmptySection>}
                    {canPublishClientComment ? <QualityCheckForm deliverable={deliverable} versionId={workspace?.currentVersionId} onMutated={handleMutated} /> : null}
                  </section>

                  <section aria-labelledby="drawer-activity" className="grid gap-3">
                    <h3 className="text-base font-semibold" id="drawer-activity">النشاط</h3>
                    {workspace?.activity.length ? <ol className="grid gap-2">{workspace.activity.slice(0, 30).map((item) => <li className="rounded-lg bg-background px-3 py-2 text-sm" key={item.id}><p>{item.label}</p><p className="mt-1 text-xs text-muted">{item.actor?.displayName ? `${item.actor.displayName} · ` : ""}{formatDate(item.createdAt)}</p></li>)}</ol> : <EmptySection>لا يوجد نشاط ظاهر لهذا الدور بعد.</EmptySection>}
                  </section>
                </div>
              )}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}

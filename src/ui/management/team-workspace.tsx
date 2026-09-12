"use client";

import { useMemo, useState } from "react";
import { FileText } from "lucide-react";
import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";
import type { DeliverableWorkspaceSummary } from "@/modules/deliverables/deliverable-workspace";
import { deriveSlaStatus } from "@/modules/sla/sla-policy";
import { UniversalDeliverableDrawer } from "@/ui/deliverables/universal-deliverable-drawer";
import { Badge } from "@/ui/core/badge";
import {
  DeliverableBoard,
  getDeliverableTypeLabel,
  kanbanStatusLabels,
  priorityLabels,
  slaLabels,
} from "./deliverable-board";
import { contentChannelLabel } from "@/modules/deliverables/domain-labels";
import { formatArabicDate } from "@/modules/localization/arabic-display";
import { WorkspaceInlineMedia } from "@/ui/deliverables/workspace-files";

type Action = (formData: FormData) => void | Promise<void>;

export function TeamWorkspace({
  deliverables,
  clientNames,
  workspaces,
  statusAction,
  approvalAction,
  now,
}: {
  deliverables: DeliverableSafeSummary[];
  clientNames: Record<string, string>;
  workspaces: Record<string, DeliverableWorkspaceSummary>;
  statusAction?: Action;
  approvalAction?: Action;
  now: string;
}) {
  const [view, setView] = useState<"list" | "board">("list");
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("all");
  const [sla, setSla] = useState("all");
  const filtered = useMemo(
    () =>
      deliverables.filter((deliverable) => {
        const slaStatus = deriveSlaStatus({
          status: deliverable.status,
          now,
          startDate: deliverable.startDate,
          internalDueDate: deliverable.internalDueDate,
          clientDueDate: deliverable.clientDueDate,
          finalDueDate: deliverable.finalDueDate,
        }).status;
        const haystack =
          `${deliverable.name} ${deliverable.type} ${clientNames[deliverable.clientId] ?? ""}`.toLocaleLowerCase(
            "ar",
          );
        return (
          haystack.includes(search.trim().toLocaleLowerCase("ar")) &&
          (priority === "all" || deliverable.priority === priority) &&
          (sla === "all" || slaStatus === sla)
        );
      }),
    [clientNames, deliverables, now, priority, search, sla],
  );

  return (
    <section className="grid gap-4" dir="rtl">
      <div
        role="group"
        aria-label="فلاتر مهامي"
        className="grid min-w-0 grid-cols-2 gap-3 rounded-xl border border-border bg-surface p-4 lg:grid-cols-[minmax(0,1fr)_auto_auto]"
      >
        <label className="col-span-2 grid min-w-0 gap-1 text-sm font-semibold lg:col-span-1">
          بحث
          <input
            className="min-h-11 w-full min-w-0 rounded-lg border border-border bg-background px-3"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="اسم المخرج أو العميل أو النوع"
            type="search"
            value={search}
          />
        </label>
        <label className="grid min-w-0 gap-1 text-sm font-semibold">
          الأولوية
          <select
            className="min-h-11 w-full min-w-0 rounded-lg border border-border bg-background px-3"
            onChange={(event) => setPriority(event.target.value)}
            value={priority}
          >
            <option value="all">الكل</option>
            <option value="urgent">عاجل</option>
            <option value="high">مرتفعة</option>
            <option value="normal">عادية</option>
            <option value="low">منخفضة</option>
          </select>
        </label>
        <label className="grid min-w-0 gap-1 text-sm font-semibold">
          SLA
          <select
            className="min-h-11 w-full min-w-0 rounded-lg border border-border bg-background px-3"
            onChange={(event) => setSla(event.target.value)}
            value={sla}
          >
            <option value="all">الكل</option>
            <option value="overdue">متأخر</option>
            <option value="at_risk">معرض للتأخير</option>
            <option value="paused_waiting_client">بانتظار العميل</option>
            <option value="paused_waiting_internal_decision">
              بانتظار قرار داخلي
            </option>
            <option value="on_track">ضمن المسار</option>
          </select>
        </label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {filtered.length} مخرج ضمن العمل المسند
        </p>
        <div
          className="flex rounded-lg border border-border bg-surface p-1"
          role="group"
          aria-label="طريقة عرض مهامي"
        >
          <button
            aria-pressed={view === "list"}
            className={`min-h-11 rounded-md px-4 text-sm font-semibold ${view === "list" ? "bg-accent text-white" : "text-muted"}`}
            onClick={() => setView("list")}
            type="button"
          >
            قائمة
          </button>
          <button
            aria-pressed={view === "board"}
            className={`min-h-11 rounded-md px-4 text-sm font-semibold ${view === "board" ? "bg-accent text-white" : "text-muted"}`}
            onClick={() => setView("board")}
            type="button"
          >
            لوحة العمل
          </button>
        </div>
      </div>
      {view === "board" ? (
        <DeliverableBoard
          action={statusAction}
          approvalAction={approvalAction}
          clientNames={clientNames}
          deliverables={filtered}
          key={filtered
            .map((deliverable) => `${deliverable.id}:${deliverable.revision}`)
            .join("|")}
          now={now}
          workspaces={workspaces}
        />
      ) : (
        <div className="grid gap-3" data-testid="team-work-list">
          {filtered.length === 0 ? (
            <div
              className="rounded-lg border border-border bg-surface p-4"
              role="status"
            >
              <p className="text-sm font-semibold">
                {deliverables.length === 0
                  ? "لا توجد مخرجات مسندة إليك حالياً"
                  : "لا توجد مخرجات تطابق الفلاتر الحالية."}
              </p>
              {deliverables.length > 0 ? (
                <p className="mt-1 text-sm text-muted">
                  جرّب تعديل البحث أو فلاتر الأولوية وSLA.
                </p>
              ) : null}
            </div>
          ) : null}
          {filtered.map((deliverable) => {
            const summary = workspaces[deliverable.id];
            const dueDate =
              deliverable.internalDueDate ??
              deliverable.clientDueDate ??
              deliverable.finalDueDate ??
              deliverable.plannedPublishDate;
            const slaStatus = deriveSlaStatus({
              status: deliverable.status,
              now,
              startDate: deliverable.startDate,
              internalDueDate: deliverable.internalDueDate,
              clientDueDate: deliverable.clientDueDate,
              finalDueDate: deliverable.finalDueDate,
            }).status;
            return (
              <article
                className="relative grid min-w-0 gap-3 rounded-lg border border-border bg-surface p-3 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-center"
                key={deliverable.id}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div
                    data-testid="team-work-thumbnail"
                    className="size-16 shrink-0 rounded-lg bg-accent-soft text-accent [&>*]:min-h-0 [&>img]:h-16 [&>img]:rounded-lg [&>div]:h-16 [&>p]:p-0 [&>p]:text-[10px] [&>p]:leading-3"
                  >
                    {summary?.previewFile?.fileType.startsWith("image/") ? (
                      <WorkspaceInlineMedia
                        key={summary.previewFile.id}
                        fileId={summary.previewFile.id}
                        fileType={summary.previewFile.fileType}
                        label="معاينة المخرج"
                      />
                    ) : (
                      <div
                        className="grid size-16 place-items-center"
                        role="img"
                        aria-label="معاينة رمزية للمخرج"
                      >
                        <FileText size={28} aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <div className="grid min-w-0 gap-2 break-words">
                    <h2 className="text-base font-semibold leading-6">
                      {deliverable.name}
                    </h2>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                      <span className="min-w-0 break-words">
                        {clientNames[deliverable.clientId] ?? "عميل مصرح"}
                      </span>
                      <span>{getDeliverableTypeLabel(deliverable.type)}</span>
                      {summary?.currentVersion?.channel ? (
                        <span>
                          {contentChannelLabel(summary.currentVersion.channel)}
                        </span>
                      ) : null}
                    </div>
                    <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      <div className="flex flex-wrap gap-1">
                        <dt className="text-muted">المسؤول:</dt>
                        <dd>
                          {deliverable.ownerDisplay?.displayName ??
                            "بانتظار الإسناد"}
                        </dd>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <dt className="text-muted">الموعد:</dt>
                        <dd>{formatArabicDate(dueDate)}</dd>
                      </div>
                    </dl>
                    {deliverable.contentStage ? (
                      <p className="text-xs text-muted">
                        المرحلة: {deliverable.contentStage}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="muted">
                        {kanbanStatusLabels[deliverable.status]}
                      </Badge>
                      <Badge
                        tone={
                          slaStatus === "overdue"
                            ? "danger"
                            : slaStatus === "at_risk"
                              ? "warning"
                              : "accent"
                        }
                      >
                        {slaLabels[slaStatus]}
                      </Badge>
                      <Badge tone="muted">
                        {priorityLabels[deliverable.priority]}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="grid min-w-0 gap-2 break-words border-t border-border pt-3 lg:border-t-0 lg:border-s lg:ps-3 lg:pt-0">
                  <p className="text-sm leading-6 text-muted">
                    <span className="font-semibold text-foreground">
                      الخطوة التالية:{" "}
                    </span>
                    {nextActionLabels[deliverable.status]}
                  </p>
                  <p className="text-xs text-muted">
                    {summary?.counts.versions ?? 0} نسخ ·{" "}
                    {summary?.counts.tasks ?? 0} مهام ·{" "}
                    {summary?.counts.files ?? 0} ملفات ·{" "}
                    {summary?.counts.comments ?? 0} تعليقات
                  </p>
                  <UniversalDeliverableDrawer
                    triggerClassName="after:absolute after:inset-0 after:rounded-lg after:content-[''] focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-accent"
                    approvalAction={approvalAction}
                    canPublishClientComment={Boolean(approvalAction)}
                    clientName={clientNames[deliverable.clientId]}
                    deliverable={deliverable}
                    summary={summary}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

const nextActionLabels = {
  not_started: "ابدأ التنفيذ أو حدّث حالة المخرج.",
  in_progress: "أكمل النسخة الحالية ثم أرسلها للمراجعة الداخلية.",
  ready_for_internal_review: "بانتظار مراجعة الإدارة للنسخة الحالية.",
  internal_changes_requested:
    "نفّذ التعديلات الداخلية المطلوبة وارفع نسخة محدثة.",
  internally_approved: "النسخة معتمدة داخليًا وجاهزة للإرسال للعميل.",
  waiting_client_approval: "بانتظار قرار العميل، ووقت SLA متوقف.",
  client_changes_requested: "نفّذ تعديلات العميل وارفع نسخة جديدة.",
  client_approved: "جهّز الملفات النهائية للتسليم.",
  ready_for_delivery: "أكمل التسليم النهائي.",
  delivered: "المخرج مكتمل ولا توجد خطوة مطلوبة.",
  cancelled: "المخرج ملغي.",
  archived: "المخرج مؤرشف.",
} as const;

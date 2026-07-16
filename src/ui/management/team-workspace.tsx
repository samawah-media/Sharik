"use client";

import { useMemo, useState } from "react";
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
        const haystack = `${deliverable.name} ${deliverable.type} ${clientNames[deliverable.clientId] ?? ""}`.toLocaleLowerCase("ar");
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
      <div className="grid gap-3 rounded-xl border border-border bg-surface p-4 lg:grid-cols-[1fr_auto_auto]">
        <label className="grid gap-1 text-sm font-semibold">بحث<input className="min-h-11 rounded-lg border border-border bg-background px-3" onChange={(event) => setSearch(event.target.value)} placeholder="اسم المخرج أو العميل أو النوع" type="search" value={search} /></label>
        <label className="grid gap-1 text-sm font-semibold">الأولوية<select className="min-h-11 rounded-lg border border-border bg-background px-3" onChange={(event) => setPriority(event.target.value)} value={priority}><option value="all">الكل</option><option value="urgent">عاجل</option><option value="high">مرتفعة</option><option value="normal">عادية</option><option value="low">منخفضة</option></select></label>
        <label className="grid gap-1 text-sm font-semibold">SLA<select className="min-h-11 rounded-lg border border-border bg-background px-3" onChange={(event) => setSla(event.target.value)} value={sla}><option value="all">الكل</option><option value="overdue">متأخر</option><option value="at_risk">معرض للتأخير</option><option value="paused_waiting_client">بانتظار العميل</option><option value="paused_waiting_internal_decision">بانتظار قرار داخلي</option><option value="on_track">ضمن المسار</option></select></label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{filtered.length} مخرج ضمن العمل المسند</p>
        <div className="flex rounded-lg border border-border bg-surface p-1" role="group" aria-label="طريقة عرض مهامي">
          <button aria-pressed={view === "list"} className={`min-h-11 rounded-md px-4 text-sm font-semibold ${view === "list" ? "bg-accent text-white" : "text-muted"}`} onClick={() => setView("list")} type="button">قائمة</button>
          <button aria-pressed={view === "board"} className={`min-h-11 rounded-md px-4 text-sm font-semibold ${view === "board" ? "bg-accent text-white" : "text-muted"}`} onClick={() => setView("board")} type="button">لوحة العمل</button>
        </div>
      </div>
      {view === "board" ? (
        <DeliverableBoard
          action={statusAction}
          approvalAction={approvalAction}
          deliverables={filtered}
          key={filtered.map((deliverable) => `${deliverable.id}:${deliverable.revision}`).join("|")}
          now={now}
          workspaces={workspaces}
        />
      ) : (
        <div className="grid gap-3" data-testid="team-work-list">
          {filtered.map((deliverable) => {
            const summary = workspaces[deliverable.id];
            const slaStatus = deriveSlaStatus({
              status: deliverable.status,
              now,
              startDate: deliverable.startDate,
              internalDueDate: deliverable.internalDueDate,
              clientDueDate: deliverable.clientDueDate,
              finalDueDate: deliverable.finalDueDate,
            }).status;
            return (
              <article className="grid gap-3 rounded-xl border border-border bg-surface p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center" key={deliverable.id}>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-accent">{clientNames[deliverable.clientId] ?? "عميل مصرح"}</p>
                  <h2 className="mt-1 break-words text-base font-semibold">{deliverable.name}</h2>
                  <div className="mt-2 flex flex-wrap gap-2"><Badge tone="neutral">{getDeliverableTypeLabel(deliverable.type)}</Badge><Badge tone="muted">{kanbanStatusLabels[deliverable.status]}</Badge><Badge tone={slaStatus === "overdue" ? "danger" : slaStatus === "at_risk" ? "warning" : "accent"}>{slaLabels[slaStatus]}</Badge><Badge tone="muted">{priorityLabels[deliverable.priority]}</Badge></div>
                  <p className="mt-2 text-xs text-muted">المسؤول: {deliverable.ownerDisplay?.displayName ?? "فريق سماوة"} · الموعد: {deliverable.internalDueDate ?? deliverable.finalDueDate ?? "غير محدد"}</p>
                  <p className="mt-1 text-xs text-muted">{summary?.counts.versions ?? 0} نسخ · {summary?.counts.tasks ?? 0} مهام · {summary?.counts.files ?? 0} ملفات · {summary?.counts.comments ?? 0} تعليقات</p>
                </div>
                <UniversalDeliverableDrawer approvalAction={approvalAction} canPublishClientComment={Boolean(approvalAction)} deliverable={deliverable} summary={summary} />
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

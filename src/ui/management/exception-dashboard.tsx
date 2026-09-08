import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";
import { deliverableStatusLabel } from "@/modules/deliverables/domain-labels";
import { deriveSlaStatus } from "@/modules/sla/sla-policy";
import { Badge } from "@/ui/core/badge";
import { ButtonLink } from "@/ui/core/button";

const distributionLabels = {
  delivered: "تم التسليم",
  waiting: "بانتظار العميل",
  review: "للمراجعة الداخلية",
  team: "داخل الفريق",
  closed: "ملغي أو مؤرشف",
} as const;

const distributionGroup: Record<
  DeliverableSafeSummary["status"],
  keyof typeof distributionLabels
> = {
  not_started: "team",
  in_progress: "team",
  ready_for_internal_review: "review",
  internal_changes_requested: "team",
  internally_approved: "team",
  waiting_client_approval: "waiting",
  client_changes_requested: "team",
  client_approved: "team",
  ready_for_delivery: "team",
  delivered: "delivered",
  cancelled: "closed",
  archived: "closed",
};

function CountBar({
  label,
  count,
  total,
}: {
  label: string;
  count: number;
  total: number;
}) {
  return (
    <div
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={count}
      aria-valuetext={`${count} من ${total} مخرج`}
      className="h-2.5 overflow-hidden rounded-full bg-border"
      role="meter"
    >
      <div className="h-full rounded-full bg-accent" style={{ width: `${(count / total) * 100}%` }} />
    </div>
  );
}

export function ManagementExceptionDashboard({
  deliverables,
  clientNames,
  now,
}: {
  deliverables: DeliverableSafeSummary[];
  clientNames: Record<string, string>;
  now: string;
}) {
  const withSla = deliverables.map((deliverable) => ({
    deliverable,
    sla: deriveSlaStatus({
      status: deliverable.status,
      now,
      startDate: deliverable.startDate,
      internalDueDate: deliverable.internalDueDate,
      clientDueDate: deliverable.clientDueDate,
      finalDueDate: deliverable.finalDueDate,
    }).status,
  }));
  const dueSoon = deliverables.filter((item) => {
    const due = item.internalDueDate ?? item.finalDueDate;
    if (!due || ["delivered", "cancelled", "archived"].includes(item.status)) return false;
    const days = (new Date(due).getTime() - new Date(now).getTime()) / 86_400_000;
    return days >= 0 && days <= 3;
  }).length;
  const metrics = [
    ["متأخر", withSla.filter((item) => item.sla === "overdue").length, "danger"],
    ["معرض للتأخير", withSla.filter((item) => item.sla === "at_risk").length, "warning"],
    ["ينتظر قرارًا داخليًا", deliverables.filter((item) => item.status === "ready_for_internal_review").length, "warning"],
    ["بانتظار العميل", deliverables.filter((item) => item.status === "waiting_client_approval").length, "accent"],
    ["مستحق قريبًا", dueSoon, "neutral"],
  ] as const;
  const workload = Array.from(
    deliverables.reduce((map, item) => {
      const name = item.ownerDisplay?.displayName ?? "غير مسند";
      map.set(name, (map.get(name) ?? 0) + (item.status === "delivered" ? 0 : 1));
      return map;
    }, new Map<string, number>()),
  ).sort((a, b) => b[1] - a[1]);
  const clients = Object.entries(clientNames).map(([clientId, name]) => {
    const scoped = deliverables.filter((item) => item.clientId === clientId);
    return {
      clientId,
      name,
      delivered: scoped.filter((item) => item.status === "delivered").length,
      total: scoped.length,
    };
  });
  const distribution = Object.entries(distributionLabels).map(([group, label]) => ({
    label,
    count: deliverables.filter((item) => distributionGroup[item.status] === group).length,
  }));
  const recent = [...deliverables]
    .filter((item) => ["internally_approved", "client_approved", "delivered"].includes(item.status))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 6);

  return (
    <section className="grid min-w-0 gap-5" aria-labelledby="management-exceptions" dir="rtl">
      <div>
        <p className="text-xs font-semibold text-muted">متابعة الأعمال</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl" id="management-exceptions">يحتاج انتباهكم</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          لقطة حالية للمخرجات ضمن نطاقك. قد يظهر المخرج في أكثر من مؤشر متابعة.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        {metrics.map(([label, count, tone]) => (
          <article aria-label={label} className="min-w-0 rounded-2xl border border-border bg-surface p-4 shadow-xs sm:p-5" key={label}>
            <Badge tone={tone}>{label}</Badge>
            <p className="mt-4 text-3xl font-semibold leading-none tabular-nums">{count}</p>
            <p className="mt-2 text-xs text-muted">مخرج</p>
          </article>
        ))}
      </div>
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <section className="min-w-0 rounded-2xl border border-border bg-surface p-4 sm:p-5" aria-labelledby="status-distribution-heading">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold" id="status-distribution-heading">وين وصل الشغل؟</h3>
            <Badge tone="muted">{deliverables.length} مخرج</Badge>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted">توزيع المخرجات الحالية؛ كل مخرج يظهر في مجموعة واحدة.</p>
          {deliverables.length ? (
            <ul className="mt-5 grid gap-5">
              {distribution.map(({ label, count }) => (
                <li className="grid gap-2" key={label}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
                    <span className="font-medium">{label}</span>
                    <span className="tabular-nums text-muted">{count} من {deliverables.length}</span>
                  </div>
                  <CountBar label={label} count={count} total={deliverables.length} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 rounded-xl bg-background p-4 text-sm leading-6 text-muted">ما فيه مخرجات لعرض توزيعها حاليًا.</p>
          )}
          <p className="mt-5 border-t border-border pt-3 text-xs leading-5 text-muted">
            التأخير مؤشر منفصل، ومدة انتظار العميل لا تُحتسب على الفريق.
          </p>
        </section>
        <section className="min-w-0 rounded-2xl border border-border bg-surface p-4 sm:p-5" aria-labelledby="workload-heading">
          <h3 className="font-semibold" id="workload-heading">المخرجات حسب المسؤول</h3>
          <p className="mt-2 text-sm leading-6 text-muted">المخرجات غير المسلّمة حسب المسؤول، بما فيها الملغي والمؤرشف.</p>
          {workload.length ? (
            <ul className="mt-4 grid gap-2">
              {workload.slice(0, 8).map(([name, count]) => (
                <li className="flex min-h-11 flex-wrap items-center justify-between gap-2 rounded-xl bg-background px-3 py-3" key={name}>
                  <span className="min-w-0 flex-1 break-words text-sm font-medium">{name}</span>
                  <Badge tone={count >= 5 ? "warning" : "muted"}>{count} غير مسلّم</Badge>
                </li>
              ))}
            </ul>
          ) : <p className="mt-4 text-sm text-muted">ما فيه مخرجات لعرضها حسب المسؤول حاليًا.</p>}
          {workload.length > 8 ? <p className="mt-3 text-xs text-muted">يظهر أعلى 8 أسماء حسب عدد المخرجات غير المسلّمة.</p> : null}
        </section>
      </div>
      <section className="min-w-0 rounded-2xl border border-border bg-surface p-4 sm:p-5" aria-labelledby="client-progress-heading">
        <h3 className="font-semibold" id="client-progress-heading">التسليم حسب العميل</h3>
        <p className="mt-2 text-sm leading-6 text-muted">المسلّم من إجمالي المخرجات الحالية لكل عميل؛ وليس استهلاك الباقة.</p>
        {clients.length ? (
          <ul className="mt-4 grid gap-3 xl:grid-cols-2">
            {clients.map((client) => (
              <li className="grid min-w-0 content-start gap-3 rounded-xl border border-border bg-background p-4" key={client.clientId}>
                <p className="min-w-0 break-words font-semibold">{client.name}</p>
                {client.total > 0 ? (
                  <CountBar label={`تسليم ${client.name}`} count={client.delivered} total={client.total} />
                ) : <p className="text-sm text-muted">ما فيه مخرجات لهذا العميل حاليًا.</p>}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm tabular-nums text-muted">{client.delivered} من {client.total} تم تسليمه</span>
                  <ButtonLink href={`/clients/${client.clientId}/commercial`} size="sm">ملف العميل</ButtonLink>
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="mt-4 text-sm text-muted">ما فيه عملاء لعرض ملخصهم حاليًا.</p>}
      </section>
      <section className="min-w-0 rounded-2xl border border-border bg-surface p-4 sm:p-5" aria-labelledby="recent-decisions">
        <h3 className="font-semibold" id="recent-decisions">أحدث القرارات والتسليمات</h3>
        <p className="mt-2 text-sm leading-6 text-muted">آخر المخرجات المعتمدة أو المسلّمة، مرتّبة حسب آخر تحديث.</p>
        {recent.length ? (
          <ol className="mt-4 grid gap-2">
            {recent.map((item) => (
              <li className="min-w-0" key={item.id}>
                <ButtonLink className="grid w-full min-w-0 justify-items-start gap-2 rounded-xl bg-background px-4 py-3 text-right hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 sm:grid-cols-2" href={`/clients/${item.clientId}/deliverables`} size="sm" variant="ghost">
                  <span className="min-w-0 break-words text-sm font-semibold">{item.name}</span>
                  <span className="min-w-0 break-words text-xs leading-5 text-muted sm:justify-self-end">{clientNames[item.clientId]} · {deliverableStatusLabel(item.status)}</span>
                </ButtonLink>
              </li>
            ))}
          </ol>
        ) : <p className="mt-4 text-sm text-muted">لا توجد قرارات حديثة.</p>}
      </section>
    </section>
  );
}

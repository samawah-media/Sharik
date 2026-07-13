import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";
import { deriveSlaStatus } from "@/modules/sla/sla-policy";
import { Badge } from "@/ui/core/badge";
import { ButtonLink } from "@/ui/core/button";

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
      progress: scoped.length
        ? Math.round(scoped.reduce((sum, item) => sum + item.progressPercentage, 0) / scoped.length)
        : 0,
      delivered: scoped.filter((item) => item.status === "delivered").length,
      total: scoped.length,
    };
  });
  const recent = [...deliverables]
    .filter((item) => ["internally_approved", "client_approved", "delivered"].includes(item.status))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 6);

  return (
    <section className="grid gap-5" aria-labelledby="management-exceptions" dir="rtl">
      <div>
        <p className="text-sm font-semibold text-accent">مراقبة الاستثناءات</p>
        <h1 className="mt-1 text-2xl font-semibold" id="management-exceptions">ما يحتاج تدخل الإدارة الآن</h1>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map(([label, count, tone]) => <article className="rounded-xl border border-border bg-surface p-4" key={label}><Badge tone={tone}>{label}</Badge><p className="mt-3 text-3xl font-semibold tabular-nums">{count}</p></article>)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-4" aria-labelledby="workload-heading"><h2 className="font-semibold" id="workload-heading">ضغط الفريق</h2>{workload.length ? <ul className="mt-3 grid gap-2">{workload.slice(0, 8).map(([name, count]) => <li className="flex min-h-11 items-center justify-between rounded-lg bg-background px-3" key={name}><span>{name}</span><Badge tone={count >= 5 ? "warning" : "muted"}>{count} نشط</Badge></li>)}</ul> : <p className="mt-3 text-sm text-muted">لا توجد أعمال نشطة.</p>}</section>
        <section className="rounded-xl border border-border bg-surface p-4" aria-labelledby="client-progress-heading"><h2 className="font-semibold" id="client-progress-heading">تقدم العملاء والباقات</h2><ul className="mt-3 grid gap-2">{clients.map((client) => <li className="grid gap-2 rounded-lg bg-background p-3" key={client.clientId}><div className="flex items-center justify-between gap-2"><span className="font-semibold">{client.name}</span><span className="text-sm tabular-nums">{client.progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-border"><div className="h-full bg-accent" style={{ width: `${client.progress}%` }} /></div><div className="flex items-center justify-between text-xs text-muted"><span>{client.delivered} من {client.total} تم تسليمه</span><ButtonLink href={`/clients/${client.clientId}/commercial`} size="sm">ملف العميل</ButtonLink></div></li>)}</ul></section>
      </div>
      <section className="rounded-xl border border-border bg-surface p-4" aria-labelledby="recent-decisions"><h2 className="font-semibold" id="recent-decisions">أحدث القرارات والتسليمات</h2>{recent.length ? <ol className="mt-3 grid gap-2">{recent.map((item) => <li className="grid min-h-11 gap-1 rounded-lg bg-background px-3 py-2 sm:grid-cols-[minmax(0,1fr)_auto]" key={item.id}><span className="font-semibold">{item.name}</span><span className="text-xs text-muted">{clientNames[item.clientId]} · {item.status}</span></li>)}</ol> : <p className="mt-3 text-sm text-muted">لا توجد قرارات حديثة.</p>}</section>
    </section>
  );
}

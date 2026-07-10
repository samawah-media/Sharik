import type { ClientCommercialSummary } from "@/modules/commercial/commercial-summary";

const typeLabels: Record<string, string> = {
  post: "منشور",
  reel: "ريلز",
  story: "ستوري",
  design: "تصميم",
  report: "تقرير",
  video: "فيديو",
  campaign: "حملة",
  article: "مقال",
};

const statusLabels = {
  draft: "مسودة",
  active: "نشط",
  completed: "مكتمل",
  cancelled: "ملغي",
  archived: "مؤرشف",
  not_started: "لم يبدأ",
  in_progress: "قيد التنفيذ",
  ready_for_internal_review: "قيد المراجعة",
  internal_changes_requested: "قيد التعديل",
  internally_approved: "معتمد داخليًا",
  waiting_client_approval: "بانتظار موافقتك",
  client_changes_requested: "قيد التعديل",
  client_approved: "معتمد",
  ready_for_delivery: "جاهز للتسليم",
  delivered: "تم التسليم",
} as const;

const formatDate = (value?: string) => {
  if (!value) {
    return "غير محدد";
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : value.slice(0, 10);
};

export function ClientCommercialSummaryCards({
  summary,
}: {
  summary: ClientCommercialSummary;
}) {
  return (
    <section aria-label="ملخص بوابة العميل" className="grid gap-5" dir="rtl">
      <div className="grid gap-3" id="contracts">
        <h2 className="text-lg font-semibold">العقد</h2>
        {summary.contracts.map((contract) => (
          <article className="rounded-lg border border-border bg-card p-4" key={contract.name}>
            <p className="text-sm text-muted">العقد والمتابعة</p>
            <h2 className="mt-1 text-base font-semibold">{contract.name}</h2>
            {contract.summary ? (
              <p className="mt-2 text-sm text-muted">{contract.summary}</p>
            ) : null}
          </article>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2" id="package">
        <h2 className="md:col-span-2 text-lg font-semibold">الباقة والمتبقي</h2>
        <p className="md:col-span-2 text-sm leading-6 text-muted">
          هذا ملخص مبسط لما تم الاتفاق عليه وما هو قيد العمل وما تبقى للعميل.
        </p>
        {summary.packages.flatMap((packageSummary) =>
          packageSummary.lines.map((line) => (
            <article
              className="rounded-lg border border-border bg-card p-4"
              key={`${packageSummary.name}-${line.serviceLabel}`}
            >
              <p className="text-sm text-muted">ملخص الباقة</p>
              <h2 className="mt-1 text-base font-semibold">{line.serviceLabel}</h2>
              <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted">
                <span>المتفق عليه: {line.balance.committed}</span>
                <span>قيد العمل: {line.balance.reserved}</span>
                <span>المتبقي: {line.balance.available}</span>
              </div>
            </article>
          )),
        )}
      </div>
      <div className="grid gap-3" id="deliverables">
        <h2 className="text-lg font-semibold">مخرجاتي</h2>
        {summary.deliverables.map((deliverable) => (
          <article className="rounded-lg border border-border bg-card p-4" key={deliverable.name}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold">{deliverable.name}</h2>
              <span className="rounded-md border border-border px-2 py-1 text-xs text-muted">
                {statusLabels[deliverable.status]}
              </span>
            </div>
            <dl className="mt-3 grid gap-3 text-sm text-muted sm:grid-cols-4">
              <div className="rounded-md bg-background px-3 py-2">
                <dt className="font-semibold text-foreground">النوع</dt>
                <dd className="mt-1">
                  {typeLabels[deliverable.type] ?? deliverable.type}
                </dd>
              </div>
              <div className="rounded-md bg-background px-3 py-2">
                <dt className="font-semibold text-foreground">التاريخ</dt>
                <dd className="mt-1">
                  {formatDate(
                    deliverable.clientDueDate ?? deliverable.finalDueDate,
                  )}
                </dd>
              </div>
              <div className="rounded-md bg-background px-3 py-2">
                <dt className="font-semibold text-foreground">الحالة</dt>
                <dd className="mt-1">{statusLabels[deliverable.status]}</dd>
              </div>
              <div className="rounded-md bg-background px-3 py-2">
                <dt className="font-semibold text-foreground">التقدم</dt>
                <dd className="mt-1">{deliverable.progressPercentage}%</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

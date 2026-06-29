import type { ClientCommercialSummary } from "@/modules/commercial/commercial-summary";

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

export function ClientCommercialSummaryCards({
  summary,
}: {
  summary: ClientCommercialSummary;
}) {
  return (
    <section aria-label="ملخص العميل التجاري" className="grid gap-4" dir="rtl">
      <div className="grid gap-3">
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
      <div className="grid gap-3 md:grid-cols-2">
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
      <div className="grid gap-3">
        {summary.deliverables.map((deliverable) => (
          <article className="rounded-lg border border-border bg-card p-4" key={deliverable.name}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold">{deliverable.name}</h2>
              <span className="rounded-md border border-border px-2 py-1 text-xs text-muted">
                {statusLabels[deliverable.status]}
              </span>
            </div>
            {deliverable.description ? (
              <p className="mt-2 text-sm text-muted">{deliverable.description}</p>
            ) : null}
            <p className="mt-3 text-sm text-muted">
              التقدم {deliverable.progressPercentage}%
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

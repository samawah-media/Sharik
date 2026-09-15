import type { ManagementCommercialSummary } from "@/modules/commercial/commercial-summary";
import { deliverableTypeLabel } from "@/modules/deliverables/domain-labels";
import {
  formatArabicDate,
  formatArabicDateRange,
} from "@/modules/localization/arabic-display";
import { PackageBalanceFacts } from "@/ui/commercial/package-balance-facts";

const statusLabels = {
  draft: "مسودة",
  active: "نشط",
  completed: "مكتمل",
  cancelled: "ملغي",
  archived: "مؤرشف",
  not_started: "لم يبدأ",
  in_progress: "قيد التنفيذ",
  ready_for_internal_review: "جاهز للمراجعة الداخلية",
  internal_changes_requested: "يحتاج تعديل داخلي",
  internally_approved: "معتمد داخليًا",
  waiting_client_approval: "بانتظار اعتماد العميل",
  client_changes_requested: "يحتاج تعديل من العميل",
  client_approved: "معتمد من العميل",
  ready_for_delivery: "جاهز للتسليم",
  delivered: "تم التسليم",
} as const;

export function ManagementCommercialSummaryCards({
  summary,
}: {
  summary: ManagementCommercialSummary;
}) {
  return (
    <section
      aria-label="ملخص المتابعة للإدارة"
      className="grid gap-5"
      dir="rtl"
    >
      <div className="grid gap-3 md:grid-cols-3">
        <article className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted">العقود</p>
          <p className="mt-1 text-2xl font-semibold">
            {summary.contracts.length}
          </p>
        </article>
        <article className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted">الباقات</p>
          <p className="mt-1 text-2xl font-semibold">
            {summary.packages.length}
          </p>
        </article>
        <article className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted">المخرجات</p>
          <p className="mt-1 text-2xl font-semibold">
            {summary.deliverables.length}
          </p>
        </article>
      </div>
      <div className="grid gap-3" id="contracts">
        <h2 className="text-lg font-semibold">العقد</h2>
        {summary.contracts.map((contract) => (
          <article
            className="rounded-lg border border-border p-4"
            key={contract.id}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold">{contract.name}</h2>
              <span className="rounded-md border border-border px-2 py-1 text-xs text-muted">
                {statusLabels[contract.status]}
              </span>
            </div>
            {contract.summary ? (
              <p className="mt-2 text-sm text-muted">{contract.summary}</p>
            ) : null}
            {contract.periodStart || contract.periodEnd ? (
              <p className="mt-2 text-sm text-muted">
                {formatArabicDateRange(
                  contract.periodStart,
                  contract.periodEnd,
                )}
              </p>
            ) : null}
          </article>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2" id="package">
        <h2 className="md:col-span-2 text-lg font-semibold">الباقة والمتبقي</h2>
        {summary.packages.flatMap((packageSummary) =>
          packageSummary.lines.map((line) => (
            <article
              className="rounded-lg border border-border p-4"
              key={`${packageSummary.id}-${line.id}`}
            >
              <p className="text-sm text-muted">{packageSummary.name}</p>
              <h2 className="mt-1 text-base font-semibold">
                {line.serviceLabel}
              </h2>
              {packageSummary.periodStart || packageSummary.periodEnd ? (
                <p className="mt-2 text-xs text-muted">
                  {formatArabicDateRange(
                    packageSummary.periodStart,
                    packageSummary.periodEnd,
                  )}
                </p>
              ) : null}
              <div className="mt-3">
                <PackageBalanceFacts
                  audience="management"
                  balance={line.balance}
                  unitLabel={line.unitLabel}
                />
              </div>
            </article>
          )),
        )}
      </div>
      <div className="grid gap-3" id="deliverables">
        <h2 className="text-lg font-semibold">المخرجات</h2>
        {summary.deliverables.map((deliverable) => (
          <article
            className="rounded-lg border border-border p-4"
            key={deliverable.id}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold">{deliverable.name}</h2>
              <span className="rounded-md border border-border px-2 py-1 text-xs text-muted">
                {statusLabels[deliverable.status]}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted">
              <span>النوع: {deliverableTypeLabel(deliverable.type)}</span>
              <span>
                التاريخ:{" "}
                {formatArabicDate(
                  deliverable.clientDueDate ?? deliverable.finalDueDate,
                )}
              </span>
              <span>التقدم {deliverable.progressPercentage}%</span>
              {deliverable.reservation ? (
                <span>
                  قيد العمل: {deliverable.reservation.reservedQuantity}
                </span>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

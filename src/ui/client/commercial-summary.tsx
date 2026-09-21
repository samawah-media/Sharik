import type { ClientCommercialSummary } from "@/modules/commercial/commercial-summary";
import { clientStatusLabel } from "@/modules/deliverables/client-labels";
import { deliverableTypeLabel } from "@/modules/deliverables/domain-labels";
import {
  formatArabicDate,
  formatArabicDateRange,
} from "@/modules/localization/arabic-display";
import { PackageBalanceFacts } from "@/ui/commercial/package-balance-facts";

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
          <article
            className="rounded-lg border border-border bg-card p-4"
            key={contract.name}
          >
            <p className="text-sm text-muted">العقد والمتابعة</p>
            <h2 className="mt-1 text-base font-semibold">{contract.name}</h2>
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
                  audience="client"
                  balance={line.balance}
                  unitLabel={line.unitLabel}
                />
              </div>
            </article>
          )),
        )}
      </div>
      <div className="grid gap-3" id="deliverables">
        <h2 className="text-lg font-semibold">الأعمال</h2>
        {summary.deliverables.map((deliverable) => (
          <article
            className="rounded-lg border border-border bg-card p-4"
            key={deliverable.name}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold">{deliverable.name}</h2>
              <span className="rounded-md border border-border px-2 py-1 text-xs text-muted">
                {clientStatusLabel(deliverable.status)}
              </span>
            </div>
            <dl className="mt-3 grid gap-3 text-sm text-muted sm:grid-cols-4">
              <div className="rounded-md bg-background px-3 py-2">
                <dt className="font-semibold text-foreground">النوع</dt>
                <dd className="mt-1">
                  {deliverableTypeLabel(deliverable.type)}
                </dd>
              </div>
              <div className="rounded-md bg-background px-3 py-2">
                <dt className="font-semibold text-foreground">التاريخ</dt>
                <dd className="mt-1">
                  {formatArabicDate(
                    deliverable.clientDueDate ?? deliverable.finalDueDate,
                  )}
                </dd>
              </div>
              <div className="rounded-md bg-background px-3 py-2">
                <dt className="font-semibold text-foreground">الحالة</dt>
                <dd className="mt-1">
                  {clientStatusLabel(deliverable.status)}
                </dd>
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

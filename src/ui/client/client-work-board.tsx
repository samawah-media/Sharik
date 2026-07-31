import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ClientCommercialSummary } from "@/modules/commercial/commercial-summary";
import {
  clientNextAction,
  clientVisibleStatusLabel,
  clientWorkSectionHeading,
  clientWorkSectionIds,
} from "@/modules/deliverables/client-labels";
import { deliverableTypeLabel } from "@/modules/deliverables/domain-labels";
import { EmptyState } from "@/ui/core/states";

type ClientWorkDeliverable = ClientCommercialSummary["deliverables"][number];

const formatDate = (value?: string) => {
  if (!value) {
    return "غير محدد";
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : value.slice(0, 10);
};

const workDetailHref = (deliverableId: string): string =>
  `/client/work/${encodeURIComponent(deliverableId)}`;

export function ClientWorkBoard({
  canApprove,
  deliverables,
}: {
  canApprove: boolean;
  deliverables: ClientWorkDeliverable[];
}) {
  if (deliverables.length === 0) {
    return (
      <EmptyState
        description="ستظهر هنا الأعمال التي يعدّها فريق سماوة لك بمجرد اعتمادها داخليًا وإرسالها."
        title="لا توجد أعمال ظاهرة بعد"
      />
    );
  }

  const byStatus = new Map<string, ClientWorkDeliverable[]>();
  for (const deliverable of deliverables) {
    const bucket = byStatus.get(deliverable.status) ?? [];
    bucket.push(deliverable);
    byStatus.set(deliverable.status, bucket);
  }

  return (
    <div className="grid gap-6" data-testid="client-work-board">
      {clientWorkSectionIds.map((sectionId) => {
        const items = byStatus.get(sectionId) ?? [];
        if (items.length === 0) return null;
        const showChangeRequestNote =
          sectionId === "client_changes_requested";
        const sectionHeading = clientWorkSectionHeading(sectionId, canApprove);
        return (
          <section
            aria-label={sectionHeading}
            className="grid gap-3"
            data-work-section={sectionId}
            key={sectionId}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold">{sectionHeading}</h2>
              <span className="text-xs text-muted">{items.length} عمل</span>
            </div>
            {showChangeRequestNote ? (
              <p
                className="rounded-md border border-accent/20 bg-accent-soft/60 px-3 py-2 text-sm text-foreground"
                data-testid="client-change-request-note"
              >
                استلم فريق سماوة ملاحظاتك، والعمل الآن قيد التعديل. سنعيد إرسال
                النسخة الجديدة فور جهوزيتها.
              </p>
            ) : null}
            <ul className="grid gap-3">
              {items.map((deliverable) => (
                <li key={`${sectionId}-${deliverable.id}`}>
                  <ClientWorkCard
                    canApprove={canApprove}
                    deliverable={deliverable}
                  />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function ClientWorkCard({
  canApprove,
  deliverable,
}: {
  canApprove: boolean;
  deliverable: ClientWorkDeliverable;
}) {
  const href = workDetailHref(deliverable.id);
  const statusLabel = clientVisibleStatusLabel(deliverable.status, canApprove);
  const nextAction = clientNextAction(deliverable.status, canApprove);
  const dueLabel = formatDate(
    deliverable.clientDueDate ?? deliverable.finalDueDate,
  );
  const waiting = deliverable.status === "waiting_client_approval";

  return (
    <Link
      aria-label={`فتح العمل: ${deliverable.name}`}
      className="group grid gap-3 rounded-xl border border-border bg-surface p-4 shadow-xs transition-colors hover:border-accent/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      data-testid="client-work-card"
      data-deliverable-id={deliverable.id}
      href={href}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="grid gap-1">
          <h3 className="text-sm font-semibold leading-6">{deliverable.name}</h3>
          <p className="text-xs text-muted">
            {deliverableTypeLabel(deliverable.type)}
          </p>
        </div>
        <span className="rounded-md border border-border px-2 py-1 text-xs font-medium text-muted">
          {statusLabel}
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-2 text-xs text-muted sm:grid-cols-3">
        <div>
          <dt className="font-semibold text-foreground">الموعد</dt>
          <dd className="mt-1">{dueLabel}</dd>
        </div>
        <div>
          <dt className="font-semibold text-foreground">التقدم</dt>
          <dd className="mt-1">{deliverable.progressPercentage}%</dd>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <dt className="font-semibold text-foreground">الخطوة التالية</dt>
          <dd className="mt-1">{nextAction}</dd>
        </div>
      </dl>
      <div className="flex items-center justify-end gap-1 text-xs font-semibold text-accent">
        <span>{waiting ? "راجع الآن" : "عرض التفاصيل"}</span>
        <ChevronLeft
          aria-hidden="true"
          className="transition-transform group-hover:-translate-x-0.5"
          size={14}
        />
      </div>
    </Link>
  );
}

export function ClientWorkEmptyState() {
  return (
    <EmptyState
      description="لا توجد أعمال في هذه المرحلة بعد. ستظهر هنا فور اعتماد فريق سماوة لأي عمل وإرساله إليك."
      title="لا توجد أعمال ظاهرة بعد"
    />
  );
}

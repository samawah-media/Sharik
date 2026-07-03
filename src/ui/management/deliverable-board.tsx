import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";
import {
  activeKanbanStatuses,
  canChangeDeliverableStatus,
  type ActiveKanbanStatus,
} from "@/modules/deliverables/deliverable-rules";
import { deriveSlaStatus, type SlaStatus } from "@/modules/sla/sla-policy";
import { Badge } from "@/ui/core/badge";
import { Button } from "@/ui/core/button";
import { EmptyState } from "@/ui/core/states";

type StatusUpdateAction = (formData: FormData) => void | Promise<void>;

export const kanbanStatusLabels: Record<ActiveKanbanStatus, string> = {
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
};

const priorityLabels = {
  low: "منخفضة",
  normal: "عادية",
  high: "مرتفعة",
  urgent: "عاجلة",
} as const;

const slaLabels: Record<SlaStatus, string> = {
  on_track: "ضمن المسار",
  at_risk: "معرض للتأخير",
  overdue: "متأخر",
  paused_waiting_client: "متوقف بانتظار العميل",
  paused_waiting_internal_decision: "متوقف بانتظار قرار داخلي",
  completed: "مكتمل",
  cancelled: "ملغي",
};

const formatDate = (value?: string) => {
  if (!value) {
    return "غير محدد";
  }

  const isoDate = /^\d{4}-\d{2}-\d{2}$/.test(value);

  return isoDate ? value.slice(5) : value;
};

const formatPeople = (deliverable: DeliverableSafeSummary) => {
  const contributors = deliverable.contributorUserIds ?? [];

  if (!deliverable.ownerUserId && contributors.length === 0) {
    return "غير محدد";
  }

  return [deliverable.ownerUserId, ...contributors].filter(Boolean).join("، ");
};

const statusOptions = (deliverable: DeliverableSafeSummary) =>
  activeKanbanStatuses.map((status) => {
    const allowed =
      status === deliverable.status ||
      canChangeDeliverableStatus({
        currentStatus: deliverable.status,
        targetStatus: status,
        requiresClientApproval: deliverable.requiresClientApproval,
      }).allowed;

    return { status, allowed };
  });

const priorityTone = (priority: DeliverableSafeSummary["priority"]) => {
  if (priority === "urgent") {
    return "danger";
  }

  if (priority === "high") {
    return "warning";
  }

  return "muted";
};

const slaTone = (status: SlaStatus) => {
  if (status === "overdue") {
    return "danger";
  }

  if (status === "at_risk" || status.startsWith("paused_")) {
    return "warning";
  }

  if (status === "completed") {
    return "success";
  }

  return "accent";
};

function DeliverableStatusControl({
  deliverable,
  action,
}: {
  deliverable: DeliverableSafeSummary;
  action?: StatusUpdateAction;
}) {
  return (
    <details className="mt-4 rounded-lg border border-border bg-background/70">
      <summary className="cursor-pointer list-none px-3 py-2 text-sm font-semibold text-accent marker:hidden">
        تغيير الحالة
      </summary>
      <form
        action={action}
        aria-label={`تغيير حالة ${deliverable.name}`}
        className="grid gap-3 border-t border-border p-3"
        dir="rtl"
      >
        <input name="clientId" type="hidden" value={deliverable.clientId} />
        <input name="deliverableId" type="hidden" value={deliverable.id} />
        <input
          name="expectedRevision"
          type="hidden"
          value={deliverable.revision}
        />
        <input
          name="idempotencyKey"
          type="hidden"
          value={`f004-status-${deliverable.id}-${deliverable.revision}`}
        />
        <label className="grid gap-1 text-xs font-semibold">
          الحالة
          <select
            className="min-h-9 rounded-md border border-border bg-surface px-2 py-1 text-sm"
            defaultValue={deliverable.status}
            name="toStatus"
          >
            {statusOptions(deliverable).map(({ status, allowed }) => (
              <option disabled={!allowed} key={status} value={status}>
                {kanbanStatusLabels[status]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-semibold">
          سبب التغيير
          <input
            className="min-h-9 rounded-md border border-border bg-surface px-2 py-1 text-sm"
            maxLength={500}
            name="reason"
            placeholder="اختياري"
          />
        </label>
        <Button size="sm" type="submit" variant="primary">
          تحديث الحالة
        </Button>
      </form>
    </details>
  );
}

function DeliverableCard({
  deliverable,
  action,
  now,
}: {
  deliverable: DeliverableSafeSummary;
  action?: StatusUpdateAction;
  now: string;
}) {
  const sla = deriveSlaStatus({
    status: deliverable.status,
    now,
    startDate: deliverable.startDate,
    internalDueDate: deliverable.internalDueDate,
    clientDueDate: deliverable.clientDueDate,
    finalDueDate: deliverable.finalDueDate,
  });
  const statusLabel = activeKanbanStatuses.includes(
    deliverable.status as ActiveKanbanStatus,
  )
    ? kanbanStatusLabels[deliverable.status as ActiveKanbanStatus]
    : deliverable.status;

  return (
    <article className="min-w-0 overflow-hidden rounded-lg border border-border bg-surface p-4 shadow-sm">
      <div className="grid gap-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 text-sm font-semibold leading-6">
            {deliverable.name}
          </h3>
          <Badge tone="accent">{deliverable.progressPercentage}%</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="neutral">{statusLabel}</Badge>
          <Badge tone="muted">{deliverable.type}</Badge>
          <Badge tone={priorityTone(deliverable.priority)}>
            {priorityLabels[deliverable.priority]}
          </Badge>
          <Badge tone={slaTone(sla.status)}>{slaLabels[sla.status]}</Badge>
        </div>
      </div>
      <dl className="mt-4 grid gap-3 text-xs text-muted">
        <div className="min-w-0">
          <dt className="font-semibold text-foreground">المسؤولون</dt>
          <dd className="mt-1 truncate">{formatPeople(deliverable)}</dd>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="min-w-0 rounded-md bg-background px-2 py-2">
            <dt className="font-semibold text-foreground">داخلي</dt>
            <dd className="mt-1 truncate">
              {formatDate(deliverable.internalDueDate)}
            </dd>
          </div>
          <div className="min-w-0 rounded-md bg-background px-2 py-2">
            <dt className="font-semibold text-foreground">العميل</dt>
            <dd className="mt-1 truncate">
              {formatDate(deliverable.clientDueDate)}
            </dd>
          </div>
          <div className="min-w-0 rounded-md bg-background px-2 py-2">
            <dt className="font-semibold text-foreground">نهائي</dt>
            <dd className="mt-1 truncate">
              {formatDate(deliverable.finalDueDate)}
            </dd>
          </div>
        </div>
      </dl>
      <DeliverableStatusControl action={action} deliverable={deliverable} />
    </article>
  );
}

export function DeliverableBoardEmptyState() {
  return (
    <EmptyState
      description="أضف مخرجات متفقًا عليها أولًا حتى تظهر ضمن سير العمل الداخلي."
      title="لا توجد مخرجات على اللوحة بعد"
    />
  );
}

export function DeliverableBoard({
  deliverables,
  action,
  now = new Date().toISOString(),
}: {
  deliverables: DeliverableSafeSummary[];
  action?: StatusUpdateAction;
  now?: string;
}) {
  if (deliverables.length === 0) {
    return <DeliverableBoardEmptyState />;
  }

  const deliverablesByStatus = new Map<
    ActiveKanbanStatus,
    DeliverableSafeSummary[]
  >(activeKanbanStatuses.map((status) => [status, []]));

  for (const deliverable of deliverables) {
    if (
      activeKanbanStatuses.includes(deliverable.status as ActiveKanbanStatus)
    ) {
      deliverablesByStatus
        .get(deliverable.status as ActiveKanbanStatus)
        ?.push(deliverable);
    }
  }

  return (
    <section
      aria-label="لوحة المتابعة"
      className="-mx-4 overflow-x-auto px-4 pb-4"
      data-testid="kanban-board-scroll"
      dir="rtl"
    >
      <div className="flex min-w-max gap-4">
        {activeKanbanStatuses.map((status) => {
          const items = deliverablesByStatus.get(status) ?? [];

          return (
            <section
              aria-label={kanbanStatusLabels[status]}
              className="flex min-h-[32rem] w-80 min-w-80 flex-col rounded-lg border border-border bg-background"
              data-testid="kanban-column"
              key={status}
            >
              <div className="sticky top-0 z-10 flex items-start justify-between gap-2 border-b border-border bg-background/95 p-3">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold">
                    {kanbanStatusLabels[status]}
                  </h2>
                  <p className="mt-1 text-xs text-muted">مرحلة تشغيل داخلية</p>
                </div>
                <Badge tone="muted">{items.length}</Badge>
              </div>
              <div className="grid content-start gap-3 p-3">
                {items.length > 0 ? (
                  items.map((deliverable) => (
                    <DeliverableCard
                      action={action}
                      deliverable={deliverable}
                      key={deliverable.id}
                      now={now}
                    />
                  ))
                ) : (
                  <p className="rounded-lg border border-dashed border-border bg-surface p-4 text-sm leading-6 text-muted">
                    ما فيه مخرجات في هذه المرحلة.
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}

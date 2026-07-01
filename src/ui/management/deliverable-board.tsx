import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";
import {
  activeKanbanStatuses,
  canChangeDeliverableStatus,
  type ActiveKanbanStatus,
} from "@/modules/deliverables/deliverable-rules";
import { deriveSlaStatus, type SlaStatus } from "@/modules/sla/sla-policy";

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

const formatDate = (value?: string) => value ?? "غير محدد";

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

function DeliverableStatusControl({
  deliverable,
  action,
}: {
  deliverable: DeliverableSafeSummary;
  action?: StatusUpdateAction;
}) {
  return (
    <form
      action={action}
      aria-label={`تغيير حالة ${deliverable.name}`}
      className="mt-4 grid gap-2"
      dir="rtl"
    >
      <input name="clientId" type="hidden" value={deliverable.clientId} />
      <input name="deliverableId" type="hidden" value={deliverable.id} />
      <input name="expectedRevision" type="hidden" value={deliverable.revision} />
      <input
        name="idempotencyKey"
        type="hidden"
        value={`f004-status-${deliverable.id}-${deliverable.revision}`}
      />
      <label className="grid gap-1 text-xs font-semibold">
        الحالة
        <select
          className="min-h-9 rounded-md border border-border bg-background px-2 py-1 text-sm"
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
          className="min-h-9 rounded-md border border-border bg-background px-2 py-1 text-sm"
          maxLength={500}
          name="reason"
          placeholder="اختياري"
        />
      </label>
      <button
        className="w-fit rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
        type="submit"
      >
        تحديث الحالة
      </button>
    </form>
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

  return (
    <article className="rounded-lg border border-border bg-card p-3">
      <div className="grid gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold leading-6">{deliverable.name}</h3>
          <span className="rounded-md border border-border px-2 py-1 text-xs text-muted">
            {deliverable.progressPercentage}%
          </span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted">
          <span>{deliverable.type}</span>
          <span>{priorityLabels[deliverable.priority]}</span>
          <span>{slaLabels[sla.status]}</span>
        </div>
      </div>
      <dl className="mt-3 grid gap-2 text-xs text-muted">
        <div>
          <dt className="font-semibold text-foreground">المسؤولون</dt>
          <dd>{formatPeople(deliverable)}</dd>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <dt className="font-semibold text-foreground">داخلي</dt>
            <dd>{formatDate(deliverable.internalDueDate)}</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">العميل</dt>
            <dd>{formatDate(deliverable.clientDueDate)}</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">نهائي</dt>
            <dd>{formatDate(deliverable.finalDueDate)}</dd>
          </div>
        </div>
      </dl>
      <DeliverableStatusControl action={action} deliverable={deliverable} />
    </article>
  );
}

export function DeliverableBoardEmptyState() {
  return (
    <section
      aria-label="حالة لوحة المخرجات الفارغة"
      className="rounded-lg border border-dashed border-border p-6"
      dir="rtl"
    >
      <h2 className="text-lg font-semibold">لا توجد مخرجات على اللوحة بعد</h2>
      <p className="mt-2 text-sm text-muted">
        أضف مخرجات متفقًا عليها أولًا حتى تظهر ضمن سير العمل الداخلي.
      </p>
    </section>
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

  const deliverablesByStatus = new Map<ActiveKanbanStatus, DeliverableSafeSummary[]>(
    activeKanbanStatuses.map((status) => [status, []]),
  );

  for (const deliverable of deliverables) {
    if (activeKanbanStatuses.includes(deliverable.status as ActiveKanbanStatus)) {
      deliverablesByStatus
        .get(deliverable.status as ActiveKanbanStatus)
        ?.push(deliverable);
    }
  }

  return (
    <section
      aria-label="لوحة Kanban الداخلية"
      className="overflow-x-auto pb-2"
      dir="rtl"
    >
      <div className="grid min-w-[1120px] grid-cols-10 gap-3">
        {activeKanbanStatuses.map((status) => {
          const items = deliverablesByStatus.get(status) ?? [];

          return (
            <section
              aria-label={kanbanStatusLabels[status]}
              className="grid min-h-64 content-start gap-3 rounded-lg border border-border bg-muted/30 p-3"
              key={status}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">{kanbanStatusLabels[status]}</h2>
                <span className="rounded-md border border-border bg-background px-2 py-1 text-xs text-muted">
                  {items.length}
                </span>
              </div>
              {items.map((deliverable) => (
                <DeliverableCard
                  action={action}
                  deliverable={deliverable}
                  key={deliverable.id}
                  now={now}
                />
              ))}
            </section>
          );
        })}
      </div>
    </section>
  );
}

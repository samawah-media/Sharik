"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useState } from "react";
import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";
import type { DeliverableWorkspace } from "@/modules/deliverables/deliverable-workspace";
import {
  activeKanbanStatuses,
  canChangeDeliverableStatus,
  genericOperationalStatuses,
  getProgressForDeliverableStatus,
  type ActiveKanbanStatus,
} from "@/modules/deliverables/deliverable-rules";
import { deriveSlaStatus, type SlaStatus } from "@/modules/sla/sla-policy";
import { Badge } from "@/ui/core/badge";
import { Button } from "@/ui/core/button";
import { EmptyState } from "@/ui/core/states";
import { DeliverableApprovalWorkflowControl } from "./deliverable-actions";
import { DeliverableStatusDisclosure } from "./deliverable-status-disclosure";
import { UniversalDeliverableDrawer } from "@/ui/deliverables/universal-deliverable-drawer";
import { moveDeliverableOnBoard } from "@/server/actions/deliverable-workspace-actions";

type StatusUpdateAction = (formData: FormData) => void | Promise<void>;

function DeliverableVersionSubmissionControl({
  deliverable,
  action,
}: {
  deliverable: DeliverableSafeSummary;
  action?: StatusUpdateAction;
}) {
  if (
    !action ||
    ![
      "not_started",
      "in_progress",
      "internal_changes_requested",
      "client_changes_requested",
    ].includes(deliverable.status)
  ) {
    return null;
  }

  return (
    <form
      action={action}
      aria-label={`رفع نسخة ${deliverable.name}`}
      className="mt-4 grid gap-2 rounded-lg border border-border bg-background/70 p-3"
      dir="rtl"
    >
      <input name="clientId" type="hidden" value={deliverable.clientId} />
      <input name="deliverableId" type="hidden" value={deliverable.id} />
      <input
        name="idempotencyKey"
        type="hidden"
        value={`s015-submit-${deliverable.id}-${deliverable.revision}`}
      />
      <label className="grid gap-1 text-xs font-semibold">
        رقم النسخة
        <input
          className="min-h-11 rounded-md border border-border bg-surface px-2"
          min={1}
          name="versionNumber"
          required
          type="number"
        />
      </label>
      <label className="grid gap-1 text-xs font-semibold">
        ملاحظة داخلية
        <textarea
          className="min-h-16 rounded-md border border-border bg-surface px-2 py-1"
          maxLength={2000}
          name="reason"
        />
      </label>
      <Button size="sm" type="submit" variant="secondary">
        رفع النسخة للمراجعة الداخلية
      </Button>
    </form>
  );
}

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

type MacroLane = {
  id: string;
  label: string;
  statuses: readonly ActiveKanbanStatus[];
  targetStatus?: "not_started" | "in_progress";
};

const macroLanes: readonly MacroLane[] = [
  { id: "planning", label: "لم يبدأ", statuses: ["not_started"], targetStatus: "not_started" },
  { id: "execution", label: "قيد التنفيذ والتعديلات", statuses: ["in_progress", "internal_changes_requested", "client_changes_requested"], targetStatus: "in_progress" },
  { id: "internal-review", label: "المراجعة الداخلية", statuses: ["ready_for_internal_review", "internally_approved"] },
  { id: "client-review", label: "مراجعة العميل", statuses: ["waiting_client_approval", "client_approved"] },
  { id: "delivery", label: "جاهز للتسليم", statuses: ["ready_for_delivery"] },
  { id: "completed", label: "تم التسليم", statuses: ["delivered"] },
];

const formatDate = (value?: string) => {
  if (!value) {
    return "غير محدد";
  }

  const isoDate = /^\d{4}-\d{2}-\d{2}$/.test(value);

  return isoDate ? value.slice(5) : value;
};

const formatPeople = (deliverable: DeliverableSafeSummary) => {
  const members = [
    deliverable.ownerDisplay,
    ...(deliverable.contributorDisplays ?? []),
  ].filter(Boolean);

  if (members.length === 0) {
    return "غير محدد";
  }

  return [...new Set(members.map((member) => member?.displayName))].join("، ");
};

const statusOptions = (deliverable: DeliverableSafeSummary) =>
  genericOperationalStatuses.map((status) => {
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
    <DeliverableStatusDisclosure label={`تغيير الحالة ${deliverable.name}`}>
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
            className="min-h-11 rounded-md border border-border bg-surface px-2 py-1 text-sm"
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
            className="min-h-11 rounded-md border border-border bg-surface px-2 py-1 text-sm"
            maxLength={500}
            name="reason"
            placeholder="اختياري"
          />
        </label>
        <Button size="sm" type="submit" variant="primary">
          تحديث الحالة
        </Button>
      </form>
    </DeliverableStatusDisclosure>
  );
}

function DeliverableCard({
  deliverable,
  action,
  approvalAction,
  versionAction,
  workspace,
  canPublishClientComment,
  now,
}: {
  deliverable: DeliverableSafeSummary;
  action?: StatusUpdateAction;
  approvalAction?: StatusUpdateAction;
  versionAction?: StatusUpdateAction;
  workspace?: DeliverableWorkspace;
  canPublishClientComment: boolean;
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
    <article className="min-w-0 overflow-hidden rounded-xl border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md">
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
      <div
        className="mt-4 h-1.5 overflow-hidden rounded-full bg-border"
        aria-label={`تقدم ${deliverable.progressPercentage}%`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={deliverable.progressPercentage}
      >
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${deliverable.progressPercentage}%` }}
        />
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
      <DeliverableApprovalWorkflowControl
        action={approvalAction}
        deliverable={deliverable}
      />
      <div className="mt-4">
        <UniversalDeliverableDrawer
          approvalAction={approvalAction}
          canPublishClientComment={canPublishClientComment}
          deliverable={deliverable}
          workspace={workspace}
        />
      </div>
      <DeliverableVersionSubmissionControl
        action={versionAction}
        deliverable={deliverable}
      />
      {action ? (
        <DeliverableStatusControl action={action} deliverable={deliverable} />
      ) : null}
    </article>
  );
}

function DraggableDeliverableCard({
  canDrag,
  children,
  deliverable,
}: {
  canDrag: boolean;
  children: React.ReactNode;
  deliverable: DeliverableSafeSummary;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: deliverable.id,
      data: { deliverableId: deliverable.id },
      disabled: !canDrag,
    });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.55 : 1,
      }}
    >
      {canDrag ? (
        <button
          aria-label={`سحب ${deliverable.name}. استخدم مفتاح المسافة ثم الأسهم للتحريك.`}
          className="mb-1 flex min-h-11 w-full touch-none items-center justify-center rounded-lg border border-dashed border-border bg-surface text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          type="button"
          {...listeners}
          {...attributes}
        >
          <GripVertical aria-hidden="true" size={18} />
          <span className="ms-2 text-xs">تحريك البطاقة</span>
        </button>
      ) : null}
      {children}
    </div>
  );
}

function MacroLaneColumn({
  activeDeliverable,
  children,
  lane,
}: {
  activeDeliverable?: DeliverableSafeSummary;
  children: React.ReactNode;
  lane: MacroLane;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: lane.id });
  const valid = Boolean(
    activeDeliverable &&
      lane.targetStatus &&
      canChangeDeliverableStatus({
        currentStatus: activeDeliverable.status,
        targetStatus: lane.targetStatus,
        requiresClientApproval: activeDeliverable.requiresClientApproval,
      }).allowed,
  );
  return (
    <section
      aria-label={lane.label}
      className={`flex min-h-[32rem] w-[20rem] min-w-[20rem] flex-col rounded-xl border bg-background ${isOver && valid ? "border-accent ring-2 ring-accent/30" : "border-border"}`}
      data-drop-valid={valid ? "true" : "false"}
      data-testid="kanban-column"
      ref={setNodeRef}
    >
      {children}
    </section>
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
  approvalAction,
  versionAction,
  workspaces = {},
  now = new Date().toISOString(),
}: {
  deliverables: DeliverableSafeSummary[];
  action?: StatusUpdateAction;
  approvalAction?: StatusUpdateAction;
  versionAction?: StatusUpdateAction;
  workspaces?: Record<string, DeliverableWorkspace>;
  now?: string;
}) {
  const [items, setItems] = useState(deliverables);
  const [activeId, setActiveId] = useState<string>();
  const [dragFeedback, setDragFeedback] = useState<string>();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const activeDeliverable = items.find((item) => item.id === activeId);

  if (deliverables.length === 0) {
    return <DeliverableBoardEmptyState />;
  }

  const finishDrag = async ({ active, over }: DragEndEvent) => {
    setActiveId(undefined);
    if (!over || !action) return;
    const deliverable = items.find((item) => item.id === active.id);
    const lane = macroLanes.find((item) => item.id === over.id);
    if (!deliverable || !lane?.targetStatus) {
      setDragFeedback("هذه المرحلة تحتاج إجراء اعتماد مخصصًا من داخل مساحة المخرج.");
      return;
    }
    const targetStatus = lane.targetStatus;
    const decision = canChangeDeliverableStatus({
      currentStatus: deliverable.status,
      targetStatus,
      requiresClientApproval: deliverable.requiresClientApproval,
    });
    if (!decision.allowed || deliverable.status === targetStatus) {
      setDragFeedback(
        deliverable.status === targetStatus
          ? undefined
          : "لا يمكن تنفيذ هذه الحركة بالسحب. استخدم الإجراء المخصص للحالة.",
      );
      return;
    }
    const previous = items;
    setItems((current) =>
      current.map((item) =>
        item.id === deliverable.id
          ? {
              ...item,
              status: targetStatus,
              progressPercentage: getProgressForDeliverableStatus(targetStatus),
              revision: item.revision + 1,
            }
          : item,
      ),
    );
    setDragFeedback("جارٍ حفظ الحركة…");
    const result = await moveDeliverableOnBoard({
      clientId: deliverable.clientId,
      deliverableId: deliverable.id,
      toStatus: targetStatus,
      expectedRevision: deliverable.revision,
      idempotencyKey: `s015-drag-${deliverable.id}-${deliverable.revision}-${crypto.randomUUID()}`,
    });
    if (!result.ok) {
      setItems(previous);
      setDragFeedback("تعذر حفظ الحركة وأُعيدت البطاقة إلى مكانها. راجع الصلاحية أو حدّث الصفحة.");
    } else {
      setDragFeedback("تم حفظ الحركة وتسجيلها في سجل النشاط.");
    }
  };

  return (
    <section
      aria-label="لوحة العمل"
      className="-mx-4 overflow-x-auto px-4 pb-4"
      data-testid="kanban-board-scroll"
      dir="rtl"
    >
      {dragFeedback ? <p aria-live="polite" className="mb-3 rounded-lg bg-surface px-3 py-2 text-sm">{dragFeedback}</p> : null}
      <DndContext
        collisionDetection={closestCenter}
        id="deliverables-board"
        onDragCancel={() => setActiveId(undefined)}
        onDragEnd={finishDrag}
        onDragStart={({ active }) => setActiveId(String(active.id))}
        sensors={sensors}
      >
      <div className="flex min-w-max gap-4">
        {macroLanes.map((lane) => {
          const laneItems = items.filter((deliverable) =>
            lane.statuses.includes(deliverable.status as never),
          );

          return (
            <MacroLaneColumn activeDeliverable={activeDeliverable} key={lane.id} lane={lane}>
              <div className="sticky top-0 z-10 flex items-start justify-between gap-2 border-b border-border bg-background/95 p-3">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold">
                    {lane.label}
                  </h2>
                  <p className="mt-1 text-xs text-muted">مسار بصري يجمع حالات قاعدة البيانات كما هي</p>
                </div>
                <Badge tone="muted">{laneItems.length}</Badge>
              </div>
              <div className="grid content-start gap-3 p-3">
                {laneItems.length > 0 ? (
                  laneItems.map((deliverable) => (
                    <DraggableDeliverableCard
                      canDrag={Boolean(action)}
                      deliverable={deliverable}
                      key={deliverable.id}
                    >
                    <DeliverableCard
                      action={action}
                      approvalAction={approvalAction}
                      canPublishClientComment={Boolean(approvalAction)}
                      versionAction={versionAction}
                      deliverable={deliverable}
                      now={now}
                      workspace={workspaces[deliverable.id]}
                    />
                    </DraggableDeliverableCard>
                  ))
                ) : (
                  <p className="rounded-lg border border-dashed border-border bg-surface p-4 text-sm leading-6 text-muted">
                    ما فيه مخرجات في هذه المرحلة.
                  </p>
                )}
              </div>
            </MacroLaneColumn>
          );
        })}
      </div>
      </DndContext>
    </section>
  );
}

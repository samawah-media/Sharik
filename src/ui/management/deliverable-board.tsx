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
import {
  Clock3,
  GripVertical,
  MessageSquare,
  Paperclip,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";
import type { DeliverableWorkspaceSummary } from "@/modules/deliverables/deliverable-workspace";
import {
  canChangeDeliverableStatus,
  genericOperationalStatuses,
  getProgressForDeliverableStatus,
  type ActiveKanbanStatus,
  type DeliverableLifecycleStatus,
} from "@/modules/deliverables/deliverable-rules";
import { deriveSlaStatus, type SlaStatus } from "@/modules/sla/sla-policy";
import { Badge } from "@/ui/core/badge";
import { Button } from "@/ui/core/button";
import { EmptyState } from "@/ui/core/states";
import { DeliverableStatusDisclosure } from "./deliverable-status-disclosure";
import { UniversalDeliverableDrawer } from "@/ui/deliverables/universal-deliverable-drawer";
import { formatArabicDate } from "@/modules/localization/arabic-display";
import {
  projectTeamWork,
  type TeamWorkCapabilities,
} from "@/modules/deliverables/team-work-presentation";
import { moveDeliverableOnBoard } from "@/server/actions/deliverable-workspace-actions";

type StatusUpdateAction = (formData: FormData) => void | Promise<void>;

export const kanbanStatusLabels: Record<DeliverableLifecycleStatus, string> = {
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
  cancelled: "ملغي",
  archived: "مؤرشف",
};

export const priorityLabels = {
  low: "منخفضة",
  normal: "عادية",
  high: "مرتفعة",
  urgent: "عاجلة",
} as const;

export const slaLabels: Record<SlaStatus, string> = {
  on_track: "ضمن المسار",
  at_risk: "معرض للتأخير",
  overdue: "متأخر",
  paused_waiting_client: "متوقف بانتظار العميل",
  paused_waiting_internal_decision: "متوقف بانتظار قرار داخلي",
  completed: "مكتمل",
  cancelled: "ملغي",
};

export const deliverableTypeLabels: Record<string, string> = {
  post: "منشور",
  reel: "ريلز",
  story: "ستوري",
  design: "تصميم",
  report: "تقرير",
  video: "فيديو",
  campaign: "حملة",
  article: "مقال",
  marketing_coordination: "تنسيق تسويقي",
};

export const getDeliverableTypeLabel = (type: string) =>
  deliverableTypeLabels[type] ?? "مخرج مخصص";

type MacroLane = {
  id: string;
  label: string;
  statuses: readonly ActiveKanbanStatus[];
  targetStatus?: "not_started" | "in_progress";
};

const macroLanes: readonly MacroLane[] = [
  {
    id: "planning",
    label: "لم يبدأ",
    statuses: ["not_started"],
    targetStatus: "not_started",
  },
  {
    id: "execution",
    label: "قيد التنفيذ والتعديلات",
    statuses: [
      "in_progress",
      "internal_changes_requested",
      "client_changes_requested",
    ],
    targetStatus: "in_progress",
  },
  {
    id: "internal-review",
    label: "المراجعة الداخلية",
    statuses: ["ready_for_internal_review", "internally_approved"],
  },
  {
    id: "client-review",
    label: "مراجعة العميل",
    statuses: ["waiting_client_approval"],
  },
  {
    id: "client-approved",
    label: "معتمد من العميل",
    statuses: ["client_approved"],
  },
  { id: "delivery", label: "جاهز للتسليم", statuses: ["ready_for_delivery"] },
  { id: "completed", label: "تم التسليم", statuses: ["delivered"] },
];

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

const protectedMoveExplanation =
  "السحب متاح فقط بين لم يبدأ وقيد التنفيذ. المراجعة والاعتماد والإرسال والتسليم تتم من مساحة المخرج بأزرار محمية ومدققة.";

const kanbanDeniedReasonLabel = (
  reason: Exclude<
    ReturnType<typeof canChangeDeliverableStatus>,
    { allowed: true }
  >["reason"],
) => {
  switch (reason) {
    case "terminal_status_locked":
      return "الحالات النهائية لا تُفتح من اللوحة.";
    case "protected_status_requires_command":
      return "هذه المرحلة تحتاج إجراء workflow محميًا من مساحة المخرج.";
    case "unsafe_operational_transition":
      return "هذه الحركة ليست انتقال تشغيل مباشرًا مسموحًا.";
    case "target_status_not_on_board":
      return "المرحلة غير متاحة على اللوحة.";
    case "internal_approval_required_before_client_waiting":
      return "لا يمكن انتظار العميل قبل الاعتماد الداخلي.";
    case "client_approval_required_before_delivery":
      return "لا يمكن التسليم قبل اعتماد العميل وتجهيز التسليم.";
  }
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
  summary,
  clientName,
  canPublishClientComment,
  nextActionLabel,
  now,
}: {
  deliverable: DeliverableSafeSummary;
  action?: StatusUpdateAction;
  approvalAction?: StatusUpdateAction;
  summary?: DeliverableWorkspaceSummary;
  clientName?: string;
  canPublishClientComment: boolean;
  nextActionLabel?: string;
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
  const statusLabel = kanbanStatusLabels[deliverable.status];

  const due =
    deliverable.internalDueDate ??
    deliverable.clientDueDate ??
    deliverable.finalDueDate ??
    deliverable.plannedPublishDate;
  const owner = deliverable.ownerDisplay;
  return (
    <article className="min-w-0" data-testid="compact-board-card">
      <UniversalDeliverableDrawer
        approvalAction={approvalAction}
        canPublishClientComment={canPublishClientComment}
        clientName={clientName}
        deliverable={deliverable}
        nextActionLabel={nextActionLabel}
        summary={summary}
        operationalControl={
          action ? (
            <DeliverableStatusControl
              action={action}
              deliverable={deliverable}
            />
          ) : undefined
        }
        triggerClassName="group grid min-h-32 w-full cursor-pointer gap-2.5 rounded-xl border border-border/80 bg-surface p-3 text-right shadow-sm transition-[border-color,box-shadow] hover:border-accent/45 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        triggerContent={
          <>
            <span className="flex flex-wrap items-center gap-1.5 text-xs">
              {clientName ? (
                <span className="max-w-40 truncate rounded-md bg-accent-soft px-2 py-0.5 font-semibold text-accent">
                  {clientName}
                </span>
              ) : null}
              <span className="rounded-md bg-background px-2 py-0.5 text-muted">
                {getDeliverableTypeLabel(deliverable.type)}
              </span>
              {deliverable.priority === "urgent" ||
              deliverable.priority === "high" ? (
                <span className="rounded-md bg-warning/10 px-2 py-0.5 text-warning">
                  {priorityLabels[deliverable.priority]}
                </span>
              ) : null}
            </span>
            <span
              className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-foreground"
              title={deliverable.name}
            >
              {deliverable.name}
            </span>
            <span className="flex min-h-6 items-center justify-between gap-2 text-xs text-muted">
              <span
                className={`inline-flex items-center gap-1 rounded-md px-1.5 py-1 ${sla.status === "overdue" ? "bg-danger/10 text-danger" : due ? "bg-accent-soft/60" : ""}`}
                title={slaLabels[sla.status]}
              >
                <Clock3 aria-hidden="true" size={13} />
                {due ? formatArabicDate(due) : "بلا موعد"}
              </span>
              <span className="flex items-center gap-2">
                {Boolean(summary?.counts.files) ? (
                  <span
                    aria-label={`${summary?.counts.files} ملفات`}
                    className="inline-flex items-center gap-1"
                  >
                    <Paperclip aria-hidden="true" size={13} />
                    {summary?.counts.files}
                  </span>
                ) : null}
                {Boolean(summary?.counts.comments) ? (
                  <span
                    aria-label={`${summary?.counts.comments} تعليقات`}
                    className="inline-flex items-center gap-1"
                  >
                    <MessageSquare aria-hidden="true" size={13} />
                    {summary?.counts.comments}
                  </span>
                ) : null}
                <span
                  className="grid size-6 place-items-center rounded-full border-2 border-white bg-accent-soft font-bold text-accent ring-1 ring-border"
                  title={owner?.displayName ?? "بانتظار الإسناد"}
                >
                  {owner?.initial ?? "—"}
                </span>
              </span>
            </span>
            <span className="sr-only">
              {statusLabel}، تقدم {deliverable.progressPercentage}%،{" "}
              {slaLabels[sla.status]}
            </span>
          </>
        }
      />
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
      className="group/drag relative"
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.55 : 1,
      }}
    >
      {canDrag ? (
        <button
          aria-label={`سحب ${deliverable.name}. استخدم مفتاح المسافة ثم الأسهم للتحريك.`}
          className="absolute -end-1 top-8 z-10 flex min-h-11 min-w-11 touch-none cursor-grab items-center justify-center rounded-lg text-muted opacity-60 transition-opacity hover:bg-accent-soft hover:text-accent active:cursor-grabbing sm:opacity-0 sm:group-hover/drag:opacity-100 sm:focus-visible:opacity-100"
          type="button"
          {...listeners}
          {...attributes}
        >
          <GripVertical aria-hidden="true" size={18} />
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
      className={`flex min-h-80 w-[17rem] min-w-[17rem] flex-col rounded-2xl border bg-board-lane/85 ${isOver && valid ? "border-accent ring-2 ring-accent/30" : "border-border/50"}`}
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
  workspaces = {},
  clientNames = {},
  nextActionByDeliverable: providedNextActionByDeliverable = {},
  now = new Date().toISOString(),
  actorUserId,
  capabilitiesByDeliverable,
  showFilters = true,
}: {
  deliverables: DeliverableSafeSummary[];
  action?: StatusUpdateAction;
  approvalAction?: StatusUpdateAction;
  workspaces?: Record<string, DeliverableWorkspaceSummary>;
  clientNames?: Record<string, string>;
  nextActionByDeliverable?: Record<string, string>;
  now?: string;
  actorUserId?: string;
  capabilitiesByDeliverable?: Record<string, TeamWorkCapabilities>;
  showFilters?: boolean;
}) {
  const [items, setItems] = useState(deliverables);
  const [search, setSearch] = useState("");
  const [assignee, setAssignee] = useState("all");
  const [priority, setPriority] = useState("all");
  const members = useMemo(
    () => [
      ...new Map(
        items.flatMap((item) =>
          [
            ...(item.ownerDisplay ? [item.ownerDisplay] : []),
            ...(item.contributorDisplays ?? []),
          ].map((member) => [member.userId, member] as const),
        ),
      ).values(),
    ],
    [items],
  );
  const filteredItems = items.filter((item) => {
    const query = search.trim().toLocaleLowerCase("ar");
    return (
      (!query ||
        `${item.name} ${clientNames[item.clientId] ?? ""}`
          .toLocaleLowerCase("ar")
          .includes(query)) &&
      (assignee === "all" ||
        (assignee === "mine"
          ? item.ownerUserId === actorUserId ||
            item.contributorUserIds.includes(actorUserId ?? "")
          : item.ownerUserId === assignee ||
            item.contributorUserIds.includes(assignee))) &&
      (priority === "all" || item.priority === priority)
    );
  });

  const nextActionByDeliverable = useMemo(() => {
    if (!actorUserId || !capabilitiesByDeliverable) {
      return providedNextActionByDeliverable;
    }
    const presented = projectTeamWork({
      actorUserId,
      capabilitiesByDeliverable,
      deliverables: items,
      now,
      workspaces,
    });
    return Object.fromEntries(
      presented.map(({ deliverable, nextAction }) => [
        deliverable.id,
        nextAction,
      ]),
    );
  }, [
    actorUserId,
    capabilitiesByDeliverable,
    items,
    now,
    workspaces,
    providedNextActionByDeliverable,
  ]);
  const [activeId, setActiveId] = useState<string>();
  const [dragFeedback, setDragFeedback] = useState<string>();
  const [pendingDeliverableIds, setPendingDeliverableIds] = useState<
    Set<string>
  >(() => new Set());
  const pendingDeliverableIdsRef = useRef(new Set<string>());
  const boardRef = useRef<HTMLElement>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const activeDeliverable = items.find((item) => item.id === activeId);
  const scrollBoardWithKeyboard = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    if (
      event.target !== event.currentTarget ||
      document.activeElement !== event.currentTarget
    ) {
      return;
    }
    event.preventDefault();
    event.currentTarget.scrollBy({
      left: event.key === "ArrowLeft" ? -320 : 320,
      behavior: "smooth",
    });
  };
  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    const fitBoardToViewport = () => {
      const top = Math.max(0, board.getBoundingClientRect().top);
      board.style.height = `${Math.max(160, window.innerHeight - top - 12)}px`;
    };
    fitBoardToViewport();
    window.addEventListener("resize", fitBoardToViewport);
    const layoutObserver =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(fitBoardToViewport);
    if (board.parentElement) layoutObserver?.observe(board.parentElement);

    return () => {
      window.removeEventListener("resize", fitBoardToViewport);
      layoutObserver?.disconnect();
    };
  }, []);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    const scrollBoardWithMouseWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
      if (board.scrollWidth <= board.clientWidth) return;

      const canMoveVertically = (element: HTMLElement) => {
        if (element.scrollHeight <= element.clientHeight) return false;
        return event.deltaY > 0
          ? element.scrollTop + element.clientHeight < element.scrollHeight
          : element.scrollTop > 0;
      };
      let verticalTarget =
        event.target instanceof HTMLElement
          ? event.target
          : event.target instanceof Element
            ? event.target.parentElement
            : null;
      while (verticalTarget) {
        if (canMoveVertically(verticalTarget)) return;
        if (verticalTarget === board) break;
        verticalTarget = verticalTarget.parentElement;
      }

      const previousScrollLeft = board.scrollLeft;
      const direction = board.dir === "rtl" ? -1 : 1;
      board.scrollBy({
        behavior: "auto",
        left: event.deltaY * direction,
      });
      if (board.scrollLeft !== previousScrollLeft) {
        event.preventDefault();
      }
    };

    board.addEventListener("wheel", scrollBoardWithMouseWheel, {
      passive: false,
    });
    return () => board.removeEventListener("wheel", scrollBoardWithMouseWheel);
  }, []);

  if (deliverables.length === 0) {
    return <DeliverableBoardEmptyState />;
  }

  const finishDrag = async ({ active, over }: DragEndEvent) => {
    setActiveId(undefined);
    if (!over || !action) return;
    const deliverable = items.find((item) => item.id === active.id);
    const lane = macroLanes.find((item) => item.id === over.id);
    if (!deliverable || !lane?.targetStatus) {
      setDragFeedback(
        "هذه المرحلة تحتاج إجراء اعتماد مخصصًا من داخل مساحة المخرج.",
      );
      return;
    }
    const canUpdateDeliverable = capabilitiesByDeliverable
      ? capabilitiesByDeliverable[deliverable.id]?.canUpdateStatus === true
      : true;
    if (
      !canUpdateDeliverable ||
      pendingDeliverableIdsRef.current.has(deliverable.id)
    ) {
      return;
    }
    const targetStatus = lane.targetStatus;
    const decision = canChangeDeliverableStatus({
      currentStatus: deliverable.status,
      targetStatus,
      requiresClientApproval: deliverable.requiresClientApproval,
    });
    if (deliverable.status === targetStatus) {
      setDragFeedback(undefined);
      return;
    }
    if (!decision.allowed) {
      setDragFeedback(kanbanDeniedReasonLabel(decision.reason));
      return;
    }
    pendingDeliverableIdsRef.current.add(deliverable.id);
    setPendingDeliverableIds(new Set(pendingDeliverableIdsRef.current));
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
    try {
      const result = await moveDeliverableOnBoard({
        clientId: deliverable.clientId,
        deliverableId: deliverable.id,
        toStatus: targetStatus,
        expectedRevision: deliverable.revision,
        idempotencyKey: `s015-drag-${deliverable.id}-${deliverable.revision}-${crypto.randomUUID()}`,
      });
      if (!result.ok) {
        setItems((current) =>
          current.map((item) =>
            item.id === deliverable.id ? deliverable : item,
          ),
        );
        setDragFeedback(
          "تعذر حفظ الحركة، لذلك أُعيدت البطاقة إلى حالتها السابقة بصدق. راجع الصلاحية أو حدّث الصفحة.",
        );
      } else {
        setDragFeedback("تم حفظ الحركة وتسجيلها في سجل النشاط.");
      }
    } catch {
      setItems((current) =>
        current.map((item) =>
          item.id === deliverable.id ? deliverable : item,
        ),
      );
      setDragFeedback(
        "تعذر حفظ الحركة، لذلك أُعيدت البطاقة إلى حالتها السابقة بصدق. راجع الصلاحية أو حدّث الصفحة.",
      );
    } finally {
      pendingDeliverableIdsRef.current.delete(deliverable.id);
      setPendingDeliverableIds(new Set(pendingDeliverableIdsRef.current));
    }
  };

  return (
    <div className="grid min-w-0 gap-2.5">
      {showFilters ? (
        <>
          <div
            className="flex flex-wrap items-center justify-between gap-3"
            aria-label="فلاتر لوحة العمل"
          >
            <div className="flex flex-wrap items-center gap-2">
              <label className="relative block">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute start-3 top-3.5 text-muted lg:top-2.5"
                  size={16}
                />
                <input
                  aria-label="ابحث عن بطاقة"
                  className="min-h-11 w-52 rounded-full border border-border bg-surface/80 pe-3 ps-9 text-sm outline-offset-2 lg:min-h-9"
                  placeholder="ابحث عن بطاقة…"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <label className="sr-only" htmlFor="board-assignee">
                المسؤول
              </label>
              <select
                id="board-assignee"
                className="min-h-11 max-w-44 rounded-full border border-border bg-surface/80 px-3 text-sm lg:min-h-9"
                value={assignee}
                onChange={(event) => setAssignee(event.target.value)}
              >
                <option value="all">كل الفريق</option>
                {actorUserId ? <option value="mine">مهامي</option> : null}
                {members.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.displayName}
                  </option>
                ))}
              </select>
              <label className="sr-only" htmlFor="board-priority">
                الأولوية
              </label>
              <select
                id="board-priority"
                className="min-h-11 rounded-full border border-border bg-surface/80 px-3 text-sm lg:min-h-9"
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
              >
                <option value="all">كل الأولويات</option>
                {Object.entries(priorityLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <span className="inline-flex items-center gap-2 text-xs text-muted">
              <SlidersHorizontal aria-hidden="true" size={14} />
              {filteredItems.length} بطاقة
            </span>
          </div>
          {members.length > 0 ? (
            <div
              className="flex gap-2 overflow-x-auto pb-1"
              aria-label="الفريق على اللوحة"
            >
              {members.map((member) => (
                <button
                  aria-pressed={assignee === member.userId}
                  key={member.userId}
                  className={`inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3 text-xs transition-colors lg:min-h-8 ${assignee === member.userId ? "border-accent bg-accent-soft text-accent" : "border-border bg-surface/70 text-muted hover:border-accent/40"}`}
                  onClick={() =>
                    setAssignee(
                      assignee === member.userId ? "all" : member.userId,
                    )
                  }
                  type="button"
                >
                  <span className="grid size-6 place-items-center rounded-full bg-accent-soft font-bold text-accent">
                    {member.initial}
                  </span>
                  {member.displayName}
                  <span>
                    {
                      items.filter(
                        (item) =>
                          (item.ownerUserId === member.userId ||
                            item.contributorUserIds.includes(member.userId)) &&
                          !["delivered", "archived", "cancelled"].includes(
                            item.status,
                          ),
                      ).length
                    }{" "}
                    مفتوحة
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
      {filteredItems.length === 0 ? (
        <p
          role="status"
          className="rounded-xl border border-dashed border-border bg-surface/70 p-4 text-sm text-muted"
        >
          ما لقينا بطاقات تطابق الفلاتر. جرّب تغيير البحث أو المسؤول.
        </p>
      ) : null}
      <section
        aria-label="لوحة العمل"
        className="h-[calc(100dvh-14rem)] max-w-full overflow-auto overscroll-contain pb-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        data-testid="kanban-board-scroll"
        dir="rtl"
        onKeyDown={scrollBoardWithKeyboard}
        ref={boardRef}
        tabIndex={0}
      >
        <p className="sr-only">{protectedMoveExplanation}</p>
        {dragFeedback ? (
          <p
            aria-live="polite"
            className="mb-3 rounded-lg bg-surface px-3 py-2 text-sm"
          >
            {dragFeedback}
          </p>
        ) : null}
        <DndContext
          collisionDetection={closestCenter}
          id="deliverables-board"
          onDragCancel={() => setActiveId(undefined)}
          onDragEnd={finishDrag}
          onDragStart={({ active }) => setActiveId(String(active.id))}
          sensors={sensors}
        >
          <div className="flex min-w-max items-start gap-3">
            {macroLanes.map((lane) => {
              const laneItems = filteredItems.filter((deliverable) =>
                lane.statuses.includes(deliverable.status as never),
              );

              return (
                <MacroLaneColumn
                  activeDeliverable={activeDeliverable}
                  key={lane.id}
                  lane={lane}
                >
                  <div className="sticky top-0 z-10 flex min-h-12 items-center justify-between gap-2 rounded-t-2xl bg-board-lane/95 px-3 py-2">
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-semibold">
                        {lane.label}
                      </h2>
                    </div>
                    <Badge tone="muted">{laneItems.length}</Badge>
                  </div>
                  <div className="grid content-start gap-2.5 px-2 pb-3">
                    {laneItems.length > 0 ? (
                      laneItems.map((deliverable) => {
                        const capabilities =
                          capabilitiesByDeliverable?.[deliverable.id];
                        const canUpdateStatus =
                          Boolean(action) &&
                          (capabilitiesByDeliverable
                            ? capabilities?.canUpdateStatus === true
                            : true);
                        const canApproveInternally =
                          Boolean(approvalAction) &&
                          (capabilitiesByDeliverable
                            ? capabilities?.canApproveInternally === true
                            : true);
                        return (
                          <DraggableDeliverableCard
                            canDrag={
                              canUpdateStatus &&
                              !pendingDeliverableIds.has(deliverable.id) &&
                              ["not_started", "in_progress"].includes(
                                deliverable.status,
                              )
                            }
                            deliverable={deliverable}
                            key={deliverable.id}
                          >
                            <DeliverableCard
                              action={canUpdateStatus ? action : undefined}
                              approvalAction={
                                canApproveInternally
                                  ? approvalAction
                                  : undefined
                              }
                              canPublishClientComment={canApproveInternally}
                              clientName={clientNames[deliverable.clientId]}
                              deliverable={deliverable}
                              nextActionLabel={
                                nextActionByDeliverable[deliverable.id]
                              }
                              now={now}
                              summary={workspaces[deliverable.id]}
                            />
                          </DraggableDeliverableCard>
                        );
                      })
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
    </div>
  );
}

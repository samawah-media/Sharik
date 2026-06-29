"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";
import {
  initialDeliverableFormState,
  type DeliverableFormState,
} from "@/modules/deliverables/deliverable-form-state";
import type { PackageLineSafeSummary } from "@/modules/packages/package-repository";
import { DeliverableCancellationControl } from "./deliverable-actions";

type DeliverableFormAction = (
  previousState: DeliverableFormState,
  formData: FormData,
) => Promise<DeliverableFormState>;

const statusLabels = {
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
} as const;

const priorityLabels = {
  low: "منخفضة",
  normal: "عادية",
  high: "مرتفعة",
  urgent: "عاجلة",
} as const;

function SubmitButton({ approvedExtra }: { approvedExtra?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending
        ? "جار الحفظ..."
        : approvedExtra
          ? "حفظ المخرج الإضافي"
          : "حفظ المخرج وحجز الكمية"}
    </button>
  );
}

export function ReservationImpactPreview({
  packageLine,
  quantity,
}: {
  packageLine?: PackageLineSafeSummary;
  quantity: number;
}) {
  if (!packageLine) {
    return (
      <section
        aria-label="أثر الحجز"
        className="rounded-md border border-border p-4 text-sm text-muted"
      >
        اختر سطر باقة لعرض أثر الحجز.
      </section>
    );
  }

  const safeQuantity = Number.isFinite(quantity) ? quantity : 0;
  const availableAfter = packageLine.balance.available - safeQuantity;
  const overCapacity = availableAfter < 0;

  return (
    <section
      aria-label="أثر الحجز"
      className="grid gap-3 rounded-md border border-border p-4"
      dir="rtl"
    >
      <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <div>
          <p className="text-muted">سطر الباقة</p>
          <p className="font-semibold">{packageLine.serviceLabel}</p>
        </div>
        <div>
          <p className="text-muted">المتاح قبل الحجز</p>
          <p className="font-semibold">{packageLine.balance.available}</p>
        </div>
        <div>
          <p className="text-muted">الكمية المطلوبة</p>
          <p className="font-semibold">{safeQuantity}</p>
        </div>
        <div>
          <p className="text-muted">المتاح بعد الحجز</p>
          <p className="font-semibold">{availableAfter}</p>
        </div>
      </div>
      {overCapacity ? (
        <div className="grid gap-2 rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
          <p className="font-semibold">لا توجد سعة كافية لهذا السطر.</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span>اختر سطر باقة آخر</span>
            <span>اطلب تعديل الباقة</span>
            <span>أنشئ مخرجًا إضافيًا معتمدًا</span>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function ApprovedExtraNotice() {
  return (
    <section
      aria-label="تنبيه المخرج الإضافي"
      className="grid gap-1 rounded-md border border-warning/30 bg-warning/10 p-3 text-sm"
      dir="rtl"
    >
      <p className="font-semibold">المخرج الإضافي لا يحجز من الباقة تلقائيًا.</p>
      <p className="text-muted">سبب الاعتماد الإداري مطلوب.</p>
    </section>
  );
}

export function DeliverableForm({
  action,
  clientId,
  contractId,
  packageId,
  packageLines,
  idempotencyKey,
  approvedExtra = false,
}: {
  action?: DeliverableFormAction;
  clientId: string;
  contractId?: string;
  packageId?: string;
  packageLines?: PackageLineSafeSummary[];
  idempotencyKey: string;
  approvedExtra?: boolean;
}) {
  const [state, formAction] = useActionState(
    action ?? (async () => initialDeliverableFormState),
    initialDeliverableFormState,
  );
  const selectedPackageLineId =
    state.values?.packageLineId ?? packageLines?.[0]?.id ?? "";
  const selectedLine = packageLines?.find(
    (line) => line.id === selectedPackageLineId,
  ) ?? packageLines?.[0];
  const quantity = Number(state.values?.reservedQuantity ?? "1");

  return (
    <form action={formAction} aria-label="إنشاء مخرج" dir="rtl">
      <div className="grid gap-5">
        <input
          name="clientId"
          type="hidden"
          value={state.values?.clientId ?? clientId}
        />
        <input
          name="contractId"
          type="hidden"
          value={state.values?.contractId ?? contractId ?? ""}
        />
        <input
          name="packageId"
          type="hidden"
          value={state.values?.packageId ?? packageId ?? ""}
        />
        <input
          name="idempotencyKey"
          type="hidden"
          value={state.values?.idempotencyKey ?? idempotencyKey}
        />
        <input name="approvedExtra" type="hidden" value={String(approvedExtra)} />
        <label className="grid gap-2 text-sm font-medium">
          اسم المخرج
          <input
            className="rounded-md border border-border bg-background px-3 py-2"
            name="name"
            required
            minLength={2}
            defaultValue={state.values?.name}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          الوصف
          <textarea
            className="min-h-24 rounded-md border border-border bg-background px-3 py-2"
            name="description"
            defaultValue={state.values?.description}
          />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium">
            نوع المخرج
            <input
              className="rounded-md border border-border bg-background px-3 py-2"
              name="type"
              required
              defaultValue={state.values?.type ?? selectedLine?.deliverableTypeHint ?? ""}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            الأولوية
            <select
              className="rounded-md border border-border bg-background px-3 py-2"
              name="priority"
              defaultValue={state.values?.priority ?? "normal"}
            >
              {Object.entries(priorityLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {approvedExtra ? (
          <>
            <ApprovedExtraNotice />
            <label className="grid gap-2 text-sm font-medium">
              سبب الاعتماد الإداري
              <textarea
                className="min-h-20 rounded-md border border-border bg-background px-3 py-2"
                name="extraReason"
                required
                defaultValue={state.values?.extraReason}
              />
            </label>
          </>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                سطر الباقة
                <select
                  className="rounded-md border border-border bg-background px-3 py-2"
                  name="packageLineId"
                  defaultValue={selectedPackageLineId}
                  required
                >
                  {packageLines?.map((line) => (
                    <option key={line.id} value={line.id}>
                      {line.serviceLabel} - متاح {line.balance.available}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium">
                الكمية المحجوزة
                <input
                  className="rounded-md border border-border bg-background px-3 py-2"
                  name="reservedQuantity"
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  defaultValue={state.values?.reservedQuantity ?? "1"}
                />
              </label>
            </div>
            <ReservationImpactPreview packageLine={selectedLine} quantity={quantity} />
          </>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium">
            المسؤول
            <input
              className="rounded-md border border-border bg-background px-3 py-2"
              name="ownerUserId"
              defaultValue={state.values?.ownerUserId}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            المساهمون
            <input
              className="rounded-md border border-border bg-background px-3 py-2"
              name="contributorUserIds"
              defaultValue={state.values?.contributorUserIds}
            />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <label className="grid gap-2 text-sm font-medium">
            تاريخ البدء
            <input
              className="rounded-md border border-border bg-background px-3 py-2"
              name="startDate"
              type="date"
              defaultValue={state.values?.startDate}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            موعد داخلي
            <input
              className="rounded-md border border-border bg-background px-3 py-2"
              name="internalDueDate"
              type="date"
              defaultValue={state.values?.internalDueDate}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            موعد العميل
            <input
              className="rounded-md border border-border bg-background px-3 py-2"
              name="clientDueDate"
              type="date"
              defaultValue={state.values?.clientDueDate}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            الموعد النهائي
            <input
              className="rounded-md border border-border bg-background px-3 py-2"
              name="finalDueDate"
              type="date"
              defaultValue={state.values?.finalDueDate}
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="inline-flex items-center gap-2">
            <input
              name="requiresInternalApproval"
              type="checkbox"
              value="true"
              defaultChecked={state.values?.requiresInternalApproval !== "false"}
            />
            يتطلب تعميدًا داخليًا
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              name="requiresClientApproval"
              type="checkbox"
              value="true"
              defaultChecked={state.values?.requiresClientApproval !== "false"}
            />
            يتطلب اعتماد العميل
          </label>
        </div>
        {state.status === "error" && state.message ? (
          <p
            aria-live="polite"
            className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
          >
            {state.message}
          </p>
        ) : null}
        <SubmitButton approvedExtra={approvedExtra} />
      </div>
    </form>
  );
}

export function DeliverableList({
  deliverables,
  cancellationAction,
}: {
  deliverables: DeliverableSafeSummary[];
  cancellationAction?: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <section aria-label="قائمة المخرجات" className="grid gap-3" dir="rtl">
      {deliverables.map((deliverable) => (
        <article
          className="rounded-lg border border-border bg-card p-4"
          key={deliverable.id}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="grid gap-1">
              <h2 className="text-base font-semibold">{deliverable.name}</h2>
              {deliverable.description ? (
                <p className="text-sm text-muted">{deliverable.description}</p>
              ) : null}
            </div>
            <span className="w-fit rounded-md border border-border px-2 py-1 text-xs text-muted">
              {statusLabels[deliverable.status]}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted">
            <span>التقدم {deliverable.progressPercentage}%</span>
            <span>{priorityLabels[deliverable.priority]}</span>
            {deliverable.reservation ? (
              <span>محجوز: {deliverable.reservation.reservedQuantity}</span>
            ) : null}
            {deliverable.approvedExtra ? <span>إضافي معتمد</span> : null}
          </div>
          <DeliverableCancellationControl
            action={cancellationAction}
            deliverable={deliverable}
            idempotencyKey={`f002d-cancel-${deliverable.id}`}
          />
        </article>
      ))}
    </section>
  );
}

export function DeliverableEmptyState() {
  return (
    <section
      aria-label="حالة المخرجات الفارغة"
      className="rounded-lg border border-dashed border-border p-6"
      dir="rtl"
    >
      <h2 className="text-lg font-semibold">لا توجد مخرجات لهذا العميل بعد</h2>
      <p className="mt-2 text-sm text-muted">
        أضف مخرجًا متفقًا عليه من باقة نشطة لبدء الحجز.
      </p>
    </section>
  );
}

export function DeliverableDeniedState() {
  return (
    <section
      aria-label="تعذر الوصول إلى المخرجات"
      className="rounded-lg border border-border p-6"
      dir="rtl"
    >
      <h2 className="text-lg font-semibold">
        لا يمكنك الوصول إلى مخرجات هذا العميل.
      </h2>
      <p className="mt-2 text-sm text-muted">
        لم يتم عرض أي بيانات خارج نطاق صلاحياتك.
      </p>
    </section>
  );
}

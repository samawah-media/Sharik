"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";
import type { DeliverableWorkspaceSummary } from "@/modules/deliverables/deliverable-workspace";
import {
  initialDeliverableFormState,
  type DeliverableFormState,
} from "@/modules/deliverables/deliverable-form-state";
import type { PackageLineSafeSummary } from "@/modules/packages/package-repository";
import { isCountUnitLabel } from "@/modules/packages/package-quantity";
import type { MemberDisplay } from "@/modules/members/member-directory";
import { formatArabicDate } from "@/modules/localization/arabic-display";
import { Badge } from "@/ui/core/badge";
import { Button, ButtonLink } from "@/ui/core/button";
import { Card, CardHeader, CardTitle, SectionPanel } from "@/ui/core/card";
import { EmptyState, ErrorState } from "@/ui/core/states";
import { DeliverableCancellationControl } from "./deliverable-actions";
import { DeliverableContentCard } from "@/ui/deliverables/deliverable-content-card";
import { UniversalDeliverableDrawer } from "@/ui/deliverables/universal-deliverable-drawer";

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

const typeTokensByLabel = Object.fromEntries(
  Object.entries(typeLabels).map(([token, label]) => [label, token]),
);

function canonicalizeDeliverableType(value: string) {
  return typeTokensByLabel[value] ?? value;
}

export function resolveCountUnitPreselection({
  clientId,
  packageId,
  packageLines,
  requestedPackageLineId,
}: {
  clientId: string;
  packageId?: string;
  packageLines: PackageLineSafeSummary[];
  requestedPackageLineId?: string;
}) {
  if (!requestedPackageLineId || !packageId) return undefined;

  const line = packageLines.find(
    (candidate) =>
      candidate.id === requestedPackageLineId &&
      candidate.clientId === clientId &&
      candidate.packageId === packageId &&
      candidate.status === "active" &&
      candidate.balance.available > 0 &&
      isCountUnitLabel(candidate.unitLabel),
  );
  if (!line) return undefined;

  const nextOrdinal = Math.max(
    1,
    Math.floor(line.committedQuantity - line.balance.available) + 1,
  );
  return {
    packageLineId: line.id,
    suggestedName: `${line.unitLabel} ${nextOrdinal} من ${line.committedQuantity}`,
  };
}

export function findExactCreatedDeliverable({
  clientId,
  saved,
  deliverableId,
  deliverables,
}: {
  clientId: string;
  saved?: string;
  deliverableId?: string;
  deliverables: DeliverableSafeSummary[];
}) {
  if (saved !== "created" || !deliverableId) return undefined;
  return deliverables.find(
    (candidate) =>
      candidate.id === deliverableId && candidate.clientId === clientId,
  );
}

export function findCreatedCountUnitLine({
  clientId,
  saved,
  deliverableId,
  deliverables,
  packages,
}: {
  clientId: string;
  saved?: string;
  deliverableId?: string;
  deliverables: DeliverableSafeSummary[];
  packages: Array<{
    id: string;
    clientId: string;
    status: string;
    lines?: PackageLineSafeSummary[];
  }>;
}) {
  const deliverable = findExactCreatedDeliverable({
    clientId,
    saved,
    deliverableId,
    deliverables,
  });
  if (
    !deliverable?.packageId ||
    !deliverable.packageLineId ||
    deliverable.clientId !== clientId
  ) {
    return undefined;
  }

  return packages
    .filter(
      (packageSummary) =>
        packageSummary.id === deliverable.packageId &&
        packageSummary.clientId === clientId &&
        packageSummary.status === "active",
    )
    .flatMap((packageSummary) => packageSummary.lines ?? [])
    .find(
      (line) =>
        line.id === deliverable.packageLineId &&
        line.clientId === clientId &&
        line.packageId === deliverable.packageId &&
        line.status === "active" &&
        isCountUnitLabel(line.unitLabel),
    );
}

export function NextCountUnitGuidance({
  canCreate,
  clientId,
  packageLine,
}: {
  canCreate: boolean;
  clientId: string;
  packageLine: PackageLineSafeSummary;
}) {
  return (
    <SectionPanel
      label="الوحدة العددية التالية"
      className="grid gap-3 text-sm shadow-none"
    >
      <p>تم إنشاء مخرج مستقل لوحدة واحدة. كل بطاقة تمثل وحدة مستقلة بسير عملها.</p>
      <p className="font-semibold">
        المتبقي: {packageLine.balance.available} {packageLine.unitLabel}
      </p>
      {canCreate && packageLine.balance.available > 0 ? (
        <div>
          <ButtonLink
            href={`/clients/${clientId}/deliverables/new?packageId=${encodeURIComponent(packageLine.packageId)}&packageLine=${encodeURIComponent(packageLine.id)}`}
            variant="primary"
          >
            إضافة المخرج التالي
          </ButtonLink>
        </div>
      ) : null}
    </SectionPanel>
  );
}

function SubmitButton({ approvedExtra }: { approvedExtra?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} type="submit" variant="primary">
      {pending
        ? "جار الحفظ..."
        : approvedExtra
          ? "حفظ المخرج الإضافي"
          : "حفظ المخرج وحجز الكمية"}
    </Button>
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
      <SectionPanel
        label="أثر الحجز"
        className="text-sm text-muted shadow-none"
      >
        اختر سطر باقة لعرض أثر الحجز.
      </SectionPanel>
    );
  }

  const safeQuantity = Number.isFinite(quantity) ? quantity : 0;
  const availableAfter = packageLine.balance.available - safeQuantity;
  const overCapacity = availableAfter < 0;

  return (
    <SectionPanel label="أثر الحجز" className="grid gap-3 shadow-none">
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
            <Badge tone="danger">اختر سطر باقة آخر</Badge>
            <Badge tone="danger">اطلب تعديل الباقة</Badge>
            <Badge tone="danger">أنشئ مخرجًا إضافيًا معتمدًا</Badge>
          </div>
        </div>
      ) : null}
    </SectionPanel>
  );
}

export function ApprovedExtraNotice() {
  return (
    <SectionPanel
      label="تنبيه المخرج الإضافي"
      className="grid gap-1 border-warning/30 bg-warning/10 text-sm shadow-none"
    >
      <p className="font-semibold">
        المخرج الإضافي لا يحجز من الباقة تلقائيًا.
      </p>
      <p className="text-muted">سبب الاعتماد الإداري مطلوب.</p>
    </SectionPanel>
  );
}

export function DeliverableForm({
  action,
  clientId,
  contractId,
  packageId,
  packageLines,
  eligibleMembers = [],
  memberDirectoryAvailable = true,
  idempotencyKey,
  approvedExtra = false,
  initialPackageLineId,
  suggestedName,
}: {
  action?: DeliverableFormAction;
  clientId: string;
  contractId?: string;
  packageId?: string;
  packageLines?: PackageLineSafeSummary[];
  eligibleMembers?: MemberDisplay[];
  memberDirectoryAvailable?: boolean;
  idempotencyKey: string;
  approvedExtra?: boolean;
  initialPackageLineId?: string;
  suggestedName?: string;
}) {
  const [state, formAction] = useActionState(
    action ?? (async () => initialDeliverableFormState),
    initialDeliverableFormState,
  );
  const [selectedPackageLine, setSelectedPackageLine] = useState(
    state.values?.packageLineId ?? initialPackageLineId ?? packageLines?.[0]?.id ?? "",
  );
  const selectedPackageLineId = selectedPackageLine;
  const selectedLine =
    packageLines?.find((line) => line.id === selectedPackageLineId) ??
    packageLines?.[0];
  const initialType = state.values?.type ?? selectedLine?.deliverableTypeHint ?? "";
  const [typeDisplayEdit, setTypeDisplayEdit] = useState<{
    packageLineId: string;
    value: string;
  }>();
  const typeDisplay =
    typeDisplayEdit?.packageLineId === selectedPackageLineId
      ? typeDisplayEdit.value
      : typeLabels[initialType] ?? initialType;
  const quantity = Number(state.values?.reservedQuantity ?? "1");
  const selectedContributorIds = new Set(
    state.values?.contributorUserIds
      ?.split(",")
      .map((value) => value.trim())
      .filter(Boolean) ?? [],
  );

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
        <input
          name="approvedExtra"
          type="hidden"
          value={String(approvedExtra)}
        />
        <label className="grid gap-2 text-sm font-medium">
          اسم العمل
          <input
            className="rounded-md border border-border bg-background px-3 py-2"
            name="name"
            required
            minLength={2}
            defaultValue={state.values?.name ?? suggestedName}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          الوصف الأساسي
          <textarea
            className="min-h-24 rounded-md border border-border bg-background px-3 py-2"
            name="description"
            defaultValue={state.values?.description}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          نوع العمل
          <input
            className="rounded-md border border-border bg-background px-3 py-2"
            name="typeDisplay"
            required
            value={typeDisplay}
            onChange={(event) => {
              setTypeDisplayEdit({
                packageLineId: selectedPackageLineId,
                value: event.currentTarget.value,
              });
            }}
          />
          <input
            name="type"
            type="hidden"
            value={canonicalizeDeliverableType(typeDisplay)}
            readOnly
          />
        </label>
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
                  onChange={(event) => setSelectedPackageLine(event.target.value)}
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
              {isCountUnitLabel(selectedLine?.unitLabel ?? "") ? (
                <div className="grid gap-2 text-sm">
                  <span className="font-medium">الكمية المحجوزة</span>
                  <input name="reservedQuantity" type="hidden" value="1" />
                  <p className="rounded-md border border-border bg-surface px-3 py-2 text-muted">
                    كل مخرج يحجز وحدة واحدة من «{selectedLine?.unitLabel ?? "الخدمة"}». أنشئ مخرجًا مستقلًا لكل وحدة.
                  </p>
                </div>
              ) : (
                <label className="grid gap-2 text-sm font-medium">
                  الكمية المحجوزة
                  <input
                    className="rounded-md border border-border bg-background px-3 py-2"
                    name="reservedQuantity"
                    type="text"
                    inputMode="decimal"
                    required
                    defaultValue={state.values?.reservedQuantity ?? "1"}
                  />
                </label>
              )}
            </div>
            <ReservationImpactPreview
              packageLine={selectedLine}
              quantity={quantity}
            />
          </>
        )}
        <label className="grid gap-2 text-sm font-medium">
          المسؤول
          <select
            className="rounded-md border border-border bg-background px-3 py-2"
            name="ownerUserId"
            defaultValue={state.values?.ownerUserId}
          >
            <option value="">بدون مسؤول حاليًا</option>
            {eligibleMembers.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.displayName}
                {member.roleLabel ? ` — ${member.roleLabel}` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          الموعد
          <input
            className="rounded-md border border-border bg-background px-3 py-2"
            name="clientDueDate"
            type="date"
            defaultValue={state.values?.clientDueDate}
          />
        </label>
        {!memberDirectoryAvailable ? (
          <p className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
            تعذر تحميل قائمة الفريق. يمكنك حفظ العمل بدون إسناد والمحاولة لاحقًا.
          </p>
        ) : null}
        <details className="grid gap-4 rounded-lg border border-border bg-surface p-4">
          <summary className="cursor-pointer text-sm font-semibold text-foreground">
            تفاصيل إضافية — اختيارية
          </summary>
          <p className="text-xs text-muted">
            هذه الحقول اختيارية ولا تؤثر على الحفظ. يمكنك تعبئتها لاحقًا أو تركها
            فارغة.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
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
            <div className="text-sm text-muted">
              <p className="font-medium text-foreground">المساهمون</p>
              <p className="text-xs">أعضاء الفريق المشاركون في هذا العمل.</p>
            </div>
          </div>
          <fieldset className="grid gap-2 text-sm font-medium">
            <div className="grid max-h-40 gap-2 overflow-y-auto rounded-md border border-border bg-background p-3">
              {eligibleMembers.length > 0 ? (
                eligibleMembers.map((member) => (
                  <label className="flex min-h-11 items-center gap-2" key={member.userId}>
                    <input
                      defaultChecked={selectedContributorIds.has(member.userId)}
                      name="contributorUserIds"
                      type="checkbox"
                      value={member.userId}
                    />
                    <span>{member.displayName}</span>
                    {member.roleLabel ? (
                      <span className="text-xs text-muted">{member.roleLabel}</span>
                    ) : null}
                  </label>
                ))
              ) : (
                <p className="text-muted">لا يوجد أعضاء متاحون للإسناد.</p>
              )}
            </div>
          </fieldset>
          <div className="grid gap-4 md:grid-cols-3">
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
              الموعد النهائي
              <input
                className="rounded-md border border-border bg-background px-3 py-2"
                name="finalDueDate"
                type="date"
                defaultValue={state.values?.finalDueDate}
              />
            </label>
          </div>
        </details>
        <fieldset
          aria-label="إعدادات سير العمل"
          className="grid gap-3 rounded-lg border border-border bg-surface p-4"
        >
          <div className="grid gap-1">
            <p className="text-sm font-semibold text-foreground">
              إعدادات سير العمل
            </p>
            <p className="text-xs text-muted">
              هذه الإعدادات تحدد خطوات الاعتماد قبل أن يصل العمل إلى التسليم.
              عدّلها بعناية لأنها تؤثر على مسار العمل.
            </p>
          </div>
          <label className="flex min-h-11 items-start gap-3 rounded-md border border-border bg-background p-3 text-sm">
            <input
              className="mt-0.5"
              name="requiresInternalApproval"
              type="checkbox"
              value="true"
              defaultChecked={
                state.values?.requiresInternalApproval !== "false"
              }
            />
            <span className="grid gap-1">
              <span className="font-semibold text-foreground">
                يتطلب تعميدًا داخليًا
              </span>
              <span className="text-xs text-muted">
                عند التفعيل يجب أن يعتمد العمل داخليًا قبل إرساله للعميل. أوقفه
                فقط إذا كان العمل لا يحتاج مراجعة داخلية.
              </span>
            </span>
          </label>
          <label className="flex min-h-11 items-start gap-3 rounded-md border border-border bg-background p-3 text-sm">
            <input
              className="mt-0.5"
              name="requiresClientApproval"
              type="checkbox"
              value="true"
              defaultChecked={state.values?.requiresClientApproval !== "false"}
            />
            <span className="grid gap-1">
              <span className="font-semibold text-foreground">
                يتطلب اعتماد العميل
              </span>
              <span className="text-xs text-muted">
                عند التفعيل لا يمكن تسليم العمل إلا بعد اعتماد العميل للنسخة
                المرسلة. أوقفه فقط إذا كان العمل لا يحتاج موافقة العميل.
              </span>
            </span>
          </label>
        </fieldset>
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
  clientName,
  workspaces = {},
  cancellationAction,
  approvalAction,
}: {
  deliverables: DeliverableSafeSummary[];
  clientName?: string;
  workspaces?: Record<string, DeliverableWorkspaceSummary>;
  cancellationAction?: (formData: FormData) => void | Promise<void>;
  approvalAction?: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <section aria-label="قائمة المخرجات" className="grid gap-3" dir="rtl">
      {deliverables.map((deliverable) => (
        <Card className="overflow-hidden p-3 sm:p-4" key={deliverable.id}>
          <div className="grid gap-4 lg:grid-cols-[15rem_minmax(0,1fr)]">
            <DeliverableContentCard
              clientName={clientName}
              deliverable={deliverable}
              statusLabel={statusLabels[deliverable.status]}
              summary={workspaces[deliverable.id]}
              typeLabel={typeLabels[deliverable.type] ?? "مخرج مخصص"}
            />
            <div className="min-w-0">
              <CardHeader>
                <CardTitle>ملخص التنفيذ</CardTitle>
              </CardHeader>
              {deliverable.description ? (
                <div className="mt-3 rounded-lg bg-background p-3">
                  <p className="text-xs font-semibold text-foreground">
                    وصف المخرج (ليس الكابشن)
                  </p>
                  <p className="mt-1 text-sm leading-7 text-muted">
                    {deliverable.description}
                  </p>
                </div>
              ) : null}
              <dl className="mt-4 grid gap-3 text-sm text-muted sm:grid-cols-4">
                <div className="rounded-md bg-background px-3 py-2">
                  <dt className="font-semibold text-foreground">
                    القناة / النوع
                  </dt>
                  <dd className="mt-1">
                    {typeLabels[deliverable.type] ?? "مخرج مخصص"}
                  </dd>
                </div>
                <div className="rounded-md bg-background px-3 py-2">
                  <dt className="font-semibold text-foreground">التاريخ</dt>
                  <dd className="mt-1">
                    {formatArabicDate(
                      deliverable.clientDueDate ??
                        deliverable.finalDueDate ??
                        deliverable.plannedPublishDate,
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
              <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted">
                <Badge tone="muted">
                  {priorityLabels[deliverable.priority]}
                </Badge>
                {deliverable.reservation ? (
                  <Badge tone="neutral">
                    محجوز: {deliverable.reservation.reservedQuantity}
                  </Badge>
                ) : null}
                {deliverable.approvedExtra ? (
                  <Badge tone="warning">إضافي معتمد</Badge>
                ) : null}
              </div>
              <div className="mt-3">
                <UniversalDeliverableDrawer
                  approvalAction={approvalAction}
                  buttonLabel="فتح العمل"
                  canPublishClientComment={Boolean(approvalAction)}
                  clientName={clientName}
                  deliverable={deliverable}
                  summary={workspaces[deliverable.id]}
                />
              </div>
              <DeliverableCancellationControl
                action={cancellationAction}
                deliverable={deliverable}
                idempotencyKey={`f002d-cancel-${deliverable.id}`}
              />
            </div>
          </div>
        </Card>
      ))}
    </section>
  );
}

export function DeliverableEmptyState() {
  return (
    <EmptyState
      description="أضف مخرجًا متفقًا عليه من باقة نشطة لبدء الحجز."
      title="لا توجد مخرجات لهذا العميل بعد"
    />
  );
}

export function DeliverableDeniedState() {
  return (
    <ErrorState
      description="لم يتم عرض أي بيانات خارج نطاق صلاحياتك."
      title="لا يمكنك الوصول إلى مخرجات هذا العميل."
    />
  );
}

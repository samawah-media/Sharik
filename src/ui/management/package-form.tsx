"use client";

import {
  useActionState,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useFormStatus } from "react-dom";
import type { PackageBalanceProjection } from "@/modules/packages/package-ledger";
import type { PackageSafeSummary } from "@/modules/packages/package-repository";
import { paginateCommercialItems } from "@/modules/commercial/commercial-presentation";
import { formatArabicDateRange } from "@/modules/localization/arabic-display";
import type { PackageAdjustmentState } from "@/server/actions/packages";
import {
  initialPackageFormState,
  type PackageFormState,
} from "@/modules/packages/package-form-state";
import { Badge, StatCard } from "@/ui/core/badge";
import { Button } from "@/ui/core/button";
import { Card, CardHeader, CardTitle, SectionPanel } from "@/ui/core/card";
import { EmptyState, ErrorState } from "@/ui/core/states";
import { PackageBalanceFacts } from "@/ui/commercial/package-balance-facts";

type PackageFormAction = (
  previousState: PackageFormState,
  formData: FormData,
) => Promise<PackageFormState>;

type PackageAdjustmentAction = (
  previousState: PackageAdjustmentState,
  formData: FormData,
) => Promise<PackageAdjustmentState>;

const initialPackageAdjustmentState: PackageAdjustmentState = {
  status: "idle",
};

const statusLabels = {
  draft: "مسودة",
  active: "نشطة",
  completed: "مكتملة",
  cancelled: "ملغية",
  archived: "مؤرشفة",
} as const;

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} type="submit" variant="primary">
      {pending ? "جار الحفظ..." : "حفظ الباقة"}
    </Button>
  );
}

export function PackageForm({
  action,
  clientId,
  contractId,
  idempotencyKey,
}: {
  action?: PackageFormAction;
  clientId: string;
  contractId: string;
  idempotencyKey: string;
}) {
  const [state, formAction] = useActionState(
    action ?? (async () => initialPackageFormState),
    initialPackageFormState,
  );

  return (
    <form action={formAction} aria-label="إنشاء باقة" dir="rtl">
      <div className="grid gap-5">
        <input
          name="clientId"
          type="hidden"
          value={state.values?.clientId ?? clientId}
        />
        <input
          name="contractId"
          type="hidden"
          value={state.values?.contractId ?? contractId}
        />
        <input
          name="idempotencyKey"
          type="hidden"
          value={state.values?.idempotencyKey ?? idempotencyKey}
        />
        <label className="grid gap-2 text-sm font-medium">
          اسم الباقة
          <input
            className="rounded-md border border-border bg-background px-3 py-2"
            name="name"
            required
            minLength={2}
            defaultValue={state.values?.name}
          />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium">
            بداية الفترة
            <input
              className="rounded-md border border-border bg-background px-3 py-2"
              name="periodStart"
              type="date"
              defaultValue={state.values?.periodStart}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            نهاية الفترة
            <input
              className="rounded-md border border-border bg-background px-3 py-2"
              name="periodEnd"
              type="date"
              defaultValue={state.values?.periodEnd}
            />
          </label>
        </div>
        <label className="grid gap-2 text-sm font-medium">
          حالة الباقة
          <select
            className="rounded-md border border-border bg-background px-3 py-2"
            name="status"
            defaultValue={state.values?.status ?? "draft"}
          >
            <option value="draft">مسودة</option>
            <option value="active">نشطة</option>
            <option value="completed">مكتملة</option>
            <option value="cancelled">ملغية</option>
            <option value="archived">مؤرشفة</option>
          </select>
        </label>
        <fieldset className="grid gap-4 rounded-lg border border-border p-4">
          <legend className="px-1 text-sm font-semibold">سطر الباقة</legend>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              اسم الخدمة
              <input
                className="rounded-md border border-border bg-background px-3 py-2"
                name="lineServiceLabel"
                required
                minLength={2}
                defaultValue={state.values?.lineServiceLabel}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              نوع المخرج المقترح
              <input
                className="rounded-md border border-border bg-background px-3 py-2"
                name="lineDeliverableTypeHint"
                defaultValue={state.values?.lineDeliverableTypeHint}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              وحدة القياس
              <input
                className="rounded-md border border-border bg-background px-3 py-2"
                name="lineUnitLabel"
                required
                defaultValue={state.values?.lineUnitLabel}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              الكمية المتفق عليها
              <input
                className="rounded-md border border-border bg-background px-3 py-2"
                name="lineCommittedQuantity"
                type="text"
                inputMode="decimal"
                required
                defaultValue={state.values?.lineCommittedQuantity}
              />
            </label>
          </div>
        </fieldset>
        {state.status === "error" && state.message ? (
          <p
            aria-live="polite"
            className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
          >
            {state.message}
          </p>
        ) : null}
        <SubmitButton />
      </div>
    </form>
  );
}

export function PackageBalanceSummary({
  balance,
}: {
  balance: PackageBalanceProjection;
}) {
  const items = [
    ["المتفق عليه", balance.committed],
    ["المحجوز", balance.reserved],
    ["المسلم", balance.consumed],
    ["التعديلات", balance.adjustments],
    ["المتاح", balance.available],
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">
      {items.map(([label, value]) => (
        <StatCard key={label} label={label} value={value} />
      ))}
    </div>
  );
}

function PackageAdjustmentForm({
  action,
  clientId,
  contractId,
  packageLineId,
}: {
  action: PackageAdjustmentAction;
  clientId: string;
  contractId: string;
  packageLineId: string;
}) {
  const [state, formAction] = useActionState(
    action,
    initialPackageAdjustmentState,
  );
  const formId = useId();
  const [attempt, setAttempt] = useState(0);
  const lastCompletedState = useRef<PackageAdjustmentState | undefined>(
    undefined,
  );

  useEffect(() => {
    if (state.status === "success" && lastCompletedState.current !== state) {
      lastCompletedState.current = state;
      setAttempt((value) => value + 1);
    }
  }, [state]);

  const idempotencyKey = `package-adjust-${packageLineId}-${formId}-${attempt}`;

  return (
    <details className="rounded-md border border-border p-3">
      <summary className="cursor-pointer text-sm font-semibold">
        تصحيح قيمة الباقة
      </summary>
      <form action={formAction} className="mt-3 grid gap-3">
        <input name="clientId" type="hidden" value={clientId} />
        <input name="contractId" type="hidden" value={contractId} />
        <input name="packageLineId" type="hidden" value={packageLineId} />
        <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
        <label className="grid gap-1 text-sm">
          فرق الكمية
          <input
            className="rounded-md border border-border bg-background px-3 py-2"
            inputMode="decimal"
            name="adjustmentQuantity"
            placeholder="مثال: -0.93"
            required
            type="text"
          />
        </label>
        <label className="grid gap-1 text-sm">
          سبب التصحيح
          <textarea
            className="min-h-20 rounded-md border border-border bg-background px-3 py-2"
            minLength={3}
            name="reason"
            required
          />
        </label>
        {state.message ? (
          <p
            aria-live="polite"
            className={
              state.status === "success" ? "text-success" : "text-danger"
            }
          >
            {state.message}
          </p>
        ) : null}
        <Button type="submit" variant="secondary">
          تسجيل التصحيح
        </Button>
      </form>
    </details>
  );
}

export function PackageList({
  packages,
  adjustmentAction,
  clientId,
  contractId,
  pageSize = 6,
}: {
  packages: PackageSafeSummary[];
  adjustmentAction?: PackageAdjustmentAction;
  clientId?: string;
  contractId?: string;
  pageSize?: number;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const result = useMemo(
    () =>
      paginateCommercialItems({
        items: packages,
        query,
        status,
        page,
        pageSize,
        getSearchText: (packageItem) =>
          [
            packageItem.name,
            ...packageItem.lines.map((line) => line.serviceLabel),
          ].join(" "),
        getStatus: (packageItem) => packageItem.status,
      }),
    [packages, page, pageSize, query, status],
  );

  return (
    <section aria-label="قائمة الباقات" className="grid gap-3" dir="rtl">
      <div className="grid gap-3 rounded-lg border border-border bg-card p-3 sm:grid-cols-[minmax(0,1fr)_12rem_auto] sm:items-end">
        <label className="grid gap-1 text-sm font-medium">
          بحث في الباقات والخدمات
          <input
            className="min-h-11 rounded-md border border-border bg-background px-3 py-2"
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="اسم الباقة أو الخدمة"
            type="search"
            value={query}
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          حالة الباقة
          <select
            className="min-h-11 rounded-md border border-border bg-background px-3 py-2"
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            value={status}
          >
            <option value="all">كل الحالات</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <p className="pb-2 text-sm text-muted">عرض {result.totalItems} باقة</p>
      </div>
      {result.items.map((packageItem) => (
        <Card key={packageItem.id}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <CardHeader>
              <CardTitle>{packageItem.name}</CardTitle>
              {packageItem.periodStart || packageItem.periodEnd ? (
                <p className="text-sm text-muted">
                  {formatArabicDateRange(
                    packageItem.periodStart,
                    packageItem.periodEnd,
                  )}
                </p>
              ) : null}
            </CardHeader>
            <Badge tone="muted">{statusLabels[packageItem.status]}</Badge>
          </div>
          <div className="mt-4 grid gap-3">
            {packageItem.lines.map((line) => (
              <SectionPanel
                aria-label={`رصيد ${line.serviceLabel}`}
                className="grid gap-3 shadow-none"
                key={line.id}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">{line.serviceLabel}</h3>
                  <Badge tone="muted">{line.unitLabel}</Badge>
                </div>
                <PackageBalanceFacts
                  audience="management"
                  balance={line.balance}
                  unitLabel={line.unitLabel}
                />
                {adjustmentAction && clientId && contractId ? (
                  <PackageAdjustmentForm
                    action={adjustmentAction}
                    clientId={clientId}
                    contractId={contractId}
                    packageLineId={line.id}
                  />
                ) : null}
              </SectionPanel>
            ))}
          </div>
        </Card>
      ))}
      {result.totalItems === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
          لا توجد باقات مطابقة
        </p>
      ) : null}
      {result.totalPages > 1 ? (
        <nav
          aria-label="صفحات الباقات"
          className="flex items-center justify-between gap-3"
        >
          <Button
            disabled={result.page === 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            type="button"
            variant="secondary"
          >
            السابق
          </Button>
          <span className="text-sm text-muted">
            صفحة {result.page} من {result.totalPages}
          </span>
          <Button
            disabled={result.page === result.totalPages}
            onClick={() =>
              setPage((value) => Math.min(result.totalPages, value + 1))
            }
            type="button"
            variant="secondary"
          >
            التالي
          </Button>
        </nav>
      ) : null}
    </section>
  );
}

export function PackageEmptyState() {
  return (
    <EmptyState
      description="أضف باقة وخط خدمة واحد على الأقل لتسجيل الالتزامات المتفق عليها."
      title="لا توجد باقات لهذا العقد بعد"
    />
  );
}

export function PackageDeniedState() {
  return (
    <ErrorState
      description="لم يتم عرض أي بيانات خارج نطاق صلاحياتك."
      title="لا يمكنك الوصول إلى باقات هذا العقد."
    />
  );
}

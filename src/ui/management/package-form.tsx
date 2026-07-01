"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { PackageBalanceProjection } from "@/modules/packages/package-ledger";
import type { PackageSafeSummary } from "@/modules/packages/package-repository";
import {
  initialPackageFormState,
  type PackageFormState,
} from "@/modules/packages/package-form-state";
import { Badge, StatCard } from "@/ui/core/badge";
import { Button } from "@/ui/core/button";
import { Card, CardHeader, CardTitle, SectionPanel } from "@/ui/core/card";
import { EmptyState, ErrorState } from "@/ui/core/states";

type PackageFormAction = (
  previousState: PackageFormState,
  formData: FormData,
) => Promise<PackageFormState>;

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
                type="number"
                min="0"
                step="0.01"
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

export function PackageList({ packages }: { packages: PackageSafeSummary[] }) {
  return (
    <section aria-label="قائمة الباقات" className="grid gap-3" dir="rtl">
      {packages.map((packageItem) => (
        <Card key={packageItem.id}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <CardHeader>
              <CardTitle>{packageItem.name}</CardTitle>
              {packageItem.periodStart || packageItem.periodEnd ? (
                <p className="text-sm text-muted">
                  {packageItem.periodStart ?? "غير محدد"} -{" "}
                  {packageItem.periodEnd ?? "غير محدد"}
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
                <div className="flex flex-wrap gap-2 text-sm text-muted">
                  <span>المتفق عليه: {line.balance.committed}</span>
                  <span>المحجوز: {line.balance.reserved}</span>
                  <span>المتاح: {line.balance.available}</span>
                </div>
                <PackageBalanceSummary balance={line.balance} />
              </SectionPanel>
            ))}
          </div>
        </Card>
      ))}
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

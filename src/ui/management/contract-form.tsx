"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { ContractSafeSummary } from "@/modules/contracts/contract-repository";
import {
  initialContractFormState,
  type ContractFormState,
} from "@/modules/contracts/contract-form-state";
import { Badge } from "@/ui/core/badge";
import { Button, ButtonLink } from "@/ui/core/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/ui/core/card";
import { EmptyState, ErrorState } from "@/ui/core/states";

type ContractFormAction = (
  previousState: ContractFormState,
  formData: FormData,
) => Promise<ContractFormState>;

const statusLabels = {
  draft: "مسودة",
  active: "نشط",
  completed: "مكتمل",
  cancelled: "ملغي",
  archived: "مؤرشف",
} as const;

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} type="submit" variant="primary">
      {pending ? "جار الحفظ..." : "حفظ العقد"}
    </Button>
  );
}

export function ContractForm({
  action,
  clientId,
  idempotencyKey,
}: {
  action?: ContractFormAction;
  clientId: string;
  idempotencyKey: string;
}) {
  const [state, formAction] = useActionState(
    action ?? (async () => initialContractFormState),
    initialContractFormState,
  );

  return (
    <form action={formAction} aria-label="إنشاء عقد" dir="rtl">
      <div className="grid gap-4">
        <input
          name="clientId"
          type="hidden"
          value={state.values?.clientId ?? clientId}
        />
        <input
          name="idempotencyKey"
          type="hidden"
          value={state.values?.idempotencyKey ?? idempotencyKey}
        />
        <label className="grid gap-2 text-sm font-medium">
          اسم العقد
          <input
            className="rounded-md border border-border bg-background px-3 py-2"
            name="name"
            required
            minLength={2}
            defaultValue={state.values?.name}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          مرجع العقد
          <input
            className="rounded-md border border-border bg-background px-3 py-2"
            name="reference"
            defaultValue={state.values?.reference}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          ملخص العقد
          <textarea
            className="min-h-28 rounded-md border border-border bg-background px-3 py-2"
            name="summary"
            defaultValue={state.values?.summary}
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
          حالة العقد
          <select
            className="rounded-md border border-border bg-background px-3 py-2"
            name="status"
            defaultValue={state.values?.status ?? "draft"}
          >
            <option value="draft">مسودة</option>
            <option value="active">نشط</option>
            <option value="completed">مكتمل</option>
            <option value="cancelled">ملغي</option>
            <option value="archived">مؤرشف</option>
          </select>
        </label>
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

export function ContractList({
  contracts,
}: {
  contracts: ContractSafeSummary[];
}) {
  return (
    <section aria-label="قائمة العقود" className="grid gap-3" dir="rtl">
      {contracts.map((contract) => (
        <Card key={contract.id}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <CardHeader>
              <CardTitle>{contract.name}</CardTitle>
              {contract.reference ? (
                <CardDescription>{contract.reference}</CardDescription>
              ) : null}
            </CardHeader>
            <Badge tone="muted">{statusLabels[contract.status]}</Badge>
          </div>
          {contract.summary ? (
            <p className="mt-3 text-sm leading-6 text-muted">
              {contract.summary}
            </p>
          ) : null}
          {contract.periodStart || contract.periodEnd ? (
            <p className="mt-3 text-sm text-muted">
              {contract.periodStart ?? "غير محدد"} -{" "}
              {contract.periodEnd ?? "غير محدد"}
            </p>
          ) : null}
          <ButtonLink
            className="mt-4"
            href={`/clients/${contract.clientId}/contracts/${contract.id}/packages`}
            variant="secondary"
          >
            الباقات
          </ButtonLink>
        </Card>
      ))}
    </section>
  );
}

export function ContractEmptyState() {
  return (
    <EmptyState
      description="ابدأ بإضافة سياق العقد قبل بناء الباقات أو المخرجات في مراحل لاحقة."
      title="لا توجد عقود لهذا العميل بعد"
    />
  );
}

export function ContractDeniedState() {
  return (
    <ErrorState
      description="لم يتم عرض أي بيانات خارج نطاق صلاحياتك."
      title="لا يمكنك الوصول إلى عقود هذا العميل."
    />
  );
}

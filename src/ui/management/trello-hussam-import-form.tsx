"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import {
  importHussamTrelloAction,
  type HussamTrelloImportState,
  type PackageOption,
} from "@/server/actions/trello-hussam-import";
import { Button } from "@/ui/core/button";

const initialState: HussamTrelloImportState = { status: "idle" };

function SubmitImportButton() {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} type="submit" variant="danger">
      {pending ? "جارٍ نقل البيانات النصية…" : "تنفيذ الاستيراد النصي"}
    </Button>
  );
}

export function TrelloHussamImportForm({
  confirmationPhrase,
  packageOptions,
  requiredCapacity,
}: {
  confirmationPhrase: string;
  packageOptions: PackageOption[];
  requiredCapacity: number;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [state, formAction] = useActionState(
    importHussamTrelloAction,
    initialState,
  );
  const eligibleLine = packageOptions.find(
    (option) => option.available >= requiredCapacity,
  );
  const hasEligibleLine = Boolean(eligibleLine);

  useEffect(() => {
    if (state.status !== "success") return;
    if ((state.remainingCount ?? 0) > 0) {
      const timer = window.setTimeout(() => formRef.current?.requestSubmit(), 400);
      return () => window.clearTimeout(timer);
    }
    router.refresh();
  }, [router, state.remainingCount, state.status]);

  return (
    <form
      action={formAction}
      className="grid gap-4"
      dir="rtl"
      ref={formRef}
    >
      <label className="grid gap-2 text-sm font-semibold">
        سطر الباقة الذي سيحجز وحدة لكل مخرج جديد
        <select
          className="min-h-11 rounded-lg border border-border bg-background px-3"
          defaultValue={eligibleLine?.lineId}
          disabled={!hasEligibleLine}
          name="packageLineId"
          required
        >
          {packageOptions.map((option) => (
            <option
              disabled={option.available < requiredCapacity}
              key={option.lineId}
              value={option.lineId}
            >
              {option.packageName} — {option.serviceLabel} — متاح{" "}
              {option.available}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2 text-sm font-semibold">
        اكتب عبارة التأكيد كما هي: «{confirmationPhrase}»
        <input
          autoComplete="off"
          className="min-h-11 rounded-lg border border-border bg-background px-3"
          name="confirmation"
          required
        />
      </label>

      <label className="flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
        <input
          className="mt-1"
          name="confirmed"
          required
          type="checkbox"
          value="yes"
        />
        <span>
          أؤكد أن المعاينة صحيحة، وأن التنفيذ سيحجز من الباقة وينشئ المخرجات
          والنسخ والمسؤوليات النصية فقط. لن تُنقل الملفات في هذه الخطوة.
        </span>
      </label>

      {state.message ? (
        <p
          className={
            state.status === "success"
              ? "rounded-lg border border-success/40 bg-success/10 p-3 text-sm"
              : "rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger"
          }
          role="status"
        >
          {state.message}
          {state.status === "success"
            ? ` عولج في الدفعة: ${state.processedCount ?? 0}، متبقٍ: ${state.remainingCount ?? 0}، مكرر متروك: ${state.duplicateCount ?? 0}.`
            : ""}
        </p>
      ) : null}

      <SubmitImportButton />
      {!hasEligibleLine ? (
        <p className="text-sm text-danger" role="alert">
          لا يوجد سطر باقة بسعة تكفي {requiredCapacity} مخرجًا جديدًا. التنفيذ
          معطل.
        </p>
      ) : null}
    </form>
  );
}

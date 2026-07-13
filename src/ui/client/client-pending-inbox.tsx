"use client";

import { useState } from "react";
import type { ClientSafeDeliverableDetail } from "@/ui/client/client-deliverable-detail";
import { ClientDeliverableDetail } from "@/ui/client/client-deliverable-detail";
import { EmptyState } from "@/ui/core/states";

export function ClientPendingInbox({
  approveAction,
  canApprove,
  details,
  requestChangesAction,
}: {
  approveAction?: (formData: FormData) => void | Promise<void>;
  canApprove: boolean;
  details: ClientSafeDeliverableDetail[];
  requestChangesAction?: (formData: FormData) => void | Promise<void>;
}) {
  const [selectedKey, setSelectedKey] = useState(() => {
    const first = details[0];
    return first
      ? `${first.approvalItem.deliverableId}-${first.approvalItem.versionId}`
      : "";
  });
  if (details.length === 0) {
    return <EmptyState description="ستظهر هنا النسخ التي اعتمدها فريق سماوة وتحتاج قرارك." title="لا توجد مخرجات بانتظار موافقتك" />;
  }

  const selected =
    details.find(
      (detail) =>
        `${detail.approvalItem.deliverableId}-${detail.approvalItem.versionId}` === selectedKey,
    ) ?? details[0];
  const activeKey = `${selected.approvalItem.deliverableId}-${selected.approvalItem.versionId}`;

  return (
    <main className="mx-auto grid w-full max-w-5xl gap-5 px-4 py-6 sm:py-8" dir="rtl">
      <header className="grid gap-2">
        <p className="text-sm font-semibold text-accent">قرارات العميل</p>
        <h1 className="text-2xl font-semibold sm:text-3xl">بانتظار موافقتي</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted">راجع كل نسخة معتمدة للعميل، ثم اعتمدها أو أرسل ملاحظات التعديل على النسخة نفسها.</p>
      </header>
      <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
        <nav aria-label="قائمة المخرجات بانتظار القرار" className="grid gap-2 lg:sticky lg:top-4">
          {details.map((detail) => {
            const key = `${detail.approvalItem.deliverableId}-${detail.approvalItem.versionId}`;
            return (
              <button
                aria-current={key === activeKey ? "true" : undefined}
                className={`min-h-11 rounded-xl border p-3 text-start ${key === activeKey ? "border-accent bg-accent/10" : "border-border bg-surface"}`}
                key={key}
                onClick={() => setSelectedKey(key)}
                type="button"
              >
                <span className="block text-sm font-semibold">{detail.approvalItem.displayName}</span>
                <span className="mt-1 block text-xs text-muted">{detail.approvalItem.versionLabel} · {detail.approvalItem.dueDateLabel ?? "دون موعد"}</span>
              </button>
            );
          })}
        </nav>
        <section className="min-w-0 rounded-xl border border-border bg-surface p-4 sm:p-5" aria-live="polite">
          <ClientDeliverableDetail
            approveAction={canApprove ? approveAction : undefined}
            canApprove={canApprove}
            detail={selected}
            key={`${selected.approvalItem.deliverableId}-${selected.approvalItem.versionId}`}
            requestChangesAction={canApprove ? requestChangesAction : undefined}
          />
        </section>
      </div>
    </main>
  );
}

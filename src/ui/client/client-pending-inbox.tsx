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
  const heading = canApprove ? "بانتظار موافقتي" : "قيد المراجعة";
  const intro = canApprove
    ? "راجع كل نسخة معتمدة للعميل، ثم اعتمدها أو أرسل ملاحظات التعديل على النسخة نفسها."
    : "هذا الحساب للاطلاع فقط. تعرض هنا النسخ التي أعدها فريق سماوة بانتظار قرار الجهة المختصة بالاعتماد، ولا يمكنك اعتمادها أو طلب تعديل عليها.";
  const emptyTitle = canApprove
    ? "لا توجد مخرجات بانتظار موافقتك"
    : "لا توجد مخرجات قيد المراجعة الآن";
  const emptyDescription = canApprove
    ? "ستظهر هنا النسخ التي اعتمدها فريق سماوة وتحتاج قرارك."
    : "ستظهر هنا النسخ قيد المراجعة بمجرد أن يعتمدها فريق سماوة للجهة المختصة بالاعتماد.";

  if (details.length === 0) {
    return (
      <main
        className="mx-auto grid w-full max-w-5xl gap-5 px-4 py-6 sm:py-8"
        dir="rtl"
      >
        <EmptyState description={emptyDescription} title={emptyTitle} />
      </main>
    );
  }

  return (
    <main
      className="mx-auto grid w-full max-w-5xl gap-5 px-4 py-6 sm:py-8"
      dir="rtl"
    >
      <header className="grid gap-2">
        <p className="text-sm font-semibold text-accent">
          {canApprove ? "قرارات العميل" : "مراجعات العميل"}
        </p>
        <h1 className="text-2xl font-semibold sm:text-3xl">{heading}</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted">{intro}</p>
      </header>
      <div className="grid gap-5" aria-live="polite">
        {details.map((detail) => (
          <section
            className="min-w-0 rounded-xl border border-border bg-surface p-4 sm:p-5"
            key={`${detail.approvalItem.deliverableId}-${detail.approvalItem.versionId}`}
          >
            <ClientDeliverableDetail
              approveAction={canApprove ? approveAction : undefined}
              canApprove={canApprove}
              detail={detail}
              requestChangesAction={
                canApprove ? requestChangesAction : undefined
              }
            />
          </section>
        ))}
      </div>
    </main>
  );
}

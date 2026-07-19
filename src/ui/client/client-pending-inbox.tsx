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
  if (details.length === 0) {
    return (
      <main
        className="mx-auto grid w-full max-w-5xl gap-5 px-4 py-6 sm:py-8"
        dir="rtl"
      >
        <EmptyState
          description="ستظهر هنا النسخ التي اعتمدها فريق سماوة وتحتاج قرارك."
          title="لا توجد مخرجات بانتظار موافقتك"
        />
      </main>
    );
  }

  return (
    <main
      className="mx-auto grid w-full max-w-5xl gap-5 px-4 py-6 sm:py-8"
      dir="rtl"
    >
      <header className="grid gap-2">
        <p className="text-sm font-semibold text-accent">قرارات العميل</p>
        <h1 className="text-2xl font-semibold sm:text-3xl">بانتظار موافقتي</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted">
          راجع كل نسخة معتمدة للعميل، ثم اعتمدها أو أرسل ملاحظات التعديل على
          النسخة نفسها.
        </p>
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

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
    return <EmptyState description="ستظهر هنا النسخ التي اعتمدها فريق سماوة وتحتاج قرارك." title="لا توجد مخرجات بانتظار موافقتك" />;
  }

  return (
    <main className="mx-auto grid w-full max-w-5xl gap-5 px-4 py-6 sm:py-8" dir="rtl">
      <header className="grid gap-2">
        <p className="text-sm font-semibold text-accent">قرارات العميل</p>
        <h1 className="text-2xl font-semibold sm:text-3xl">بانتظار موافقتي</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted">راجع كل نسخة معتمدة للعميل، ثم اعتمدها أو أرسل ملاحظات التعديل على النسخة نفسها.</p>
      </header>
      <div className="grid gap-6">
        {details.map((detail) => (
          <ClientDeliverableDetail
            approveAction={canApprove ? approveAction : undefined}
            canApprove={canApprove}
            detail={detail}
            key={`${detail.approvalItem.deliverableId}-${detail.approvalItem.versionId}`}
            requestChangesAction={canApprove ? requestChangesAction : undefined}
          />
        ))}
      </div>
    </main>
  );
}

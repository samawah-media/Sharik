import { Badge } from "@/ui/core/badge";
import { Button } from "@/ui/core/button";

export type ClientApprovalFormAction = (
  formData: FormData,
) => void | Promise<void>;

export type ClientApprovalPanelItem = {
  clientId: string;
  deliverableId: string;
  versionId: string;
  expectedRevision: number;
  displayName: string;
  typeLabel: string;
  statusLabel: string;
  versionLabel: string;
  dueDateLabel?: string;
};

const HiddenApprovalFields = ({
  actionKind,
  idempotencyKey,
  item,
  reason,
}: {
  actionKind: "approve" | "request_changes";
  idempotencyKey: string;
  item: ClientApprovalPanelItem;
  reason?: string;
}) => (
  <>
    <input name="clientApprovalAction" type="hidden" value={actionKind} />
    <input name="clientId" type="hidden" value={item.clientId} />
    <input name="deliverableId" type="hidden" value={item.deliverableId} />
    <input name="versionId" type="hidden" value={item.versionId} />
    <input
      name="expectedRevision"
      type="hidden"
      value={item.expectedRevision}
    />
    <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
    {reason ? <input name="reason" type="hidden" value={reason} /> : null}
  </>
);

export function ClientApprovalPanel({
  approveAction,
  canApprove,
  item,
  requestChangesAction,
}: {
  approveAction?: ClientApprovalFormAction;
  canApprove: boolean;
  item: ClientApprovalPanelItem;
  requestChangesAction?: ClientApprovalFormAction;
}) {
  const hasServerActions = Boolean(approveAction && requestChangesAction);

  return (
    <section
      aria-label="قرار اعتماد العميل"
      className="grid gap-4 rounded-lg border border-border bg-surface p-4"
      dir="rtl"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <p className="text-sm text-muted">بانتظار موافقتك</p>
          <h2 className="text-base font-semibold leading-7">{item.displayName}</h2>
        </div>
        <Badge tone="accent">{item.statusLabel}</Badge>
      </div>

      <dl className="grid gap-2 text-sm text-muted sm:grid-cols-3">
        <div>
          <dt className="font-semibold text-foreground">النوع</dt>
          <dd className="mt-1">{item.typeLabel}</dd>
        </div>
        <div>
          <dt className="font-semibold text-foreground">النسخة</dt>
          <dd className="mt-1">{item.versionLabel}</dd>
        </div>
        <div>
          <dt className="font-semibold text-foreground">الموعد</dt>
          <dd className="mt-1">{item.dueDateLabel ?? "غير محدد"}</dd>
        </div>
      </dl>

      {!canApprove ? (
        <p className="rounded-md bg-background px-3 py-2 text-sm text-muted">
          يمكنك مشاهدة المخرج فقط.
        </p>
      ) : null}

      {canApprove && !hasServerActions ? (
        <p className="rounded-md bg-background px-3 py-2 text-sm text-muted">
          إجراءات الاعتماد تحتاج أمر خادم محمي قبل التفعيل.
        </p>
      ) : null}

      {canApprove && hasServerActions ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <form action={approveAction} className="grid gap-2">
            <HiddenApprovalFields
              actionKind="approve"
              idempotencyKey={`r007-client-approve-${item.deliverableId}-${item.expectedRevision}`}
              item={item}
              reason="client_approval"
            />
            <Button type="submit" variant="primary">
              اعتماد المخرج
            </Button>
          </form>

          <form action={requestChangesAction} className="grid gap-2">
            <HiddenApprovalFields
              actionKind="request_changes"
              idempotencyKey={`r007-client-changes-${item.deliverableId}-${item.expectedRevision}`}
              item={item}
            />
            <label className="grid gap-1 text-xs font-semibold text-foreground">
              سبب التعديل
              <textarea
                className="min-h-16 rounded-md border border-border bg-background px-3 py-2 text-sm"
                maxLength={500}
                name="reason"
                required
              />
            </label>
            <Button type="submit" variant="secondary">
              طلب تعديل
            </Button>
          </form>
        </div>
      ) : null}
    </section>
  );
}

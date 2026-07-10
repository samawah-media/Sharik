import type {
  ClientVisibleFileAssetSummary,
  FileAssetVisibility,
} from "@/modules/files/file-visibility-rules";
import type { ClientApprovalFormAction } from "./client-approval-panel";
import {
  ClientApprovalPanel,
  type ClientApprovalPanelItem,
} from "./client-approval-panel";

export type ClientPortalFileSummary = ClientVisibleFileAssetSummary & {
  label: string;
};

export type ClientPortalCommentSummary = {
  id: string;
  body: string;
  createdAt: string;
};

export type ClientSafeDeliverableDetail = {
  approvalItem: ClientApprovalPanelItem;
  statusLabel: string;
  progressPercentage: number;
  files: ClientPortalFileSummary[];
  comments: ClientPortalCommentSummary[];
};

const visibilityLabels: Record<FileAssetVisibility, string> = {
  internal_only: "ملف داخلي",
  client_visible: "ملف متاح",
  client_uploaded: "ملف مرفوع من العميل",
  final_delivery: "تسليم نهائي",
  contract_file: "ملف العقد",
  report_file: "تقرير",
  brand_asset: "أصل للهوية",
};

const formatDate = (value: string) => value.slice(0, 10);

export function ClientDeliverableDetail({
  approveAction,
  canApprove,
  detail,
  requestChangesAction,
}: {
  approveAction?: ClientApprovalFormAction;
  canApprove: boolean;
  detail: ClientSafeDeliverableDetail;
  requestChangesAction?: ClientApprovalFormAction;
}) {
  return (
    <section
      aria-label="تفاصيل مخرج العميل"
      className="grid gap-5"
      data-testid="client-approval-detail"
      dir="rtl"
      id="approval"
    >
      <div className="grid gap-2">
        <h2 className="text-lg font-semibold">بانتظار موافقتي</h2>
        <p className="text-xl font-semibold">
          {detail.approvalItem.displayName}
        </p>
        <dl className="grid gap-2 text-sm text-muted sm:grid-cols-3">
          <div className="rounded-md bg-surface px-3 py-2">
            <dt className="font-semibold text-foreground">الحالة</dt>
            <dd className="mt-1">{detail.statusLabel}</dd>
          </div>
          <div className="rounded-md bg-surface px-3 py-2">
            <dt className="font-semibold text-foreground">التقدم</dt>
            <dd className="mt-1">{detail.progressPercentage}%</dd>
          </div>
          <div className="rounded-md bg-surface px-3 py-2">
            <dt className="font-semibold text-foreground">الموعد</dt>
            <dd className="mt-1">
              {detail.approvalItem.dueDateLabel ?? "غير محدد"}
            </dd>
          </div>
        </dl>
      </div>

      <ClientApprovalPanel
        approveAction={approveAction}
        canApprove={canApprove}
        item={detail.approvalItem}
        requestChangesAction={requestChangesAction}
      />

      <section aria-label="ملفات العميل" className="grid gap-3">
        <h3 className="text-base font-semibold">الملفات المتاحة</h3>
        {detail.files.length > 0 ? (
          <ul className="grid gap-2" data-testid="client-files">
            {detail.files.map((file) => (
              <li
                className="rounded-md bg-surface px-3 py-2"
                data-file-visibility={file.visibility}
                key={file.id}
              >
                <p className="text-sm font-semibold">{file.label}</p>
                <p className="text-xs text-muted">
                  {visibilityLabels[file.visibility]} · نسخة {file.versionNumber}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-md bg-surface px-3 py-2 text-sm text-muted">
            لا توجد ملفات متاحة الآن.
          </p>
        )}
      </section>

      <section aria-label="تعليقات العميل" className="grid gap-3">
        <h3 className="text-base font-semibold">التعليقات</h3>
        {detail.comments.length > 0 ? (
          <ul className="grid gap-2">
            {detail.comments.map((comment) => (
              <li className="rounded-md bg-surface px-3 py-2" key={comment.id}>
                <p className="text-sm leading-6">{comment.body}</p>
                <p className="mt-1 text-xs text-muted">
                  {formatDate(comment.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-md bg-surface px-3 py-2 text-sm text-muted">
            لا توجد تعليقات ظاهرة الآن.
          </p>
        )}
      </section>
    </section>
  );
}

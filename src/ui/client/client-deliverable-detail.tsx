import type { FileAssetVisibility } from "@/modules/files/file-visibility-rules";
import { firstMeaningfulReviewText } from "@/modules/approvals/client-review-readiness";
import type { ClientApprovalFormAction } from "./client-approval-panel";
import {
  ClientApprovalPanel,
  type ClientApprovalPanelItem,
} from "./client-approval-panel";
import {
  WorkspaceFileDownload,
  WorkspaceFilePreview,
} from "@/ui/deliverables/workspace-files";
import { ClientWorkspaceCommentForm } from "@/ui/deliverables/workspace-forms";
import { ContentPreviewCard } from "@/ui/deliverables/content-preview-card";
import { WorkspaceInlineMedia } from "@/ui/deliverables/workspace-files";

export type ClientPortalFileSummary = {
  id: string;
  label: string;
  visibility: FileAssetVisibility;
  fileType: string;
  fileSize: number;
  versionNumber: number;
  isFinal: boolean;
  createdAt: string;
};

export type ClientPortalCommentSummary = {
  id: string;
  body: string;
  createdAt: string;
  authorName: string;
};

export type ClientSafeDeliverableDetail = {
  clientName?: string;
  approvalItem: ClientApprovalPanelItem;
  statusLabel: string;
  progressPercentage: number;
  files: ClientPortalFileSummary[];
  comments: ClientPortalCommentSummary[];
  content?: {
    brief?: string;
    body?: string;
    caption?: string;
    channel?: string;
    format?: string;
    objective?: string;
    kpi?: string;
  };
  previewFile?: {
    id: string;
    fileType: string;
    label: string;
  };
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
  const reviewHeading = canApprove
    ? detail.approvalItem.isActionable
      ? "قرارك مطلوب"
      : detail.approvalItem.actionabilityReason === "missing_review_payload"
        ? "نسخة غير مكتملة"
        : "تفاصيل المخرج"
    : "للاطلاع";
  const visibleStatusLabel = canApprove
    ? detail.statusLabel
    : detail.statusLabel === "بانتظار موافقتك"
      ? "قيد المراجعة"
      : detail.statusLabel;
  const visibleApprovalItem = canApprove
    ? detail.approvalItem
    : {
        ...detail.approvalItem,
        statusLabel:
          detail.approvalItem.statusLabel === "بانتظار موافقتك"
            ? "قيد المراجعة"
            : detail.approvalItem.statusLabel,
      };

  return (
    <section
      aria-label="تفاصيل مخرج العميل"
      className="grid w-full min-w-0 max-w-[calc(100vw-2rem)] gap-5 sm:max-w-full"
      data-testid="client-approval-detail"
      data-review-ready={
        detail.approvalItem.actionabilityReason ? "false" : "true"
      }
      dir="rtl"
      id="approval"
    >
      <div className="grid gap-2">
        <h2 className="text-lg font-semibold">{reviewHeading}</h2>
        <dl className="grid gap-2 text-sm text-muted sm:grid-cols-2">
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

      <ContentPreviewCard
        caption={firstMeaningfulReviewText(
          detail.content?.caption,
          detail.content?.body,
        )}
        channel={detail.content?.channel}
        clientName={detail.clientName}
        eyebrow={detail.approvalItem.versionLabel}
        format={detail.content?.format ?? detail.approvalItem.typeLabel}
        status={visibleStatusLabel}
        title={detail.approvalItem.displayName}
        media={
          detail.previewFile ? (
            <WorkspaceInlineMedia
              fileId={detail.previewFile.id}
              fileType={detail.previewFile.fileType}
              label={detail.previewFile.label}
            />
          ) : undefined
        }
      />

      <ClientApprovalPanel
        approveAction={approveAction}
        canApprove={canApprove}
        item={visibleApprovalItem}
        requestChangesAction={requestChangesAction}
        showSummary={false}
      />

      {detail.content?.objective || detail.content?.kpi ? (
        <section
          aria-label="هدف المحتوى وقياسه"
          className="grid min-w-0 gap-3 rounded-lg border border-border bg-surface p-4"
        >
          <h3 className="text-base font-semibold">الهدف والقياس</h3>
          <dl className="grid gap-2 text-xs text-muted sm:grid-cols-2">
            {detail.content.objective ? (
              <div>
                <dt className="font-semibold text-foreground">الهدف</dt>
                <dd>{detail.content.objective}</dd>
              </div>
            ) : null}
            {detail.content.kpi ? (
              <div>
                <dt className="font-semibold text-foreground">مؤشر القياس</dt>
                <dd>{detail.content.kpi}</dd>
              </div>
            ) : null}
          </dl>
        </section>
      ) : null}

      <section aria-label="ملفات العميل" className="grid gap-3">
        <h3 className="text-base font-semibold">الملفات المتاحة</h3>
        {detail.files.length > 0 ? (
          <ul className="grid gap-2" data-testid="client-files">
            {detail.files.map((file) => (
              <li
                className="min-w-0 rounded-md bg-surface px-3 py-2"
                data-file-visibility={file.visibility}
                key={file.id}
              >
                <p className="break-words text-sm font-semibold">
                  {file.label}
                </p>
                <p className="text-xs text-muted">
                  {visibilityLabels[file.visibility]} · نسخة{" "}
                  {file.versionNumber}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <WorkspaceFileDownload fileId={file.id} />
                  <WorkspaceFilePreview
                    fileId={file.id}
                    fileType={file.fileType}
                    label={file.label}
                  />
                </div>
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
              <li
                className="min-w-0 rounded-md bg-surface px-3 py-2"
                key={comment.id}
              >
                <p className="break-words text-sm leading-6">{comment.body}</p>
                <p className="mt-1 text-xs text-muted">
                  {comment.authorName} · {formatDate(comment.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-md bg-surface px-3 py-2 text-sm text-muted">
            لا توجد تعليقات ظاهرة الآن.
          </p>
        )}
        {canApprove ? (
          <ClientWorkspaceCommentForm
            clientId={detail.approvalItem.clientId}
            deliverableId={detail.approvalItem.deliverableId}
            versionId={detail.approvalItem.versionId}
          />
        ) : null}
      </section>
    </section>
  );
}

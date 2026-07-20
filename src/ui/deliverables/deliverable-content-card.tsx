import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";
import type { DeliverableWorkspaceSummary } from "@/modules/deliverables/deliverable-workspace";
import { firstMeaningfulReviewText } from "@/modules/approvals/client-review-readiness";
import { ContentPreviewCard } from "./content-preview-card";
import { WorkspaceInlineMedia } from "./workspace-files";

export function DeliverableContentCard({
  clientName,
  deliverable,
  statusLabel,
  summary,
  typeLabel,
}: {
  clientName?: string;
  deliverable: DeliverableSafeSummary;
  statusLabel: string;
  summary?: DeliverableWorkspaceSummary;
  typeLabel: string;
}) {
  const version = summary?.currentVersion;
  const preview = summary?.previewFile;
  const dueDate =
    deliverable.internalDueDate ??
    deliverable.clientDueDate ??
    deliverable.finalDueDate ??
    deliverable.plannedPublishDate;

  return (
    <ContentPreviewCard
      caption={firstMeaningfulReviewText(version?.caption, version?.body)}
      channel={version?.channel ?? typeLabel}
      clientName={clientName}
      eyebrow={version ? `النسخة ${version.versionNumber}` : "المخرج"}
      footer={
        <dl className="grid gap-2 text-xs text-muted sm:grid-cols-3">
          <div>
            <dt className="font-semibold text-foreground">المسؤول</dt>
            <dd>{deliverable.ownerDisplay?.displayName ?? "بانتظار الإسناد"}</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">الموعد</dt>
            <dd>{dueDate ?? "غير محدد"}</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">القناة والصيغة</dt>
            <dd>
              {[version?.channel, version?.format ?? typeLabel]
                .filter(Boolean)
                .join(" · ")}
            </dd>
          </div>
        </dl>
      }
      format={version?.format ?? typeLabel}
      media={
        preview ? (
          <WorkspaceInlineMedia
            fileId={preview.id}
            fileType={preview.fileType}
            label={`معاينة ${deliverable.name}`}
          />
        ) : undefined
      }
      status={statusLabel}
      title={deliverable.name}
    />
  );
}

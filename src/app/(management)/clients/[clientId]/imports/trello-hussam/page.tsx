import {
  HUSSAM_TRELLO_CONFIRMATION,
  HUSSAM_TRELLO_EXPECTED_ACTIVE_CARDS,
  HUSSAM_TRELLO_TARGET_CLIENT_ID,
} from "@/modules/imports/trello-hussam";
import { loadHussamTrelloImportPreview } from "@/server/actions/trello-hussam-import";
import { loadHussamAttachmentImportPreview } from "@/server/actions/trello-hussam-attachments";
import { Badge } from "@/ui/core/badge";
import { ButtonLink } from "@/ui/core/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  SectionPanel,
} from "@/ui/core/card";
import {
  AccessDeniedState,
  ClientUnavailableState,
} from "@/ui/shared/access-states";
import { TrelloHussamImportForm } from "@/ui/management/trello-hussam-import-form";
import { TrelloHussamAttachmentForm } from "@/ui/management/trello-hussam-attachment-form";

export const maxDuration = 300;

const stateLabels = {
  ready: "جاهز للنقل",
  incomplete_import: "استيراد غير مكتمل — سيُستأنف بأمان",
  already_imported: "منقول سابقًا — سيُستكمل بأمان",
  exact_duplicate: "عنوان مطابق — سيُترك دون تكرار",
  scope_conflict: "تعارض نطاق — يمنع التنفيذ",
} as const;

export default async function HussamTrelloImportPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  if (clientId !== HUSSAM_TRELLO_TARGET_CLIENT_ID) {
    return <ClientUnavailableState />;
  }

  const [previewResult, attachmentPreviewResult] = await Promise.all([
    loadHussamTrelloImportPreview(),
    loadHussamAttachmentImportPreview(),
  ]);
  if (!previewResult.ok) {
    return previewResult.reason === "denied" ? (
      <AccessDeniedState returnHref={`/clients/${clientId}`} />
    ) : (
      <main className="grid gap-4" dir="rtl">
        <h1 className="text-2xl font-semibold">
          استيراد محتوى الحسام من Trello
        </h1>
        <p className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-danger">
          تعذر تحميل المعاينة الآمنة. لم تُكتب أي بيانات. حدّث الصفحة وحاول
          مجددًا.
        </p>
      </main>
    );
  }

  const { preview } = previewResult;
  const countChanged =
    preview.activeCardCount !== HUSSAM_TRELLO_EXPECTED_ACTIVE_CARDS;
  const executionBlocked = countChanged || preview.scopeConflictCount > 0;

  return (
    <main className="grid max-w-6xl gap-5" dir="rtl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-accent">
            معاينة فقط — لا توجد كتابة عند فتح الصفحة
          </p>
          <h1 className="mt-1 text-2xl font-semibold">
            استيراد محتوى الحسام من Trello
          </h1>
          <p className="mt-2 text-sm text-muted">{preview.boardName}</p>
        </div>
        <ButtonLink href={`/clients/${clientId}`} variant="secondary">
          العودة لمساحة العميل
        </ButtonLink>
      </div>

      <section
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6"
        aria-label="ملخص المعاينة"
      >
        <SummaryCard label="بطاقات نشطة" value={preview.activeCardCount} />
        <SummaryCard label="مخرجات جديدة" value={preview.readyCount} />
        <SummaryCard
          label="منقولة سابقًا"
          value={preview.alreadyImportedCount}
        />
        <SummaryCard
          label="تحتاج استكمالًا"
          value={preview.incompleteImportCount}
        />
        <SummaryCard
          label="عناوين مطابقة"
          value={preview.exactDuplicateCount}
        />
        <SummaryCard label="مهام إجرائية" value={preview.taskCount} />
      </section>

      {countChanged ? (
        <p
          className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-danger"
          role="alert"
        >
          العدد الحالي ليس 60 بطاقة نشطة. التنفيذ معطل حتى مراجعة التغيير في
          Trello.
        </p>
      ) : null}
      {preview.scopeConflictCount > 0 ? (
        <p
          className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-danger"
          role="alert"
        >
          يوجد {preview.scopeConflictCount} تعارضًا في مفاتيح المصدر مع عميل
          آخر. التنفيذ معطل.
        </p>
      ) : null}

      <SectionPanel label="الباقات والسعة">
        <h2 className="text-lg font-semibold">الباقات وخطوط السعة</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-2xl text-right text-sm">
            <thead className="text-muted">
              <tr>
                <th className="p-2">الباقة</th>
                <th className="p-2">سطر الخدمة</th>
                <th className="p-2">الوحدة</th>
                <th className="p-2">المتاح</th>
                <th className="p-2">النتيجة</th>
              </tr>
            </thead>
            <tbody>
              {preview.packageOptions.map((option) => (
                <tr className="border-t border-border" key={option.lineId}>
                  <td className="p-2">{option.packageName}</td>
                  <td className="p-2">{option.serviceLabel}</td>
                  <td className="p-2">{option.unitLabel}</td>
                  <td className="p-2">{option.available}</td>
                  <td className="p-2">
                    {option.available >= preview.readyCount
                      ? "تكفي"
                      : "لا تكفي"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionPanel>

      <SectionPanel label="تفاصيل البطاقات">
        <h2 className="text-lg font-semibold">تفاصيل 60 بطاقة قبل النقل</h2>
        <div className="mt-3 grid gap-2">
          {preview.cards.map((plan) => (
            <Card className="shadow-none" key={plan.card.id}>
              <CardHeader className="flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle>{plan.card.name}</CardTitle>
                  <p className="text-xs text-muted">{plan.card.listName}</p>
                </div>
                <Badge>{stateLabels[plan.state]}</Badge>
              </CardHeader>
              <CardContent className="text-xs text-muted">
                {plan.tasks.length
                  ? `المهام: ${plan.tasks.map((task) => task.title).join("، ")}`
                  : "لا توجد labels إجرائية تتحول إلى مهام."}
              </CardContent>
            </Card>
          ))}
        </div>
      </SectionPanel>

      <SectionPanel label="تأكيد التنفيذ">
        <h2 className="text-lg font-semibold">التنفيذ بعد مراجعة المعاينة</h2>
        <p className="my-3 text-sm leading-6 text-muted">
          لن يستخدم التنفيذ صلاحية service role، ولن ينشئ مخرجات إضافية خارج
          الباقة، ولن ينقل المرفقات. حالات النشر والرفض في Trello لا تتحول إلى
          مهام.
        </p>
        {executionBlocked ? (
          <p className="text-sm text-danger">
            أصلح أسباب المنع الظاهرة أعلاه قبل التنفيذ.
          </p>
        ) : (
          <TrelloHussamImportForm
            confirmationPhrase={HUSSAM_TRELLO_CONFIRMATION}
            packageOptions={preview.packageOptions}
            requiredCapacity={preview.readyCount}
          />
        )}
      </SectionPanel>

      <SectionPanel label="نقل المرفقات">
        <h2 className="text-lg font-semibold">نقل المرفقات المؤهلة تلقائيًا</h2>
        {!attachmentPreviewResult.ok ? (
          <p className="mt-3 rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
            تعذر تحميل معاينة المرفقات. لن يبدأ أي نقل.
          </p>
        ) : (
          <div className="mt-3 grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                label="مرفقات مؤهلة حاليًا"
                value={attachmentPreviewResult.preview.eligibleCount}
              />
              <SummaryCard
                label="تم نقلها"
                value={attachmentPreviewResult.preview.importedCount}
              />
              <SummaryCard
                label="متبقية"
                value={attachmentPreviewResult.preview.remainingCount}
              />
              <SummaryCard
                label="مستبعدة"
                value={
                  attachmentPreviewResult.preview.excludedSharePointCount +
                  attachmentPreviewResult.preview.excludedUnsupportedCount +
                  attachmentPreviewResult.preview.excludedTooLargeCount +
                  attachmentPreviewResult.preview.excludedUnavailableCount
                }
              />
            </div>
            <p className="text-sm leading-6 text-muted">
              المستبعد الآن: SharePoint{" "}
              {attachmentPreviewResult.preview.excludedSharePointCount}، نوع غير
              مدعوم مثل PSD{" "}
              {attachmentPreviewResult.preview.excludedUnsupportedCount}، أكبر
              من 100MB {attachmentPreviewResult.preview.excludedTooLargeCount}،
              ومصدر غير متاح{" "}
              {attachmentPreviewResult.preview.excludedUnavailableCount}. روابط
              Google Drive العامة وملفات Trello المسموحة تُنقل كملفات داخلية.
            </p>
            {preview.readyCount > 0 || preview.incompleteImportCount > 0 ? (
              <p className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
                أكمل استيراد البيانات النصية أولًا؛ المرفق لا يُنقل إلا إذا كان
                مخرجه ونسخته موجودين بالفعل.
              </p>
            ) : attachmentPreviewResult.preview.remainingCount > 0 ? (
              <TrelloHussamAttachmentForm />
            ) : (
              <p className="text-sm text-success">
                لا توجد مرفقات مؤهلة متبقية.
              </p>
            )}
          </div>
        )}
      </SectionPanel>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent className="text-2xl font-semibold">{value}</CardContent>
    </Card>
  );
}

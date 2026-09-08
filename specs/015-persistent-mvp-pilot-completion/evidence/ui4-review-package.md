# UI4 exact presentation delta — 2026-09-08

Compared against pre-UI4 dirty-file snapshots; not the full branch diff.
HEAD115fb9af unchanged. This package contains only the three production files.

## client-approval-panel.tsx

```diff
diff --git a/D:/Omar_Data/Temp/samawah-ui4-baseline-20260908/client-approval-panel.tsx b/src/ui/client/client-approval-panel.tsx
index 0fe88e0..7483f41 100644
--- a/D:/Omar_Data/Temp/samawah-ui4-baseline-20260908/client-approval-panel.tsx
+++ b/src/ui/client/client-approval-panel.tsx
@@ -72,7 +72,7 @@ export function ClientApprovalPanel({
   return (
     <section
       aria-label="قرار اعتماد العميل"
-      className="grid gap-4 rounded-lg border border-border bg-surface p-4"
+      className="grid min-w-0 gap-4 rounded-lg border border-border bg-surface p-4"
       data-testid="client-approval-actions"
       dir="rtl"
     >
@@ -80,7 +80,9 @@ export function ClientApprovalPanel({
         <>
           <div className="flex flex-wrap items-start justify-between gap-3">
             <div className="grid gap-1">
-              <p className="text-sm text-muted">بانتظار قرارك</p>
+              <p className="text-sm text-muted">
+                {canSubmitDecision ? "بانتظار قرارك" : "للاطلاع"}
+              </p>
               <h2 className="text-base font-semibold leading-7">
                 {item.displayName}
               </h2>
@@ -104,9 +106,14 @@ export function ClientApprovalPanel({
           </dl>
         </>
       ) : (
-        <h3 className="text-base font-semibold">
-          {canApprove ? "قرار الاعتماد" : "صلاحية الحساب"}
-        </h3>
+        <div className="flex flex-wrap items-center gap-2">
+          <h3 className="text-base font-semibold">
+            {canApprove ? "قرار الاعتماد" : "صلاحية الحساب"}
+          </h3>
+          <span className="min-w-0 break-words text-sm text-muted">
+            {item.versionLabel}
+          </span>
+        </div>
       )}

       {!canSubmitDecision ? (
@@ -117,7 +124,7 @@ export function ClientApprovalPanel({

       {canSubmitDecision && !hasServerActions ? (
         <p className="rounded-md bg-background px-3 py-2 text-sm text-muted">
-          إجراءات الاعتماد تحتاج أمر خادم محمي قبل التفعيل.
+          إجراءات الموافقة غير متاحة الآن.
         </p>
       ) : null}

@@ -131,7 +138,7 @@ export function ClientApprovalPanel({
               reason="client_approval"
             />
             <Button type="submit" variant="primary">
-              اعتماد المخرج
+              اعتماد النسخة
             </Button>
           </form>

@@ -147,6 +154,7 @@ export function ClientApprovalPanel({
                 className="min-h-16 rounded-md border border-border bg-background px-3 py-2 text-sm"
                 maxLength={500}
                 name="reason"
+                placeholder="وش التعديل المطلوب على النسخة؟"
                 required
               />
             </label>

```

## client-deliverable-detail.tsx

```diff
diff --git a/D:/Omar_Data/Temp/samawah-ui4-baseline-20260908/client-deliverable-detail.tsx b/src/ui/client/client-deliverable-detail.tsx
index cc6f32a..f72865a 100644
--- a/D:/Omar_Data/Temp/samawah-ui4-baseline-20260908/client-deliverable-detail.tsx
+++ b/src/ui/client/client-deliverable-detail.tsx
@@ -130,35 +130,38 @@ export function ClientDeliverableDetail({
         </dl>
       </div>

-      <ContentPreviewCard
-        caption={firstMeaningfulReviewText(
-          detail.content?.caption,
-          detail.content?.body,
-        )}
-        channel={detail.content?.channel}
-        clientName={detail.clientName}
-        eyebrow={detail.approvalItem.versionLabel}
-        format={detail.content?.format ?? detail.approvalItem.typeLabel}
-        status={visibleStatusLabel}
-        title={detail.approvalItem.displayName}
-        media={
-          detail.previewFile ? (
-            <WorkspaceInlineMedia
-              fileId={detail.previewFile.id}
-              fileType={detail.previewFile.fileType}
-              label={detail.previewFile.label}
-            />
-          ) : undefined
-        }
-      />
+      <div className="grid min-w-0 items-start gap-5 lg:grid-cols-2">
+        <ContentPreviewCard
+          caption={firstMeaningfulReviewText(
+            detail.content?.caption,
+            detail.content?.body,
+          )}
+          channel={detail.content?.channel}
+          clientName={detail.clientName}
+          eyebrow={detail.approvalItem.versionLabel}
+          format={detail.content?.format ?? detail.approvalItem.typeLabel}
+          fullText
+          status={visibleStatusLabel}
+          title={detail.approvalItem.displayName}
+          media={
+            detail.previewFile ? (
+              <WorkspaceInlineMedia
+                fileId={detail.previewFile.id}
+                fileType={detail.previewFile.fileType}
+                label={detail.previewFile.label}
+              />
+            ) : undefined
+          }
+        />

-      <ClientApprovalPanel
-        approveAction={approveAction}
-        canApprove={canApprove}
-        item={visibleApprovalItem}
-        requestChangesAction={requestChangesAction}
-        showSummary={false}
-      />
+        <ClientApprovalPanel
+          approveAction={approveAction}
+          canApprove={canApprove}
+          item={visibleApprovalItem}
+          requestChangesAction={requestChangesAction}
+          showSummary={false}
+        />
+      </div>

       {detail.content?.objective || detail.content?.kpi ? (
         <section

```

## content-preview-card.tsx

```diff
diff --git a/D:/Omar_Data/Temp/samawah-ui4-baseline-20260908/content-preview-card.tsx b/src/ui/deliverables/content-preview-card.tsx
index 377b5d4..97e79ad 100644
--- a/D:/Omar_Data/Temp/samawah-ui4-baseline-20260908/content-preview-card.tsx
+++ b/src/ui/deliverables/content-preview-card.tsx
@@ -20,6 +20,7 @@ type ContentPreviewCardProps = {
   captionLabel?: string;
   footer?: ReactNode;
   compact?: boolean;
+  fullText?: boolean;
   className?: string;
 };

@@ -80,6 +81,7 @@ export function ContentPreviewCard({
   captionLabel = "نص النسخة الحالية",
   footer,
   compact = false,
+  fullText = false,
   className,
 }: ContentPreviewCardProps) {
   const presentation = channelPresentation(channel, format);
@@ -138,7 +140,14 @@ export function ContentPreviewCard({
         </div>
         <div className="grid gap-1 border-b border-border bg-surface p-4">
           <p className="text-xs font-semibold text-accent">{eyebrow}</p>
-          <p className="line-clamp-2 text-lg font-bold leading-7">{title}</p>
+          <p
+            className={cn(
+              "text-lg font-bold leading-7",
+              fullText ? "whitespace-pre-wrap break-words" : "line-clamp-2",
+            )}
+          >
+            {title}
+          </p>
           {clientName ? (
             <p className="text-xs text-muted">{clientName}</p>
           ) : null}
@@ -152,7 +161,12 @@ export function ContentPreviewCard({
         {visibleCaption ? (
           <div>
             <p className="text-xs font-semibold text-muted">{captionLabel}</p>
-            <p className="mt-1 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-7 text-foreground">
+            <p
+              className={cn(
+                "mt-1 whitespace-pre-wrap break-words text-sm leading-7 text-foreground",
+                !fullText && "line-clamp-3",
+              )}
+            >
               {visibleCaption}
             </p>
           </div>

```

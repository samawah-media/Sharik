"use client";

import Uppy from "@uppy/core";
import Tus from "@uppy/tus";
import Dashboard from "@uppy/react/dashboard";
import "@uppy/core/css/style.min.css";
import "@uppy/dashboard/css/style.min.css";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  createWorkspaceFileDownload,
  createWorkspaceFilePreview,
  registerWorkspaceFile,
} from "@/server/actions/deliverable-workspace-actions";
import { Button } from "@/ui/core/button";

const allowedTypes = [
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "video/mp4", "video/webm", "application/pdf", "text/plain",
] as const;

export function WorkspaceFileUpload({
  deliverable,
  currentVersionId,
  canPublishClientFile,
}: {
  deliverable: DeliverableSafeSummary;
  currentVersionId?: string;
  canPublishClientFile: boolean;
}) {
  const router = useRouter();
  const [uppy, setUppy] = useState<Uppy>();
  const [feedback, setFeedback] = useState<string>();
  const [visibility, setVisibility] = useState<"internal_only" | "client_visible" | "final_delivery">("internal_only");
  const visibilityRef = useRef(visibility);

  useEffect(() => {
    visibilityRef.current = visibility;
  }, [visibility]);

  useEffect(() => {
    if (!currentVersionId) return;
    let active = true;
    let instance: Uppy | undefined;
    const supabase = createSupabaseBrowserClient();
    const setup = async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const endpoint = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      if (!token || !endpoint || !apiKey || !active) {
        setFeedback("جلسة الرفع غير متاحة. حدّث الصفحة وسجّل الدخول مجددًا.");
        return;
      }
      const created = new Uppy({
        autoProceed: false,
        restrictions: { maxFileSize: 104_857_600, maxNumberOfFiles: 5, allowedFileTypes: [...allowedTypes] },
        onBeforeFileAdded: (file) => {
          const extension = file.name.includes(".") ? `.${file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "")}` : "";
          const objectName = `${deliverable.tenantId}/${deliverable.clientId}/${deliverable.id}/${currentVersionId}/${crypto.randomUUID()}${extension}`;
          return {
            ...file,
            meta: {
              ...file.meta,
              bucketName: "deliverable-assets",
              objectName,
              contentType: file.type,
              cacheControl: "3600",
              uploadId: crypto.randomUUID(),
            },
          };
        },
      }).use(Tus, {
        endpoint: `${endpoint}/storage/v1/upload/resumable`,
        headers: { authorization: `Bearer ${token}`, apikey: apiKey },
        removeFingerprintOnSuccess: true,
        retryDelays: [0, 1_000, 3_000, 5_000],
      });
      instance = created;
      created.on("complete", async (result) => {
        let saved = 0;
        for (const file of result.successful ?? []) {
          const path = String(file.meta.objectName ?? "");
          const uploadId = String(file.meta.uploadId ?? crypto.randomUUID());
          const registered = await registerWorkspaceFile({
            fileId: crypto.randomUUID(),
            clientId: deliverable.clientId,
            deliverableId: deliverable.id,
            versionId: currentVersionId,
            bucketId: "deliverable-assets",
            storagePath: path,
            fileName: file.name,
            fileType: file.type as (typeof allowedTypes)[number],
            fileSize: file.size ?? 0,
            visibility: visibilityRef.current,
            isFinal: visibilityRef.current === "final_delivery",
            idempotencyKey: `s015-upload-${uploadId}`,
          });
          if (registered.ok) {
            saved += 1;
          } else {
            await supabase.storage.from("deliverable-assets").remove([path]);
          }
        }
        setFeedback(saved === (result.successful?.length ?? 0) ? `تم حفظ ${saved} ملف بنجاح.` : "تعذر حفظ بعض الملفات وحُذفت الرفوعات غير المسجلة تلقائيًا.");
        router.refresh();
      });
      created.on("upload-error", () => setFeedback("فشل الرفع. لم تُسجل بيانات ملف ناقصة."));
      if (active) setUppy(created);
    };
    void setup();
    return () => {
      active = false;
      void instance?.cancelAll();
      instance?.destroy();
    };
  }, [currentVersionId, deliverable.clientId, deliverable.id, deliverable.tenantId, router]);

  if (!currentVersionId) return <p className="text-sm text-muted">احفظ نسخة أولًا لرفع ملفات مرتبطة بها.</p>;
  return (
    <div className="grid gap-3 rounded-xl border border-border bg-background p-4">
      {canPublishClientFile ? <label className="grid gap-1 text-sm font-semibold">رؤية الملف<select className="min-h-11 rounded-lg border border-border bg-surface px-3" onChange={(event) => setVisibility(event.target.value as typeof visibility)} value={visibility}><option value="internal_only">داخلي — الافتراضي</option><option value="client_visible">ظاهر للعميل</option><option value="final_delivery">تسليم نهائي</option></select></label> : null}
      {uppy ? <Dashboard height={300} proudlyDisplayPoweredByUppy={false} uppy={uppy} width="100%" /> : <p className="text-sm text-muted">جارٍ تجهيز الرفع الآمن…</p>}
      {feedback ? <p aria-live="polite" className="text-sm text-muted">{feedback}</p> : null}
    </div>
  );
}

export function WorkspaceFileDownload({ fileId }: { fileId: string }) {
  const [feedback, setFeedback] = useState<string>();
  const download = async () => {
    const result = await createWorkspaceFileDownload(fileId);
    if (!result.ok) {
      setFeedback("تعذر تنزيل الملف أو انتهت صلاحية الوصول.");
      return;
    }
    window.open(result.url, "_blank", "noopener,noreferrer");
  };
  return <div><Button onClick={download} size="sm" type="button">تنزيل آمن</Button>{feedback ? <p aria-live="polite" className="mt-1 text-xs text-danger">{feedback}</p> : null}</div>;
}

export function WorkspaceFilePreview({
  fileId,
  fileType,
  label,
}: {
  fileId: string;
  fileType: string;
  label: string;
}) {
  const [url, setUrl] = useState<string>();
  const [feedback, setFeedback] = useState<string>();
  const preview = async () => {
    const result = await createWorkspaceFileDownload(fileId);
    if (!result.ok) {
      setFeedback("المعاينة غير متاحة لهذا الدور أو انتهت صلاحيتها.");
      return;
    }
    setUrl(result.url);
  };
  return (
    <div className="grid gap-2">
      <Button onClick={preview} size="sm" type="button">معاينة</Button>
      {/* Signed object URLs are short-lived and cannot be safely delegated to the Next image optimizer. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {url && fileType.startsWith("image/") ? <img alt={label} className="max-h-80 w-full rounded-lg border border-border object-contain" src={url} /> : null}
      {url && fileType.startsWith("video/") ? <video aria-label={label} className="max-h-80 w-full rounded-lg border border-border" controls preload="metadata" src={url} /> : null}
      {url && fileType === "application/pdf" ? <iframe className="h-80 w-full rounded-lg border border-border" src={url} title={label} /> : null}
      {url && !fileType.startsWith("image/") && !fileType.startsWith("video/") && fileType !== "application/pdf" ? <p className="rounded-lg bg-surface p-3 text-sm text-muted">لا توجد معاينة مرئية لهذا النوع. استخدم التنزيل الآمن.</p> : null}
      {feedback ? <p aria-live="polite" className="text-xs text-danger">{feedback}</p> : null}
    </div>
  );
}

export function WorkspaceInlineMedia({
  fileId,
  fileType,
  label,
}: {
  fileId: string;
  fileType: string;
  label: string;
}) {
  const [url, setUrl] = useState<string>();
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let active = true;
    void createWorkspaceFilePreview(fileId).then((preview) => {
      if (!active) return;
      if (preview.ok) setUrl(preview.url);
      else setUnavailable(true);
    });
    return () => {
      active = false;
    };
  }, [fileId]);

  if (unavailable) {
    return (
      <p className="grid min-h-36 place-items-center p-4 text-center text-xs text-muted">
        تعذرت معاينة الأصل المرئي بأمان.
      </p>
    );
  }
  if (!url) {
    return (
      <div
        aria-label="جارٍ تحميل المعاينة"
        className="min-h-36 animate-pulse bg-border/30 motion-reduce:animate-none"
      />
    );
  }
  if (fileType.startsWith("image/")) {
    return (
      // Signed object URLs are short-lived and cannot use the image optimizer.
      // eslint-disable-next-line @next/next/no-img-element
      <img alt={label} className="h-full min-h-36 w-full object-cover" src={url} />
    );
  }
  return (
    <video
      aria-label={label}
      className="h-full min-h-36 w-full object-cover"
      controls
      preload="metadata"
      src={url}
    />
  );
}

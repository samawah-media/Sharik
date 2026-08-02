"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  canPreviewInline,
  clientFileStatus,
  formatDateArabic,
  fileTypeLabel,
  formatFileSize,
  groupClientFiles,
  isPreviewableImage,
  isPreviewableVideo,
  type GroupedFile,
} from "@/modules/files/file-groups";
import {
  createWorkspaceFileDownload,
  createWorkspaceFilePreview,
} from "@/server/actions/deliverable-workspace-actions";
import { FileText, ImageIcon, PlayCircle } from "lucide-react";

// Lazy, image-only thumbnail. Non-image files never request a signed URL on
// render (they show a static icon), and image URLs are fetched only once the
// thumbnail scrolls into view. This avoids N+1 preview requests and avoids
// auto-requesting video/PDF previews when the page opens.
const useLazyImageThumb = (fileId: string, fileType: string) => {
  const [url, setUrl] = useState<string>();
  const [unavailable, setUnavailable] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  useEffect(() => {
    if (!isPreviewableImage(fileType)) return;
    if (typeof IntersectionObserver === "undefined") return;
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !startedRef.current) {
            startedRef.current = true;
            void createWorkspaceFilePreview(fileId).then((result) => {
              if (result.ok) setUrl(result.url);
              else setUnavailable(true);
            });
            observer.disconnect();
          }
        }
      },
      { rootMargin: "128px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [fileId, fileType]);
  return { ref, url, unavailable };
};

const FileThumbnail = ({
  fileId,
  fileType,
}: {
  fileId: string;
  fileType: string;
}) => {
  const { ref, url, unavailable } = useLazyImageThumb(fileId, fileType);
  if (!isPreviewableImage(fileType)) {
    return isPreviewableVideo(fileType) ? (
      <PlayCircle aria-hidden="true" className="h-8 w-8 text-muted" />
    ) : (
      <FileText aria-hidden="true" className="h-8 w-8 text-muted" />
    );
  }
  if (unavailable) {
    return <ImageIcon aria-hidden="true" className="h-8 w-8 text-muted" />;
  }
  if (!url) {
    return (
      <div
        aria-label="جارٍ تحميل المعاينة"
        className="h-16 w-16 animate-pulse rounded-lg bg-border/40 motion-reduce:animate-none"
        ref={ref}
      />
    );
  }
  return (
    // Signed object URLs are short-lived and cannot use the image optimizer.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt=""
      className="h-16 w-16 rounded-lg border border-border object-cover"
      loading="lazy"
      src={url}
    />
  );
};

// Real modal: focus is moved in on open, trapped while open, and restored to
// the trigger element on close. Escape closes. The signed preview URL is only
// requested when the modal actually opens.
const PreviewModal = ({
  file,
  open,
  onClose,
}: {
  file: GroupedFile;
  open: boolean;
  onClose: () => void;
}) => {
  const [url, setUrl] = useState<string>();
  const [unavailable, setUnavailable] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closerRef = useRef<HTMLButtonElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = (document.activeElement as HTMLElement) ?? null;
    let active = true;
    void createWorkspaceFilePreview(file.id).then((result) => {
      if (!active) return;
      if (result.ok) setUrl(result.url);
      else setUnavailable(true);
    });
    // Move focus into the modal once it is painted.
    const focusTimer = window.setTimeout(() => {
      closerRef.current?.focus();
    }, 0);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute("disabled"));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      active = false;
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKey, true);
      restoreRef.current?.focus?.();
    };
  }, [open, file.id, onClose]);

  if (!open) return null;
  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
      onClick={onClose}
      role="dialog"
      aria-label={`معاينة ${file.name}`}
    >
      <div
        className="grid max-h-[85vh] w-full max-w-3xl gap-3 overflow-auto rounded-xl bg-background p-4"
        onClick={(event) => event.stopPropagation()}
        ref={panelRef}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="break-words text-sm font-semibold" dir="auto">
            {file.name}
          </p>
          <button
            className="min-h-11 rounded-lg border border-border px-3 text-sm"
            onClick={onClose}
            ref={closerRef}
            type="button"
          >
            إغلاق
          </button>
        </div>
        {unavailable ? (
          <p className="grid place-items-center p-8 text-center text-sm text-muted">
            لا توجد معاينة مرئية لهذا الملف. استخدم التنزيل.
          </p>
        ) : url && isPreviewableImage(file.fileType) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={file.name}
            className="max-h-[70vh] w-full rounded-lg object-contain"
            src={url}
          />
        ) : url && isPreviewableVideo(file.fileType) ? (
          <video
            aria-label={file.name}
            className="max-h-[70vh] w-full rounded-lg"
            controls
            preload="metadata"
            src={url}
          />
        ) : url && file.fileType.toLowerCase() === "application/pdf" ? (
          <iframe
            className="h-[70vh] w-full rounded-lg border border-border"
            src={url}
            title={file.name}
          />
        ) : (
          <div className="grid place-items-center p-8">
            <div className="h-8 w-8 animate-pulse rounded-full border-2 border-border border-t-accent motion-reduce:hidden" />
            <span className="sr-only">جارٍ تحميل المعاينة</span>
          </div>
        )}
      </div>
    </div>
  );
};

const FileCard = ({ file }: { file: GroupedFile }) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pendingDownload, setPendingDownload] = useState(false);
  const [downloadError, setDownloadError] = useState(false);
  const status = clientFileStatus(file);
  const previewable = canPreviewInline(file.fileType);
  const openPreview = useCallback(() => {
    if (previewable) setPreviewOpen(true);
  }, [previewable]);
  const download = useCallback(async () => {
    setDownloadError(false);
    setPendingDownload(true);
    const result = await createWorkspaceFileDownload(file.id);
    setPendingDownload(false);
    if (!result.ok) {
      setDownloadError(true);
      return;
    }
    window.open(result.url, "_blank", "noopener,noreferrer");
  }, [file.id]);

  return (
    <>
      <article
        className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-[4rem_minmax(0,1fr)_auto] sm:items-center"
        data-testid="client-file-card"
      >
        <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-lg border border-border bg-background">
          <FileThumbnail fileId={file.id} fileType={file.fileType} />
        </div>
        {previewable ? (
          <div
            aria-label={`فتح معاينة ${file.name}`}
            className="min-w-0 cursor-pointer rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent"
            onClick={openPreview}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openPreview();
              }
            }}
            role="button"
            tabIndex={0}
          >
            <FileMetaBody file={file} status={status} />
          </div>
        ) : (
          <div className="min-w-0">
            <FileMetaBody file={file} status={status} />
          </div>
        )}
        <button
          className="min-h-11 rounded-lg border border-border px-4 text-sm font-semibold hover:bg-background disabled:opacity-60"
          disabled={pendingDownload}
          onClick={download}
          type="button"
        >
          {pendingDownload ? "جارٍ…" : "تنزيل"}
        </button>
        {downloadError ? (
          <p className="text-xs text-danger sm:col-span-3">
            تعذر تنزيل الملف أو انتهت صلاحية الوصول.
          </p>
        ) : null}
      </article>
      {previewable ? (
        <PreviewModal
          file={file}
          onClose={() => setPreviewOpen(false)}
          open={previewOpen}
        />
      ) : null}
    </>
  );
};

const FileMetaBody = ({
  file,
  status,
}: {
  file: GroupedFile;
  status: string | null;
}) => (
  <>
    <p className="break-words text-sm font-semibold" dir="auto">
      {file.name || "ملف"}
    </p>
    <p className="mt-1 text-xs text-muted">
      {fileTypeLabel(file.fileType)}
      {" · "}
      {formatFileSize(file.fileSize)}
      {" · "}
      {formatDateArabic(file.createdAt) || "—"}
    </p>
    <p className="mt-1 text-xs text-muted">
      {file.deliverableName ? `العمل: ${file.deliverableName}` : null}
      {file.deliverableName && status ? " · " : null}
      {status ? status : null}
      {(file.deliverableName || status) && file.versionNumber ? " · " : null}
      {file.versionNumber ? `نسخة ${file.versionNumber}` : null}
    </p>
  </>
);

export type ClientFilesBoardProps = {
  files: GroupedFile[];
};

export function ClientFilesBoard({ files }: ClientFilesBoardProps) {
  const groups = groupClientFiles(files);
  if (groups.length === 0) {
    return (
      <div
        className="rounded-xl border border-dashed border-border bg-surface p-8 text-center"
        data-testid="client-files-empty"
      >
        <p className="text-sm text-muted">
          لا توجد ملفات متاحة حاليًا. تظهر التسليمات النهائية والملفات المعتمدة
          هنا فور توفرها.
        </p>
      </div>
    );
  }
  return (
    <div className="grid gap-6" data-testid="client-files-board">
      {groups.map((group) => (
        <section
          aria-labelledby={`files-group-${group.key}`}
          className="grid gap-3"
          key={group.key}
        >
          <div className="flex items-baseline justify-between gap-3">
            <h2
              className="text-base font-semibold"
              id={`files-group-${group.key}`}
            >
              {group.title}
            </h2>
            <span className="text-xs text-muted">
              {group.files.length} ملف
            </span>
          </div>
          <p className="text-xs text-muted">{group.description}</p>
          <ul className="grid gap-3">
            {group.files.map((file) => (
              <li key={file.id}>
                <FileCard file={file} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

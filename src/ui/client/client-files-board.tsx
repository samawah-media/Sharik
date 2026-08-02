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

type BoardFile = GroupedFile & { deliverableName?: string };

const useObjectUrl = (fileId: string | undefined) => {
  const [url, setUrl] = useState<string>();
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    if (!fileId) return;
    let active = true;
    void createWorkspaceFilePreview(fileId).then((result) => {
      if (!active) return;
      if (result.ok) setUrl(result.url);
      else setUnavailable(true);
    });
    return () => {
      active = false;
    };
  }, [fileId]);
  return { url, unavailable };
};

const FileThumbnail = ({ file }: { file: BoardFile }) => {
  const { url, unavailable } = useObjectUrl(file.id);
  if (unavailable) {
    return <FileText aria-hidden="true" className="h-8 w-8 text-muted" />;
  }
  if (!url) {
    return (
      <div
        aria-label="جارٍ تحميل المعاينة"
        className="h-16 w-16 animate-pulse rounded-lg bg-border/40 motion-reduce:animate-none"
      />
    );
  }
  if (isPreviewableImage(file.fileType)) {
    return (
      // Signed object URLs are short-lived and cannot use the image optimizer.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt={file.name}
        className="h-16 w-16 rounded-lg border border-border object-cover"
        src={url}
      />
    );
  }
  if (isPreviewableVideo(file.fileType)) {
    return <PlayCircle aria-hidden="true" className="h-8 w-8 text-muted" />;
  }
  return <ImageIcon aria-hidden="true" className="h-8 w-8 text-muted" />;
};

const PreviewOverlay = ({
  file,
  open,
  onClose,
}: {
  file: BoardFile;
  open: boolean;
  onClose: () => void;
}) => {
  const { url, unavailable } = useObjectUrl(open ? file.id : undefined);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <dialog
      aria-label={`معاينة ${file.name}`}
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
      onClick={onClose}
      open
    >
      <div
        className="grid max-h-[85vh] w-full max-w-3xl gap-3 overflow-auto rounded-xl bg-background p-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="break-words text-sm font-semibold" dir="auto">
            {file.name}
          </p>
          <button
            autoFocus
            className="min-h-11 rounded-lg border border-border px-3 text-sm"
            onClick={onClose}
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
          <p className="grid place-items-center p-8 text-center text-sm text-muted">
            لا توجد معاينة مرئية لهذا الملف. استخدم التنزيل.
          </p>
        )}
      </div>
    </dialog>
  );
};

const FileCard = ({ file }: { file: BoardFile }) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pendingDownload, setPendingDownload] = useState(false);
  const [downloadError, setDownloadError] = useState(false);
  const status = clientFileStatus(file);
  const openPreview = useCallback(() => {
    if (canPreviewInline(file.fileType)) setPreviewOpen(true);
  }, [file.fileType]);
  const cardRef = useRef<HTMLDivElement>(null);
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
        data-file-visibility={file.visibility}
      >
        <button
          className="grid h-16 w-16 place-items-center overflow-hidden rounded-lg border border-border bg-background disabled:cursor-default"
          disabled={!canPreviewInline(file.fileType)}
          onClick={openPreview}
          type="button"
        >
          <FileThumbnail file={file} />
        </button>
        <div
          className="min-w-0 cursor-pointer rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent"
          onClick={openPreview}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openPreview();
            }
          }}
          ref={cardRef}
          role="button"
          tabIndex={0}
          aria-label={`فتح معاينة ${file.name}`}
        >
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
            {(file.deliverableName || status) && file.versionNumber
              ? " · "
              : null}
            {file.versionNumber ? `نسخة ${file.versionNumber}` : null}
          </p>
        </div>
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
      <PreviewOverlay
        file={file}
        onClose={() => setPreviewOpen(false)}
        open={previewOpen}
      />
    </>
  );
};

export type ClientFilesBoardProps = {
  files: GroupedFile[];
};

export function ClientFilesBoard({ files }: ClientFilesBoardProps) {
  const groups = groupClientFiles(files);
  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center">
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

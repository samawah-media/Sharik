import { FileText, ImageIcon, Instagram, Megaphone, Play } from "lucide-react";
import type { ReactNode } from "react";
import { isMeaningfulReviewText } from "@/modules/approvals/client-review-readiness";
import { Badge } from "@/ui/core/badge";
import { cn } from "@/ui/core/utils";

type ContentPreviewCardProps = {
  title: string;
  clientName?: string;
  channel?: string;
  format?: string;
  caption?: string;
  status?: string;
  eyebrow?: string;
  media?: ReactNode;
  captionLabel?: string;
  footer?: ReactNode;
  compact?: boolean;
  className?: string;
};

const normalized = (value?: string) =>
  value?.trim().toLocaleLowerCase("ar") ?? "";

const channelPresentation = (channel?: string) => {
  const value = normalized(channel);

  if (
    value.includes("instagram") ||
    value.includes("انست") ||
    value.includes("إنست")
  ) {
    return {
      icon: Instagram,
      label: "Instagram",
    };
  }

  if (
    value.includes("video") ||
    value.includes("reel") ||
    value.includes("ريل") ||
    value.includes("فيديو")
  ) {
    return {
      icon: Play,
      label: channel || "فيديو",
    };
  }

  if (value.includes("campaign") || value.includes("حملة")) {
    return {
      icon: Megaphone,
      label: channel || "حملة",
    };
  }

  return {
    icon: ImageIcon,
    label: channel || "محتوى رقمي",
  };
};

export function ContentPreviewCard({
  title,
  clientName,
  channel,
  format,
  caption,
  status,
  eyebrow = "محتوى",
  media,
  captionLabel = "نص النسخة الحالية",
  footer,
  compact = false,
  className,
}: ContentPreviewCardProps) {
  const presentation = channelPresentation(channel || format);
  const Icon = presentation.icon;
  const visibleCaption = isMeaningfulReviewText(caption) ? caption : undefined;
  const showFormat =
    Boolean(format) && normalized(format) !== normalized(presentation.label);

  return (
    <div
      className={cn(
        "group min-w-0 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm",
        className,
      )}
      data-content-card
      data-has-caption={Boolean(visibleCaption)}
      dir="rtl"
    >
      <div className="relative isolate overflow-hidden bg-accent-soft text-foreground">
        {media ? (
          <div className={compact ? "min-h-36" : "min-h-52"}>{media}</div>
        ) : (
          <div
            className={cn(
              "grid place-items-center border-b border-border p-5 text-center",
              compact ? "min-h-36" : "min-h-52",
            )}
            data-media-fallback
          >
            <div>
              <Icon aria-hidden="true" className="mx-auto text-accent" size={32} />
              <p className="mt-3 text-sm font-semibold">{presentation.label}</p>
              <p className="mt-1 text-xs text-muted">لا يوجد أصل مرئي مرفوع لهذه النسخة</p>
            </div>
          </div>
        )}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 p-3">
          <span className="inline-flex min-h-9 items-center gap-2 rounded-full bg-surface/90 px-3 text-xs font-semibold shadow-sm backdrop-blur">
            <Icon aria-hidden="true" size={16} />
            <bdi>{presentation.label}</bdi>
          </span>
          <span
            className="flex size-9 items-center justify-center rounded-xl bg-accent text-sm font-black text-white shadow-sm"
            aria-label="سماوة"
          >
            س
          </span>
        </div>
        <div className="grid gap-1 border-b border-border bg-surface p-4">
          <p className="text-xs font-semibold text-accent">{eyebrow}</p>
          <p className="line-clamp-2 text-lg font-bold leading-7">{title}</p>
          {clientName ? <p className="text-xs text-muted">{clientName}</p> : null}
        </div>
      </div>
      <div className="grid gap-3 p-4">
        <div className="flex flex-wrap gap-2">
          {showFormat ? <Badge tone="muted">{format}</Badge> : null}
          {status ? <Badge tone="accent">{status}</Badge> : null}
        </div>
        {visibleCaption ? (
          <div>
            <p className="text-xs font-semibold text-muted">{captionLabel}</p>
            <p className="mt-1 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-7 text-foreground">
              {visibleCaption}
            </p>
          </div>
        ) : (
          <p className="inline-flex items-center gap-2 text-sm text-muted">
            <FileText aria-hidden="true" size={16} />
            لا يوجد caption أو body محفوظ في النسخة الحالية
          </p>
        )}
        {footer ? (
          <div className="border-t border-border pt-3">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}

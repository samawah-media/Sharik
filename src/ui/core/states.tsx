import { AlertTriangle, Inbox, LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";
import { ButtonLink } from "./button";
import { cn } from "./utils";

function StateShell({
  icon,
  title,
  description,
  action,
  tone = "neutral",
  className,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: "neutral" | "danger";
  className?: string;
}) {
  return (
    <section
      aria-live="polite"
      className={cn(
        "grid justify-items-start gap-3 rounded-lg border border-dashed bg-surface p-6 text-right",
        tone === "danger" ? "border-danger/30" : "border-border",
        className,
      )}
      dir="rtl"
    >
      <div
        className={cn(
          "flex size-10 items-center justify-center rounded-lg border",
          tone === "danger"
            ? "border-danger/20 bg-danger/10 text-danger"
            : "border-accent/20 bg-accent-soft text-accent",
        )}
      >
        {icon}
      </div>
      <div className="grid gap-1">
        <h2 className="text-lg font-semibold leading-7">{title}</h2>
        {description ? (
          <p className="max-w-2xl text-sm leading-6 text-muted">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </section>
  );
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <StateShell
      action={action}
      className={className}
      description={description}
      icon={<Inbox aria-hidden="true" size={20} />}
      title={title}
    />
  );
}

export function ErrorState({
  title,
  description,
  returnHref = "/",
  actionLabel = "العودة للمساحة الآمنة",
}: {
  title: string;
  description?: string;
  returnHref?: string;
  actionLabel?: string;
}) {
  return (
    <StateShell
      action={
        <ButtonLink href={returnHref} variant="primary">
          {actionLabel}
        </ButtonLink>
      }
      description={description}
      icon={<AlertTriangle aria-hidden="true" size={20} />}
      title={title}
      tone="danger"
    />
  );
}

export function LoadingSkeleton({ label = "جار التحميل" }: { label?: string }) {
  return (
    <section
      aria-label={label}
      className="grid gap-3 rounded-lg border border-border bg-surface p-4"
      dir="rtl"
    >
      <div className="flex items-center gap-2 text-sm text-muted">
        <LoaderCircle aria-hidden="true" className="animate-spin" size={16} />
        <span>{label}</span>
      </div>
      <div className="h-4 w-3/4 rounded bg-border/70" />
      <div className="h-4 w-1/2 rounded bg-border/70" />
      <div className="h-24 rounded bg-border/50" />
    </section>
  );
}

import type { ReactNode } from "react";
import { cn } from "./utils";

type BadgeTone =
  | "neutral"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "muted";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "border-border bg-surface text-foreground",
  accent: "border-accent/20 bg-accent-soft text-accent",
  success: "border-success/20 bg-success/10 text-success",
  warning: "border-warning/25 bg-warning/10 text-warning",
  danger: "border-danger/20 bg-danger/10 text-danger",
  muted: "border-border bg-background text-muted",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold leading-5",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatCard({
  label,
  value,
  description,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  description?: string;
  tone?: BadgeTone;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border bg-surface p-4 shadow-sm",
        tone === "accent" ? "border-accent/20" : "border-border",
      )}
    >
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold leading-none">{value}</p>
      {description ? (
        <p className="mt-2 text-xs leading-5 text-muted">{description}</p>
      ) : null}
    </section>
  );
}

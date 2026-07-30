import type { ReactNode } from "react";
import { cn } from "@/ui/core/utils";

export function PageHeader({
  title,
  description,
  actions,
  status,
  className,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  status?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-xl font-semibold leading-8 text-foreground sm:text-2xl">
          {title}
        </h1>
        {description ? (
          <div className="mt-1.5 text-sm leading-6 text-muted">{description}</div>
        ) : null}
        {status ? <div className="mt-2.5">{status}</div> : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {actions}
        </div>
      ) : null}
    </header>
  );
}

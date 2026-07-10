import type { ReactNode } from "react";

export function DeliverableStatusDisclosure({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <details
      className="mt-4 rounded-lg border border-border bg-background/70"
      open={false}
    >
      <summary className="cursor-pointer list-none px-3 py-2 text-right text-sm font-semibold text-accent marker:hidden">
        {label}
      </summary>
      <div className="border-t border-border">{children}</div>
    </details>
  );
}

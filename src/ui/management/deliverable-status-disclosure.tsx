"use client";

import { useState } from "react";
import type { ReactNode } from "react";

export function DeliverableStatusDisclosure({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4 rounded-lg border border-border bg-background/70">
      <button
        aria-expanded={open}
        className="w-full cursor-pointer px-3 py-2 text-right text-sm font-semibold text-accent"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        {label}
      </button>
      {open ? <div className="border-t border-border">{children}</div> : null}
    </div>
  );
}

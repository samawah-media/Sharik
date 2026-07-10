"use client";

import { useId, useState, useSyncExternalStore, type ReactNode } from "react";

const subscribeToHydration = () => () => undefined;

export function DeliverableStatusDisclosure({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const contentId = useId();

  return (
    <div className="mt-4 rounded-lg border border-border bg-background/70">
      <button
        aria-controls={contentId}
        aria-expanded={open}
        className="w-full cursor-pointer px-3 py-2 text-right text-sm font-semibold text-accent"
        disabled={!hydrated}
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {label}
      </button>
      <div className={open ? "border-t border-border" : "hidden"} id={contentId}>
        {children}
      </div>
    </div>
  );
}

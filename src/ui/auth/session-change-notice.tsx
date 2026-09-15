"use client";

import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const noticeCopy =
  "تغيّر الحساب في تبويب ثاني. حدّث الصفحة عشان تكمل بالحساب الصحيح.";
const actionCopy = "تحديث الصفحة";

export function SessionChangeNotice() {
  const [showNotice, setShowNotice] = useState(false);
  const initialAccountRef = useRef<string | null>(null);
  const hasCapturedInitialEventRef = useRef(false);

  useEffect(() => {
    let client: ReturnType<typeof createSupabaseBrowserClient>;

    try {
      client = createSupabaseBrowserClient();
    } catch {
      // Public Supabase runtime configuration is unavailable; fail quietly
      // instead of showing a false stale-tab warning.
      return;
    }

    const { data } = client.auth.onAuthStateChange((event, session) => {
      const accountId = session?.user?.id ?? null;

      // The first callback reports the session this tab loaded with; it is
      // the private baseline, not an account change.
      if (!hasCapturedInitialEventRef.current) {
        initialAccountRef.current = accountId;
        hasCapturedInitialEventRef.current = true;
        return;
      }

      if (accountId !== initialAccountRef.current) {
        setShowNotice(true);
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  if (!showNotice) {
    return null;
  }

  return (
    <div
      className="border-b border-warning/40 bg-warning/10 px-4 py-3 text-foreground"
      data-testid="session-change-notice"
      dir="rtl"
      role="alert"
    >
      <div className="mx-auto flex max-w-[90rem] flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">{noticeCopy}</p>
        <button
          className="min-h-11 rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold hover:bg-accent-soft/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          onClick={() => window.location.reload()}
          type="button"
        >
          {actionCopy}
        </button>
      </div>
    </div>
  );
}

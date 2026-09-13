"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function SignOutButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClick() {
    setError(null);
    setIsSubmitting(true);
    try {
      const { error: signOutError } =
        await createSupabaseBrowserClient().auth.signOut();

      if (signOutError) {
        setError("تعذر تسجيل الخروج الآن. حاول مرة أخرى.");
        return;
      }

      router.replace("/sign-in");
      router.refresh();
    } catch {
      setError("تعذر تسجيل الخروج الآن. حاول مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-2">
      <button
        className="min-h-11 rounded-md border border-border px-3 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        onClick={handleClick}
        type="button"
      >
        {isSubmitting ? "جار الخروج..." : "تسجيل الخروج"}
      </button>
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

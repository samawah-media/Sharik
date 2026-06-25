"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getSafeAuthErrorMessage,
  getSafeRedirectPath,
  signInSchema,
} from "@/modules/auth/sign-in";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const parsed = signInSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "تحقق من بيانات الدخول.");
      return;
    }

    setIsSubmitting(true);
    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword(
      parsed.data,
    );
    setIsSubmitting(false);

    if (signInError) {
      setError(getSafeAuthErrorMessage(signInError.code));
      return;
    }

    router.replace(getSafeRedirectPath(searchParams.get("next")));
    router.refresh();
  }

  return (
    <form aria-label="تسجيل الدخول" className="grid gap-4" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-medium">
        البريد الإلكتروني
        <input
          autoComplete="email"
          className="rounded-md border border-border bg-background px-3 py-2"
          name="email"
          type="email"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        كلمة المرور
        <input
          autoComplete="current-password"
          className="rounded-md border border-border bg-background px-3 py-2"
          name="password"
          type="password"
        />
      </label>
      {error ? (
        <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <button
        className="w-fit rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "جار تسجيل الدخول..." : "تسجيل الدخول"}
      </button>
    </form>
  );
}

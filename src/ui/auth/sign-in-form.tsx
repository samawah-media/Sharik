"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);

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
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword(
        parsed.data,
      );

      if (signInError) {
        setError(getSafeAuthErrorMessage(signInError.code));
        return;
      }

      router.replace(getSafeRedirectPath(searchParams.get("next")));
      router.refresh();
    } catch {
      setError(getSafeAuthErrorMessage());
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      aria-label="تسجيل الدخول"
      className="grid gap-5"
      onSubmit={handleSubmit}
    >
      <label className="grid gap-2 text-sm font-medium">
        البريد الإلكتروني
        <input
          autoComplete="email"
          className="min-h-11 rounded-xl border border-border bg-background px-3 py-2.5 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
          name="email"
          type="email"
        />
      </label>
      <div className="grid gap-2 text-sm font-medium">
        <label htmlFor="sign-in-password">كلمة المرور</label>
        <span className="relative block">
          <input
            autoComplete="current-password"
            className="w-full min-h-11 rounded-xl border border-border bg-background px-3 py-2.5 pl-11 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
            id="sign-in-password"
            name="password"
            type={showPassword ? "text" : "password"}
          />
          <button
            aria-label={
              showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
            }
            aria-pressed={showPassword}
            className="absolute inset-y-1 left-1 inline-flex w-9 items-center justify-center rounded-md text-muted transition hover:bg-muted/10 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            onClick={() => setShowPassword((value) => !value)}
            title={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
            type="button"
          >
            {showPassword ? (
              <EyeOff aria-hidden="true" size={18} strokeWidth={2} />
            ) : (
              <Eye aria-hidden="true" size={18} strokeWidth={2} />
            )}
          </button>
        </span>
      </div>
      {error ? (
        <p
          className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm leading-6 text-danger"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <button
        className="min-h-11 w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "جار تسجيل الدخول..." : "تسجيل الدخول"}
      </button>
    </form>
  );
}

import { Suspense } from "react";
import { SignInForm } from "@/ui/auth/sign-in-form";

export default function SignInPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5">
      <div className="grid gap-5 rounded-md border border-border bg-surface p-6">
        <h1 className="text-2xl font-semibold">تسجيل الدخول الإداري</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          استخدم حساب UAT المصرح به للوصول إلى نطاقك فقط.
        </p>
        <Suspense fallback={null}>
          <SignInForm />
        </Suspense>
      </div>
    </main>
  );
}

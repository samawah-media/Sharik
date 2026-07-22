import { Suspense } from "react";
import { SignInForm } from "@/ui/auth/sign-in-form";

export default function SignInPage() {
  return (
    <main className="relative mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-8 sm:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-accent-soft/70 to-transparent" />
      <div className="relative grid gap-6 rounded-2xl border border-border bg-surface/95 p-5 shadow-xl shadow-accent/5 sm:p-8">
        <div className="grid gap-4">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-lg font-bold text-white shadow-sm">
            ش
          </span>
          <div>
            <p className="text-sm font-semibold text-accent">تشغيل سماوة</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              تسجيل الدخول إلى شريك
            </h1>
          </div>
        </div>
        <p className="text-sm leading-6 text-muted">
          استخدم حسابك المصرح به. ستنتقل تلقائيًا إلى مساحة الإدارة أو الفريق أو
          العميل حسب دورك.
        </p>
        <Suspense fallback={null}>
          <SignInForm />
        </Suspense>
      </div>
    </main>
  );
}

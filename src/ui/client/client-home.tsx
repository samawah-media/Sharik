import { ButtonLink } from "@/ui/core/button";
import { Badge } from "@/ui/core/badge";
import type { ReactNode } from "react";
import {
  formatMvpClientName,
  MvpSnapshotCards,
  type MvpSnapshotStats,
} from "@/ui/mvp/hadna-mvp-summary";

type ClientHomeProps = {
  children?: ReactNode;
  clientName?: string;
  stats?: MvpSnapshotStats;
};

export function ClientHome({
  children,
  clientName = "العميل",
  stats,
}: ClientHomeProps) {
  const displayClientName = formatMvpClientName(clientName);

  return (
    <main className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-6 sm:py-8">
      <section className="grid gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-accent">بوابة العميل</p>
          <Badge tone="success">مساحتك الخاصة</Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          مساحة {displayClientName}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted">
          هنا تجد ما يحتاج قرارك، وما تم تسليمه، وحالة المخرجات المتفق عليها في
          مكان واحد واضح.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <ButtonLink href="/client/pending" variant="primary">
            مراجعة ما ينتظرني
          </ButtonLink>
          <ButtonLink href="/client/files" variant="secondary">
            فتح الملفات
          </ButtonLink>
        </div>
      </section>
      {stats ? <MvpSnapshotCards stats={stats} /> : null}
      {children ?? (
        <section className="grid gap-3 rounded-lg border border-border p-5">
          <h2 className="text-lg font-semibold">بانتظار موافقتي</h2>
          <p className="text-sm text-muted">
            لا توجد عناصر تحتاج قرارك الآن. سنعرض هنا فقط النسخ التي اعتمدها
            فريق سماوة وأرسلها لك رسميًا.
          </p>
        </section>
      )}
      <section className="grid gap-3 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold">المخرجات والباقة</h2>
        <p className="text-sm text-muted">
          افتح مخرجاتي لمراجعة الاسم والنوع والتاريخ والحالة والتقدم، وافتح
          الباقة لمعرفة المتفق عليه والمتبقي.
        </p>
      </section>
    </main>
  );
}

export function ClientPortalEmptyState() {
  return (
    <section
      aria-label="حالة بوابة العميل الفارغة"
      className="rounded-lg border border-dashed border-border p-6"
    >
      <h2 className="text-lg font-semibold">لا توجد عناصر ظاهرة بعد</h2>
      <p className="mt-2 text-sm text-muted">
        ستظهر هنا الملفات أو الموافقات المتاحة لهذا العميل عند تفعيلها لاحقًا.
      </p>
    </section>
  );
}

export function ClientPortalDeniedState() {
  return (
    <section
      aria-label="حالة منع الوصول"
      className="rounded-lg border border-border p-6"
    >
      <h2 className="text-lg font-semibold">لا يمكنك الوصول لهذه المساحة</h2>
      <p className="mt-2 text-sm text-muted">
        استخدم الرابط المخصص لك أو تواصل مع مدير الحساب دون مشاركة معرفات
        داخلية.
      </p>
    </section>
  );
}

export function ClientInviteForm() {
  return (
    <form aria-label="دعوة عضو عميل" className="grid gap-4">
      <label className="grid gap-2 text-sm font-medium">
        بريد عضو العميل
        <input
          className="rounded-md border border-border bg-background px-3 py-2"
          name="email"
          required
          type="email"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        الدور
        <select
          className="rounded-md border border-border bg-background px-3 py-2"
          name="roleKey"
          required
        >
          <option value="client_viewer">مشاهد العميل</option>
          <option value="client_approver">معتمد العميل</option>
          <option value="client_admin">مدير العميل</option>
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium">
        نطاق العميل
        <select
          className="rounded-md border border-border bg-background px-3 py-2"
          name="clientId"
          required
        >
          <option value="client_a">هدنة</option>
        </select>
      </label>
      <button
        className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        type="submit"
      >
        إرسال الدعوة
      </button>
    </form>
  );
}

import { ButtonLink } from "@/ui/core/button";
import { Badge } from "@/ui/core/badge";
import { ArrowLeft, BriefcaseBusiness, PackageCheck, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import {
  formatMvpClientName,
  MvpSnapshotCards,
  type MvpSnapshotStats,
} from "@/ui/mvp/hadna-mvp-summary";

type ClientHomeProps = {
  canApprove?: boolean;
  children?: ReactNode;
  clientName?: string;
  stats?: MvpSnapshotStats;
  pendingCount?: number;
};

export function ClientHome({
  canApprove = true,
  children,
  clientName = "العميل",
  stats,
  pendingCount = 0,
}: ClientHomeProps) {
  const displayClientName = formatMvpClientName(clientName);
  const reviewHeading = canApprove ? "بانتظار موافقتي" : "قيد المراجعة";
  const heroDescription = canApprove
    ? "هنا تجد ما يحتاج قرارك، وما تم تسليمه، وحالة أعمالك المتفق عليها في مكان واحد واضح."
    : "هنا تتابع ما هو قيد المراجعة، وما تم تسليمه، وحالة أعمالك المتفق عليها في مكان واحد واضح.";
  const pendingLinkLabel = canApprove
    ? "مراجعة ما ينتظرني"
    : "عرض ما هو قيد المراجعة";

  return (
    <main className="mx-auto grid w-full max-w-5xl gap-5 px-4 py-5 sm:py-6">
      <section className="grid gap-3 rounded-lg border border-border bg-surface p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-accent">بوابة العميل</p>
          <Badge tone="success">مساحتك الخاصة</Badge>
        </div>
        <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
          مساحة {displayClientName}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted">
          {heroDescription}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <ButtonLink href="/client/pending" variant="primary">
            {pendingLinkLabel}
          </ButtonLink>
          <ButtonLink href="/client/work" variant="secondary">
            فتح أعمالي
          </ButtonLink>
          <ButtonLink href="/client/files" variant="secondary">
            فتح الملفات
          </ButtonLink>
        </div>
      </section>
      {stats ? <MvpSnapshotCards stats={stats} /> : null}
      {children ?? null}
      <div className="grid gap-3 sm:grid-cols-3">
        <HomeSectionCard
          ctaLabel={pendingCount > 0 ? `${pendingCount} بانتظار قرارك` : "لا يوجد ما ينتظر قرارك الآن"}
          description={
            canApprove
              ? "راجع الأعمال التي أرسلها فريق سماوة واعتمدها أو اطلب تعديلًا."
              : "تابع الأعمال قيد المراجعة. هذا الحساب للاطلاع فقط."
          }
          heading={reviewHeading}
          href="/client/pending"
          icon={<PackageCheck aria-hidden="true" size={18} />}
        />
        <HomeSectionCard
          ctaLabel="عرض كل الأعمال"
          description="كل أعمالك: ما ينتظر قرارك، وما قيد التعديل، وما تم تسليمه."
          heading="أعمالي"
          href="/client/work"
          icon={<BriefcaseBusiness aria-hidden="true" size={18} />}
        />
        <HomeSectionCard
          ctaLabel="عرض الباقة"
          description="ما تم الاتفاق عليه وما تبقى من أعمال الباقة."
          heading="الباقة والمتبقي"
          href="/client/commercial"
          icon={<Wallet aria-hidden="true" size={18} />}
        />
      </div>
    </main>
  );
}

function HomeSectionCard({
  ctaLabel,
  description,
  heading,
  href,
  icon,
}: {
  ctaLabel: string;
  description: string;
  heading: string;
  href: string;
  icon: ReactNode;
}) {
  return (
    <ButtonLink
      aria-label={`${heading} — ${ctaLabel}`}
      className="grid h-auto grid-rows-[auto_auto_auto] items-start gap-2 rounded-lg !text-right"
      href={href}
      variant="secondary"
    >
      <span className="flex size-9 items-center justify-center rounded-lg border border-accent/20 bg-accent-soft text-accent">
        {icon}
      </span>
      <span className="grid gap-1">
        <span className="text-sm font-semibold text-foreground">{heading}</span>
        <span className="text-xs font-normal leading-5 text-muted">
          {description}
        </span>
      </span>
      <span className="flex items-center gap-1 text-xs font-semibold text-accent">
        <span>{ctaLabel}</span>
        <ArrowLeft aria-hidden="true" size={14} />
      </span>
    </ButtonLink>
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

import { ButtonLink } from "@/ui/core/button";
import {
  formatMvpClientName,
  MvpSnapshotCards,
  type MvpSnapshotStats,
} from "@/ui/mvp/hadna-mvp-summary";

type ClientHomeProps = {
  clientName?: string;
  stats?: MvpSnapshotStats;
};

export function ClientHome({ clientName = "هدنة", stats }: ClientHomeProps) {
  const displayClientName = formatMvpClientName(clientName);

  return (
    <main className="mx-auto grid w-full max-w-4xl gap-6 px-4 py-8">
      <section className="grid gap-3">
        <p className="text-sm font-medium text-muted">بوابة العميل</p>
        <h1 className="text-2xl font-semibold">مساحة {displayClientName}</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted">
          هذه واجهة هدنة المبسطة. تظهر هنا الباقة والمخرجات المسموحة لك فقط،
          بدون لوحات الإدارة الداخلية أو عملاء آخرين.
        </p>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/client/commercial#deliverables" variant="primary">
            عرض مخرجاتي
          </ButtonLink>
          <ButtonLink href="/client/commercial#package" variant="secondary">
            عرض الباقة
          </ButtonLink>
        </div>
      </section>
      {stats ? <MvpSnapshotCards stats={stats} /> : null}
      <section className="grid gap-3 rounded-lg border border-border p-5">
        <h2 className="text-lg font-semibold">بانتظار موافقتي</h2>
        <p className="text-sm text-muted">
          لا توجد عناصر بانتظار موافقتك الآن. سيتم تفعيل هذه المساحة لاحقًا
          لمسار الاعتماد.
        </p>
      </section>
      <section className="grid gap-3 rounded-lg border border-border p-5">
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

import type { ClientRecord } from "@/modules/clients/client-repository";

export function ClientForm({
  client,
  mode = "create",
}: {
  client?: ClientRecord;
  mode?: "create" | "update";
}) {
  return (
    <form aria-label={mode === "create" ? "إنشاء عميل" : "تعديل العميل"}>
      <div className="grid gap-4">
        <label className="grid gap-2 text-sm font-medium">
          اسم العميل
          <input
            className="rounded-md border border-border bg-background px-3 py-2"
            name="name"
            required
            minLength={2}
            defaultValue={client?.name}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          اسم جهة التواصل
          <input
            className="rounded-md border border-border bg-background px-3 py-2"
            name="primaryContactName"
            defaultValue={client?.primaryContactName}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          بريد جهة التواصل
          <input
            className="rounded-md border border-border bg-background px-3 py-2"
            name="primaryContactEmail"
            type="email"
            defaultValue={client?.primaryContactEmail}
          />
        </label>
        <button
          className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          type="submit"
        >
          {mode === "create" ? "حفظ العميل" : "حفظ التعديلات"}
        </button>
      </div>
    </form>
  );
}

export function ClientEmptyState() {
  return (
    <section aria-label="حالة العملاء الفارغة" className="rounded-lg border border-dashed border-border p-6">
      <h2 className="text-lg font-semibold">لا يوجد عملاء بعد</h2>
      <p className="mt-2 text-sm text-muted">
        ابدأ بإضافة أول عميل داخل نطاق سماوة الآمن.
      </p>
    </section>
  );
}

export function ClientDeniedState() {
  return (
    <section aria-label="تعذر الوصول" className="rounded-lg border border-border p-6">
      <h2 className="text-lg font-semibold">لا يمكنك الوصول إلى هذا المورد.</h2>
      <p className="mt-2 text-sm text-muted">
        لم يتم عرض أي بيانات خارج نطاق صلاحياتك.
      </p>
    </section>
  );
}

export function InternalInviteForm() {
  return (
    <form aria-label="دعوة عضو داخلي">
      <div className="grid gap-4">
        <label className="grid gap-2 text-sm font-medium">
          بريد العضو
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
            <option value="account_manager">مدير حساب</option>
            <option value="content_writer">كاتب محتوى</option>
            <option value="designer">مصمم</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          نطاق العميل
          <select
            className="rounded-md border border-border bg-background px-3 py-2"
            name="clientIds"
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
      </div>
    </form>
  );
}

export function InternalInviteEmptyState() {
  return (
    <section
      aria-label="حالة الدعوات الفارغة"
      className="rounded-lg border border-dashed border-border p-6"
    >
      <h2 className="text-lg font-semibold">لا توجد دعوات داخلية بعد</h2>
      <p className="mt-2 text-sm text-muted">
        أرسل دعوة لعضو داخلي مع تحديد العميل المسموح له.
      </p>
    </section>
  );
}

export function InternalInviteLoadingState() {
  return <p className="text-sm text-muted">جاري تجهيز الدعوة...</p>;
}

export function InternalInviteSaveFailure() {
  return (
    <p role="alert" className="text-sm font-medium text-destructive">
      تعذر إرسال الدعوة. راجع البيانات وحاول مرة أخرى.
    </p>
  );
}

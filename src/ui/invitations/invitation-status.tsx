type InvitationStatus =
  | "pending"
  | "accepted"
  | "expired"
  | "revoked"
  | "superseded"
  | "already-used"
  | "email-mismatch";

const statusCopy: Record<
  InvitationStatus,
  { title: string; body: string; action: string }
> = {
  pending: {
    title: "الدعوة جاهزة",
    body: "سجل الدخول بنفس البريد المدعو لإكمال الانضمام.",
    action: "متابعة الدعوة",
  },
  accepted: {
    title: "تم قبول الدعوة",
    body: "تم تفعيل الوصول ضمن النطاق المسموح فقط.",
    action: "الدخول للمنصة",
  },
  expired: {
    title: "انتهت صلاحية الدعوة",
    body: "اطلب رابط دعوة جديد من مدير الحساب.",
    action: "العودة لتسجيل الدخول",
  },
  revoked: {
    title: "الدعوة غير متاحة",
    body: "تم إيقاف هذه الدعوة بأمان ولم يتم منح أي صلاحية.",
    action: "طلب مساعدة",
  },
  superseded: {
    title: "يوجد رابط أحدث",
    body: "هذا الرابط لم يعد صالحا. استخدم آخر رابط تم إرساله.",
    action: "فهمت",
  },
  "already-used": {
    title: "تم استخدام الدعوة",
    body: "العضوية المرتبطة بهذه الدعوة معالجة مسبقا.",
    action: "الدخول",
  },
  "email-mismatch": {
    title: "البريد غير مطابق",
    body: "استخدم البريد الذي استلم الدعوة. لم يتم منح أي صلاحية.",
    action: "تبديل الحساب",
  },
};

export function InvitationStatusView({
  status = "pending",
}: {
  status?: InvitationStatus;
}) {
  const copy = statusCopy[status];

  return (
    <main className="mx-auto grid min-h-dvh w-full max-w-xl content-center gap-6 px-4 py-8">
      <section className="grid gap-4 rounded-lg border border-border p-6">
        <p className="text-sm font-medium text-muted">دعوة المنصة</p>
        <h1 className="text-2xl font-semibold">{copy.title}</h1>
        <p className="text-sm leading-6 text-muted">{copy.body}</p>
        <a
          className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          href="/sign-in"
        >
          {copy.action}
        </a>
      </section>
    </main>
  );
}

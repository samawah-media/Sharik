import { f001CopyArSA } from "@/ui/copy/ar-SA/f001";

type AccessStateProps = {
  returnHref?: string;
};

function SafeState({
  heading,
  body,
  returnHref = "/",
  actionLabel = "العودة للرئيسية",
}: AccessStateProps & {
  heading: string;
  body: string;
  actionLabel?: string;
}) {
  return (
    <main
      dir="rtl"
      className="mx-auto grid min-h-[60vh] w-full max-w-2xl place-content-center gap-4 px-4 py-10 text-right"
    >
      <section
        aria-live="polite"
        className="grid gap-3 rounded-lg border border-border bg-background p-6"
      >
        <h1 className="text-2xl font-semibold">{heading}</h1>
        <p className="text-sm leading-6 text-muted">{body}</p>
        <a
          className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          href={returnHref}
        >
          {actionLabel}
        </a>
      </section>
    </main>
  );
}

export function AccessDeniedState({ returnHref = "/" }: AccessStateProps) {
  return (
    <SafeState
      heading={f001CopyArSA["f001.access.permissionDenied"]}
      body="راجع المساحة المصرح لك بها أو تواصل مع مدير الحساب. لا نعرض تفاصيل الموارد غير المصرح بها."
      returnHref={returnHref}
    />
  );
}

export function ResourceNotFoundState({ returnHref = "/" }: AccessStateProps) {
  return (
    <SafeState
      heading={f001CopyArSA["f001.access.notFound"]}
      body="لا يمكن فتح هذه الصفحة من حسابك الحالي. اختر المساحة المسندة لك أو تواصل مع مدير الحساب."
      returnHref={returnHref}
    />
  );
}

export function ClientUnavailableState({
  returnHref = "/clients",
}: AccessStateProps) {
  return (
    <SafeState
      actionLabel="العودة للعملاء"
      body="تأكد من اختيار عميل مسند لك."
      heading="لا يمكنك الوصول لهذا العميل"
      returnHref={returnHref}
    />
  );
}

export function NoAssignedClientState({ returnHref = "/" }: AccessStateProps) {
  return (
    <SafeState
      heading={f001CopyArSA["f001.access.noAssignedClients"]}
      body="ستظهر هنا المساحات بعد إسناد عميل لك من الإدارة."
      returnHref={returnHref}
    />
  );
}

export function SessionExpiredState() {
  return (
    <SafeState
      heading={f001CopyArSA["f001.access.sessionExpired"]}
      body="سجل الدخول مرة أخرى للمتابعة بأمان."
      returnHref="/sign-in"
      actionLabel="تسجيل الدخول"
    />
  );
}

export function MembershipDisabledState({ returnHref = "/" }: AccessStateProps) {
  return (
    <SafeState
      heading={f001CopyArSA["f001.access.membershipDisabled"]}
      body="هذه العضوية غير مفعلة حاليًا. تواصل مع مدير الحساب عند الحاجة."
      returnHref={returnHref}
    />
  );
}

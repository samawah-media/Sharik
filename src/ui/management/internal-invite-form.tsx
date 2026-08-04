"use client";

import { useActionState } from "react";
import { roleLabelAr } from "@/modules/roles/role-labels";
import {
  initialInvitationActionState,
  type InvitationActionState,
} from "@/modules/invitations/internal-team-invitation-state";
import { Button } from "@/ui/core/button";

export type InternalInviteClientOption = {
  id: string;
  name: string;
};

type InternalInvitationFormAction = (
  previousState: InvitationActionState,
  formData: FormData,
) => Promise<InvitationActionState>;

function InvitationActionFeedback({ state }: { state: InvitationActionState }) {
  if (state.status === "idle") return null;

  return (
    <div
      className={
        state.status === "success"
          ? "rounded-xl border border-success/30 bg-success/10 p-3 text-sm text-success"
          : "rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger"
      }
      role={state.status === "error" ? "alert" : "status"}
    >
      <p>{state.message}</p>
      {state.invitationPath ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <a
            className="break-all font-mono text-xs underline"
            href={state.invitationPath}
          >
            فتح رابط الدعوة
          </a>
          <Button
            onClick={() =>
              void navigator.clipboard.writeText(
                `${window.location.origin}${state.invitationPath}`,
              )
            }
            size="sm"
            type="button"
            variant="secondary"
          >
            نسخ الرابط
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function InternalInviteForm({
  action,
  clients = [{ id: "00000000-0000-4000-8000-000000000001", name: "هدنة" }],
  idempotencyKey = "fixture-invite-idempotency",
  invitationToken = "fixture-invitation-token-with-forty-safe-characters-0001",
}: {
  action?: InternalInvitationFormAction;
  clients?: InternalInviteClientOption[];
  idempotencyKey?: string;
  invitationToken?: string;
}) {
  const [state, formAction, pending] = useActionState(
    action ?? (async () => initialInvitationActionState),
    initialInvitationActionState,
  );

  return (
    <form action={formAction} aria-label="دعوة عضو داخلي" dir="rtl">
      <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
      <input name="invitationToken" type="hidden" value={invitationToken} />
      <div className="grid gap-4">
        <label className="grid gap-2 text-sm font-medium">
          اسم العضو
          <input
            autoComplete="name"
            className="min-h-11 rounded-xl border border-border bg-background px-3 py-2"
            maxLength={120}
            minLength={2}
            name="displayName"
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          بريد العضو
          <input
            autoComplete="email"
            className="min-h-11 rounded-xl border border-border bg-background px-3 py-2"
            name="email"
            required
            type="email"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          الدور
          <select
            className="min-h-11 rounded-xl border border-border bg-background px-3 py-2"
            name="roleKey"
            required
          >
            <option value="account_manager">{roleLabelAr("account_manager")}</option>
            <option value="content_writer">{roleLabelAr("content_writer")}</option>
            <option value="designer">{roleLabelAr("designer")}</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          العميل الذي سيعمل عليه
          <select
            className="min-h-11 rounded-xl border border-border bg-background px-3 py-2"
            name="clientId"
            required
          >
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs leading-5 text-muted">
          أنشئ الرابط ثم شاركه مع العضو عبر قناة موثوقة. لن يحصل العضو على أي
          صلاحية قبل تسجيل الدخول بنفس البريد وقبول الدعوة. إرسال البريد غير
          مفعّل في هذه المرحلة.
        </p>
        <InvitationActionFeedback state={state} />
        <Button
          className="w-fit"
          disabled={clients.length === 0 || pending}
          type="submit"
        >
          {pending ? "جارٍ إنشاء الدعوة..." : "إنشاء رابط الدعوة"}
        </Button>
      </div>
    </form>
  );
}

export function InternalInviteEmptyState() {
  return (
    <section
      aria-label="حالة الدعوات الفارغة"
      className="rounded-xl border border-dashed border-border p-5"
    >
      <h2 className="text-lg font-semibold">لا توجد دعوات داخلية بعد</h2>
      <p className="mt-2 text-sm text-muted">
        أنشئ رابط دعوة لعضو داخلي وحدد دوره والعميل الذي سيعمل عليه.
      </p>
    </section>
  );
}

export function InternalInviteLoadingState() {
  return <p className="text-sm text-muted">جارٍ تجهيز الدعوة...</p>;
}

export function InternalInviteSaveFailure() {
  return (
    <p role="alert" className="text-sm font-medium text-danger">
      تعذر إنشاء الدعوة. راجع البيانات وحاول مرة أخرى.
    </p>
  );
}

"use client";

import { useActionState, useState, useSyncExternalStore } from "react";
import { roleLabelAr } from "@/modules/roles/role-labels";
import {
  initialInvitationActionState,
  type InvitationActionState,
} from "@/modules/invitations/internal-team-invitation-state";
import { Button } from "@/ui/core/button";

const subscribeToHydration = () => () => undefined;

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
  const [selectedRoleKey, setSelectedRoleKey] = useState("");
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
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
            disabled={!hydrated || pending}
            name="roleKey"
            onChange={(event) => setSelectedRoleKey(event.target.value)}
            required
            value={selectedRoleKey}
          >
            <option disabled value="">
              اختر الدور
            </option>
            <option value="account_manager">{roleLabelAr("account_manager")}</option>
            <option value="content_writer">{roleLabelAr("content_writer")}</option>
            <option value="designer">{roleLabelAr("designer")}</option>
          </select>
        </label>
        <fieldset
          aria-describedby="invitation-client-scope-help"
          className="grid gap-3 rounded-xl border border-border bg-background p-3"
        >
          <legend className="px-1 text-sm font-medium">
            العملاء الذين سيعمل عليهم
          </legend>
          <p className="text-xs leading-5 text-muted" id="invitation-client-scope-help">
            اختر كل العملاء الذين سيحصل العضو على الدور نفسه ضمنهم. لن يرى
            بيانات أي عميل غير محدد هنا.
          </p>
          {clients.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {clients.map((client) => {
                const checked = selectedClientIds.includes(client.id);
                return (
                  <label
                    className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent-soft"
                    key={client.id}
                  >
                    <input
                      checked={checked}
                      className="size-4 accent-accent"
                      disabled={!hydrated || pending}
                      name="clientIds"
                      onChange={(event) =>
                        setSelectedClientIds((current) =>
                          event.target.checked
                            ? [...current, client.id]
                            : current.filter((clientId) => clientId !== client.id),
                        )
                      }
                      type="checkbox"
                      value={client.id}
                    />
                    <span>{client.name}</span>
                  </label>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted">لا يوجد عملاء نشطون متاحون للإسناد.</p>
          )}
        </fieldset>
        <p className="text-xs leading-5 text-muted">
          أنشئ الرابط ثم شاركه مع العضو عبر قناة موثوقة. لن يحصل العضو على أي
          صلاحية قبل تسجيل الدخول بنفس البريد وقبول الدعوة. إرسال البريد غير
          مفعّل في هذه المرحلة.
        </p>
        <InvitationActionFeedback state={state} />
        <Button
          className="w-fit"
          disabled={
            !hydrated ||
            selectedRoleKey === "" ||
            selectedClientIds.length === 0 ||
            pending
          }
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
        أنشئ رابط دعوة لعضو داخلي وحدد دوره والعملاء الذين سيعمل عليهم.
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

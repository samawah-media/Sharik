"use client";

import { useActionState } from "react";
import { roleLabelAr } from "@/modules/roles/role-labels";
import {
  initialInvitationActionState,
  type InvitationActionState,
} from "@/modules/invitations/internal-team-invitation-state";
import type { InternalTeamInvitation } from "@/server/actions/internal-team-invitations";
import { Button } from "@/ui/core/button";

type InvitationMutationAction = (
  previousState: InvitationActionState,
  formData: FormData,
) => Promise<InvitationActionState>;

function PendingInvitationActions({
  invitation,
  resendAction,
  revokeAction,
  resendIdempotencyKey,
  revokeIdempotencyKey,
  invitationToken,
}: {
  invitation: InternalTeamInvitation;
  resendAction: InvitationMutationAction;
  revokeAction: InvitationMutationAction;
  resendIdempotencyKey: string;
  revokeIdempotencyKey: string;
  invitationToken: string;
}) {
  const [resendState, resendFormAction, resendPending] = useActionState(
    resendAction,
    initialInvitationActionState,
  );
  const [revokeState, revokeFormAction, revokePending] = useActionState(
    revokeAction,
    initialInvitationActionState,
  );
  const state = resendState.status !== "idle" ? resendState : revokeState;

  return (
    <div className="mt-3 grid gap-2">
      <div className="flex flex-wrap gap-2">
        <form action={resendFormAction}>
          <input name="invitationId" type="hidden" value={invitation.id} />
          <input
            name="invitationToken"
            type="hidden"
            value={invitationToken}
          />
          <input
            name="idempotencyKey"
            type="hidden"
            value={resendIdempotencyKey}
          />
          <Button
            disabled={resendPending || revokePending}
            size="sm"
            type="submit"
            variant="secondary"
          >
            {resendPending ? "جارٍ التجديد..." : "إنشاء رابط جديد"}
          </Button>
        </form>
        <form action={revokeFormAction}>
          <input name="invitationId" type="hidden" value={invitation.id} />
          <input
            name="idempotencyKey"
            type="hidden"
            value={revokeIdempotencyKey}
          />
          <Button
            disabled={resendPending || revokePending}
            size="sm"
            type="submit"
            variant="ghost"
          >
            {revokePending ? "جارٍ الإلغاء..." : "إلغاء الدعوة"}
          </Button>
        </form>
      </div>
      {state.status !== "idle" ? (
        <div
          className={
            state.status === "error"
              ? "text-sm text-danger"
              : "text-sm text-success"
          }
          role={state.status === "error" ? "alert" : "status"}
        >
          <p>{state.message}</p>
          {state.invitationPath ? (
            <div className="mt-2 flex flex-wrap gap-2">
              <a
                className="break-all font-mono text-xs underline"
                href={state.invitationPath}
              >
                فتح الرابط الجديد
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
      ) : null}
    </div>
  );
}

export function InvitationList({
  invitations,
  resendAction,
  revokeAction,
  operationInputs = {},
}: {
  invitations: InternalTeamInvitation[];
  resendAction?: InvitationMutationAction;
  revokeAction?: InvitationMutationAction;
  operationInputs?: Record<
    string,
    {
      resendIdempotencyKey: string;
      revokeIdempotencyKey: string;
      invitationToken: string;
    }
  >;
}) {
  if (invitations.length === 0) {
    return (
      <section aria-label="الدعوات">
        <p>لا توجد دعوات مسجلة.</p>
      </section>
    );
  }

  return (
    <section aria-label="الدعوات" className="grid gap-3">
      <h2 className="text-lg font-semibold">الدعوات السابقة</h2>
      {invitations.map((invitation) => {
        const inputs = operationInputs[invitation.id];
        return (
          <article
            key={invitation.id}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="grid gap-1">
                <h3 className="text-base font-semibold">
                  {invitation.invitedDisplayName}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {invitation.invitedEmail}
                </p>
                <p className="text-sm text-muted-foreground">
                  {roleLabelAr(invitation.roleKey)} · {invitation.clientName}
                </p>
              </div>
              <span className="rounded-full border border-border px-3 py-1 text-xs">
                {invitation.status === "pending"
                  ? "بانتظار القبول"
                  : invitation.status === "accepted"
                    ? "تم القبول"
                    : invitation.status === "revoked"
                      ? "ملغاة"
                      : "استُبدلت"
                }
              </span>
            </div>
            {invitation.status === "pending" &&
            resendAction &&
            revokeAction &&
            inputs ? (
              <PendingInvitationActions
                invitation={invitation}
                invitationToken={inputs.invitationToken}
                resendAction={resendAction}
                resendIdempotencyKey={inputs.resendIdempotencyKey}
                revokeAction={revokeAction}
                revokeIdempotencyKey={inputs.revokeIdempotencyKey}
              />
            ) : null}
          </article>
        );
      })}
    </section>
  );
}

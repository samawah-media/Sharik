"use client";

import { useActionState, useState, useSyncExternalStore } from "react";
import { roleLabelAr } from "@/modules/roles/role-labels";
import {
  initialInvitationActionState,
  type InvitationActionState,
} from "@/modules/invitations/internal-team-invitation-state";
import type { InternalTeamInvitation } from "@/server/actions/internal-team-invitations";
import { Button } from "@/ui/core/button";

const subscribeToHydration = () => () => undefined;

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
  const [showClosed, setShowClosed] = useState(false);
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );

  const pendingInvitations = invitations.filter(
    (invitation) => invitation.status === "pending",
  );
  const closedInvitations = invitations.filter(
    (invitation) =>
      invitation.status === "revoked" || invitation.status === "superseded",
  );

  const renderInvitation = (
    invitation: InternalTeamInvitation,
    actionable: boolean,
  ) => {
    const inputs = operationInputs[invitation.id];
    return (
      <article
        key={invitation.id}
        className="grid gap-3 rounded-xl border border-border bg-surface p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start"
      >
        <div className="grid min-w-0 gap-1">
          <h3 className="truncate text-sm font-semibold">
            {invitation.invitedDisplayName}
          </h3>
          <p className="truncate text-xs text-muted-foreground">
            {invitation.invitedEmail}
          </p>
          <p className="text-xs leading-5 text-muted-foreground">
            {roleLabelAr(invitation.roleKey)} · {invitation.clientNames.join("، ")}
          </p>
        </div>
        <span className="w-fit rounded-full border border-border px-3 py-1 text-xs">
          {invitation.status === "pending"
            ? "بانتظار القبول"
            : invitation.status === "revoked"
              ? "ملغاة"
              : "استُبدلت برابط أحدث"}
        </span>
        {actionable &&
        resendAction &&
        revokeAction &&
        inputs ? (
          <div className="sm:col-span-2">
            <PendingInvitationActions
              invitation={invitation}
              invitationToken={inputs.invitationToken}
              resendAction={resendAction}
              resendIdempotencyKey={inputs.resendIdempotencyKey}
              revokeAction={revokeAction}
              revokeIdempotencyKey={inputs.revokeIdempotencyKey}
            />
          </div>
        ) : null}
      </article>
    );
  };

  return (
    <section aria-label="الدعوات" className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">دعوات بانتظار القبول</h2>
          <p className="text-xs text-muted">
            الروابط الفعالة فقط؛ العضو المقبول يظهر مرة واحدة في قائمة الفريق.
          </p>
        </div>
        <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
          {pendingInvitations.length}
        </span>
      </div>
      {pendingInvitations.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {pendingInvitations.map((invitation) =>
            renderInvitation(invitation, true),
          )}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">
          لا توجد دعوات بانتظار القبول.
        </p>
      )}
      {closedInvitations.length > 0 ? (
        <section className="rounded-xl border border-border bg-surface">
          <button
            aria-controls="closed-invitations"
            aria-expanded={showClosed}
            className="min-h-11 w-full px-4 py-3 text-start text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
            disabled={!hydrated}
            onClick={() => setShowClosed((current) => !current)}
            type="button"
          >
            سجل الدعوات المغلقة ({closedInvitations.length})
          </button>
          <div
            className="grid gap-3 border-t border-border p-3 lg:grid-cols-2"
            hidden={!showClosed}
            id="closed-invitations"
          >
            {closedInvitations.map((invitation) =>
              renderInvitation(invitation, false),
            )}
          </div>
        </section>
      ) : null}
    </section>
  );
}

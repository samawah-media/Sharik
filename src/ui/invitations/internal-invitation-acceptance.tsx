import { roleLabelAr } from "@/modules/roles/role-labels";
import {
  acceptInternalTeamInvitationAction,
  type InternalInvitationPreview,
} from "@/server/actions/internal-team-invitations";
import { Button } from "@/ui/core/button";

export function InternalInvitationAcceptance({
  invitation,
  invitationToken,
  denied = false,
}: {
  invitation: InternalInvitationPreview;
  invitationToken: string;
  denied?: boolean;
}) {
  if (invitation.status === "accepted") {
    return (
      <section className="grid gap-4 rounded-2xl border border-border bg-surface p-6">
        <h1 className="text-2xl font-semibold">تم قبول الدعوة</h1>
        <p className="text-sm leading-6 text-muted">
          عضويتك مفعلة بالفعل ضمن النطاق المسموح.
        </p>
        <a className="font-semibold text-accent underline" href="/work">
          فتح مساحة العمل
        </a>
      </section>
    );
  }

  return (
    <section className="grid gap-5 rounded-2xl border border-border bg-surface p-6">
      <div className="grid gap-2">
        <p className="text-sm font-semibold text-accent">دعوة فريق سماوة</p>
        <h1 className="text-2xl font-semibold">
          مرحبًا {invitation.invitedDisplayName}
        </h1>
        <p className="text-sm leading-6 text-muted">
          ستنضم بصفة {roleLabelAr(invitation.roleKey)} للعمل على العملاء المحددين:
          {" "}
          {invitation.clientNames.join("، ")} فقط.
        </p>
      </div>
      {denied ? (
        <p
          className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger"
          role="alert"
        >
          تعذر قبول الدعوة. تأكد أنك سجلت الدخول بنفس البريد المدعو وأن الرابط
          ما زال صالحًا.
        </p>
      ) : null}
      <form action={acceptInternalTeamInvitationAction}>
        <input name="invitationToken" type="hidden" value={invitationToken} />
        <Button type="submit">قبول الدعوة وفتح مساحة العمل</Button>
      </form>
      <p className="text-xs leading-5 text-muted">
        القبول يفعّل هذا الدور ضمن العملاء الموضحين فقط، ويسجل كل إسناد في سجل
        التدقيق.
      </p>
    </section>
  );
}

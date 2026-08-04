import {
  InternalInviteEmptyState,
  InternalInviteForm,
} from "@/ui/management/internal-invite-form";
import {
  canUseRouteActorFixtures,
  guardManagementRoute,
  routeClients,
  resolveRouteRuntime,
} from "@/server/navigation/route-guards";
import { AccessDeniedState } from "@/ui/shared/access-states";
import { ErrorState } from "@/ui/core/states";
import { InvitationList } from "@/ui/management/invitation-list";
import {
  createInternalTeamInvitationAction,
  listInternalTeamInvitations,
  resendInternalTeamInvitationAction,
  revokeInternalTeamInvitationAction,
  type InternalTeamInvitation,
} from "@/server/actions/internal-team-invitations";

const fixtureInvitations: InternalTeamInvitation[] = [
  {
    id: "fixture-internal-invite-a",
    tenantId: "tenant_a",
    invitedDisplayName: "مصمم هدنة",
    invitedEmail: "designer@example.com",
    roleKey: "designer",
    clientId: "client_a",
    clientName: "هدنة",
    status: "pending",
    deliveryState: "queued",
    createdAt: "2026-07-26T10:00:00.000Z",
    expiresAt: "2026-08-02T10:00:00.000Z",
  },
];

export default async function InternalInvitationPage({
  searchParams,
}: {
  searchParams?: Promise<{ as?: string }>;
}) {
  const params = await searchParams;
  const runtime = await resolveRouteRuntime(params?.as);

  if (!runtime.ok) {
    return <AccessDeniedState />;
  }

  const access = guardManagementRoute({
    actor: runtime.actor,
    route: "invitations",
  });

  if (!access.allowed) {
    return <AccessDeniedState />;
  }

  const invitationResult = canUseRouteActorFixtures()
    ? { ok: true as const, invitations: fixtureInvitations }
    : await listInternalTeamInvitations();
  const invitations = invitationResult.invitations;
  const clients = runtime.clients.map((client) => ({
    id: client.id,
    name: client.name,
  })).filter((client) =>
    canUseRouteActorFixtures()
      ? routeClients.some((fixtureClient) => fixtureClient.id === client.id)
      : true,
  );

  return (
    <main className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="text-2xl font-semibold">إضافة عضو إلى الفريق</h1>
        <p className="text-sm text-muted">
          حدّد بيانات العضو ودوره والعميل، ثم شارك معه رابط الدعوة عبر قناة
          موثوقة. لن تُمنح الصلاحية قبل قبول الدعوة بنفس البريد.
        </p>
      </header>
      {!invitationResult.ok ? (
        <ErrorState
          description="حاول تحديث الصفحة. لم نعرض قائمة فارغة بدل الخطأ."
          title="تعذر تحميل الدعوات الآن"
        />
      ) : null}
      {invitations.length === 0 ? <InternalInviteEmptyState /> : null}
      <InternalInviteForm
        action={createInternalTeamInvitationAction}
        clients={clients}
        idempotencyKey={`s015-invite-${crypto.randomUUID()}`}
        invitationToken={`${crypto.randomUUID().replaceAll("-", "")}${crypto.randomUUID().replaceAll("-", "")}`}
      />
      <InvitationList
        invitations={invitations}
        operationInputs={Object.fromEntries(
          invitations.map((invitation) => [
            invitation.id,
            {
              resendIdempotencyKey: `s015-resend-${crypto.randomUUID()}`,
              revokeIdempotencyKey: `s015-revoke-${crypto.randomUUID()}`,
              invitationToken: `${crypto.randomUUID().replaceAll("-", "")}${crypto.randomUUID().replaceAll("-", "")}`,
            },
          ]),
        )}
        resendAction={resendInternalTeamInvitationAction}
        revokeAction={revokeInternalTeamInvitationAction}
      />
    </main>
  );
}

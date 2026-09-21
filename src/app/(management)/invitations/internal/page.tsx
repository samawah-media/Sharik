import { InternalInviteForm } from "@/ui/management/internal-invite-form";
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
    clientIds: ["client_a"],
    clientNames: ["هدنة"],
    status: "pending",
    deliveryState: "queued",
    createdAt: "2026-07-26T10:00:00.000Z",
    expiresAt: "2026-08-02T10:00:00.000Z",
  },
  {
    id: "fixture-internal-invite-accepted",
    tenantId: "tenant_a",
    invitedDisplayName: "عضو مقبول يظهر في الفريق",
    invitedEmail: "accepted@example.test",
    roleKey: "content_writer",
    clientIds: ["client_a", "client_b"],
    clientNames: ["هدنة", "عميل تجريبي ب"],
    status: "accepted",
    deliveryState: "sent",
    createdAt: "2026-07-24T10:00:00.000Z",
    expiresAt: "2026-07-31T10:00:00.000Z",
  },
  {
    id: "fixture-internal-invite-revoked",
    tenantId: "tenant_a",
    invitedDisplayName: "دعوة ملغاة سابقة",
    invitedEmail: "revoked@example.test",
    roleKey: "designer",
    clientIds: ["client_a"],
    clientNames: ["هدنة"],
    status: "revoked",
    deliveryState: "sent",
    createdAt: "2026-07-22T10:00:00.000Z",
    expiresAt: "2026-07-29T10:00:00.000Z",
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
          حدّد بيانات العضو ودوره والعملاء بدقة، ثم شارك معه رابط الدعوة عبر
          قناة موثوقة. لن تُمنح أي صلاحية قبل قبول الدعوة بنفس البريد.
        </p>
      </header>
      {!invitationResult.ok ? (
        <ErrorState
          description="حاول تحديث الصفحة. لم نعرض قائمة فارغة بدل الخطأ."
          title="تعذر تحميل الدعوات الآن"
        />
      ) : null}
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(20rem,0.8fr)_minmax(0,1.2fr)]">
        <section className="grid gap-4 rounded-xl border border-border bg-surface p-4 xl:sticky xl:top-4">
          <div>
            <h2 className="text-lg font-semibold">بيانات الدعوة</h2>
            <p className="mt-1 text-xs leading-5 text-muted">
              لا توجد اختيارات افتراضية. راجع الدور وكل نطاق عميل قبل إنشاء
              الرابط.
            </p>
          </div>
          <InternalInviteForm
            action={createInternalTeamInvitationAction}
            clients={clients}
            idempotencyKey={`s015-invite-${crypto.randomUUID()}`}
            invitationToken={`${crypto.randomUUID().replaceAll("-", "")}${crypto.randomUUID().replaceAll("-", "")}`}
          />
        </section>
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
      </div>
    </main>
  );
}

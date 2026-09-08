import Link from "next/link";
import {
  canUseRouteActorFixtures,
  guardManagementRoute,
  resolveRouteRuntime,
} from "@/server/navigation/route-guards";
import {
  listInternalTeamInvitations,
} from "@/server/actions/internal-team-invitations";
import { listInternalTeamMembers } from "@/server/actions/internal-team-members";
import { ErrorState } from "@/ui/core/states";
import { InvitationList } from "@/ui/management/invitation-list";
import {
  InternalTeamDirectory,
  MemberList,
  ResponsibilityTransferBlockedState,
} from "@/ui/management/member-list";
import {
  AccessDeniedState,
  MembershipDisabledState,
  SessionExpiredState,
} from "@/ui/shared/access-states";

const fixtureMembers = [
  {
    id: "tm_internal_a",
    name: "عضو فريق سماوة",
    email: "internal-a@example.test",
    status: "active" as const,
    roles: [],
  },
  {
    id: "tm_disabled_a",
    name: "عضو معطل",
    email: "disabled@example.test",
    status: "disabled" as const,
    roles: [],
  },
];

const fixtureInvitations = [
  {
    id: "inv_pending",
    tenantId: "tenant_a",
    invitedDisplayName: "عضو فريق مدعو",
    invitedEmail: "pending@example.test",
    roleKey: "account_manager" as const,
    clientIds: ["00000000-0000-4000-8000-000000000001"],
    clientNames: ["هدنة"],
    status: "pending" as const,
    expiresAt: "2026-07-01T00:00:00.000Z",
    createdAt: "2026-06-24T00:00:00.000Z",
    deliveryState: "sent" as const,
  },
];

export default async function MembersPage({
  searchParams,
}: {
  searchParams?: Promise<{ as?: string; directoryFixture?: string }>;
}) {
  const params = await searchParams;
  const runtime = await resolveRouteRuntime(params?.as);

  if (!runtime.ok) {
    if (runtime.reason === "auth_required" || runtime.reason === "session_expired") {
      return <SessionExpiredState />;
    }

    if (runtime.reason === "membership_disabled") {
      return <MembershipDisabledState returnHref="/sign-in" />;
    }

    return <AccessDeniedState returnHref="/sign-in" />;
  }

  const access = guardManagementRoute({ actor: runtime.actor, route: "members" });

  if (!access.allowed) {
    if (access.reason === "membership_disabled") {
      return <MembershipDisabledState returnHref={access.safeReturnHref} />;
    }

    return <AccessDeniedState returnHref={access.safeReturnHref} />;
  }

  const usesFixtures = canUseRouteActorFixtures();
  const [memberResult, invitationResult] = usesFixtures
    ? [
        { ok: true as const, members: [] },
        { ok: true as const, invitations: fixtureInvitations },
      ]
    : await Promise.all([
        listInternalTeamMembers(),
        listInternalTeamInvitations(),
      ]);

  return (
    <main className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-2">
          <h1 className="text-2xl font-semibold">فريق العمل</h1>
          <p className="text-sm text-muted">
            راجع أعضاء الفريق وأدوارهم والعملاء المسندين إليهم، أو أنشئ دعوة
            آمنة لعضو جديد.
          </p>
        </div>
        <Link
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
          href="/invitations/internal"
        >
          إضافة عضو
        </Link>
      </header>

      {usesFixtures ? (
        params?.directoryFixture === "compact" ? (
          <InternalTeamDirectory members={[
            {
              membershipId: "directory-member-1",
              userId: "directory-user-1",
              displayName: "سارة المصممة",
              status: "active",
              roleKeys: ["designer", "content_writer"],
              clientNames: ["هدنة", "Glass Studio"],
            },
            {
              membershipId: "directory-member-2",
              userId: "directory-user-2",
              displayName: "مدير المساحة",
              status: "active",
              roleKeys: ["samawah_admin"],
              clientNames: [],
            },
            {
              membershipId: "directory-member-3",
              userId: "directory-user-3",
              displayName: "عضو معطل",
              status: "disabled",
              roleKeys: ["account_manager"],
              clientNames: ["جلس"],
            },
            {
              membershipId: "directory-member-4",
              userId: "directory-user-4",
              displayName: "عبدالرحمن مسؤول التنسيق والتصميم للحملات المشتركة متعددة العملاء Samawah Studio",
              status: "active",
              roleKeys: ["designer", "content_writer", "account_manager"],
              clientNames: [
                "مؤسسة المشاريع الإبداعية والتسويق والتواصل متعددة الفروع",
                "InternationalCreativeCollaborationStudioWithoutSpaces",
                "هدنة",
              ],
            },
          ]} />
        ) : (
          <>
            <ResponsibilityTransferBlockedState />
            <MemberList members={fixtureMembers} />
            <InvitationList invitations={fixtureInvitations} />
          </>
        )
      ) : (
        <>
          {!memberResult.ok ? (
            <ErrorState
              actionLabel="تحديث الصفحة"
              description="لم نستبدل الخطأ بقائمة فارغة. حدّث الصفحة وحاول مرة أخرى."
              returnHref="/members"
              title="تعذر تحميل أعضاء الفريق"
            />
          ) : (
            <InternalTeamDirectory members={memberResult.members} />
          )}
          {!invitationResult.ok ? (
            <ErrorState
              actionLabel="تحديث الصفحة"
              description="تعذر قراءة الدعوات الحالية. حدّث الصفحة وحاول مرة أخرى."
              returnHref="/members"
              title="تعذر تحميل الدعوات"
            />
          ) : (
            <InvitationList invitations={invitationResult.invitations} />
          )}
        </>
      )}
    </main>
  );
}

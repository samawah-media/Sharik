import { evaluatePermission } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listTenantTeamMembers } from "@/server/actions/onboarding-member-read";
import {
  guardManagementRoute,
  resolveRouteRuntime,
} from "@/server/navigation/route-guards";
import { FirstClientWizard } from "@/ui/management/first-client-wizard";
import {
  AccessDeniedState,
  MembershipDisabledState,
  SessionExpiredState,
} from "@/ui/shared/access-states";

export default async function OnboardFirstClientPage({
  searchParams,
}: {
  searchParams?: Promise<{ as?: string }>;
}) {
  const params = await searchParams;
  const runtime = await resolveRouteRuntime(params?.as);

  if (!runtime.ok) {
    if (
      runtime.reason === "auth_required" ||
      runtime.reason === "session_expired"
    ) {
      return <SessionExpiredState />;
    }

    if (runtime.reason === "membership_disabled") {
      return <MembershipDisabledState returnHref="/sign-in" />;
    }

    return <AccessDeniedState returnHref="/sign-in" />;
  }

  const access = guardManagementRoute({
    actor: runtime.actor,
    route: "clientWrite",
  });

  if (!access.allowed) {
    return <AccessDeniedState />;
  }

  const tenantId = runtime.actor.tenantId;
  const canOnboard = [
    PERMISSIONS.CLIENT_CREATE,
    PERMISSIONS.CONTRACT_CREATE,
    PERMISSIONS.PACKAGE_CREATE,
    PERMISSIONS.DELIVERABLE_CREATE,
  ].every((permission) =>
    evaluatePermission({
      actor: runtime.actor,
      permission,
      resource: { tenantId },
    }).allowed,
  );

  if (!canOnboard) {
    return <AccessDeniedState />;
  }

  const [tenantMembers] = await Promise.all([
    listTenantTeamMembers({ tenantId }),
  ]);

  return (
    <main className="grid max-w-3xl gap-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-semibold">إضافة أول عميل</h1>
        <p className="mt-2 text-sm text-muted">
          أنشئ العميل والعقد والباقة وأول مخرج في رحلة واحدة متصلة.
        </p>
      </div>
      <FirstClientWizard
        runId={`onboard-${crypto.randomUUID()}`}
        eligibleMembers={tenantMembers.ok ? tenantMembers.members : []}
        memberDirectoryAvailable={tenantMembers.ok}
      />
    </main>
  );
}

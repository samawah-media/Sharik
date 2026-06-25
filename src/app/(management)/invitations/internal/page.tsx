import {
  InternalInviteEmptyState,
  InternalInviteForm,
} from "@/ui/management/internal-invite-form";
import {
  canUseRouteActorFixtures,
  guardManagementRoute,
  resolveRouteRuntime,
} from "@/server/navigation/route-guards";
import { AccessDeniedState } from "@/ui/shared/access-states";

export default async function InternalInvitationPage({
  searchParams,
}: {
  searchParams?: Promise<{ as?: string }>;
}) {
  const params = await searchParams;
  const runtime = await resolveRouteRuntime(params?.as);

  if (!runtime.ok || !canUseRouteActorFixtures()) {
    return <AccessDeniedState />;
  }

  const access = guardManagementRoute({
    actor: runtime.actor,
    route: "invitations",
  });

  if (!access.allowed) {
    return <AccessDeniedState />;
  }

  return (
    <main className="grid gap-6">
      <h1 className="text-2xl font-semibold">دعوة عضو داخلي</h1>
      <InternalInviteEmptyState />
      <InternalInviteForm />
    </main>
  );
}

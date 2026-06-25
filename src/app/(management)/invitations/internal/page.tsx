import {
  InternalInviteEmptyState,
  InternalInviteForm,
} from "@/ui/management/internal-invite-form";
import {
  guardManagementRoute,
  resolveRouteActor,
} from "@/server/navigation/route-guards";
import { AccessDeniedState } from "@/ui/shared/access-states";

export default async function InternalInvitationPage({
  searchParams,
}: {
  searchParams?: Promise<{ as?: string }>;
}) {
  const params = await searchParams;
  const actor = resolveRouteActor(params?.as);
  const access = guardManagementRoute({ actor, route: "invitations" });

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

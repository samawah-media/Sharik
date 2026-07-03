import {
  guardClientDetailRoute,
  guardManagementRoute,
  resolveRouteRuntime,
} from "@/server/navigation/route-guards";
import { updateClientAction } from "@/server/actions/clients";
import { ClientForm } from "@/ui/management/client-form";
import {
  AccessDeniedState,
  ClientUnavailableState,
  MembershipDisabledState,
  SessionExpiredState,
} from "@/ui/shared/access-states";

export default async function EditClientPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams?: Promise<{ as?: string }>;
}) {
  const [{ clientId }, query] = await Promise.all([params, searchParams]);
  const runtime = await resolveRouteRuntime(query?.as);

  if (!runtime.ok) {
    if (runtime.reason === "auth_required" || runtime.reason === "session_expired") {
      return <SessionExpiredState />;
    }

    if (runtime.reason === "membership_disabled") {
      return <MembershipDisabledState returnHref="/sign-in" />;
    }

    return <AccessDeniedState returnHref="/sign-in" />;
  }

  const detailAccess = guardClientDetailRoute({
    actor: runtime.actor,
    clientId,
    clients: runtime.clients,
  });
  const writeAccess = guardManagementRoute({
    actor: runtime.actor,
    route: "clientWrite",
  });

  if (!detailAccess.allowed && detailAccess.reason === "not_found") {
    return <ClientUnavailableState />;
  }

  if (!detailAccess.allowed) {
    return <ClientUnavailableState />;
  }

  if (!writeAccess.allowed) {
    return <AccessDeniedState />;
  }

  const client = runtime.clients.find((item) => item.id === clientId);

  if (!client) {
    return <ClientUnavailableState />;
  }

  return (
    <main className="grid max-w-2xl gap-6">
      <h1 className="text-2xl font-semibold">تعديل العميل</h1>
      <ClientForm action={updateClientAction} client={client} mode="update" />
    </main>
  );
}

import { evaluatePermission } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import { ClientShell } from "@/ui/client/client-shell";
import { ClientWorkspaceSelector } from "@/ui/client/client-workspace-selector";
import { readClientWorkspace } from "@/server/navigation/client-workspace";
import { selectClientWorkspaceAction } from "@/server/actions/select-client-workspace";
import { redirect } from "next/navigation";
import { resolveRuntimeContext } from "@/server/auth/runtime-context";
import {
  canUseRouteActorFixtures,
  isClientPortalOnlyActor,
} from "@/server/navigation/route-guards";
import {
  readNotificationBellData,
  type NotificationBellPayload,
} from "@/server/actions/notifications-read";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const emptyBellData: NotificationBellPayload = { unreadCount: 0, recent: [] };

export default async function ClientLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const usesFixtures = canUseRouteActorFixtures();
  let canApprove = usesFixtures;
  let notifications: NotificationBellPayload = emptyBellData;
  let workspaceSelector: React.ReactNode;

  if (!usesFixtures) {
    const runtime = await resolveRuntimeContext();

    if (runtime.ok && !isClientPortalOnlyActor(runtime.actor)) {
      redirect("/");
    }

    if (runtime.ok) {
      const { clients, selectedClient: primaryClient } = await readClientWorkspace(runtime);
      workspaceSelector = (
        <ClientWorkspaceSelector
          clients={clients.map(({ id, name }) => ({ id, name }))}
          selectedClientId={primaryClient?.id}
          onSelect={selectClientWorkspaceAction}
        />
      );
      if (primaryClient) {
        canApprove = evaluatePermission({
          actor: runtime.actor,
          permission: PERMISSIONS.DELIVERABLE_CLIENT_APPROVE,
          resource: {
            tenantId: primaryClient.tenantId,
            clientId: primaryClient.id,
          },
        }).allowed;
      } else {
        canApprove = false;
      }

      notifications = await readNotificationBellData({
        supabase: await createSupabaseServerClient(),
      }).catch(() => emptyBellData);
    }
  }

  return (
    <ClientShell canApprove={canApprove} notifications={notifications} workspaceSelector={workspaceSelector}>
      {children}
    </ClientShell>
  );
}

import { evaluatePermission } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import { ClientShell } from "@/ui/client/client-shell";
import { redirect } from "next/navigation";
import { resolveRuntimeContext } from "@/server/auth/runtime-context";
import {
  canUseRouteActorFixtures,
  isClientPortalOnlyActor,
} from "@/server/navigation/route-guards";

export default async function ClientLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const usesFixtures = canUseRouteActorFixtures();
  let canApprove = usesFixtures;

  if (!usesFixtures) {
    const runtime = await resolveRuntimeContext();

    if (runtime.ok && !isClientPortalOnlyActor(runtime.actor)) {
      redirect("/");
    }

    if (runtime.ok) {
      const primaryClient = runtime.clients.find((client) =>
        runtime.actor.roleAssignments.some(
          (assignment) =>
            assignment.status === "active" &&
            assignment.scopeType === "client" &&
            assignment.scopeId === client.id,
        ),
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
    }
  }

  return <ClientShell canApprove={canApprove}>{children}</ClientShell>;
}

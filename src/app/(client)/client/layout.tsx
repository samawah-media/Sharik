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
  if (!canUseRouteActorFixtures()) {
    const runtime = await resolveRuntimeContext();

    if (runtime.ok && !isClientPortalOnlyActor(runtime.actor)) {
      redirect("/");
    }
  }

  return <ClientShell>{children}</ClientShell>;
}

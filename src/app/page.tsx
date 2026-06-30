import { redirect } from "next/navigation";
import { resolveRoleAwareNavigation } from "@/modules/navigation/navigation-resolver";
import { resolveRuntimeContext } from "@/server/auth/runtime-context";
import {
  AccessDeniedState,
  MembershipDisabledState,
  NoAssignedClientState,
} from "@/ui/shared/access-states";

export default async function HomePage() {
  const runtime = await resolveRuntimeContext();

  if (!runtime.ok) {
    if (runtime.reason === "auth_required" || runtime.reason === "session_expired") {
      redirect("/sign-in");
    }

    if (runtime.reason === "membership_disabled") {
      return <MembershipDisabledState returnHref="/sign-in" />;
    }

    return <AccessDeniedState returnHref="/sign-in" />;
  }

  const navigation = resolveRoleAwareNavigation({
    actor: runtime.actor,
    assignedClients: runtime.clients,
  });
  const firstDestination = navigation.items[0]?.href;

  if (firstDestination) {
    redirect(firstDestination);
  }

  if (navigation.state === "membership_disabled") {
    return <MembershipDisabledState returnHref="/sign-in" />;
  }

  return <NoAssignedClientState returnHref="/sign-in" />;
}

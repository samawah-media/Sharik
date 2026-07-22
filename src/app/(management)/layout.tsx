import { resolveRoleAwareNavigation } from "@/modules/navigation/navigation-resolver";
import { resolveRuntimeContext } from "@/server/auth/runtime-context";
import {
  canUseRouteActorFixtures,
  isClientPortalOnlyActor,
} from "@/server/navigation/route-guards";
import { redirect } from "next/navigation";
import {
  ProductShell,
  type ProductShellNavigationItem,
} from "@/ui/layout/product-shell";

const iconForNavigationItem = (
  id: string,
): ProductShellNavigationItem["icon"] => {
  if (id.includes("deliverables")) return "file";
  if (id.includes("members")) return "users";
  if (id.includes("invitations")) return "invite";
  if (id.includes("dashboard") || id.includes("portfolio")) return "dashboard";
  return "briefcase";
};

const hasSupabasePublicRuntimeEnv = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

const resolveShellNavigation = async () => {
  if (
    process.env.NODE_ENV === "test" ||
    canUseRouteActorFixtures() ||
    !hasSupabasePublicRuntimeEnv()
  ) {
    return [];
  }

  const runtime = await resolveRuntimeContext();

  if (!runtime.ok) {
    return [];
  }

  return resolveRoleAwareNavigation({
    actor: runtime.actor,
    assignedClients: runtime.clients,
  }).items.map((item) => ({
    href: item.href,
    icon: iconForNavigationItem(item.id),
    label: item.label,
  }));
};

export default async function ManagementLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (
    process.env.NODE_ENV !== "test" &&
    !canUseRouteActorFixtures() &&
    hasSupabasePublicRuntimeEnv()
  ) {
    const runtime = await resolveRuntimeContext();

    if (runtime.ok && isClientPortalOnlyActor(runtime.actor)) {
      redirect("/client");
    }
  }

  const navigationItems = await resolveShellNavigation();
  const shellRoot = navigationItems[0] ?? {
    href: "/portfolio",
    label: "المساحة",
  };

  return (
    <ProductShell
      breadcrumbRootHref={shellRoot.href}
      breadcrumbRootLabel={shellRoot.label}
      homeHref={shellRoot.href}
      navigationItems={navigationItems}
      navigationLabel="تنقل مساحة الفريق"
    >
      <section
        dir="rtl"
        data-security-scope="management-entry"
        data-route-guard="server-authorized"
      >
        {children}
      </section>
    </ProductShell>
  );
}

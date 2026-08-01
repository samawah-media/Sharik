import { resolveRoleAwareNavigation } from "@/modules/navigation/navigation-resolver";
import {
  canUseRouteActorFixtures,
  isClientPortalOnlyActor,
  resolveRouteRuntime,
} from "@/server/navigation/route-guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  readNotificationBellData,
  readNotificationList,
} from "@/server/actions/notifications-read";
import { ClientShell } from "@/ui/client/client-shell";
import {
  ProductShell,
  type ProductShellNavigationItem,
} from "@/ui/layout/product-shell";
import { NotificationList } from "@/ui/notifications/notification-list";
import { ErrorState } from "@/ui/core/states";
import {
  AccessDeniedState,
  MembershipDisabledState,
  SessionExpiredState,
} from "@/ui/shared/access-states";
import type { NotificationFilter } from "@/modules/notifications/notification-labels";
import type { NotificationItemData } from "@/ui/notifications/notification-item";

export const dynamic = "force-dynamic";

const iconForNavigationItem = (
  id: string,
): ProductShellNavigationItem["icon"] => {
  if (id.includes("deliverables")) return "file";
  if (id.includes("members")) return "users";
  if (id.includes("dashboard") || id.includes("portfolio")) return "dashboard";
  return "briefcase";
};

const fixtureNotifications: NotificationItemData[] = [
  {
    id: "fixture-notification-1",
    eventType: "client_send",
    title: "لديك نسخة جديدة بانتظار المراجعة",
    message: "تستطيع الآن مراجعة «منشور الأسبوع» واعتمادها أو طلب تعديل.",
    actionHref: "/client/pending",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: "fixture-notification-2",
    eventType: "delivered",
    title: "تم التسليم النهائي",
    message: "اكتمل تسليم «تقرير الشهر» للعميل.",
    actionHref: "/portfolio",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  },
];

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ filter?: string; as?: string }>;
}) {
  const params = await searchParams;
  const requestedFilter = params?.filter === "unread" ? "unread" : "all";
  const filter = requestedFilter as NotificationFilter;
  const usesFixtures = canUseRouteActorFixtures();

  const runtime = await resolveRouteRuntime(
    usesFixtures ? (params?.as ?? "tenant_admin_a") : undefined,
  );

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

  const { actor, clients } = runtime;
  const clientOnly = isClientPortalOnlyActor(actor);

  const bellData =
    usesFixtures || !clientOnly
      ? null
      : await readNotificationBellData({
          supabase: await createSupabaseServerClient(),
        }).catch(() => ({ unreadCount: 0, recent: [] }));

  const listResult = usesFixtures
    ? {
        ok: true as const,
        value:
          filter === "unread"
            ? fixtureNotifications.filter((item) => !item.read)
            : fixtureNotifications,
      }
    : await readNotificationList({
        supabase: await createSupabaseServerClient(),
        filter,
      });

  const items = listResult.ok ? listResult.value : [];
  const hasUnread = items.some((item) => !item.read);
  // Preserve one server snapshot through hydration so relative times cannot
  // cross a minute boundary between the server render and the first client render.
  const renderedAt = new Date().toISOString();

  const heading = "مركز الإشعارات";
  const intro =
    "هنا تجد كل إشعاراتك: المهام المسندة إليك، طلبات التعديل، اعتمادات العميل، ومراحل التسليم. افتح أي إشعار للانتقال إلى وجهته.";

  const content = (
    <main
      className="mx-auto grid w-full max-w-3xl gap-5 px-4 py-6 sm:py-8"
      dir="rtl"
      data-testid="notifications-page"
    >
      <header className="grid gap-2">
        <h1 className="text-2xl font-semibold sm:text-3xl">{heading}</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted">{intro}</p>
      </header>
      {!listResult.ok && !usesFixtures ? (
        <ErrorState
          description="تعذر تحميل إشعاراتك الآن. حاول مرة أخرى."
          returnHref={clientOnly ? "/client" : "/portfolio"}
          title="تعذر تحميل الإشعارات"
        />
      ) : (
        <NotificationList
          filter={filter}
          items={items}
          hasUnread={hasUnread}
          renderedAt={renderedAt}
        />
      )}
    </main>
  );

  if (clientOnly) {
    return (
      <ClientShell
        canApprove={
          actor.roleAssignments.some(
            (assignment) =>
              assignment.status === "active" &&
              assignment.roleKey === "client_approver",
          ) || usesFixtures
        }
        notifications={
          bellData ?? { unreadCount: 0, recent: [] }
        }
      >
        {content}
      </ClientShell>
    );
  }

  const nav = resolveRoleAwareNavigation({ actor, assignedClients: clients });
  const navigationItems: ProductShellNavigationItem[] = nav.items.map(
    (item) => ({
      href: item.href,
      icon: iconForNavigationItem(item.id),
      label: item.label,
    }),
  );
  const shellRoot = navigationItems[0] ?? { href: "/portfolio", label: "المساحة" };

  const managementBell = usesFixtures
    ? { unreadCount: 0, recent: [] }
    : await readNotificationBellData({
        supabase: await createSupabaseServerClient(),
      }).catch(() => ({ unreadCount: 0, recent: [] }));

  return (
    <ProductShell
      breadcrumbRootHref={shellRoot.href}
      breadcrumbRootLabel={shellRoot.label}
      homeHref={shellRoot.href}
      navigationItems={navigationItems}
      navigationLabel="تنقل مساحة الفريق"
      notifications={managementBell}
    >
      {content}
    </ProductShell>
  );
}

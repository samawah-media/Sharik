"use client";

import {
  BriefcaseBusiness,
  ChevronLeft,
  FileText,
  LayoutDashboard,
  Users,
  UserRoundPlus,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/ui/core/utils";
import { SignOutButton } from "@/ui/auth/sign-out-button";
import {
  NotificationBell,
  type NotificationBellData,
} from "@/ui/notifications/notification-bell";

const emptyNotifications: NotificationBellData = { unreadCount: 0, recent: [] };

const shellIcons = {
  briefcase: BriefcaseBusiness,
  dashboard: LayoutDashboard,
  file: FileText,
  invite: UserRoundPlus,
  users: Users,
} as const;

export type ProductShellNavigationItem = {
  href: string;
  label: string;
  icon?: keyof typeof shellIcons;
};

const defaultNavigationItems = [
  { href: "/portfolio", label: "لوحة الإدارة", icon: "dashboard" },
  { href: "/clients", label: "العملاء", icon: "briefcase" },
  { href: "/members", label: "الفريق", icon: "users" },
  { href: "/invitations/internal", label: "الدعوات", icon: "invite" },
] satisfies ProductShellNavigationItem[];

const segmentLabels: Record<string, string> = {
  clients: "العملاء",
  contracts: "العقد والباقة",
  packages: "الباقة",
  deliverables: "المخرجات",
  board: "لوحة العمل",
  commercial: "المتابعة / SLA",
  new: "إضافة",
  edit: "تعديل",
  members: "الفريق",
  invitations: "الدعوات",
  internal: "دعوة داخلية",
  notifications: "الإشعارات",
  onboard: "إضافة عميل جديد",
  portfolio: "لوحة الإدارة",
  work: "مهامي",
  readiness: "الجاهزية",
  r007: "R-007",
};

const uuidLikePattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isActive(pathname: string, href: string) {
  if (href === "/clients") {
    return pathname === href || pathname.startsWith("/clients/");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function breadcrumbLabel(segment: string, previousSegment?: string) {
  if (segmentLabels[segment]) {
    return segmentLabels[segment];
  }

  if (uuidLikePattern.test(segment)) {
    if (previousSegment === "clients") {
      return "العميل";
    }

    if (previousSegment === "contracts") {
      return "العقد";
    }

    return "التفاصيل";
  }

  if (segment.startsWith("client_")) {
    return "العميل";
  }

  if (segment.startsWith("contract_")) {
    return "العقد";
  }

  return segment;
}

function Breadcrumbs({
  pathname,
  rootHref,
  rootLabel,
}: {
  pathname: string;
  rootHref: string;
  rootLabel: string;
}) {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  const rootSegment = rootHref.split("/").filter(Boolean).at(-1);
  const crumbs = segments.map((segment, index) => ({
    href: `/${segments.slice(0, index + 1).join("/")}`,
    label:
      segment === rootSegment
        ? rootLabel
        : breadcrumbLabel(segment, segments[index - 1]),
  }));

  return (
    <nav
      aria-label="مسار الصفحة"
      className="min-w-0 max-w-full overflow-x-auto p-0.5 text-xs text-muted lg:overflow-visible lg:p-0"
    >
      <ol className="flex w-max min-w-full items-center gap-1 lg:w-auto lg:min-w-0 lg:flex-wrap">
        <li>
          <Link
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-3 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            href={rootHref}
          >
            {rootLabel}
          </Link>
        </li>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;

          return (
            <li
              className="flex min-w-0 shrink-0 items-center gap-1 lg:shrink"
              key={crumb.href}
            >
              <ChevronLeft aria-hidden="true" size={14} />
              {isLast ? (
                <span className="truncate font-medium text-foreground">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  className="inline-flex min-h-11 min-w-11 max-w-full items-center justify-center truncate rounded-md px-3 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                  href={crumb.href}
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function ProductShell({
  breadcrumbRootHref = "/clients",
  breadcrumbRootLabel = "الإدارة",
  children,
  homeHref = "/clients",
  navigationItems = defaultNavigationItems,
  navigationLabel = "تنقل الإدارة",
  notifications = emptyNotifications,
}: {
  breadcrumbRootHref?: string;
  breadcrumbRootLabel?: string;
  children: ReactNode;
  homeHref?: string;
  navigationItems?: ProductShellNavigationItem[];
  navigationLabel?: string;
  notifications?: NotificationBellData;
}) {
  const pathname = usePathname() ?? "/clients";

  return (
    <section
      className="min-h-screen bg-background text-foreground"
      data-product-shell="management"
      data-testid="product-shell"
      dir="rtl"
    >
      <div className="grid min-h-screen grid-rows-[auto_minmax(0,1fr)] lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:grid-rows-1">
        <aside className="min-w-0 border-b border-shell-border bg-shell px-3 py-1 text-shell-foreground lg:border-b-0 lg:border-l lg:px-3 lg:py-4">
          <div className="mx-auto grid gap-0 lg:sticky lg:top-4 lg:gap-4">
            <Link
              className="flex min-h-11 items-center gap-3 rounded-xl px-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:py-2"
              href={homeHref}
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-sm font-bold text-white shadow-sm shadow-black/20">
                ش
              </span>
              <span className="grid">
                <span className="text-sm font-semibold text-shell-foreground">
                  شريك
                </span>
                <span className="text-xs text-shell-muted">تشغيل سماوة</span>
              </span>
            </Link>
            {navigationItems.length > 0 ? (
              <nav
                aria-label={navigationLabel}
                className="flex snap-x gap-2 overflow-x-auto pb-1 lg:grid lg:overflow-visible lg:pb-0"
              >
                {navigationItems.map((item) => {
                  const Icon = shellIcons[item.icon ?? "briefcase"];
                  const active = isActive(pathname, item.href);

                  return (
                    <Link
                      className={cn(
                        "flex min-h-11 min-w-fit snap-start items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors",
                        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                        active
                          ? "border-accent bg-accent-soft text-accent"
                          : "border-transparent text-shell-muted hover:bg-accent-soft/50 hover:text-shell-foreground",
                      )}
                      href={item.href}
                      key={`${item.href}-${item.label}`}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon aria-hidden="true" size={18} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            ) : null}
            <div className="hidden rounded-xl border border-shell-border bg-background p-3 text-shell-foreground lg:grid lg:gap-2 [&_button]:border-shell-border [&_button]:hover:bg-accent-soft">
              <p className="text-xs font-semibold text-shell-muted">
                الحساب الحالي
              </p>
              <SignOutButton />
            </div>
          </div>
        </aside>
        <div className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-border bg-background/92 px-4 py-0.5 backdrop-blur sm:px-5 lg:py-2.5">
            <div className="mx-auto flex max-w-[90rem] flex-col gap-0 sm:flex-row sm:items-center sm:justify-between lg:gap-1.5">
              <Breadcrumbs
                pathname={pathname}
                rootHref={breadcrumbRootHref}
                rootLabel={breadcrumbRootLabel}
              />
              <div className="flex min-h-11 items-center gap-2 text-xs text-muted">
                <NotificationBell data={notifications} />
                <span>حساب الفريق</span>
                <span className="lg:hidden">
                  <SignOutButton />
                </span>
              </div>
            </div>
          </header>
          <div className="mx-auto w-full max-w-[90rem] px-4 py-5 sm:px-5 lg:px-6">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

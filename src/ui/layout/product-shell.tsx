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
import { SessionChangeNotice } from "@/ui/auth/session-change-notice";
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
  portfolio: "عملائي",
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

export type ProductShellAccountIdentity = {
  displayName: string;
  roleLabels: string[];
};

export function ProductShell({
  accountIdentity,
  breadcrumbRootHref = "/clients",
  breadcrumbRootLabel = "الإدارة",
  children,
  homeHref = "/clients",
  navigationItems = defaultNavigationItems,
  navigationLabel = "تنقل الإدارة",
  notifications = emptyNotifications,
}: {
  accountIdentity?: ProductShellAccountIdentity;
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
      className="workspace-shell min-h-screen bg-background text-foreground"
      data-product-shell="management"
      data-testid="product-shell"
      dir="rtl"
    >
      <SessionChangeNotice />
      <div className="grid min-h-screen grid-rows-[auto_minmax(0,1fr)]">
        <aside className="min-w-0 px-4 pt-4 text-shell-foreground sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[100rem] flex-wrap items-center justify-between gap-3">
            <Link
              className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
                className="flex max-w-full snap-x gap-1 overflow-x-auto rounded-full border border-white/80 bg-surface/85 p-1 shadow-sm"
              >
                {navigationItems.map((item) => {
                  const Icon = shellIcons[item.icon ?? "briefcase"];
                  const active = isActive(pathname, item.href);

                  return (
                    <Link
                      className={cn(
                        "flex min-h-11 min-w-fit snap-start items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                        active
                          ? "border-accent bg-accent text-white shadow-sm shadow-accent/20"
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
          </div>
        </aside>
        <div className="min-w-0">
          <header className="relative z-20 px-4 py-1 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-[100rem] flex-wrap items-center justify-between gap-1">
              <Breadcrumbs
                pathname={pathname}
                rootHref={breadcrumbRootHref}
                rootLabel={breadcrumbRootLabel}
              />
              <div className="flex min-h-11 min-w-0 max-w-full items-center gap-2 text-xs text-muted">
                <NotificationBell data={notifications} />
                {accountIdentity ? (
                  <span
                    className="grid min-w-0 max-w-full text-right"
                    data-testid="product-shell-account-identity"
                  >
                    <span className="min-w-0 break-words font-semibold text-foreground [overflow-wrap:anywhere]">
                      {accountIdentity.displayName}
                    </span>
                    <span className="text-muted">
                      {accountIdentity.roleLabels.join(" · ")}
                    </span>
                  </span>
                ) : (
                  <span>حساب الفريق</span>
                )}
                <span>
                  <SignOutButton />
                </span>
              </div>
            </div>
          </header>
          <div className="mx-auto w-full max-w-[100rem] px-4 pb-5 pt-3 sm:px-6 lg:px-8">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

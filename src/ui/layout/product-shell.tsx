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
  portfolio: "لوحة الإدارة",
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
    <nav aria-label="مسار الصفحة" className="min-w-0 text-xs text-muted">
      <ol className="flex min-w-0 flex-wrap items-center gap-1">
        <li>
          <Link className="hover:text-foreground" href={rootHref}>
            {rootLabel}
          </Link>
        </li>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;

          return (
            <li className="flex min-w-0 items-center gap-1" key={crumb.href}>
              <ChevronLeft aria-hidden="true" size={14} />
              {isLast ? (
                <span className="truncate font-medium text-foreground">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  className="truncate hover:text-foreground"
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
}: {
  breadcrumbRootHref?: string;
  breadcrumbRootLabel?: string;
  children: ReactNode;
  homeHref?: string;
  navigationItems?: ProductShellNavigationItem[];
  navigationLabel?: string;
}) {
  const pathname = usePathname() ?? "/clients";

  return (
    <section
      className="min-h-screen bg-background text-foreground"
      data-product-shell="management"
      data-testid="product-shell"
      dir="rtl"
    >
      <div className="grid min-h-screen lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="border-b border-border bg-surface/95 px-4 py-4 lg:border-b-0 lg:border-l">
          <div className="mx-auto grid max-w-7xl gap-4 lg:sticky lg:top-4">
            <Link
              className="flex items-center gap-3 rounded-lg px-2 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              href={homeHref}
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
                ش
              </span>
              <span className="grid">
                <span className="text-sm font-semibold">شريك</span>
                <span className="text-xs text-muted">تشغيل سماوة</span>
              </span>
            </Link>
            {navigationItems.length > 0 ? (
              <nav
                aria-label={navigationLabel}
                className="flex gap-2 overflow-x-auto pb-1 lg:grid lg:overflow-visible lg:pb-0"
              >
                {navigationItems.map((item) => {
                  const Icon = shellIcons[item.icon ?? "briefcase"];
                  const active = isActive(pathname, item.href);

                  return (
                    <Link
                      className={cn(
                        "flex min-w-fit items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors",
                        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent",
                        active
                          ? "border-accent/20 bg-accent-soft text-accent"
                          : "border-transparent text-muted hover:bg-accent-soft/50 hover:text-foreground",
                      )}
                      href={item.href}
                      key={`${item.href}-${item.label}`}
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
          <header className="border-b border-border bg-background/90 px-4 py-4 backdrop-blur">
            <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Breadcrumbs
                pathname={pathname}
                rootHref={breadcrumbRootHref}
                rootLabel={breadcrumbRootLabel}
              />
              <div className="flex items-center gap-2 text-xs text-muted">
                <FileText aria-hidden="true" size={15} />
                <span>تجربة UAT داخلية ضمن النطاق المصرح</span>
              </div>
            </div>
          </header>
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import {
  BriefcaseBusiness,
  FileText,
  FolderOpen,
  LayoutDashboard,
  PackageCheck,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/ui/auth/sign-out-button";
import { cn } from "@/ui/core/utils";
import {
  NotificationBell,
  type NotificationBellData,
} from "@/ui/notifications/notification-bell";

const emptyNotifications: NotificationBellData = { unreadCount: 0, recent: [] };

const items = [
  { href: "/client", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/client/work", label: "أعمالي", icon: BriefcaseBusiness },
  { href: "/client/pending", label: "بانتظار موافقتي", icon: PackageCheck },
  { href: "/client/files", label: "الملفات", icon: FolderOpen },
  { href: "/client/commercial", label: "العقد والمتابعة", icon: FileText },
];

export function ClientShell({
  canApprove = true,
  children,
  notifications = emptyNotifications,
}: {
  canApprove?: boolean;
  children: React.ReactNode;
  notifications?: NotificationBellData;
}) {
  const pathname = usePathname() ?? "/client";
  const pendingLabel = canApprove ? "بانتظار موافقتي" : "قيد المراجعة";

  return (
    <section
      className="min-h-screen bg-background text-foreground"
      dir="rtl"
      data-product-shell="client"
    >
      <div className="grid min-h-screen grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)] lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:grid-rows-1">
        <aside className="min-w-0 border-b border-shell-border bg-shell px-3 py-1 text-shell-foreground lg:border-b-0 lg:border-l lg:py-4">
          <Link
            className="flex min-h-11 items-center gap-3 rounded-lg px-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:py-2"
            href="/client"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white shadow-sm shadow-black/20">
              ش
            </span>
            <span>
              <strong className="block text-sm">مساحة العميل</strong>
              <span className="text-xs text-shell-muted">تشغيل سماوة</span>
            </span>
          </Link>
          <nav
            aria-label="تنقل بوابة العميل"
            className="mt-1 flex min-w-0 max-w-full gap-2 overflow-x-auto lg:mt-5 lg:grid"
          >
            {items.map(({ href, label, icon: Icon }) => {
              const active =
                pathname === href ||
                (href !== "/client" && pathname.startsWith(`${href}/`));
              const resolvedLabel =
                href === "/client/pending" ? pendingLabel : label;
              return (
                <Link
                  key={href}
                  href={href}
                  onFocus={(event) =>
                    event.currentTarget.scrollIntoView({
                      block: "nearest",
                      inline: "nearest",
                    })
                  }
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 min-w-fit items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                    active
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-transparent text-shell-muted hover:bg-accent-soft/50 hover:text-shell-foreground",
                  )}
                >
                  <Icon size={17} aria-hidden="true" />
                  {resolvedLabel}
                </Link>
              );
            })}
          </nav>
          <div className="mt-5 hidden rounded-lg border border-shell-border bg-background p-3 lg:block [&_button]:border-shell-border [&_button]:hover:bg-accent-soft">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <UserRound size={16} aria-hidden="true" />
              حسابي
            </div>
            <SignOutButton />
          </div>
        </aside>
        <div className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-border bg-background/92 px-4 py-1 backdrop-blur sm:px-5 lg:py-2.5">
            <div className="mx-auto flex max-w-[90rem] flex-wrap items-center justify-end gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2 lg:hidden">
                <span className="flex shrink-0 items-center gap-2 text-sm font-semibold">
                  <UserRound size={16} aria-hidden="true" />
                  حسابي
                </span>
                <SignOutButton />
              </div>
              <NotificationBell data={notifications} />
            </div>
          </header>
          {children}
        </div>
      </div>
    </section>
  );
}

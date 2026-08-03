"use client";

import { BriefcaseBusiness, FileText, FolderOpen, LayoutDashboard, PackageCheck, UserRound } from "lucide-react";
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
    <section className="min-h-screen bg-background text-foreground" dir="rtl" data-product-shell="client">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="border-b border-border bg-surface px-3 py-3 lg:border-b-0 lg:border-l lg:py-5">
          <Link className="flex min-h-11 items-center gap-3 rounded-lg px-2 py-2" href="/client">
            <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">ش</span>
            <span><strong className="block text-sm">مساحة العميل</strong><span className="text-xs text-muted">تشغيل سماوة</span></span>
          </Link>
          <nav aria-label="تنقل بوابة العميل" className="mt-5 flex gap-2 overflow-x-auto lg:grid">
            {items.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== "/client" && pathname.startsWith(`${href}/`));
              const resolvedLabel = href === "/client/pending" ? pendingLabel : label;
              return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("flex min-h-11 min-w-fit items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold", active ? "bg-accent-soft text-accent" : "text-muted hover:bg-accent-soft/50 hover:text-foreground")}><Icon size={17} aria-hidden="true" />{resolvedLabel}</Link>;
            })}
          </nav>
          <div className="mt-5 rounded-lg border border-border bg-background p-3">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><UserRound size={16} aria-hidden="true" />حسابي</div>
            <SignOutButton />
          </div>
        </aside>
        <div className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-end gap-2">
              <NotificationBell data={notifications} />
            </div>
          </header>
          {children}
        </div>
      </div>
    </section>
  );
}

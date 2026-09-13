"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/ui/core/utils";
import {
  formatNotificationRelative,
  NOTIFICATION_CATEGORY_LABEL,
  NOTIFICATION_EVENT_CATEGORIES,
  type NotificationEventType,
} from "@/modules/notifications/notification-labels";
import type { NotificationItemData } from "./notification-item";

export type NotificationBellData = {
  unreadCount: number;
  recent: NotificationItemData[];
  recentReadFailed?: boolean;
};

export function NotificationBell({ data }: { data: NotificationBellData }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const overflow = data.unreadCount > 99;
  const count = Math.max(0, Math.min(data.unreadCount, 99));
  const displayCount = overflow ? "+99" : String(count);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={
          count > 0
            ? `الإشعارات، لديك ${count} إشعار غير مقروء`
            : "الإشعارات"
        }
        className={cn(
          "relative inline-flex size-11 items-center justify-center rounded-lg border text-muted transition-colors",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          open
            ? "border-accent/30 bg-accent-soft text-accent"
            : "border-border bg-background hover:bg-accent-soft/50 hover:text-foreground",
        )}
        onClick={() => setOpen((previous) => !previous)}
        type="button"
      >
        <Bell aria-hidden="true" size={18} />
        {count > 0 ? (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-[18px] text-white"
          >
            {displayCount}
          </span>
        ) : null}
      </button>
      {open ? (
        <div
          aria-label="آخر الإشعارات"
          className="absolute left-0 top-12 z-30 w-[20rem] max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-surface p-2 shadow-lg"
          dir="rtl"
          role="menu"
        >
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-sm font-semibold">الإشعارات</span>
            <Link
              className="text-xs font-semibold text-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              href="/notifications"
              onClick={() => setOpen(false)}
            >
              عرض كل الإشعارات
            </Link>
          </div>
          {data.recentReadFailed ? (
            <div className="grid gap-2 px-3 py-5 text-center">
              <p className="text-sm text-muted">
                تعذر تحميل آخر الإشعارات.
              </p>
              <Link
                className="text-xs font-semibold text-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                href="/notifications"
                onClick={() => setOpen(false)}
              >
                فتح مركز الإشعارات والمحاولة مجددًا
              </Link>
            </div>
          ) : data.recent.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted">
              لا توجد إشعارات حديثة.
            </p>
          ) : (
            <ul className="grid gap-1">
              {data.recent.slice(0, 5).map((notification) => {
                const category =
                  NOTIFICATION_EVENT_CATEGORIES[
                    notification.eventType as NotificationEventType
                  ];
                return (
                  <li key={notification.id}>
                    <Link
                      className={cn(
                        "block rounded-md px-3 py-2 text-right transition-colors",
                        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                        notification.read
                          ? "hover:bg-accent-soft/40"
                          : "bg-accent-soft/30 hover:bg-accent-soft/50",
                      )}
                      href={notification.actionHref ?? "/notifications"}
                      onClick={() => setOpen(false)}
                      role="menuitem"
                    >
                      <div className="flex items-center gap-2">
                        {category ? (
                          <span className="rounded-full border border-border bg-background px-1.5 py-0.5 text-[10px] text-muted">
                            {NOTIFICATION_CATEGORY_LABEL[category]}
                          </span>
                        ) : null}
                        {!notification.read ? (
                          <span className="size-2 rounded-full bg-accent" />
                        ) : null}
                        <span className="text-[11px] text-muted">
                          {formatNotificationRelative(notification.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-foreground">
                        {notification.title}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

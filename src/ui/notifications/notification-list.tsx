"use client";

import { useState, useTransition } from "react";
import { CheckCheck, CheckCircle2 } from "lucide-react";
import { cn } from "@/ui/core/utils";
import {
  NOTIFICATION_FILTER_LABELS,
  NOTIFICATION_FILTERS,
  type NotificationFilter,
} from "@/modules/notifications/notification-labels";
import {
  NotificationItem,
  type NotificationItemData,
} from "./notification-item";

export function NotificationList({
  filter,
  items,
  hasUnread,
  renderedAt,
}: {
  filter: NotificationFilter;
  items: NotificationItemData[];
  hasUnread: boolean;
  renderedAt: string;
}) {
  const [pendingId, startMarkTransition] = useTransition();
  const [pendingAll, startMarkAllTransition] = useTransition();
  const [localError, setLocalError] = useState<string | null>(null);
  const renderedAtDate = new Date(renderedAt);

  const handleMarkAll = () => {
    setLocalError(null);
    startMarkAllTransition(async () => {
      const { markAllNotificationsReadAction } = await import(
        "@/server/actions/notifications-write"
      );
      const result = await markAllNotificationsReadAction();
      if (!result.ok) {
        setLocalError("تعذر تعليم الكل كمقروء الآن. حاول مرة أخرى.");
      }
    });
  };

  const handleMarkOne = (notificationId: string) => {
    setLocalError(null);
    startMarkTransition(async () => {
      const { markNotificationReadAction } = await import(
        "@/server/actions/notifications-write"
      );
      const result = await markNotificationReadAction({ notificationId });
      if (!result.ok) {
        setLocalError("تعذر تعليم الإشعار كمقروء الآن. حاول مرة أخرى.");
      }
    });
  };

  return (
    <section className="grid gap-4" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="inline-flex rounded-lg border border-border bg-surface p-1"
          role="tablist"
          aria-label="فلترة الإشعارات"
        >
          {NOTIFICATION_FILTERS.map((value) => {
            const active = value === filter;
            return (
              <a
                aria-current={active ? "page" : undefined}
                aria-selected={active}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-md px-4 text-sm font-semibold transition-colors",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                  active
                    ? "bg-accent text-white"
                    : "text-muted hover:bg-accent-soft/50 hover:text-foreground",
                )}
                href={
                  value === "all" ? "/notifications" : "/notifications?filter=unread"
                }
                key={value}
                role="tab"
              >
                {NOTIFICATION_FILTER_LABELS[value]}
              </a>
            );
          })}
        </div>
        <button
          className={cn(
            "inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-semibold",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
            "disabled:pointer-events-none disabled:opacity-60",
          )}
          disabled={!hasUnread || pendingAll}
          onClick={handleMarkAll}
          type="button"
        >
          <CheckCheck aria-hidden="true" size={16} />
          {pendingAll ? "جار التحديث..." : "تعليم الكل كمقروء"}
        </button>
      </div>

      {localError ? (
        <p className="text-sm text-danger" role="alert">
          {localError}
        </p>
      ) : null}

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-surface px-4 py-10 text-center text-sm text-muted">
          {filter === "unread"
            ? "لا توجد إشعارات غير مقروءة."
            : "لا توجد إشعارات حتى الآن."}
        </p>
      ) : (
        <ul className="grid gap-3">
          {items.map((notification) => (
            <li className="grid gap-2" key={notification.id}>
              <NotificationItem
                notification={notification}
                now={renderedAtDate}
              />
              {!notification.read ? (
                <form action={() => handleMarkOne(notification.id)}>
                  <button
                    className={cn(
                      "inline-flex min-h-11 items-center gap-1 self-end rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                      "disabled:pointer-events-none disabled:opacity-60",
                    )}
                    disabled={pendingId}
                    type="submit"
                  >
                    <CheckCircle2 aria-hidden="true" size={14} />
                    تعليم كمقروء
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

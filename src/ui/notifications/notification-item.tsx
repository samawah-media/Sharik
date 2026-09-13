import Link from "next/link";
import { Bell, CheckCircle2 } from "lucide-react";
import { cn } from "@/ui/core/utils";
import {
  formatNotificationRelative,
  NOTIFICATION_CATEGORY_LABEL,
  NOTIFICATION_EVENT_CATEGORIES,
  type NotificationEventType,
} from "@/modules/notifications/notification-labels";

export type NotificationItemData = {
  id: string;
  eventType: string;
  title: string;
  message: string;
  actionHref: string | null;
  read: boolean;
  createdAt: string;
};

export function NotificationItem({
  notification,
  now,
}: {
  notification: NotificationItemData;
  now: Date;
}) {
  const category =
    NOTIFICATION_EVENT_CATEGORIES[notification.eventType as NotificationEventType];
  const categoryLabel = category
    ? NOTIFICATION_CATEGORY_LABEL[category]
    : "إشعار";
  const relative = formatNotificationRelative(notification.createdAt, now);
  const href = notification.actionHref ?? "/notifications";
  const Icon = Bell;

  return (
    <article
      aria-label={notification.title}
      className={cn(
        "grid gap-2 rounded-lg border border-border bg-surface p-3 text-right transition-colors",
        notification.read ? "opacity-80" : "border-accent/20 bg-accent-soft/30",
      )}
      dir="rtl"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-md border",
            notification.read
              ? "border-border bg-background text-muted"
              : "border-accent/20 bg-accent-soft text-accent",
          )}
        >
          <Icon size={18} />
        </span>
        <div className="grid min-w-0 flex-1 gap-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-muted">
              {categoryLabel}
            </span>
            {!notification.read ? (
              <span
                aria-label="غير مقروء"
                className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white"
              >
                جديد
              </span>
            ) : null}
            <span className="text-[11px] text-muted">{relative}</span>
          </div>
          <h3 className="text-sm font-semibold leading-6 text-foreground">
            {notification.title}
          </h3>
          <p className="text-sm leading-6 text-muted">{notification.message}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <Link
          className={cn(
            "inline-flex min-h-11 items-center gap-1 rounded-md px-3 py-2 text-xs font-semibold text-accent",
            "hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          )}
          href={href}
        >
          <CheckCircle2 aria-hidden="true" size={14} />
          فتح الإشعار
        </Link>
      </div>
    </article>
  );
}

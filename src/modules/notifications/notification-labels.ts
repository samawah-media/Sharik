// In-app notification labels and routing rules.
//
// The persistent notification row already carries Arabic title/message authored
// server-side inside PostgreSQL (see migration 202608010002). This module does
// NOT re-author copy. It only provides:
//   * the authoritative TypeScript mirror of the PostgreSQL action_href
//     allowlist (used for unit tests and defensive client validation),
//   * a coarse category per event_type for visual grouping/accessibility
//     (never a raw enum/UUID shown to the user),
//   * relative-time helpers in Arabic.
//
// No email, WhatsApp, push, or cron lives here. X010-B4 is in-app only.

export type NotificationEventType =
  | "version_submitted"
  | "internal_changes_requested"
  | "client_send"
  | "client_approved"
  | "client_changes_requested"
  | "delivery_prepared"
  | "delivered"
  | "client_delivered"
  | "task_assigned"
  | "task_reassigned";

export type NotificationCategory =
  | "assignment"
  | "internal_review"
  | "client_decision"
  | "delivery";

export const NOTIFICATION_EVENT_CATEGORIES: Record<
  NotificationEventType,
  NotificationCategory
> = {
  task_assigned: "assignment",
  task_reassigned: "assignment",
  version_submitted: "internal_review",
  internal_changes_requested: "internal_review",
  client_send: "client_decision",
  client_approved: "client_decision",
  client_changes_requested: "client_decision",
  delivery_prepared: "delivery",
  delivered: "delivery",
  client_delivered: "delivery",
};

export const NOTIFICATION_CATEGORY_LABEL: Record<NotificationCategory, string> =
  {
    assignment: "المهام المسندة",
    internal_review: "المراجعة الداخلية",
    client_decision: "قرار العميل",
    delivery: "التسليم",
  };

const UUID_PATTERN =
  "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

const ALLOWED_HREF_PATTERNS: RegExp[] = [
  /^\/portfolio$/,
  /^\/work$/,
  /^\/client$/,
  /^\/client\/pending$/,
  /^\/client\/work$/,
  /^\/client\/files$/,
  new RegExp(`^/clients/${UUID_PATTERN}/deliverables$`),
];

// Mirrors public.s015_notification_href_is_allowed in migration 202608010002.
// action_href is generated server-side only; this is a defensive check and a
// unit-test contract. A null href is allowed (some notifications are advisory).
export function isAllowedNotificationHref(href: string | null | undefined) {
  if (href === null || href === undefined) {
    return true;
  }
  return ALLOWED_HREF_PATTERNS.some((pattern) => pattern.test(href));
}

const ARABIC_WEEKDAYS = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

const pad = (value: number) => String(value).padStart(2, "0");

// Local, human Arabic formatting. No technical ISO strings reach the UI.
export function formatNotificationDate(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const hours = date.getHours() % 12 === 0 ? 12 : date.getHours() % 12;
  const minutes = pad(date.getMinutes());
  const meridiem = date.getHours() < 12 ? "ص" : "م";
  return `${ARABIC_WEEKDAYS[date.getDay()]} ${day}/${pad(month)}/${year} ${hours}:${minutes} ${meridiem}`;
}

export function formatNotificationRelative(
  isoTimestamp: string,
  now: Date = new Date(),
): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  const diffMs = now.getTime() - date.getTime();
  const seconds = Math.round(diffMs / 1000);
  if (seconds < 60) {
    return "الآن";
  }
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `قبل ${minutes} دقيقة`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `قبل ${hours} ساعة`;
  }
  const days = Math.round(hours / 24);
  if (days < 7) {
    return `قبل ${days} يوم`;
  }
  const weeks = Math.round(days / 7);
  if (weeks < 4) {
    return `قبل ${weeks} أسبوع`;
  }
  const months = Math.round(days / 30);
  if (months < 12) {
    return `قبل ${months} شهر`;
  }
  const years = Math.round(days / 365);
  return `قبل ${years} سنة`;
}

export const NOTIFICATION_FILTERS = ["all", "unread"] as const;
export type NotificationFilter = (typeof NOTIFICATION_FILTERS)[number];

export const NOTIFICATION_FILTER_LABELS: Record<NotificationFilter, string> = {
  all: "الكل",
  unread: "غير المقروء",
};

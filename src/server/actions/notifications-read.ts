import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { isAllowedNotificationHref } from "@/modules/notifications/notification-labels";

export type NotificationListItem = {
  id: string;
  clientId: string | null;
  eventType: string;
  title: string;
  message: string;
  actionHref: string | null;
  read: boolean;
  createdAt: string;
};

const notificationRowSchema = z.object({
  id: z.string().uuid(),
  client_id: z.string().uuid().nullable(),
  event_type: z.string().min(1),
  title: z.string().min(1),
  message: z.string().min(1),
  action_href: z.string().nullable().optional(),
  read_at: z.string().datetime().nullable().optional(),
  created_at: z.string(),
});

const toNotificationListItem = (
  row: z.infer<typeof notificationRowSchema>,
): NotificationListItem => {
  const actionHref =
    row.action_href && isAllowedNotificationHref(row.action_href)
      ? row.action_href
      : null;
  return {
    id: row.id,
    clientId: row.client_id,
    eventType: row.event_type,
    title: row.title,
    message: row.message,
    actionHref,
    read: Boolean(row.read_at),
    createdAt: row.created_at,
  };
};

export async function readNotificationUnreadCount({
  supabase,
}: {
  supabase: SupabaseClient;
}): Promise<number> {
  const { data, error } = await supabase.rpc("s015_notification_unread_count");
  if (error || typeof data !== "number") {
    return 0;
  }
  return Math.max(0, Math.min(data, 999));
}

export async function readNotificationList({
  supabase,
  filter,
  limit = 50,
  offset = 0,
}: {
  supabase: SupabaseClient;
  filter: "all" | "unread";
  limit?: number;
  offset?: number;
}): Promise<{ ok: true; value: NotificationListItem[] } | { ok: false }> {
  const { data, error } = await supabase.rpc("s015_list_notifications", {
    p_filter: filter,
    p_limit: Math.max(1, Math.min(limit, 200)),
    p_offset: Math.max(0, offset),
  });

  if (error) {
    return { ok: false };
  }

  const parsed = z.array(notificationRowSchema).safeParse(data ?? []);
  if (!parsed.success) {
    return { ok: false };
  }

  return {
    ok: true,
    value: parsed.data
      .map(toNotificationListItem)
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime(),
      ),
  };
}

export type NotificationBellPayload = {
  unreadCount: number;
  recent: NotificationListItem[];
};

// Combined payload for the shell bell. Returns a safe empty payload on any
// read failure (the bell simply shows no badge) instead of throwing, so a
// transient read error never blocks the shell from rendering.
export async function readNotificationBellData({
  supabase,
}: {
  supabase: SupabaseClient;
}): Promise<NotificationBellPayload> {
  const unreadCount = await readNotificationUnreadCount({ supabase });
  const recentResult = await readNotificationList({
    supabase,
    filter: "all",
    limit: 5,
  });

  if (!recentResult.ok) {
    return { unreadCount, recent: [] };
  }

  return { unreadCount, recent: recentResult.value };
}

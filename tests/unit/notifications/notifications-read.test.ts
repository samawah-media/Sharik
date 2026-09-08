import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  readNotificationBellData,
  readNotificationList,
  readNotificationUnreadCount,
} from "@/server/actions/notifications-read";

const row = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: "00000000-0000-4000-8000-000000000001",
  client_id: "00000000-0000-4000-8000-000000000010",
  event_type: "client_send",
  title: "لديك نسخة جديدة بانتظار المراجعة",
  message: "تستطيع الآن مراجعة العمل.",
  action_href: "/client/pending",
  read_at: null,
  created_at: "2026-08-01T10:00:00.000Z",
  ...overrides,
});

const supabaseWith = (data: unknown, error: unknown) =>
  ({
    rpc: vi.fn().mockResolvedValue({ data, error }),
  }) as unknown as SupabaseClient;

describe("notification unread count read", () => {
  it("returns the RPC count clamped to a safe positive range", async () => {
    const count = await readNotificationUnreadCount({
      supabase: supabaseWith(7, null),
    });
    expect(count).toBe(7);
  });

  it("returns 0 on RPC error or non-numeric payload (never throws)", async () => {
    expect(
      await readNotificationUnreadCount({ supabase: supabaseWith(null, { message: "boom" }) }),
    ).toBe(0);
    expect(
      await readNotificationUnreadCount({ supabase: supabaseWith("not-a-number", null) }),
    ).toBe(0);
  });

  it("clamps absurd values to the badge range", async () => {
    expect(
      await readNotificationUnreadCount({ supabase: supabaseWith(-3, null) }),
    ).toBe(0);
    expect(
      await readNotificationUnreadCount({ supabase: supabaseWith(5000, null) }),
    ).toBe(999);
  });
});

describe("notification list read", () => {
  it("parses rows and preserves server-generated allowlisted hrefs", async () => {
    const result = await readNotificationList({
      supabase: supabaseWith([row()], null),
      filter: "all",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0].actionHref).toBe("/client/pending");
      expect(result.value[0].read).toBe(false);
    }
  });

  it("accepts PostgreSQL timezone-offset read timestamps after a notification is marked read", async () => {
    const result = await readNotificationList({
      supabase: supabaseWith(
        [row({ read_at: "2026-09-01T09:15:30.123456+00:00" })],
        null,
      ),
      filter: "all",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0].read).toBe(true);
    }
  });

  it("strips a non-allowlisted action_href defensively (defense-in-depth on top of the DB CHECK)", async () => {
    const result = await readNotificationList({
      supabase: supabaseWith([row({ action_href: "/admin/users" })], null),
      filter: "all",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value[0].actionHref).toBeNull();
    }
  });

  it("sorts newest first regardless of RPC order", async () => {
    const result = await readNotificationList({
      supabase: supabaseWith(
        [
          row({ id: "00000000-0000-4000-8000-000000000001", created_at: "2026-08-01T09:00:00.000Z" }),
          row({ id: "00000000-0000-4000-8000-000000000002", created_at: "2026-08-01T12:00:00.000Z" }),
        ],
        null,
      ),
      filter: "all",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value[0].id).toBe("00000000-0000-4000-8000-000000000002");
    }
  });

  it("returns ok:false on RPC error (UI must show error, not convert it to empty)", async () => {
    const result = await readNotificationList({
      supabase: supabaseWith(null, { message: "denied" }),
      filter: "all",
    });
    expect(result.ok).toBe(false);
  });

  it("returns ok:false when the row shape is unexpected", async () => {
    const result = await readNotificationList({
      supabase: supabaseWith([{ id: "not-a-uuid" }], null),
      filter: "all",
    });
    expect(result.ok).toBe(false);
  });

  it("forwards the requested filter and clamps limit/offset to safe bounds", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [], error: null });
    await readNotificationList({
      supabase: { rpc } as unknown as SupabaseClient,
      filter: "unread",
      limit: 9999,
      offset: -5,
    });

    expect(rpc).toHaveBeenCalledWith(
      "s015_list_notifications",
      expect.objectContaining({
        p_filter: "unread",
        p_limit: 200,
        p_offset: 0,
      }),
    );
  });
});

describe("notification bell read", () => {
  it("keeps the unread count but reports an honest recent-list failure", async () => {
    const rpc = vi.fn(async (name: string) =>
      name === "s015_notification_unread_count"
        ? { data: 15, error: null }
        : { data: null, error: { message: "temporary failure" } },
    );

    const result = await readNotificationBellData({
      supabase: { rpc } as unknown as SupabaseClient,
    });

    expect(result).toEqual({
      unreadCount: 15,
      recent: [],
      recentReadFailed: true,
    });
  });
});

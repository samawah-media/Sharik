import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NotificationBell } from "@/ui/notifications/notification-bell";
import type { NotificationItemData } from "@/ui/notifications/notification-item";

afterEach(() => {
  cleanup();
});

const recentItem = (overrides: Partial<NotificationItemData> = {}): NotificationItemData => ({
  id: "00000000-0000-4000-8000-000000000001",
  eventType: "client_send",
  title: "لديك نسخة جديدة بانتظار المراجعة",
  message: "تستطيع الآن مراجعة العمل.",
  actionHref: "/client/pending",
  read: false,
  createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  ...overrides,
});

describe("notification bell", () => {
  it("hides the unread badge when there are zero unread notifications", () => {
    render(<NotificationBell data={{ unreadCount: 0, recent: [] }} />);
    expect(
      screen.getByRole("button", { name: "الإشعارات" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/\d/)).not.toBeInTheDocument();
  });

  it("shows the unread count on the badge and an accessible label", () => {
    render(
      <NotificationBell data={{ unreadCount: 3, recent: [recentItem()] }} />,
    );
    const button = screen.getByRole("button", {
      name: /لديك 3 إشعار غير مقروء/,
    });
    expect(button).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("clamps large counts to +99", () => {
    render(<NotificationBell data={{ unreadCount: 150, recent: [] }} />);
    expect(screen.getByText("+99")).toBeInTheDocument();
  });

  it("opens the popover with recent items and a view-all link, then closes on Escape", async () => {
    const user = userEvent.setup();
    render(
      <NotificationBell
        data={{
          unreadCount: 2,
          recent: [
            recentItem({ id: "a", title: "إشعار أول" }),
            recentItem({
              id: "b",
              title: "إشعار ثانٍ",
              read: true,
              actionHref: "/client/files",
            }),
          ],
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: /غير مقروء/ }));
    expect(screen.getByRole("menu", { name: "آخر الإشعارات" })).toBeVisible();
    expect(screen.getByText("إشعار أول")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "عرض كل الإشعارات" }),
    ).toHaveAttribute("href", "/notifications");

    await user.keyboard("{Escape}");
    expect(
      screen.queryByRole("menu", { name: "آخر الإشعارات" }),
    ).not.toBeInTheDocument();
  });

  it("shows a calm empty state inside the popover when there are no notifications", async () => {
    const user = userEvent.setup();
    render(<NotificationBell data={{ unreadCount: 0, recent: [] }} />);

    await user.click(screen.getByRole("button", { name: "الإشعارات" }));
    expect(
      screen.getByText("لا لديك إشعارات جديدة."),
    ).toBeInTheDocument();
  });

  it("renders the badge node only for unread items in the popover", async () => {
    const user = userEvent.setup();
    render(
      <NotificationBell
        data={{
          unreadCount: 1,
          recent: [
            recentItem({ id: "unread-1", title: "غير مقروء", read: false }),
            recentItem({ id: "read-1", title: "مقروء بالفعل", read: true }),
          ],
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: /غير مقروء/ }));
    const unreadLink = screen.getByRole("menuitem", { name: /غير مقروء/ });
    expect(unreadLink.querySelector(".bg-accent")).not.toBeNull();
  });
});

// Keep the import-side-effect mock honest: the bell uses document listeners.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
}));

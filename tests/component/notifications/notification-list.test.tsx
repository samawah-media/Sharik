import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NotificationList } from "@/ui/notifications/notification-list";
import type { NotificationItemData } from "@/ui/notifications/notification-item";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const item = (overrides: Partial<NotificationItemData> = {}): NotificationItemData => ({
  id: "00000000-0000-4000-8000-000000000001",
  eventType: "client_send",
  title: "لديك نسخة جديدة بانتظار المراجعة",
  message: "تستطيع الآن مراجعة العمل.",
  actionHref: "/client/pending",
  read: false,
  createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  ...overrides,
});

const markOneMock = vi.fn();
const markAllMock = vi.fn();
const renderedAt = "2026-08-01T12:00:00.000Z";

vi.mock("@/server/actions/notifications-write", () => ({
  markNotificationReadAction: (input: { notificationId: string }) =>
    markOneMock(input) ?? { ok: true },
  markAllNotificationsReadAction: () => markAllMock() ?? { ok: true },
}));

describe("notification list", () => {
  it("renders the All / Unread filter tabs with the active state", () => {
    render(
      <NotificationList
        filter="all"
        items={[item()]}
        hasUnread={true}
        renderedAt={renderedAt}
      />,
    );

    const allTab = screen.getByRole("tab", { name: "الكل" });
    const unreadTab = screen.getByRole("tab", { name: "غير المقروء" });
    expect(allTab).toHaveAttribute("aria-selected", "true");
    expect(unreadTab).toHaveAttribute("aria-selected", "false");
    expect(unreadTab).toHaveAttribute(
      "href",
      "/notifications?filter=unread",
    );
  });

  it("renders each notification with Arabic title, message, category, and a safe open link", () => {
    render(
      <NotificationList
        filter="all"
        items={[
          item({
            title: "طلب العميل تعديلات",
            message: "طلب العميل تعديلات على العمل.",
            actionHref: "/portfolio",
            eventType: "client_changes_requested",
          }),
        ]}
        hasUnread={true}
        renderedAt={renderedAt}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "طلب العميل تعديلات" }),
    ).toBeVisible();
    expect(
      screen.getByText("طلب العميل تعديلات على العمل."),
    ).toBeInTheDocument();
    expect(screen.getByText("قرار العميل")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /فتح الإشعار/ })).toHaveAttribute(
      "href",
      "/portfolio",
    );
  });

  it("shows a real empty state when there are no items (never confuses empty with error)", () => {
    render(
      <NotificationList
        filter="all"
        items={[]}
        hasUnread={false}
        renderedAt={renderedAt}
      />,
    );
    expect(
      screen.getByText("لا توجد إشعارات حتى الآن."),
    ).toBeInTheDocument();
  });

  it("uses a distinct empty copy for the unread filter", () => {
    render(
      <NotificationList
        filter="unread"
        items={[]}
        hasUnread={false}
        renderedAt={renderedAt}
      />,
    );
    expect(screen.getByText("لا توجد إشعارات غير مقروءة.")).toBeInTheDocument();
  });

  it("marks a single notification as read through the scoped server action", async () => {
    const user = userEvent.setup();
    markOneMock.mockResolvedValue({ ok: true });

    render(
      <NotificationList
        filter="all"
        items={[item({ id: "00000000-0000-4000-8000-000000000099" })]}
        hasUnread={true}
        renderedAt={renderedAt}
      />,
    );

    await user.click(screen.getByRole("button", { name: /تعليم كمقروء/ }));

    await waitFor(() => {
      expect(markOneMock).toHaveBeenCalledWith({
        notificationId: "00000000-0000-4000-8000-000000000099",
      });
    });
  });

  it("marks all notifications as read and disables the action while pending or when nothing is unread", async () => {
    const user = userEvent.setup();
    markAllMock.mockResolvedValue({ ok: true });

    const { rerender } = render(
      <NotificationList
        filter="all"
        items={[item()]}
        hasUnread={true}
        renderedAt={renderedAt}
      />,
    );
    const allButton = screen.getByRole("button", {
      name: /تعليم الكل كمقروء/,
    });
    expect(allButton).not.toBeDisabled();

    await user.click(allButton);
    await waitFor(() => expect(markAllMock).toHaveBeenCalled());

    rerender(
      <NotificationList
        filter="all"
        items={[item({ read: true })]}
        hasUnread={false}
        renderedAt={renderedAt}
      />,
    );
    expect(
      screen.getByRole("button", { name: /تعليم الكل كمقروء/ }),
    ).toBeDisabled();
  });

  it("does not render the per-item mark-read control for already-read notifications", () => {
    render(
      <NotificationList
        filter="all"
        items={[item({ read: true })]}
        hasUnread={false}
        renderedAt={renderedAt}
      />,
    );
    expect(
      screen.queryByRole("button", { name: /تعليم كمقروء/ }),
    ).not.toBeInTheDocument();
  });
});

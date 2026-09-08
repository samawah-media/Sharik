import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";
import { ManagementExceptionDashboard } from "@/ui/management/exception-dashboard";

afterEach(() => cleanup());

const baseDeliverable = (
  overrides: Partial<DeliverableSafeSummary>,
): DeliverableSafeSummary => ({
  id: "d1",
  tenantId: "t1",
  clientId: "c1",
  name: "منشور الهوية",
  type: "post",
  status: "internally_approved",
  priority: "normal",
  ownerUserId: "u1",
  ownerDisplay: {
    userId: "u1",
    displayName: "أحمد العتيبي",
    roleLabel: "كاتب محتوى",
    initial: "أ",
  },
  contributorUserIds: [],
  requiresInternalApproval: true,
  requiresClientApproval: true,
  progressPercentage: 70,
  approvedExtra: false,
  revision: 1,
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-29T00:00:00.000Z",
  ...overrides,
});

describe("ManagementExceptionDashboard — X010-B-1", () => {
  it.each([
    ["not_started", "داخل الفريق"],
    ["in_progress", "داخل الفريق"],
    ["ready_for_internal_review", "للمراجعة الداخلية"],
    ["internal_changes_requested", "داخل الفريق"],
    ["internally_approved", "داخل الفريق"],
    ["waiting_client_approval", "بانتظار العميل"],
    ["client_changes_requested", "داخل الفريق"],
    ["client_approved", "داخل الفريق"],
    ["ready_for_delivery", "داخل الفريق"],
    ["delivered", "تم التسليم"],
    ["cancelled", "ملغي أو مؤرشف"],
    ["archived", "ملغي أو مؤرشف"],
  ] as const)("counts %s only in %s", (status, expectedGroup) => {
    render(
      <ManagementExceptionDashboard
        clientNames={{ c1: "شركة النور" }}
        deliverables={[baseDeliverable({ status })]}
        now="2026-07-30T00:00:00.000Z"
      />,
    );

    const distribution = within(
      screen.getByRole("region", { name: "وين وصل الشغل؟" }),
    );
    expect(distribution.getAllByRole("meter")).toHaveLength(5);
    for (const label of [
      "تم التسليم", "بانتظار العميل", "للمراجعة الداخلية",
      "داخل الفريق", "ملغي أو مؤرشف",
    ]) {
      const bar = distribution.getByRole("meter", { name: label });
      const count = label === expectedGroup ? "1" : "0";
      expect(bar).toHaveAttribute("aria-valuenow", count);
      expect(bar).toHaveAttribute("aria-valuemin", "0");
      expect(bar).toHaveAttribute("aria-valuemax", "1");
      expect(bar).toHaveAttribute("aria-valuetext", `${count} من 1 مخرج`);
    }
  });

  it("partitions all twelve statuses once while overdue remains a separate SLA indicator", () => {
    const statuses = [
      "not_started", "in_progress", "ready_for_internal_review",
      "internal_changes_requested", "internally_approved", "waiting_client_approval",
      "client_changes_requested", "client_approved", "ready_for_delivery",
      "delivered", "cancelled", "archived",
    ] as const;
    const deliverables = statuses.map((status, index) => baseDeliverable({
      id: `status-${index}`, status,
      internalDueDate: status === "in_progress" ? "2026-07-29T00:00:00.000Z" : undefined,
    }));
    render(<ManagementExceptionDashboard clientNames={{ c1: "شركة النور" }} deliverables={deliverables} now="2026-07-30T00:00:00.000Z" />);

    expect(screen.getByRole("heading", { level: 2, name: "يحتاج انتباهكم" })).toBeVisible();
    const distribution = within(screen.getByRole("region", { name: "وين وصل الشغل؟" }));
    const expected = [
      ["تم التسليم", 1], ["بانتظار العميل", 1], ["للمراجعة الداخلية", 1],
      ["داخل الفريق", 7], ["ملغي أو مؤرشف", 2],
    ] as const;
    expect(distribution.getAllByRole("meter")).toHaveLength(5);
    for (const [label, count] of expected) {
      const bar = distribution.getByRole("meter", { name: label });
      expect(bar).toHaveAttribute("aria-valuenow", String(count));
      expect(bar).toHaveAttribute("aria-valuemin", "0");
      expect(bar).toHaveAttribute("aria-valuemax", "12");
      expect(bar).toHaveAttribute("aria-valuetext", `${count} من 12 مخرج`);
      expect(distribution.getByText(label)).toBeVisible();
    }
    expect(distribution.getAllByRole("meter").reduce((sum, bar) => sum + Number(bar.getAttribute("aria-valuenow")), 0)).toBe(12);
    expect(within(screen.getByRole("article", { name: "متأخر" })).getByText("1")).toBeVisible();
    expect(screen.getAllByRole("article")).toHaveLength(5);
    expect(distribution.queryByRole("meter", { name: "متأخر" })).not.toBeInTheDocument();
  });

  it("shows honest successful-empty states without fabricated bars or percentages", () => {
    render(<ManagementExceptionDashboard clientNames={{ c1: "شركة النور" }} deliverables={[]} now="2026-07-30T00:00:00.000Z" />);
    expect(screen.queryByRole("meter")).not.toBeInTheDocument();
    expect(screen.getByText("ما فيه مخرجات لعرض توزيعها حاليًا.")).toBeVisible();
    expect(screen.getByText("ما فيه مخرجات لهذا العميل حاليًا.")).toBeVisible();
    for (const metric of screen.getAllByRole("article")) {
      expect(within(metric).getByText("0")).toBeVisible();
    }
    expect(screen.getByRole("link", { name: "ملف العميل" })).toHaveAttribute("href", "/clients/c1/commercial");
  });

  it("uses delivered over total per client, not average workflow progress or package usage", () => {
    render(<ManagementExceptionDashboard
      clientNames={{ c1: "شركة النور", c2: "شركة الأفق" }}
      deliverables={[
        baseDeliverable({ id: "delivered", status: "delivered", progressPercentage: 100 }),
        baseDeliverable({ id: "approved", status: "client_approved", progressPercentage: 90 }),
        baseDeliverable({ id: "other", clientId: "c2", status: "in_progress", progressPercentage: 30 }),
      ]}
      now="2026-07-30T00:00:00.000Z"
    />);
    const clients = within(screen.getByRole("region", { name: "التسليم حسب العميل" }));
    const delivered = clients.getByRole("meter", { name: "تسليم شركة النور" });
    expect(delivered).toHaveAttribute("aria-valuenow", "1");
    expect(delivered).toHaveAttribute("aria-valuemax", "2");
    expect(delivered.firstElementChild).toHaveStyle({ width: "50%" });
    expect(clients.getByText("1 من 2 تم تسليمه")).toBeVisible();
    const zero = clients.getByRole("meter", { name: "تسليم شركة الأفق" });
    expect(zero).toHaveAttribute("aria-valuenow", "0");
    expect(zero.firstElementChild).toHaveStyle({ width: "0%" });
    expect(clients.queryByText(/الباقات|95%/)).not.toBeInTheDocument();
  });

  it("preserves long user-provided names and original client/recent destinations", () => {
    const clientName = "شركة الخدمات التسويقية والتطوير الإبداعي للمشاريع المحلية والإقليمية";
    const ownerName = "المسؤول عن التصميم والمراجعة للمحتوى العربي طويل العنوان";
    const deliverableName = "مخرج بعنوان طويل للمراجعة والتسليم دون اختصار النص الذي كتبه المستخدم";
    render(<ManagementExceptionDashboard
      clientNames={{ c1: clientName }}
      deliverables={[baseDeliverable({ name: deliverableName, ownerDisplay: { userId: "u1", displayName: ownerName, roleLabel: "مصمم", initial: "م" } })]}
      now="2026-07-30T00:00:00.000Z"
    />);
    expect(screen.getByText(ownerName)).toBeVisible();
    expect(screen.getByRole("meter", { name: `تسليم ${clientName}` })).toHaveAttribute("aria-valuetext", "0 من 1 مخرج");
    expect(screen.getByRole("link", { name: "ملف العميل" })).toHaveAttribute("href", "/clients/c1/commercial");
    const recent = screen.getByRole("link", { name: new RegExp(deliverableName) });
    expect(recent).toHaveAttribute("href", "/clients/c1/deliverables");
    expect(within(recent).getByText(clientName, { exact: false })).toBeVisible();
  });

  it("renders Arabic status labels and never leaks raw technical enums", () => {
    const deliverables = [
      baseDeliverable({ id: "d1", status: "internally_approved" }),
      baseDeliverable({ id: "d2", status: "client_approved" }),
      baseDeliverable({ id: "d3", status: "delivered" }),
    ];

    render(
      <ManagementExceptionDashboard
        clientNames={{ c1: "شركة النور" }}
        deliverables={deliverables}
        now="2026-07-30T00:00:00.000Z"
      />,
    );

    const recent = screen.getByLabelText("أحدث القرارات والتسليمات");
    expect(within(recent).getByText(/معتمد داخليًا/)).toBeInTheDocument();
    expect(within(recent).getByText(/معتمد من العميل/)).toBeInTheDocument();
    expect(within(recent).getByText(/تم التسليم/)).toBeInTheDocument();

    expect(within(recent).queryByText(/^internally_approved$/)).not.toBeInTheDocument();
    expect(within(recent).queryByText(/^client_approved$/)).not.toBeInTheDocument();
    expect(within(recent).queryByText(/^delivered$/)).not.toBeInTheDocument();
  });

  it("makes the whole recent-decision row a single clickable link to the deliverables page", () => {
    const deliverables = [
      baseDeliverable({ id: "d1", name: "منشور الهوية", status: "delivered" }),
    ];

    render(
      <ManagementExceptionDashboard
        clientNames={{ c1: "شركة النور" }}
        deliverables={deliverables}
        now="2026-07-30T00:00:00.000Z"
      />,
    );

    const link = screen.getByRole("link", { name: /منشور الهوية/u });
    expect(link).toHaveAttribute("href", "/clients/c1/deliverables");
    expect(within(link).getByText(/شركة النور/u)).toBeInTheDocument();
    expect(within(link).getByText(/تم التسليم/u)).toBeInTheDocument();
  });
});

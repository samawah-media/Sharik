import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PackageSafeSummary } from "@/modules/packages/package-repository";
import {
  PackageBalanceSummary,
  PackageDeniedState,
  PackageEmptyState,
  PackageForm,
  PackageList,
} from "@/ui/management/package-form";

afterEach(() => cleanup());

const packageSummary: PackageSafeSummary = {
  id: "package_a",
  tenantId: "tenant_a",
  clientId: "client_a",
  contractId: "contract_a",
  name: "باقة المحتوى الشهرية",
  periodStart: "2026-07-01",
  periodEnd: "2026-07-31",
  status: "draft",
  createdAt: "2026-06-28T00:00:00.000Z",
  updatedAt: "2026-06-28T00:00:00.000Z",
  lines: [
    {
      id: "package_line_posts",
      tenantId: "tenant_a",
      clientId: "client_a",
      packageId: "package_a",
      serviceLabel: "منشورات",
      deliverableTypeHint: "post",
      unitLabel: "منشور",
      committedQuantity: 4,
      status: "active",
      createdAt: "2026-06-28T00:00:00.000Z",
      updatedAt: "2026-06-28T00:00:00.000Z",
      balance: {
        committed: 4,
        reserved: 1,
        consumed: 0,
        released: 0,
        adjustments: 0,
        available: 3,
      },
    },
  ],
  balances: [
    {
      packageLineId: "package_line_posts",
      committed: 4,
      reserved: 1,
      consumed: 0,
      released: 0,
      adjustments: 0,
      available: 3,
    },
  ],
};

describe("package form and balance states", () => {
  it("renders Arabic RTL package and package-line create fields with scoped hidden values", () => {
    render(
      <PackageForm
        clientId="client_a"
        contractId="contract_a"
        idempotencyKey="f002b-package-client-a"
      />,
    );

    expect(
      screen.getByRole("form", { name: "إنشاء باقة" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("اسم الباقة")).toBeRequired();
    expect(screen.getByLabelText("بداية الفترة")).toBeInTheDocument();
    expect(screen.getByLabelText("نهاية الفترة")).toBeInTheDocument();
    expect(screen.getByLabelText("حالة الباقة")).toHaveValue("draft");
    expect(screen.getByLabelText("اسم الخدمة")).toBeRequired();
    expect(screen.getByLabelText("وحدة القياس")).toBeRequired();
    expect(screen.getByLabelText("الكمية المتفق عليها")).toHaveAttribute(
      "inputmode",
      "decimal",
    );
    expect(screen.getByLabelText("الكمية المتفق عليها")).toHaveAttribute(
      "type",
      "text",
    );
    expect(document.querySelector('input[name="clientId"]')).toHaveValue(
      "client_a",
    );
    expect(document.querySelector('input[name="contractId"]')).toHaveValue(
      "contract_a",
    );
    expect(document.querySelector('input[name="idempotencyKey"]')).toHaveValue(
      "f002b-package-client-a",
    );
    expect(
      screen.getByRole("button", { name: "حفظ الباقة" }),
    ).toBeInTheDocument();
  });

  it("renders package summaries with derived balances and no internal reasons", () => {
    render(<PackageList packages={[packageSummary]} />);

    const list = screen.getByRole("region", { name: "قائمة الباقات" });
    expect(within(list).getByText("باقة المحتوى الشهرية")).toBeInTheDocument();
    expect(within(list).getByText("منشورات")).toBeInTheDocument();
    const deliveredFact = within(list).getByText("المسلّم").closest("div");
    const remainingFact = within(list).getByText("المتبقي").closest("div");
    expect(deliveredFact).not.toBeNull();
    expect(remainingFact).not.toBeNull();
    expect(within(deliveredFact!).getByText("٠")).toBeInTheDocument();
    expect(within(remainingFact!).getByText("٣")).toBeInTheDocument();
    expect(within(list).getByText(/يوليو/)).toBeInTheDocument();
    expect(within(list).queryByText("internal")).not.toBeInTheDocument();
    expect(within(list).queryByText("reason")).not.toBeInTheDocument();
    expect(within(list).queryByText("Client B")).not.toBeInTheDocument();
  });

  it("warns about invalid count balances instead of presenting a negative remainder", () => {
    render(
      <PackageList
        packages={[
          {
            ...packageSummary,
            lines: [
              {
                ...packageSummary.lines[0],
                balance: {
                  ...packageSummary.lines[0].balance,
                  committed: 11.93,
                  consumed: 13,
                  available: -2.07,
                },
              },
            ],
          },
        ]}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("الرصيد يحتاج تصحيحًا");
    expect(screen.getAllByText("يحتاج تصحيحًا").length).toBeGreaterThan(0);
    expect(screen.queryByText("المتاح: -2.07")).not.toBeInTheDocument();
  });

  it("searches, filters, and paginates packages without a long unbounded list", () => {
    render(
      <PackageList
        packages={[
          packageSummary,
          {
            ...packageSummary,
            id: "package_completed",
            name: "باقة حملة مكتملة",
            status: "completed",
          },
        ]}
        pageSize={1}
      />,
    );

    expect(screen.getByText("صفحة 1 من 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "التالي" }));
    expect(screen.getByText("باقة حملة مكتملة")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("حالة الباقة"), {
      target: { value: "draft" },
    });
    expect(screen.getByText("باقة المحتوى الشهرية")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("بحث في الباقات والخدمات"), {
      target: { value: "لا نتيجة" },
    });
    expect(screen.getByText("لا توجد باقات مطابقة")).toBeInTheDocument();
  });

  it("offers an audited decimal correction path without a number spinner", () => {
    render(
      <PackageList
        adjustmentAction={vi.fn(async () => ({ status: "idle" as const }))}
        clientId="client_a"
        contractId="contract_a"
        packages={[packageSummary]}
      />,
    );

    expect(screen.getByText("تصحيح قيمة الباقة")).toBeInTheDocument();
    expect(screen.getByLabelText("فرق الكمية")).toHaveAttribute("type", "text");
    expect(screen.getByLabelText("فرق الكمية")).toHaveAttribute(
      "inputmode",
      "decimal",
    );
    expect(screen.getByLabelText("سبب التصحيح")).toBeRequired();
  });

  it("renders a compact balance summary for a package line", () => {
    render(
      <PackageBalanceSummary
        balance={{
          committed: 6,
          reserved: 2,
          consumed: 0,
          released: 1,
          adjustments: 1,
          available: 5,
        }}
      />,
    );

    expect(screen.getByText("المتفق عليه")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText("المتاح")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders the empty state without leaking other client names", () => {
    render(<PackageEmptyState />);

    expect(
      screen.getByText("لا توجد باقات لهذا العقد بعد"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Client B")).not.toBeInTheDocument();
  });

  it("renders a safe denied state", () => {
    render(<PackageDeniedState />);

    expect(
      screen.getByRole("heading", {
        name: "لا يمكنك الوصول إلى باقات هذا العقد.",
      }),
    ).toBeInTheDocument();
  });
});

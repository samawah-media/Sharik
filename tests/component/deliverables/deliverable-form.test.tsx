import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";
import type { PackageLineSafeSummary } from "@/modules/packages/package-repository";
import {
  ApprovedExtraNotice,
  DeliverableDeniedState,
  DeliverableEmptyState,
  DeliverableForm,
  DeliverableList,
  ReservationImpactPreview,
} from "@/ui/management/deliverable-form";

afterEach(() => cleanup());

const packageLineSummary: PackageLineSafeSummary = {
  id: "package_line_posts_a",
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
};

const deliverableSummary: DeliverableSafeSummary = {
  id: "deliverable_a",
  tenantId: "tenant_a",
  clientId: "client_a",
  contractId: "contract_a",
  packageId: "package_a",
  packageLineId: "package_line_posts_a",
  name: "منشور إطلاق الحملة",
  description: "مخرج متفق عليه ضمن الباقة.",
  type: "post",
  priority: "normal",
  ownerUserId: "assigned_internal_a",
  contributorUserIds: [],
  status: "not_started",
  progressPercentage: 0,
  requiresInternalApproval: true,
  requiresClientApproval: true,
  approvedExtra: false,
  createdAt: "2026-06-28T00:00:00.000Z",
  updatedAt: "2026-06-28T00:00:00.000Z",
  reservation: {
    packageLineId: "package_line_posts_a",
    reservedQuantity: 1,
  },
};

describe("deliverable creation form and reservation preview", () => {
  it("renders Arabic RTL in-package deliverable fields with scoped hidden values", () => {
    render(
      <DeliverableForm
        clientId="client_a"
        contractId="contract_a"
        packageId="package_a"
        packageLines={[packageLineSummary]}
        idempotencyKey="f002c-deliverable-client-a"
      />,
    );

    expect(
      screen.getByRole("form", { name: "إنشاء مخرج" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("اسم المخرج")).toBeRequired();
    expect(screen.getByLabelText("نوع المخرج")).toBeRequired();
    expect(screen.getByLabelText("الأولوية")).toHaveValue("normal");
    expect(screen.getByLabelText("سطر الباقة")).toHaveValue(
      "package_line_posts_a",
    );
    expect(screen.getByLabelText("الكمية المحجوزة")).toHaveAttribute("min", "1");
    expect(screen.getByLabelText("يتطلب تعميدًا داخليًا")).toBeChecked();
    expect(screen.getByLabelText("يتطلب اعتماد العميل")).toBeChecked();
    expect(document.querySelector('input[name="clientId"]')).toHaveValue(
      "client_a",
    );
    expect(document.querySelector('input[name="contractId"]')).toHaveValue(
      "contract_a",
    );
    expect(document.querySelector('input[name="packageId"]')).toHaveValue(
      "package_a",
    );
    expect(
      screen.getByRole("button", { name: "حفظ المخرج وحجز الكمية" }),
    ).toBeInTheDocument();
  });

  it("shows reservation impact and over-capacity recovery actions without internal details", () => {
    render(<ReservationImpactPreview packageLine={packageLineSummary} quantity={4} />);

    const preview = screen.getByRole("region", { name: "أثر الحجز" });
    expect(within(preview).getByText("المتاح قبل الحجز")).toBeInTheDocument();
    expect(within(preview).getByText("3")).toBeInTheDocument();
    expect(within(preview).getByText("المتاح بعد الحجز")).toBeInTheDocument();
    expect(
      within(preview).getByText("لا توجد سعة كافية لهذا السطر."),
    ).toBeInTheDocument();
    expect(within(preview).getByText("اختر سطر باقة آخر")).toBeInTheDocument();
    expect(within(preview).getByText("أنشئ مخرجًا إضافيًا معتمدًا")).toBeInTheDocument();
    expect(within(preview).queryByText("Client B")).not.toBeInTheDocument();
    expect(within(preview).queryByText("internal")).not.toBeInTheDocument();
  });

  it("renders approved extra notice with reason requirement and no reservation promise", () => {
    render(<ApprovedExtraNotice />);

    expect(
      screen.getByText("المخرج الإضافي لا يحجز من الباقة تلقائيًا."),
    ).toBeInTheDocument();
    expect(screen.getByText("سبب الاعتماد الإداري مطلوب.")).toBeInTheDocument();
  });

  it("renders deliverable list with safe summary fields only", () => {
    render(<DeliverableList deliverables={[deliverableSummary]} />);

    const list = screen.getByRole("region", { name: "قائمة المخرجات" });
    expect(within(list).getByText("منشور إطلاق الحملة")).toBeInTheDocument();
    expect(within(list).getByText("لم يبدأ")).toBeInTheDocument();
    expect(within(list).getByText("التقدم 0%")).toBeInTheDocument();
    expect(within(list).getByText("محجوز: 1")).toBeInTheDocument();
    expect(within(list).queryByText("approval log")).not.toBeInTheDocument();
    expect(within(list).queryByText("internal comment")).not.toBeInTheDocument();
  });

  it("renders safe empty and denied states", () => {
    const { rerender } = render(<DeliverableEmptyState />);

    expect(screen.getByText("لا توجد مخرجات لهذا العميل بعد")).toBeInTheDocument();
    expect(screen.queryByText("Client B")).not.toBeInTheDocument();

    rerender(<DeliverableDeniedState />);

    expect(
      screen.getByRole("heading", {
        name: "لا يمكنك الوصول إلى مخرجات هذا العميل.",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText("package_line_client_b")).not.toBeInTheDocument();
  });
});

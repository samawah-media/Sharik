import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";
import type { PackageLineSafeSummary } from "@/modules/packages/package-repository";
import type { MemberDisplay } from "@/modules/members/member-directory";
import {
  ApprovedExtraNotice,
  DeliverableDeniedState,
  DeliverableEmptyState,
  DeliverableForm,
  DeliverableList,
  findExactCreatedDeliverable,
  findCreatedCountUnitLine,
  NextCountUnitGuidance,
  ReservationImpactPreview,
  resolveCountUnitPreselection,
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

const eligibleMembers: MemberDisplay[] = [
  {
    userId: "00000000-0000-4000-8000-000000000001",
    displayName: "سارة علي",
    roleLabel: "مصممة",
    initial: "س",
  },
  {
    userId: "00000000-0000-4000-8000-000000000002",
    displayName: "أحمد محمد",
    roleLabel: "كاتب محتوى",
    initial: "أ",
  },
];

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
  clientDueDate: "2026-07-05",
  requiresInternalApproval: true,
  requiresClientApproval: true,
  approvedExtra: false,
  revision: 1,
  createdAt: "2026-06-28T00:00:00.000Z",
  updatedAt: "2026-06-28T00:00:00.000Z",
  reservation: {
    packageLineId: "package_line_posts_a",
    reservedQuantity: 1,
  },
};

describe("deliverable creation form and reservation preview", () => {
  it.each([
    { saved: "created", deliverableId: undefined, expectedId: undefined },
    { saved: "created", deliverableId: "wrong_id", expectedId: undefined },
    { saved: undefined, deliverableId: "deliverable_a", expectedId: undefined },
    { saved: "created", deliverableId: "deliverable_a", expectedId: "deliverable_a" },
  ])("resolves only an exact created deliverable", ({ saved, deliverableId, expectedId }) => {
    expect(
      findExactCreatedDeliverable({
        clientId: "client_a",
        saved,
        deliverableId,
        deliverables: [deliverableSummary],
      })?.id,
    ).toBe(expectedId);
  });

  it.each([
    { saved: "created", deliverableId: undefined, expected: undefined },
    { saved: "created", deliverableId: "wrong_id", expected: undefined },
    { saved: undefined, deliverableId: "deliverable_a", expected: undefined },
    { saved: "created", deliverableId: "deliverable_a", expected: packageLineSummary },
  ])("binds success guidance to the exact scoped deliverable ID", ({ saved, deliverableId, expected }) => {
    expect(
      findCreatedCountUnitLine({
        clientId: "client_a",
        saved,
        deliverableId,
        deliverables: [
          { ...deliverableSummary, id: "newer_deliverable" },
          deliverableSummary,
        ],
        packages: [
          {
            id: "package_a",
            clientId: "client_a",
            status: "active",
            lines: [packageLineSummary],
          },
        ],
      }),
    ).toEqual(expected);
  });

  it("preselects a scoped active count line and suggests the next independent unit name", () => {
    const preselection = resolveCountUnitPreselection({
      clientId: "client_a",
      packageId: "package_a",
      packageLines: [packageLineSummary],
      requestedPackageLineId: "package_line_posts_a",
    });

    render(
      <DeliverableForm
        clientId="client_a"
        contractId="contract_a"
        packageId="package_a"
        packageLines={[packageLineSummary]}
        initialPackageLineId={preselection?.packageLineId}
        suggestedName={preselection?.suggestedName}
        idempotencyKey="sil66-next-post"
      />,
    );

    expect(screen.getByLabelText("سطر الباقة")).toHaveValue(
      "package_line_posts_a",
    );
    expect(screen.getByLabelText("اسم العمل")).toHaveValue("منشور 2 من 4");
  });

  it.each([
    {
      label: "foreign client",
      line: { ...packageLineSummary, clientId: "client_b" },
    },
    {
      label: "foreign package",
      line: { ...packageLineSummary, packageId: "package_b" },
    },
    {
      label: "inactive line",
      line: { ...packageLineSummary, status: "archived" as const },
    },
  ])("ignores $label preselection", ({ line }) => {
    expect(
      resolveCountUnitPreselection({
        clientId: "client_a",
        packageId: "package_a",
        packageLines: [line],
        requestedPackageLineId: "package_line_posts_a",
      }),
    ).toBeUndefined();
  });

  it("explains a created count unit and offers the next unit only to authorized management", () => {
    render(
      <NextCountUnitGuidance
        canCreate
        clientId="client_a"
        packageLine={packageLineSummary}
      />,
    );

    const guidance = screen.getByRole("region", { name: "الوحدة العددية التالية" });
    expect(within(guidance).getByText(/تم إنشاء مخرج مستقل لوحدة واحدة/u)).toBeInTheDocument();
    expect(within(guidance).getByText("المتبقي: 3 منشور")).toBeInTheDocument();
    expect(
      within(guidance).getByRole("link", { name: "إضافة المخرج التالي" }),
    ).toHaveAttribute(
      "href",
      "/clients/client_a/deliverables/new?packageId=package_a&packageLine=package_line_posts_a",
    );
  });

  it("does not offer a next-unit action when capacity is exhausted or creation is unauthorized", () => {
    const { rerender } = render(
      <NextCountUnitGuidance
        canCreate
        clientId="client_a"
        packageLine={{
          ...packageLineSummary,
          balance: { ...packageLineSummary.balance, available: 0 },
        }}
      />,
    );

    expect(screen.getByText("المتبقي: 0 منشور")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "إضافة المخرج التالي" })).not.toBeInTheDocument();

    rerender(
      <NextCountUnitGuidance
        canCreate={false}
        clientId="client_a"
        packageLine={packageLineSummary}
      />,
    );

    expect(screen.getByText(/كل بطاقة تمثل وحدة مستقلة/u)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "إضافة المخرج التالي" })).not.toBeInTheDocument();
  });

  it("renders Arabic RTL in-package deliverable fields with scoped hidden values", () => {
    render(
      <DeliverableForm
        clientId="client_a"
        contractId="contract_a"
        packageId="package_a"
        packageLines={[packageLineSummary]}
        eligibleMembers={eligibleMembers}
        idempotencyKey="f002c-deliverable-client-a"
      />,
    );

    expect(
      screen.getByRole("form", { name: "إنشاء مخرج" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("اسم العمل")).toBeRequired();
    expect(screen.getByLabelText("نوع العمل")).toBeRequired();
    expect(screen.getByLabelText("الأولوية")).toHaveValue("normal");
    expect(screen.getByLabelText("سطر الباقة")).toHaveValue(
      "package_line_posts_a",
    );
    expect(screen.queryByLabelText("الكمية المحجوزة")).not.toBeInTheDocument();
    expect(document.querySelector('input[name="reservedQuantity"]')).toHaveValue(
      "1",
    );
    expect(
      screen.getByText("كل مخرج يحجز وحدة واحدة من «منشور». أنشئ مخرجًا مستقلًا لكل وحدة."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^يتطلب تعميدًا داخليًا/)).toBeChecked();
    expect(screen.getByLabelText(/^يتطلب اعتماد العميل/)).toBeChecked();
    expect(screen.getByLabelText("المسؤول")).toHaveTextContent("سارة علي");
    expect(
      screen.getByRole("checkbox", { name: /سارة علي/u }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: /أحمد محمد/u }),
    ).toBeInTheDocument();
    expect(screen.queryByText(eligibleMembers[0].userId)).not.toBeInTheDocument();
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

  it("displays a canonical package hint in Arabic while submitting its token", () => {
    render(
      <DeliverableForm
        clientId="client_a"
        packageId="package_a"
        packageLines={[packageLineSummary]}
        idempotencyKey="f002c-deliverable-client-a"
      />,
    );

    const typeInput = screen.getByLabelText("نوع العمل");
    const form = screen.getByRole("form", { name: "إنشاء مخرج" });
    expect(typeInput).toHaveValue("منشور");
    expect(
      new FormData(form as HTMLFormElement).get("type"),
    ).toBe("post");
  });

  it("preserves a user-entered custom type in the submitted value", () => {
    render(
      <DeliverableForm
        clientId="client_a"
        packageLines={[packageLineSummary]}
        idempotencyKey="f002c-deliverable-client-a"
      />,
    );

    const typeInput = screen.getByLabelText("نوع العمل");
    const form = screen.getByRole("form", { name: "إنشاء مخرج" });
    fireEvent.change(typeInput, { target: { value: "جلسة استشارة" } });

    expect(new FormData(form as HTMLFormElement).get("type")).toBe("جلسة استشارة");
  });

  it("shows reservation impact and over-capacity recovery actions without internal details", () => {
    render(
      <ReservationImpactPreview
        packageLine={packageLineSummary}
        quantity={4}
      />,
    );

    const preview = screen.getByRole("region", { name: "أثر الحجز" });
    expect(within(preview).getByText("المتاح قبل الحجز")).toBeInTheDocument();
    expect(within(preview).getByText("3")).toBeInTheDocument();
    expect(within(preview).getByText("المتاح بعد الحجز")).toBeInTheDocument();
    expect(
      within(preview).getByText("لا توجد سعة كافية لهذا السطر."),
    ).toBeInTheDocument();
    expect(within(preview).getByText("اختر سطر باقة آخر")).toBeInTheDocument();
    expect(
      within(preview).getByText("أنشئ مخرجًا إضافيًا معتمدًا"),
    ).toBeInTheDocument();
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
    expect(within(list).getAllByText("منشور إطلاق الحملة")).toHaveLength(1);
    expect(within(list).getAllByText("منشور").length).toBeGreaterThan(0);
    expect(within(list).getAllByText("٥ يوليو ٢٠٢٦").length).toBeGreaterThan(0);
    expect(within(list).getAllByText("لم يبدأ").length).toBeGreaterThan(0);
    expect(within(list).getByText("0%")).toBeInTheDocument();
    expect(
      within(list).getByText("مخرج متفق عليه ضمن الباقة."),
    ).toBeInTheDocument();
    expect(within(list).getByText("محجوز: 1")).toBeInTheDocument();
    expect(
      within(list).getByRole("button", { name: "فتح العمل" }),
    ).toBeInTheDocument();
    expect(within(list).queryByText("approval log")).not.toBeInTheDocument();
    expect(
      within(list).queryByText("internal comment"),
    ).not.toBeInTheDocument();
  });

  it("renders safe empty and denied states", () => {
    const { rerender } = render(<DeliverableEmptyState />);

    expect(
      screen.getByText("لا توجد مخرجات لهذا العميل بعد"),
    ).toBeInTheDocument();
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

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { ContractSafeSummary } from "@/modules/contracts/contract-repository";
import {
  ContractDeniedState,
  ContractEmptyState,
  ContractForm,
  ContractList,
} from "@/ui/management/contract-form";

const contractSummary: ContractSafeSummary = {
  id: "contract_a",
  tenantId: "tenant_a",
  clientId: "client_a",
  name: "عقد إدارة محتوى",
  reference: "CTR-A-2026",
  summary: "ملخص آمن للعقد.",
  periodStart: "2026-07-01",
  periodEnd: "2026-12-31",
  status: "draft",
  createdAt: "2026-06-28T00:00:00.000Z",
  updatedAt: "2026-06-28T00:00:00.000Z",
};

afterEach(() => cleanup());

describe("contract form and states", () => {
  it("renders Arabic RTL-ready create fields with scoped hidden values", () => {
    render(
      <ContractForm
        clientId="client_a"
        idempotencyKey="f002a-contract-client-a"
      />,
    );

    expect(screen.getByRole("form", { name: "إنشاء عقد" })).toBeInTheDocument();
    expect(screen.getByLabelText("اسم العقد")).toBeRequired();
    expect(screen.getByLabelText("مرجع العقد")).toBeInTheDocument();
    expect(screen.getByLabelText("ملخص العقد")).toBeInTheDocument();
    expect(screen.getByLabelText("بداية الفترة")).toBeInTheDocument();
    expect(screen.getByLabelText("نهاية الفترة")).toBeInTheDocument();
    expect(screen.getByLabelText("حالة العقد")).toHaveValue("draft");
    expect(document.querySelector('input[name="clientId"]')).toHaveValue(
      "client_a",
    );
    expect(document.querySelector('input[name="idempotencyKey"]')).toHaveValue(
      "f002a-contract-client-a",
    );
    expect(
      screen.getByRole("button", { name: "حفظ العقد" }),
    ).toBeInTheDocument();
  });

  it("renders scoped contract summaries without internal metadata", () => {
    render(<ContractList contracts={[contractSummary]} />);

    const list = screen.getByRole("region", { name: "قائمة العقود" });
    expect(within(list).getByText("عقد إدارة محتوى")).toBeInTheDocument();
    expect(within(list).getByText("CTR-A-2026")).toBeInTheDocument();
    expect(within(list).getAllByText("مسودة").length).toBeGreaterThan(0);
    expect(within(list).queryByText("createdBy")).not.toBeInTheDocument();
    expect(within(list).queryByText("Client B")).not.toBeInTheDocument();
  });

  it("searches, filters, paginates, and quarantines hosted UAT contracts", () => {
    render(
      <ContractList
        contracts={[
          contractSummary,
          {
            ...contractSummary,
            id: "contract_completed",
            name: "عقد حملة مكتمل",
            reference: "CTR-COMPLETE",
            status: "completed",
          },
          {
            ...contractSummary,
            id: "contract_hosted",
            name: "عقد اصطناعي مستضاف",
            reference: "S015-UAT-hidden",
          },
        ]}
        pageSize={1}
      />,
    );

    expect(screen.queryByText("عقد اصطناعي مستضاف")).not.toBeInTheDocument();
    expect(screen.getByText("صفحة 1 من 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "التالي" }));
    expect(screen.getByText("عقد حملة مكتمل")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("حالة العقد"), {
      target: { value: "draft" },
    });
    expect(screen.getByText("عقد إدارة محتوى")).toBeInTheDocument();
    expect(screen.queryByText("عقد حملة مكتمل")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("بحث في العقود"), {
      target: { value: "غير موجود" },
    });
    expect(screen.getByText("لا توجد عقود مطابقة")).toBeInTheDocument();
  });

  it("renders the empty state without leaking other client names", () => {
    render(<ContractEmptyState />);

    expect(
      screen.getByText("لا توجد عقود لهذا العميل بعد"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Client B")).not.toBeInTheDocument();
  });

  it("renders a safe denied state", () => {
    render(<ContractDeniedState />);

    expect(
      screen.getByRole("heading", {
        name: "لا يمكنك الوصول إلى عقود هذا العميل.",
      }),
    ).toBeInTheDocument();
  });
});

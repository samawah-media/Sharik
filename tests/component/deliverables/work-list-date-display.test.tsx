import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";
import { ClientWorkBoard } from "@/ui/client/client-work-board";
import { DeliverableForm, DeliverableList } from "@/ui/management/deliverable-form";

afterEach(() => cleanup());

// Same safe-summary shape used by the existing deliverable-form component tests.
const deliverable: DeliverableSafeSummary = {
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
  status: "waiting_client_approval",
  progressPercentage: 80,
  requiresInternalApproval: true,
  requiresClientApproval: true,
  approvedExtra: false,
  revision: 1,
  createdAt: "2026-06-28T00:00:00.000Z",
  updatedAt: "2026-06-28T00:00:00.000Z",
};

type DateCase = {
  name: string;
  dates: Partial<Pick<DeliverableSafeSummary,
    "clientDueDate" | "finalDueDate" | "plannedPublishDate" | "internalDueDate">>;
  expected: string;
};

const cases: DateCase[] = [
  { name: "date-only", dates: { clientDueDate: "2026-08-12" }, expected: "١٢ أغسطس ٢٠٢٦" },
  { name: "Riyadh next-day rollover", dates: { clientDueDate: "2026-08-12T22:30:00.000Z" }, expected: "١٣ أغسطس ٢٠٢٦" },
  { name: "missing", dates: {}, expected: "غير محدد" },
  { name: "invalid", dates: { clientDueDate: "not-a-date" }, expected: "تاريخ غير صالح" },
  { name: "client date wins", dates: { clientDueDate: "2026-08-12", finalDueDate: "2026-08-20", internalDueDate: "2026-08-01" }, expected: "١٢ أغسطس ٢٠٢٦" },
  { name: "final fallback wins over publication", dates: { finalDueDate: "2026-08-20", plannedPublishDate: "2026-08-25" }, expected: "٢٠ أغسطس ٢٠٢٦" },
  { name: "invalid primary does not fall through", dates: { clientDueDate: "invalid", finalDueDate: "2026-08-20" }, expected: "تاريخ غير صالح" },
  { name: "empty primary keeps nullish precedence", dates: { clientDueDate: "", finalDueDate: "2026-08-20" }, expected: "غير محدد" },
];

describe.each(["client", "management"] as const)("%s work-list dates", (surface) => {
  const renderDate = (dates: DateCase["dates"]) => {
    const work = Object.freeze({ ...deliverable, ...dates });
    render(surface === "client"
      ? <ClientWorkBoard canApprove={false} deliverables={[work]} />
      : <DeliverableList deliverables={[work]} />);
    // Scope the assertion to the changed visible definition, not a sibling
    // content card that already uses the shared formatter.
    return screen.getByText(surface === "client" ? "الموعد" : "التاريخ", { selector: "dt" })
      .parentElement!.querySelector("dd")!;
  };

  it.each(cases)("renders $name without changing source dates", ({ dates, expected }) => {
    expect(renderDate(dates)).toHaveTextContent(expected);
  });

  it("preserves the surface-specific publication fallback", () => {
    expect(renderDate({ plannedPublishDate: "2026-08-25" })).toHaveTextContent(
      surface === "management" ? "٢٥ أغسطس ٢٠٢٦" : "غير محدد",
    );
  });
});

it("keeps management date inputs serialized as ISO dates", () => {
  render(<DeliverableForm clientId="client_a" idempotencyKey="date-display-test" />);
  const form = screen.getByRole("form", { name: "إنشاء مخرج" }) as HTMLFormElement;
  for (const name of ["clientDueDate", "startDate", "internalDueDate", "finalDueDate"]) {
    const input = form.querySelector(`input[name="${name}"]`)!;
    expect(input).toHaveAttribute("type", "date");
    fireEvent.change(input, { target: { value: "2026-08-12" } });
    expect(new FormData(form).get(name)).toBe("2026-08-12");
  }
});

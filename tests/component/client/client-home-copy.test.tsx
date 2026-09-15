import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ClientHome } from "@/ui/client/client-home";

afterEach(cleanup);

describe("SIL-63 role-safe client home copy", () => {
  it.each([
    [0, "لا توجد أعمال قيد المراجعة"],
    [2, "2 أعمال قيد المراجعة"],
  ])("viewer with %i pending works is not prompted for a decision", (pendingCount, cta) => {
    render(<ClientHome canApprove={false} pendingCount={pendingCount} />);

    expect(screen.getByRole("main")).not.toHaveTextContent("قرارك");
    expect(screen.getByRole("link", { name: `قيد المراجعة — ${cta}` }))
      .toHaveAttribute("href", "/client/pending");
    expect(screen.getByRole("link", { name: "عرض ما هو قيد المراجعة" }))
      .toHaveAttribute("href", "/client/pending");
    expect(screen.getByRole("link", { name: "أعمالي — عرض كل الأعمال" }))
      .toHaveTextContent("تابع الأعمال قيد المراجعة والتعديل، والأعمال المسلّمة.");
    expect(screen.getByRole("link", { name: "أعمالي — عرض كل الأعمال" }))
      .toHaveAttribute("href", "/client/work");
    expect(screen.getByText("تابع الأعمال قيد المراجعة. هذا الحساب للاطلاع فقط."))
      .toBeVisible();
  });

  it.each([
    [0, "لا يوجد ما ينتظر قرارك الآن"],
    [2, "2 بانتظار قرارك"],
  ])("approver with %i pending works retains decision copy and routes", (pendingCount, cta) => {
    render(<ClientHome canApprove pendingCount={pendingCount} />);

    expect(screen.getByRole("link", { name: `بانتظار موافقتي — ${cta}` }))
      .toHaveAttribute("href", "/client/pending");
    expect(screen.getByRole("link", { name: "مراجعة ما ينتظرني" }))
      .toHaveAttribute("href", "/client/pending");
    expect(screen.getByRole("link", { name: "أعمالي — عرض كل الأعمال" }))
      .toHaveTextContent("كل أعمالك: ما ينتظر قرارك، وما قيد التعديل، وما تم تسليمه.");
    expect(screen.getByRole("link", { name: "أعمالي — عرض كل الأعمال" }))
      .toHaveAttribute("href", "/client/work");
    expect(screen.getByText("راجع الأعمال التي أرسلها فريق سماوة واعتمدها أو اطلب تعديلًا."))
      .toBeVisible();
  });
});

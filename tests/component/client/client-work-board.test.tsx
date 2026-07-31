import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ClientWorkBoard } from "@/ui/client/client-work-board";
import type { ClientCommercialSummary } from "@/modules/commercial/commercial-summary";

afterEach(() => cleanup());

type WorkDeliverable = ClientCommercialSummary["deliverables"][number];

let counter = 0;
const makeDeliverable = (
  status: WorkDeliverable["status"],
  name: string,
  overrides: Partial<WorkDeliverable> = {},
): WorkDeliverable => {
  counter += 1;
  return {
    id: `work_deliverable_${counter}`,
    name,
    type: "post",
    status,
    progressPercentage:
      status === "delivered" ? 100 : status === "client_approved" ? 90 : 80,
    clientDueDate: "2026-08-12",
    ...overrides,
  };
};

describe("client work board", () => {
  it("groups work into the five client sections and renders clickable cards", () => {
    render(
      <ClientWorkBoard
        canApprove
        deliverables={[
          makeDeliverable("waiting_client_approval", "منشور الأسبوع", {
            id: "del_waiting",
          }),
          makeDeliverable("client_changes_requested", "ريلز الإطلاق", {
            id: "del_changes",
          }),
          makeDeliverable("client_approved", "تصميم الهوية", {
            id: "del_approved",
          }),
          makeDeliverable("ready_for_delivery", "تقرير الشهر", {
            id: "del_ready",
          }),
          makeDeliverable("delivered", "حملة رمضان", { id: "del_delivered" }),
        ]}
      />,
    );

    expect(
      screen.getByRole("region", { name: "بانتظار قرارك" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "تم اعتماد العمل" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "جارٍ تجهيز التسليم" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "تم التسليم" }),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId("client-work-card")).toHaveLength(5);
  });

  it("opens the specific deliverable detail from each card", () => {
    render(
      <ClientWorkBoard
        canApprove
        deliverables={[
          makeDeliverable("waiting_client_approval", "منشور الأسبوع", {
            id: "del_waiting",
          }),
          makeDeliverable("delivered", "حملة رمضان", { id: "del_delivered" }),
        ]}
      />,
    );

    const waitingCard = screen
      .getAllByTestId("client-work-card")
      .find((card) =>
        card.getAttribute("data-deliverable-id") === "del_waiting",
      )!;
    expect(waitingCard).toHaveAttribute("data-deliverable-id", "del_waiting");
    const waitingLink = screen.getByRole("link", {
      name: "فتح العمل: منشور الأسبوع",
    });
    expect(waitingLink).toHaveAttribute("href", "/client/work/del_waiting");
    const deliveredLink = screen.getByRole("link", {
      name: "فتح العمل: حملة رمضان",
    });
    expect(deliveredLink).toHaveAttribute("href", "/client/work/del_delivered");
  });

  it("keeps duplicate deliverable names distinct with stable keys and correct links", () => {
    render(
      <ClientWorkBoard
        canApprove
        deliverables={[
          makeDeliverable("waiting_client_approval", "منشور مكرر", {
            id: "dup_a",
          }),
          makeDeliverable("waiting_client_approval", "منشور مكرر", {
            id: "dup_b",
          }),
        ]}
      />,
    );

    const cards = screen.getAllByTestId("client-work-card");
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveAttribute("data-deliverable-id", "dup_a");
    expect(cards[1]).toHaveAttribute("data-deliverable-id", "dup_b");
    const links = screen.getAllByRole("link", { name: "فتح العمل: منشور مكرر" });
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/client/work/dup_a");
    expect(links[1]).toHaveAttribute("href", "/client/work/dup_b");
  });

  it("keeps a change-requested work visible with the Samawah team message", () => {
    render(
      <ClientWorkBoard
        canApprove
        deliverables={[
          makeDeliverable("client_changes_requested", "ريلز الإطلاق"),
        ]}
      />,
    );

    expect(
      screen.getAllByText("قيد التعديل لدى فريق سماوة").length,
    ).toBeGreaterThan(0);
    expect(screen.getByTestId("client-change-request-note")).toHaveTextContent(
      "استلم فريق سماوة ملاحظاتك",
    );
    expect(
      screen.queryByRole("button", { name: "اعتماد المخرج" }),
    ).not.toBeInTheDocument();
  });

  it("shows the change-request note only on the editing section, not elsewhere", () => {
    render(
      <ClientWorkBoard
        canApprove
        deliverables={[
          makeDeliverable("waiting_client_approval", "منشور الأسبوع"),
          makeDeliverable("client_changes_requested", "ريلز الإطلاق"),
        ]}
      />,
    );

    expect(
      screen.getAllByTestId("client-change-request-note"),
    ).toHaveLength(1);
  });

  it("renders a useful empty state when there is no visible work", () => {
    render(<ClientWorkBoard canApprove deliverables={[]} />);
    expect(
      screen.getByRole("heading", { name: "لا توجد أعمال ظاهرة بعد" }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("client-work-card")).not.toBeInTheDocument();
  });

  it("never surfaces raw enums, UUIDs, or internal terms on the cards", () => {
    render(
      <ClientWorkBoard
        canApprove
        deliverables={[
          makeDeliverable("client_changes_requested", "ريلز الإطلاق", {
            id: "00000000-0000-4000-8000-000000000001",
          }),
        ]}
      />,
    );
    const board = screen.getByTestId("client-work-board");
    expect(board).not.toHaveTextContent("client_changes_requested");
    expect(board).not.toHaveTextContent("waiting_client_approval");
    expect(board).not.toHaveTextContent("internal_only");
    expect(board).not.toHaveTextContent("التعميد الداخلي");
    expect(board).not.toHaveTextContent("00000000");
    const card = screen.getByTestId("client-work-card");
    expect(card).toHaveAttribute(
      "data-deliverable-id",
      "00000000-0000-4000-8000-000000000001",
    );
    expect(card).not.toHaveTextContent("00000000");
  });

  it("uses viewer copy for a decision-pending work and never asks the viewer to approve", () => {
    render(
      <ClientWorkBoard
        canApprove={false}
        deliverables={[makeDeliverable("waiting_client_approval", "منشور")]}
      />,
    );
    expect(
      screen.getByRole("region", { name: "قيد المراجعة" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("بانتظار قرارك")).not.toBeInTheDocument();
    expect(
      screen.getByText(/والقرار لدى المسؤول عن الاعتماد/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/راجع النسخة ثم اعتمدها/),
    ).not.toBeInTheDocument();
  });

  it("shows the approver decision instruction for a decision-pending work", () => {
    render(
      <ClientWorkBoard
        canApprove
        deliverables={[makeDeliverable("waiting_client_approval", "منشور")]}
      />,
    );
    expect(
      screen.getByText(/راجع النسخة ثم اعتمدها أو اطلب تعديلًا/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/والقرار لدى المسؤول عن الاعتماد/),
    ).not.toBeInTheDocument();
  });
});

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  HadnaMvpHero,
  MvpSnapshotCards,
  buildMvpStatsFromDeliverables,
} from "@/ui/mvp/hadna-mvp-summary";

afterEach(() => cleanup());

describe("Hadna MVP summary", () => {
  it("renders clear Hadna UAT snapshot cards", () => {
    render(
      <MvpSnapshotCards
        stats={{
          deliverablesCount: 52,
          packageLineCount: 5,
          waitingWorkCount: 35,
          waitingClientCount: 5,
          completedCount: 12,
        }}
      />,
    );

    const region = screen.getByRole("region", { name: "ملخص تجربة هدنة" });
    expect(within(region).getByText("عدد المخرجات")).toBeInTheDocument();
    expect(within(region).getByText("52")).toBeInTheDocument();
    expect(within(region).getByText("الباقة")).toBeInTheDocument();
    expect(within(region).getByText("5 بنود")).toBeInTheDocument();
    expect(within(region).getByText("ما ينتظر العميل")).toBeInTheDocument();
  });

  it("renders Hadna as the first-class MVP signal", () => {
    render(
      <HadnaMvpHero
        clientName="هدنة"
        roleLabel="الإدارة / مدير المشروع"
        stats={{
          deliverablesCount: 52,
          packageLineCount: 5,
          waitingWorkCount: 35,
          waitingClientCount: 5,
          completedCount: 12,
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "تجربة هدنة" })).toBeVisible();
    expect(screen.getByText("العميل: هدنة")).toBeInTheDocument();
    expect(screen.getByText("تجربة داخلية")).toBeInTheDocument();
    expect(screen.queryByText("UUID")).not.toBeInTheDocument();
    expect(screen.queryByText("Commercial")).not.toBeInTheDocument();
  });

  it("summarizes work and client waiting states from deliverables", () => {
    const stats = buildMvpStatsFromDeliverables(
      [
        { status: "not_started" },
        { status: "in_progress" },
        { status: "waiting_client_approval" },
        { status: "delivered" },
      ],
      5,
    );

    expect(stats).toEqual({
      deliverablesCount: 4,
      packageLineCount: 5,
      waitingWorkCount: 2,
      waitingClientCount: 1,
      completedCount: 1,
    });
  });
});

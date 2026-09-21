import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ClientDeliverableDetail,
  type ClientSafeDeliverableDetail,
} from "@/ui/client/client-deliverable-detail";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

afterEach(cleanup);

const makeDetail = (dueDateLabel?: string): ClientSafeDeliverableDetail => ({
  approvalItem: {
    clientId: "client_a",
    deliverableId: "deliverable_a",
    versionId: "version_a",
    expectedRevision: 1,
    isActionable: true,
    displayName: "منشور الأسبوع",
    typeLabel: "منشور",
    status: "waiting_client_approval",
    statusLabel: "بانتظار موافقتك",
    versionLabel: "النسخة 1",
    dueDateLabel,
  },
  status: "waiting_client_approval",
  statusLabel: "بانتظار موافقتك",
  progressPercentage: 80,
  content: { caption: "نص المنشور للمراجعة" },
  files: [],
  comments: [],
});

describe("X010-B-7C-10 client deliverable dates", () => {
  it.each([
    ["2026-07-03", "٣ يوليو ٢٠٢٦"],
    ["2026-07-03T20:59:59Z", "٣ يوليو ٢٠٢٦"],
    ["2026-07-03T21:00:00Z", "٤ يوليو ٢٠٢٦"],
    ["", "غير محدد"],
    ["not-a-date", "تاريخ غير صالح"],
  ])(
    "shows comment date %s with Gregorian/Riyadh display and keeps the source",
    (createdAt, expected) => {
      const detail = makeDetail();
      detail.comments = [
        {
          id: "comment_a",
          body: "ملاحظة العميل",
          authorName: "صاحب التعليق",
          createdAt,
        },
      ];
      const original = structuredClone(detail);

      render(<ClientDeliverableDetail canApprove={false} detail={detail} />);

      const comments = within(
        screen.getByRole("region", { name: "تعليقات العميل" }),
      );
      expect(
        comments.getByText(`صاحب التعليق · ${expected}`),
      ).toBeInTheDocument();
      expect(detail).toEqual(original);
    },
  );

  it.each([
    ["2026-07-03", "٣ يوليو ٢٠٢٦"],
    ["2026-07-03T21:00:00Z", "٤ يوليو ٢٠٢٦"],
    ["2026-13-03", "تاريخ غير صالح"],
    ["2026-07-03Tinvalid", "تاريخ غير صالح"],
    [undefined, "غير محدد"],
    ["", "غير محدد"],
    ["   ", "غير محدد"],
    ["غدًا", "غدًا"],
    ["٣ يوليو ٢٠٢٦", "٣ يوليو ٢٠٢٦"],
    ["2026-07-03 بعد موافقة العميل", "2026-07-03 بعد موافقة العميل"],
  ])(
    "localizes raw due date %s without reparsing human labels",
    (dueDateLabel, expected) => {
      const detail = makeDetail(dueDateLabel);
      const original = structuredClone(detail);

      render(<ClientDeliverableDetail canApprove={false} detail={detail} />);

      expect(
        screen.getByText(expected, { selector: "dd" }),
      ).toBeInTheDocument();
      expect(detail).toEqual(original);
      expect(
        screen.queryByRole("button", { name: "اعتماد النسخة" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "إضافة التعليق" }),
      ).not.toBeInTheDocument();
    },
  );
});

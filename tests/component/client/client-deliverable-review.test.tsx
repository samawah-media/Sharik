import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ClientDeliverableDetail } from "@/ui/client/client-deliverable-detail";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

afterEach(cleanup);

describe("client deliverable review presentation", () => {
  it.each(["caption", "body"] as const)(
    "shows the full %s before the decision while retaining supporting content",
    (textSource) => {
      const title = "عنوان طويل يحتاج العميل إلى مراجعته بالكامل ".repeat(15);
      const reviewText = "تفاصيل النسخة المعروضة لاتخاذ القرار\n".repeat(30);
      render(
        <ClientDeliverableDetail
          canApprove
          approveAction={async () => undefined}
          requestChangesAction={async () => undefined}
          detail={{
            approvalItem: {
              clientId: "client_a",
              deliverableId: "deliverable_a",
              versionId: "version_exact",
              expectedRevision: 7,
              isActionable: true,
              displayName: title,
              typeLabel: "منشور",
              status: "waiting_client_approval",
              statusLabel: "بانتظار موافقتك",
              versionLabel: "نسخة المراجعة النهائية",
              dueDateLabel: "2026-07-03",
            },
            statusLabel: "بانتظار موافقتك",
            progressPercentage: 80,
            content: {
              [textSource]: reviewText,
              objective: "تعريف الخدمة",
              kpi: "زيارات الموقع",
            },
            files: [],
            comments: [{
              id: "comment_a",
              body: "ملاحظة ظاهرة للعميل",
              authorName: "العميل",
              createdAt: "2026-07-03",
            }],
          }}
        />,
      );
      const titleElement = screen.getByText(title.trim());
      const caption = screen.getByText(reviewText.trim().replace(/\s+/g, " "));
      expect(titleElement).not.toHaveClass("line-clamp-2");
      expect(caption).not.toHaveClass("line-clamp-3");
      expect(caption.textContent).toBe(reviewText);
      const decision = screen.getByRole("region", { name: "قرار اعتماد العميل" });
      expect(
        caption.compareDocumentPosition(decision) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      expect(within(decision).getByText("نسخة المراجعة النهائية")).toBeVisible();
      expect(
        within(decision).getByRole("button", { name: "اعتماد النسخة" }),
      ).toBeVisible();
      expect(screen.getByText("تعريف الخدمة")).toBeVisible();
      expect(screen.getByText("زيارات الموقع")).toBeVisible();
      expect(screen.getByRole("region", { name: "ملفات العميل" })).toBeVisible();
      expect(screen.getByText("ملاحظة ظاهرة للعميل")).toBeVisible();
      expect(screen.getByText("80%")).toBeVisible();
      expect(screen.getByText("٣ يوليو ٢٠٢٦")).toBeVisible();
    },
  );
});

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  ClientApprovalPanel,
  type ClientApprovalPanelItem,
} from "@/ui/client/client-approval-panel";

afterEach(cleanup);

describe("D08 client approval panel date labels", () => {
  it.each<[string | undefined, string]>([
    ["2026-07-03", "٣ يوليو ٢٠٢٦"],
    ["2026-07-03T20:59:59Z", "٣ يوليو ٢٠٢٦"],
    ["2026-07-03T21:00:00Z", "٤ يوليو ٢٠٢٦"],
    [undefined, "غير محدد"],
    ["", "غير محدد"],
    ["   ", "غير محدد"],
    ["2026-13-03", "تاريخ غير صالح"],
    ["2026-07-03Tinvalid", "تاريخ غير صالح"],
    ["غدًا", "غدًا"],
    ["٣ يوليو ٢٠٢٦", "٣ يوليو ٢٠٢٦"],
    ["2026-07-03 بعد موافقة العميل", "2026-07-03 بعد موافقة العميل"],
  ])(
    "displays %s using Gregorian/Riyadh while preserving human labels and source values",
    (dueDateLabel, expected) => {
      const item: ClientApprovalPanelItem = {
        clientId: "client_a",
        deliverableId: "deliverable_a",
        versionId: "version_a",
        expectedRevision: 3,
        displayName: "مخرج تجريبي",
        typeLabel: "منشور",
        status: "waiting_client_approval",
        statusLabel: "بانتظار موافقتك",
        versionLabel: "النسخة المعتمدة للعميل",
        dueDateLabel,
      };
      const original = structuredClone(item);

      render(<ClientApprovalPanel canApprove={false} item={item} />);

      expect(screen.getByText(expected, { selector: "dd" })).toBeVisible();
      expect(item).toEqual(original);
    },
  );
});

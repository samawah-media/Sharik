import { describe, expect, it } from "vitest";
import {
  clientDeliverableStatusLabels,
  clientNextAction,
  clientStatusLabel,
  clientVisibleStatusLabel,
  clientWorkSectionHeading,
  clientWorkSectionIds,
} from "@/modules/deliverables/client-labels";

const clientRawEnums = [
  "waiting_client_approval",
  "client_changes_requested",
  "client_approved",
  "ready_for_delivery",
  "delivered",
];

describe("client status labels", () => {
  it("maps every client-visible status to natural Arabic the owner approved", () => {
    expect(clientStatusLabel("waiting_client_approval")).toBe("بانتظار قرارك");
    expect(clientStatusLabel("client_changes_requested")).toBe(
      "قيد التعديل لدى فريق سماوة",
    );
    expect(clientStatusLabel("client_approved")).toBe("تم اعتماد العمل");
    expect(clientStatusLabel("ready_for_delivery")).toBe("جارٍ تجهيز التسليم");
    expect(clientStatusLabel("delivered")).toBe("تم التسليم");
    expect(clientStatusLabel("in_progress")).toBe("قيد العمل");
  });

  it("never leaks a raw technical enum token for client-visible statuses", () => {
    for (const status of clientRawEnums) {
      const label = clientStatusLabel(status);
      expect(label, `${status} leaked raw enum`).not.toBe(status);
      expect(clientRawEnums, `${status} leaked raw enum`).not.toContain(label);
    }
  });

  it("uses a safe Arabic fallback for unknown statuses instead of the raw value", () => {
    expect(clientStatusLabel("future_client_state")).toBe("قيد المتابعة");
    expect(clientStatusLabel("")).toBe("قيد المتابعة");
  });

  it("shows viewer-oriented copy that never asks the viewer to decide", () => {
    expect(clientVisibleStatusLabel("waiting_client_approval", false)).toBe(
      "قيد المراجعة",
    );
  });

  it("shows the decision-oriented copy for approvers on a decision-pending work", () => {
    expect(clientVisibleStatusLabel("waiting_client_approval", true)).toBe(
      "بانتظار قرارك",
    );
    expect(clientVisibleStatusLabel("delivered", false)).toBe("تم التسليم");
    expect(clientVisibleStatusLabel("delivered", true)).toBe("تم التسليم");
  });

  it("describes the next action per status and role", () => {
    expect(clientNextAction("client_changes_requested")).toContain(
      "استلم فريق سماوة ملاحظاتك",
    );
    expect(clientNextAction("delivered")).toBe("تم تسليم العمل");
    expect(clientNextAction("unknown_state")).toBe("تابع حالة العمل");
    expect(
      clientNextAction("waiting_client_approval", true),
    ).toContain("اعتمدها أو اطلب تعديلًا");
    expect(
      clientNextAction("waiting_client_approval", false),
    ).toContain("والقرار لدى المسؤول عن الاعتماد");
  });

  it("keeps the work sections ordered from decision to delivery with role-aware headings", () => {
    expect([...clientWorkSectionIds]).toEqual([
      "waiting_client_approval",
      "client_changes_requested",
      "client_approved",
      "ready_for_delivery",
      "delivered",
    ]);
    for (const id of clientWorkSectionIds) {
      expect(clientDeliverableStatusLabels[id]).toBeDefined();
    }
    expect(clientWorkSectionHeading("waiting_client_approval", true)).toBe(
      "بانتظار قرارك",
    );
    expect(clientWorkSectionHeading("waiting_client_approval", false)).toBe(
      "قيد المراجعة",
    );
  });
});

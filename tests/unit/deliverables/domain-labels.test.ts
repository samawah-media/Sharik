import { describe, expect, it } from "vitest";
import {
  approvalDecisionLabel,
  deliverableStatusLabel,
  deliverableTypeLabel,
  fileVisibilityLabel,
  priorityLabel,
  qualityCheckStatusLabel,
  taskStatusLabel,
  versionStatusLabel,
} from "@/modules/deliverables/domain-labels";

const rawEnums = [
  "internally_approved",
  "social_content",
  "normal",
  "approved",
  "ready_for_internal_review",
  "client_changes_requested",
  "todo",
  "in_progress",
  "passed",
  "changes_required",
];

describe("domain labels", () => {
  it("returns natural Arabic for every known deliverable status", () => {
    expect(deliverableStatusLabel("internally_approved")).toBe("معتمد داخليًا");
    expect(deliverableStatusLabel("waiting_client_approval")).toBe(
      "بانتظار اعتماد العميل",
    );
    expect(deliverableStatusLabel("delivered")).toBe("تم التسليم");
  });

  it("returns natural Arabic for every known deliverable type and a custom fallback", () => {
    expect(deliverableTypeLabel("post")).toBe("منشور");
    expect(deliverableTypeLabel("social_content")).toBe("مخرج مخصص");
    expect(deliverableTypeLabel("reel")).toBe("ريلز");
  });

  it("returns natural Arabic for priorities including the normal default", () => {
    expect(priorityLabel("normal")).toBe("عادية");
    expect(priorityLabel("urgent")).toBe("عاجلة");
  });

  it("returns natural Arabic for task, version, quality, approval, and visibility values", () => {
    expect(taskStatusLabel("in_progress")).toBe("قيد التنفيذ");
    expect(versionStatusLabel("internally_approved")).toBe("معتمدة داخليًا");
    expect(qualityCheckStatusLabel("changes_required")).toBe("تطلب تعديلًا");
    expect(approvalDecisionLabel("approved")).toBe("مقبول");
    expect(fileVisibilityLabel("internal_only")).toBe("ملف داخلي");
  });

  it("never surfaces a raw technical enum token for known keys", () => {
    const known = [
      ["deliverableStatusLabel", deliverableStatusLabel("internally_approved")] as const,
      ["deliverableTypeLabel", deliverableTypeLabel("post")] as const,
      ["priorityLabel", priorityLabel("normal")] as const,
      ["taskStatusLabel", taskStatusLabel("todo")] as const,
      ["taskStatusLabel2", taskStatusLabel("in_progress")] as const,
      ["qualityCheckStatusLabel", qualityCheckStatusLabel("passed")] as const,
      ["qualityCheckStatusLabel2", qualityCheckStatusLabel("changes_required")] as const,
      ["approvalDecisionLabel", approvalDecisionLabel("approved")] as const,
    ];
    for (const [name, value] of known) {
      expect(rawEnums, `${name} returned raw enum`).not.toContain(value);
    }
  });
});

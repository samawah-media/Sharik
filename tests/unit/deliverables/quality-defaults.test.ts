import { describe, expect, it } from "vitest";
import {
  createDefaultQualityChecklist,
  defaultQualityChecklistLabels,
} from "@/modules/deliverables/quality-defaults";

describe("default internal quality checklist", () => {
  it("provides editable Arabic defaults without auto-saved ids", () => {
    expect(defaultQualityChecklistLabels).toEqual([
      "سلامة اللغة والإملاء.",
      "مطابقة هوية العميل.",
      "صحة المقاسات أو الصيغة.",
      "مطابقة متطلبات العمل.",
      "مراجعة النص والرابط وCTA إن وجدت.",
      "جاهزية الملف النهائي.",
    ]);

    expect(createDefaultQualityChecklist()).toEqual(
      defaultQualityChecklistLabels.map((label, index) => ({
        label,
        note: "",
        sortOrder: index,
        status: "pending",
      })),
    );
  });
});

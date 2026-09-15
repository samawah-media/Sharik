import { describe, expect, it } from "vitest";
import {
  firstMeaningfulReviewText,
  hasClientReviewPayload,
  isMeaningfulReviewText,
} from "@/modules/approvals/client-review-readiness";

describe("client review readiness", () => {
  it.each([{ caption: "approval caption" }, { body: "report body" }])(
    "accepts meaningful review text: %o",
    (payload) => {
      expect(hasClientReviewPayload(payload)).toBe(true);
    },
  );

  it("accepts a non-empty client-visible file", () => {
    expect(
      hasClientReviewPayload({
        files: [{ fileSize: 128, visibility: "client_visible" }],
      }),
    ).toBe(true);
  });

  it("rejects whitespace, empty files, and internal-only files", () => {
    expect(
      hasClientReviewPayload({
        caption: "   ",
        body: "",
        files: [
          { fileSize: 0, visibility: "client_visible" },
          { fileSize: 128, visibility: "internal_only" },
        ],
      }),
    ).toBe(false);
  });

  it.each(["-", "—", "...", "N/A", "TBD", "لا يوجد", "غير متوفر"])(
    "rejects placeholder-only review text: %s",
    (value) => {
      expect(isMeaningfulReviewText(value)).toBe(false);
      expect(hasClientReviewPayload({ caption: value })).toBe(false);
    },
  );

  it.each(["قريبًا", "مراجعة النسخة النهائية", "Campaign caption 2"])(
    "accepts human-readable review text: %s",
    (value) => {
      expect(isMeaningfulReviewText(value)).toBe(true);
    },
  );

  it("selects a meaningful body when caption is only a placeholder", () => {
    expect(firstMeaningfulReviewText("-", "النص الحقيقي للنسخة")).toBe(
      "النص الحقيقي للنسخة",
    );
  });
});

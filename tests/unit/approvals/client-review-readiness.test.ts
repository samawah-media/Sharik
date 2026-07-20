import { describe, expect, it } from "vitest";
import { hasClientReviewPayload } from "@/modules/approvals/client-review-readiness";

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
});

import { describe, expect, it } from "vitest";
import {
  inspectEvidenceSummary,
  redactEvidenceSummary,
} from "@/modules/release/evidence-redaction";

describe("R-007 evidence redaction", () => {
  it("accepts safe evidence summaries", () => {
    expect(
      inspectEvidenceSummary(
        "PASS: management role category loaded 3 safe cards with no hosted mutation.",
      ),
    ).toEqual({ safe: true, violations: [] });
  });

  it("flags prohibited evidence categories without needing real sensitive values", () => {
    const syntheticEmail = ["owner", "example.test"].join("@");
    const syntheticUrl = "https://" + "example.test/path";
    const syntheticToken = "token_" + "x".repeat(32);
    const result = inspectEvidenceSummary(
      [
        `email=${syntheticEmail}`,
        `link=${syntheticUrl}`,
        `secret=${syntheticToken}`,
        "screenshot file was attached",
        "workbook row content was copied",
        "caption text was printed",
      ].join(" "),
    );

    expect(result.safe).toBe(false);
    expect(result.violations.map((violation) => violation.category)).toEqual([
      "email",
      "link",
      "secret_or_token",
      "screenshot",
      "workbook_content",
      "caption_or_deliverable_title",
    ]);
  });

  it("redacts prohibited values while preserving safe summary context", () => {
    const syntheticEmail = ["client", "example.test"].join("@");
    const syntheticUrl = "https://" + "example.test/evidence";
    const redacted = redactEvidenceSummary(
      `PASS for ${syntheticEmail} at ${syntheticUrl}`,
    );

    expect(redacted).toBe(
      "PASS for [REDACTED_EMAIL] at [REDACTED_LINK]",
    );
  });
});


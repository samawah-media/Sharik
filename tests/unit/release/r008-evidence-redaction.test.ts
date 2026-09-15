import { describe, expect, it } from "vitest";
import {
  R008_PROHIBITED_EVIDENCE_LABELS,
  buildR008EvidencePolicy,
  reviewR008EvidenceSummary,
} from "@/modules/release/r008-evidence-policy";

describe("R-008 evidence redaction policy", () => {
  it("accepts safe local evidence summaries", () => {
    const review = reviewR008EvidenceSummary(
      "PASS: client approver category approved 1 current visible version; hosted mutation stayed blocked.",
    );

    expect(review.safe).toBe(true);
    expect(review.violations).toEqual([]);
    expect(review.redactedSummary).toBeUndefined();
  });

  it("flags prohibited evidence categories using synthetic values only", () => {
    const syntheticEmail = ["reviewer", "example.test"].join("@");
    const syntheticUrl = "https://" + "example.test/evidence";
    const syntheticSecret = "token_" + "x".repeat(32);
    const review = reviewR008EvidenceSummary(
      [
        `email=${syntheticEmail}`,
        `link=${syntheticUrl}`,
        `secret=${syntheticSecret}`,
        "screenshot attached",
        "workbook row content copied",
        "caption text printed",
      ].join(" "),
    );

    expect(review.safe).toBe(false);
    expect(review.violations.map((violation) => violation.category)).toEqual([
      "email",
      "link",
      "secret_or_token",
      "screenshot",
      "workbook_content",
      "caption_or_deliverable_title",
    ]);
    expect(review.redactedSummary).toContain("[REDACTED_EMAIL]");
    expect(review.redactedSummary).toContain("[REDACTED_LINK]");
    expect(review.redactedSummary).toContain("[REDACTED_SECRET_OR_TOKEN]");
  });

  it("documents allowed evidence forms and prohibited labels for reviewers", () => {
    const policy = buildR008EvidencePolicy();

    expect(policy.safeEvidenceOnly).toBe(true);
    expect(policy.allowedEvidenceForms).toEqual(
      expect.arrayContaining(["pass_fail_blocked_status", "role_categories"]),
    );
    expect(policy.prohibitedEvidenceLabels).toEqual([
      ...R008_PROHIBITED_EVIDENCE_LABELS,
    ]);
  });
});

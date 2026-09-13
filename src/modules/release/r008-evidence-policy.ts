import {
  inspectEvidenceSummary,
  redactEvidenceSummary,
  type EvidenceRedactionViolation,
} from "./evidence-redaction";

export const R008_ALLOWED_EVIDENCE_FORMS = [
  "pass_fail_blocked_status",
  "role_categories",
  "route_categories",
  "counts",
  "safe_state_names",
  "command_names",
  "non_sensitive_blocker_summaries",
] as const;

export const R008_PROHIBITED_EVIDENCE_LABELS = [
  "credentials",
  "emails",
  "screenshots",
  "workbook_content",
  "external_links",
  "captions",
  "deliverable_titles",
  "tokens",
  "secret_values",
] as const;

export type R008EvidencePolicy = {
  safeEvidenceOnly: true;
  allowedEvidenceForms: readonly (typeof R008_ALLOWED_EVIDENCE_FORMS)[number][];
  prohibitedEvidenceLabels: readonly (typeof R008_PROHIBITED_EVIDENCE_LABELS)[number][];
};

export type R008EvidencePolicyReview = {
  safe: boolean;
  violations: EvidenceRedactionViolation[];
  allowedEvidenceForms: readonly (typeof R008_ALLOWED_EVIDENCE_FORMS)[number][];
  prohibitedEvidenceLabels: readonly (typeof R008_PROHIBITED_EVIDENCE_LABELS)[number][];
  redactedSummary?: string;
};

export const buildR008EvidencePolicy = (): R008EvidencePolicy => ({
  safeEvidenceOnly: true,
  allowedEvidenceForms: R008_ALLOWED_EVIDENCE_FORMS,
  prohibitedEvidenceLabels: R008_PROHIBITED_EVIDENCE_LABELS,
});

export const reviewR008EvidenceSummary = (
  summary: string,
): R008EvidencePolicyReview => {
  const inspection = inspectEvidenceSummary(summary);
  const policy = buildR008EvidencePolicy();

  return {
    safe: inspection.safe,
    violations: inspection.violations,
    allowedEvidenceForms: policy.allowedEvidenceForms,
    prohibitedEvidenceLabels: policy.prohibitedEvidenceLabels,
    redactedSummary: inspection.safe
      ? undefined
      : redactEvidenceSummary(summary),
  };
};

export const assertR008EvidenceSummarySafe = (summary: string) => {
  const review = reviewR008EvidenceSummary(summary);

  if (!review.safe) {
    throw new Error("R008_EVIDENCE_REDACTION_REQUIRED");
  }

  return review;
};

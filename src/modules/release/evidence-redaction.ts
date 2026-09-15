export type EvidenceRedactionCategory =
  | "email"
  | "link"
  | "secret_or_token"
  | "screenshot"
  | "workbook_content"
  | "caption_or_deliverable_title";

export type EvidenceRedactionViolation = {
  category: EvidenceRedactionCategory;
  matchCount: number;
};

const prohibitedPatterns: {
  category: EvidenceRedactionCategory;
  pattern: RegExp;
}[] = [
  {
    category: "email",
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  },
  {
    category: "link",
    pattern: /\b(?:https?:\/\/|www\.)[^\s)]+/gi,
  },
  {
    category: "secret_or_token",
    pattern:
      /\b(?:password|credential|secret|token|api[_ -]?key|service[_ -]?role)[=:]?[^\s,;]*/gi,
  },
  {
    category: "screenshot",
    pattern: /\b(?:screenshot|screen shot|\.png|\.jpe?g|\.webp)\b/gi,
  },
  {
    category: "workbook_content",
    pattern: /\b(?:workbook|sheet row|row content|worksheet)\b/gi,
  },
  {
    category: "caption_or_deliverable_title",
    pattern: /\b(?:caption|deliverable title|title:)\b/gi,
  },
];

export const inspectEvidenceSummary = (summary: string) => {
  const violations = prohibitedPatterns
    .map<EvidenceRedactionViolation | undefined>(({ category, pattern }) => {
      const matches = summary.match(pattern);

      return matches
        ? {
            category,
            matchCount: matches.length,
          }
        : undefined;
    })
    .filter((violation): violation is EvidenceRedactionViolation =>
      Boolean(violation),
    );

  return {
    safe: violations.length === 0,
    violations,
  };
};

export const redactEvidenceSummary = (summary: string) =>
  prohibitedPatterns.reduce(
    (redacted, { category, pattern }) =>
      redacted.replace(pattern, `[REDACTED_${category.toUpperCase()}]`),
    summary,
  );

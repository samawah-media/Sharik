import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildR007OwnerReadinessSummary } from "@/modules/release/r007-readiness-boundary";
import {
  r007PersonaFixtures,
  r007ReadinessGateFixtures,
} from "../../fixtures/r007-fixtures";

const releaseDocPath = join(
  process.cwd(),
  "docs",
  "08-release",
  "R-007-v1-owner-pilot-expansion-readiness.md",
);

const verificationDocPath = join(
  process.cwd(),
  "specs",
  "009-r007-v1-owner-pilot-expansion-readiness",
  "evidence",
  "verification.md",
);

const readDoc = (path: string) => readFileSync(path, "utf8");

const requiredEvidenceKeys = [
  "tenant_client_isolation",
  "role_negative_tests",
  "client_waiting_pause",
  "resume_on_client_change_request",
  "version_bound_decisions",
  "stale_version_denial",
  "internal_file_hidden",
  "client_visible_file_authorization",
  "sensitive_transition_audit",
  "security_denial_audit",
  "client_rtl_mobile",
  "secret_scan_outcome",
  "blocked_checks_and_residual_risks",
  "production_acceptance_separate_owner_decision",
] as const;

describe("R-007 evidence completeness", () => {
  it("keeps the owner readiness summary aligned to the US4 evidence requirements", () => {
    const summary = buildR007OwnerReadinessSummary();
    const evidenceKeys = new Set(
      summary.gates.flatMap((gate) => gate.requiredEvidence),
    );

    expect(summary.gates.map((gate) => gate.area)).toEqual([
      ...r007ReadinessGateFixtures,
    ]);
    expect([...evidenceKeys]).toEqual(
      expect.arrayContaining([...requiredEvidenceKeys]),
    );
  });

  it("records a reviewer-readable US4 bundle without granting production acceptance", () => {
    const releaseDoc = readDoc(releaseDocPath);
    const verificationDoc = readDoc(verificationDocPath);
    const combinedEvidence = `${releaseDoc}\n${verificationDoc}`;

    expect(releaseDoc).toContain("## US4 Release Evidence Bundle");
    expect(verificationDoc).toContain("## US4 Evidence");

    for (const evidenceKey of requiredEvidenceKeys) {
      expect(combinedEvidence).toContain(evidenceKey);
    }

    expect(combinedEvidence).toContain(
      "production_acceptance_separate_owner_decision",
    );
    expect(combinedEvidence).not.toContain("production_acceptance_granted");
  });

  it("uses only role/persona categories and avoids direct sensitive identifiers", () => {
    const combinedEvidence = `${readDoc(releaseDocPath)}\n${readDoc(
      verificationDocPath,
    )}`;

    for (const persona of r007PersonaFixtures) {
      expect(combinedEvidence).toContain(persona);
    }

    expect(combinedEvidence).not.toMatch(
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
    );
    expect(combinedEvidence).not.toMatch(/\bhttps?:\/\//i);
    expect(combinedEvidence).not.toMatch(/!\[[^\]]*]\(/);
    expect(combinedEvidence).not.toMatch(
      /\b(?:sk|sb|eyJ)[A-Za-z0-9_-]{16,}\b/,
    );
  });
});

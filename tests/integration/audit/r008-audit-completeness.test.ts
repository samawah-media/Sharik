import { describe, expect, it } from "vitest";
import {
  R008_AUDIT_EVENT_CATEGORIES,
  buildR008AuditCompletenessMatrix,
  buildR008CompleteAuditFixtureEvents,
  summarizeR008AuditCompleteness,
} from "@/modules/audit/r008-audit-completeness";

describe("R-008 audit completeness matrix", () => {
  it("covers all sensitive approval, file, SLA, delivery, package, and denial categories", () => {
    const matrix = buildR008AuditCompletenessMatrix(
      buildR008CompleteAuditFixtureEvents(),
    );

    expect(matrix.rows.map((row) => row.category)).toEqual([
      ...R008_AUDIT_EVENT_CATEGORIES,
    ]);
    expect(matrix.rows.every((row) => row.complete)).toBe(true);
    expect(summarizeR008AuditCompleteness(matrix)).toEqual({
      complete: true,
      completeCount: 11,
      blockerCount: 0,
      missingCategories: [],
    });
  });

  it("records blockers when a required denial audit path is missing", () => {
    const events = buildR008CompleteAuditFixtureEvents().filter(
      (event) => event.action !== "SecurityDenied",
    );
    const matrix = buildR008AuditCompletenessMatrix(events);

    expect(summarizeR008AuditCompleteness(matrix)).toMatchObject({
      complete: false,
      blockerCount: 1,
      missingCategories: ["security_denial"],
    });
  });
});

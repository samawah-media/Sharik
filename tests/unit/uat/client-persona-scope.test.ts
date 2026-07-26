import { describe, expect, it } from "vitest";
import {
  createS015ClientPersonaScopeIds,
  isS015ClientPersonaScopeRunId,
  S015_CLIENT_PERSONAS,
} from "../../../scripts/lib/s015-client-persona-scope.mjs";

describe("Spec 015 UAT client persona scope", () => {
  it("keeps the approved client personas and roles explicit", () => {
    expect(S015_CLIENT_PERSONAS).toEqual([
      { key: "CLIENT_APPROVER", roleKey: "client_approver" },
      { key: "CLIENT_VIEWER", roleKey: "client_viewer" },
    ]);
  });

  it("creates deterministic, distinct identifiers", () => {
    const first = createS015ClientPersonaScopeIds({
      runId: "owner-trial-20260726",
      userId: "11111111-1111-4111-8111-111111111111",
      roleKey: "client_approver",
    });
    const replay = createS015ClientPersonaScopeIds({
      runId: "owner-trial-20260726",
      userId: "11111111-1111-4111-8111-111111111111",
      roleKey: "client_approver",
    });

    expect(replay).toEqual(first);
    expect(new Set(Object.values(first))).toHaveLength(5);
    expect(Object.values(first)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
        ),
      ]),
    );
  });

  it("rejects ambiguous or unsafe run identifiers", () => {
    expect(isS015ClientPersonaScopeRunId("owner-trial-20260726")).toBe(true);
    expect(isS015ClientPersonaScopeRunId("ab")).toBe(false);
    expect(isS015ClientPersonaScopeRunId("../production")).toBe(false);
    expect(isS015ClientPersonaScopeRunId("contains spaces")).toBe(false);
  });
});

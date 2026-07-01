import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const seedPath = join(
  process.cwd(),
  "supabase",
  "seeds",
  "r005_internal_online_trial_readiness.sql",
);
const seedSql = readFileSync(seedPath, "utf8");

describe("R-005 synthetic trial seed policy", () => {
  it("targets the named non-production staging trial", () => {
    expect(seedSql).toContain("sharik-internal-trial-staging");
    expect(seedSql).toContain("Samawah Demo");
    expect(seedSql).toContain("No Production Supabase");
  });

  it("uses only r005.example.test email addresses", () => {
    const emails = seedSql.match(
      /[A-Za-z0-9._+-]+@[A-Za-z0-9.-]+/g,
    ) ?? [];

    expect(emails.length).toBeGreaterThanOrEqual(6);
    expect(new Set(emails)).toEqual(
      new Set([
        "tenant-admin@r005.example.test",
        "account-manager@r005.example.test",
        "client-viewer@r005.example.test",
        "alpha-contact@r005.example.test",
        "beta-contact@r005.example.test",
      ]),
    );
    expect(emails.every((email) => email.endsWith("@r005.example.test"))).toBe(
      true,
    );
    expect(seedSql).not.toContain("@r004.example.test");
  });

  it("does not commit temporary passwords or hashes", () => {
    expect(seedSql).toContain("encrypted_password");
    expect(seedSql).toMatch(/email,\s+null,\s+now\(\),/);
    expect(seedSql).toMatch(/encrypted_password = null/);
    expect(seedSql).not.toMatch(/crypt\(|gen_salt|temporary_password/i);
    expect(seedSql).not.toMatch(/encrypted_password\s*=\s*'[^']+'/i);
  });

  it("contains the required fixture shape for the UAT checklist", () => {
    const statuses = [
      "not_started",
      "in_progress",
      "ready_for_internal_review",
      "internally_approved",
      "waiting_client_approval",
      "client_approved",
      "delivered",
    ];

    for (const status of statuses) {
      expect(seedSql).toContain(`'${status}'`);
    }

    expect(seedSql).toContain("tenant_administrator");
    expect(seedSql).toContain("account_manager");
    expect(seedSql).toContain("client_viewer");
    expect(seedSql).toContain("r005-client-alpha");
    expect(seedSql).toContain("r005-client-beta");

    const deliverableIds =
      seedSql.match(/'a6000000-0000-4000-8000-000000000\d{3}'::uuid/g) ??
      [];
    expect(new Set(deliverableIds).size).toBe(8);
  });
});

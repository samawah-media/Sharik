import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const readProjectFile = (path: string) =>
  readFileSync(join(process.cwd(), path), "utf8");

describe("R-008 release boundary documentation", () => {
  it("keeps the release document local-only and owner-review scoped", () => {
    const releaseDoc = readProjectFile(
      "docs/08-release/R-008-controlled-v1-pilot-production-candidate-readiness-execution.md",
    );

    expect(releaseDoc).toContain("R-008 final status");
    expect(releaseDoc).toContain("ready for owner go/no-go review");
    expect(releaseDoc).toContain("This is not Production acceptance");
    expect(releaseDoc).toContain("Hosted database mutation");
    expect(releaseDoc).toContain("BLOCKED");
    expect(releaseDoc).toContain(
      "No Production acceptance is granted or implied",
    );
  });

  it("records the final owner options in the go/no-go package", () => {
    const packageDoc = readProjectFile(
      "specs/010-r008-controlled-v1-pilot-production-candidate-readiness-execution/evidence/go-no-go-package.md",
    );

    expect(packageDoc).toContain("accept R-008 local readiness only");
    expect(packageDoc).toContain("request fixes");
    expect(packageDoc).toContain("authorize limited hosted read-only UAT");
    expect(packageDoc).toContain(
      "authorize limited hosted UAT mutation with named environment/data/rollback/duration/evidence",
    );
    expect(packageDoc).toContain("start separate production-candidate package");
    expect(packageDoc).toContain(
      "No Production acceptance is granted or implied",
    );
  });
});

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  versionContentInputSchema,
  workspaceCommentInputSchema,
} from "@/modules/deliverables/workspace-inputs";

describe("workspace input boundary", () => {
  it("keeps browser validation schemas outside the server-action module", () => {
    const source = readFileSync(
      join(process.cwd(), "src/ui/deliverables/workspace-forms.tsx"),
      "utf8",
    );

    expect(source).toContain("@/modules/deliverables/workspace-inputs");
    expect(source).not.toMatch(
      /import\s*\{[^}]*InputSchema[^}]*\}\s*from\s*["']@\/server\/actions/s,
    );
  });

  it("provides real shared Zod schemas to both browser and server code", () => {
    expect(
      versionContentInputSchema.safeParse({
        clientId: crypto.randomUUID(),
        deliverableId: crypto.randomUUID(),
        versionId: crypto.randomUUID(),
        versionNumber: 1,
        submit: false,
        brief: "",
        contentBody: "",
        caption: "",
        channel: "",
        format: "",
        objective: "",
        kpi: "",
        sourceReference: "",
        idempotencyKey: "request-1",
      }).success,
    ).toBe(true);
    expect(
      workspaceCommentInputSchema.safeParse({
        clientId: crypto.randomUUID(),
        deliverableId: crypto.randomUUID(),
        versionId: crypto.randomUUID(),
        visibility: "internal_only",
        body: "تعليق داخلي",
        idempotencyKey: "request-2",
      }).success,
    ).toBe(true);
  });
});

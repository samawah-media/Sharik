import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  versionContentInputSchema,
  workspaceCommentInputSchema,
  deliverableTaskInputSchema,
  deleteTaskInputSchema,
  qualityCheckInputSchema,
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

  it("validates deliverable task input with required fields", () => {
    expect(
      deliverableTaskInputSchema.safeParse({
        clientId: crypto.randomUUID(),
        deliverableId: crypto.randomUUID(),
        taskId: null,
        title: "كتابة المحتوى",
        status: "todo",
        priority: "normal",
        idempotencyKey: "task-create-1",
      }).success,
    ).toBe(true);
  });

  it("rejects task input with invalid status or priority", () => {
    expect(
      deliverableTaskInputSchema.safeParse({
        clientId: crypto.randomUUID(),
        deliverableId: crypto.randomUUID(),
        taskId: null,
        title: "مهمة",
        status: "invalid",
        priority: "normal",
        idempotencyKey: "task-create-2",
      }).success,
    ).toBe(false);
  });

  it("validates delete task input", () => {
    expect(
      deleteTaskInputSchema.safeParse({
        clientId: crypto.randomUUID(),
        deliverableId: crypto.randomUUID(),
        taskId: crypto.randomUUID(),
        idempotencyKey: "task-delete-1",
      }).success,
    ).toBe(true);
  });

  it("validates quality check input with required fields", () => {
    expect(
      qualityCheckInputSchema.safeParse({
        clientId: crypto.randomUUID(),
        deliverableId: crypto.randomUUID(),
        versionId: crypto.randomUUID(),
        checkId: null,
        label: "مراجعة المحتوى",
        status: "pending",
        idempotencyKey: "quality-create-1",
      }).success,
    ).toBe(true);
  });

  it("rejects quality check input with invalid status", () => {
    expect(
      qualityCheckInputSchema.safeParse({
        clientId: crypto.randomUUID(),
        deliverableId: crypto.randomUUID(),
        versionId: crypto.randomUUID(),
        checkId: null,
        label: "مراجعة",
        status: "approved",
        idempotencyKey: "quality-create-2",
      }).success,
    ).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import {
  canPreviewInline,
  clientFileStatus,
  fileTypeLabel,
  formatDateArabic,
  formatFileSize,
  groupClientFiles,
  groupTeamFiles,
  isPreviewableImage,
  isPreviewablePdf,
  isPreviewableVideo,
  type GroupedFile,
} from "@/modules/files/file-groups";

const file = (overrides: Partial<GroupedFile>): GroupedFile => ({
  id: overrides.id ?? "1",
  name: overrides.name ?? "f",
  fileType: overrides.fileType ?? "image/png",
  fileSize: overrides.fileSize ?? 1024,
  visibility: overrides.visibility ?? "final_delivery",
  versionNumber: overrides.versionNumber ?? 1,
  isFinal: overrides.isFinal ?? true,
  createdAt: overrides.createdAt ?? "2026-01-01T00:00:00Z",
  deliverableName: overrides.deliverableName,
});

describe("file-groups formatting", () => {
  it("formats sizes in Arabic units", () => {
    expect(formatFileSize(0)).toBe("0 بايت");
    expect(formatFileSize(512)).toBe("512 بايت");
    expect(formatFileSize(2048)).toBe("2.0 كيلوبايت");
    expect(formatFileSize(2_621_440)).toBe("2.5 ميجابايت");
  });

  it("labels file types in Arabic without leaking MIME/enum terms", () => {
    expect(fileTypeLabel("image/jpeg")).toBe("صورة");
    expect(fileTypeLabel("video/mp4")).toBe("فيديو");
    expect(fileTypeLabel("application/pdf")).toBe("PDF");
    expect(fileTypeLabel("text/plain")).toBe("مستند نصي");
    expect(fileTypeLabel("application/zip")).toBe("ملف مضغوط");
    expect(fileTypeLabel("application/octet-stream")).toBe("ملف");
  });

  it("detects previewable types", () => {
    expect(isPreviewableImage("image/png")).toBe(true);
    expect(isPreviewableVideo("video/webm")).toBe(true);
    expect(isPreviewablePdf("application/pdf")).toBe(true);
    expect(canPreviewInline("application/msword")).toBe(false);
  });

  it("formats dates in Arabic and returns empty for invalid input", () => {
    expect(formatDateArabic("2026-08-02T00:00:00Z")).toMatch(/2026/);
    expect(formatDateArabic("not-a-date")).toBe("");
  });

  it("never surfaces a raw visibility enum on the client surface", () => {
    expect(clientFileStatus(file({ visibility: "client_visible" }))).toBeNull();
    expect(clientFileStatus(file({ visibility: "final_delivery" }))).toBe(
      "تسليم نهائي",
    );
    expect(clientFileStatus(file({ visibility: "client_uploaded" }))).toBe(
      "ملف رفعته",
    );
    expect(
      clientFileStatus(file({ visibility: "final_delivery" })),
    ).not.toMatch(/final_delivery/);
  });
});

describe("groupClientFiles", () => {
  it("groups files into ordered client folders with counts and hides empty groups", () => {
    const groups = groupClientFiles([
      file({ id: "a", visibility: "final_delivery" }),
      file({ id: "b", visibility: "client_visible" }),
      file({ id: "c", visibility: "client_uploaded" }),
      file({ id: "d", visibility: "contract_file" }),
    ]);
    expect(groups.map((g) => g.key)).toEqual([
      "final",
      "review",
      "uploaded",
      "contract",
    ]);
    expect(groups[0].files).toHaveLength(1);
    expect(groups[0].title).toBe("التسليمات النهائية");
  });

  it("drops internal-only files so they never reach the client view", () => {
    const groups = groupClientFiles([
      file({ id: "a", visibility: "internal_only" }),
      file({ id: "b", visibility: "client_visible" }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].key).toBe("review");
  });

  it("sorts files newest first within a group", () => {
    const groups = groupClientFiles([
      file({ id: "old", visibility: "client_visible", createdAt: "2026-01-01T00:00:00Z" }),
      file({ id: "new", visibility: "client_visible", createdAt: "2026-06-01T00:00:00Z" }),
    ]);
    expect(groups[0].files.map((f) => f.id)).toEqual(["new", "old"]);
  });
});

describe("groupTeamFiles", () => {
  it("groups by team visibility context including internal files", () => {
    const groups = groupTeamFiles([
      file({ id: "a", visibility: "internal_only" }),
      file({ id: "b", visibility: "client_visible" }),
      file({ id: "c", visibility: "client_uploaded" }),
      file({ id: "d", visibility: "final_delivery" }),
    ]);
    expect(groups.map((g) => g.key)).toEqual([
      "final",
      "sent",
      "clientUploaded",
      "internal",
    ]);
    expect(groups.find((g) => g.key === "internal")!.files).toHaveLength(1);
  });
});

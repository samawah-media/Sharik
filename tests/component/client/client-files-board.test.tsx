import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ClientFilesBoard } from "@/ui/client/client-files-board";
import type { GroupedFile } from "@/modules/files/file-groups";

const { download, preview } = vi.hoisted(() => ({
  download: vi.fn(),
  preview: vi.fn(),
}));

vi.mock("@/server/actions/deliverable-workspace-actions", () => ({
  createWorkspaceFileDownload: download,
  createWorkspaceFilePreview: preview,
}));

const file = (overrides: Partial<GroupedFile>): GroupedFile => ({
  id: overrides.id ?? "f1",
  name: overrides.name ?? "ملف العميل",
  fileType: overrides.fileType ?? "image/png",
  fileSize: overrides.fileSize ?? 2048,
  visibility: overrides.visibility ?? "final_delivery",
  versionNumber: overrides.versionNumber ?? 1,
  isFinal: overrides.isFinal ?? true,
  createdAt: overrides.createdAt ?? "2026-08-01T00:00:00Z",
  deliverableName: overrides.deliverableName,
});

beforeEach(() => {
  download.mockReset();
  preview.mockReset();
  preview.mockResolvedValue({ ok: false });
  download.mockResolvedValue({ ok: true, url: "https://example.test/file" });
});

afterEach(() => cleanup());

describe("ClientFilesBoard", () => {
  it("renders grouped folders with counts and hides empty groups", () => {
    render(
      <ClientFilesBoard
        files={[
          file({ id: "a", visibility: "final_delivery", name: "تسليم نهائي" }),
          file({ id: "b", visibility: "client_uploaded", name: "ملفي" }),
        ]}
      />,
    );
    expect(screen.getByText("التسليمات النهائية")).toBeInTheDocument();
    expect(screen.getByText("ملفات رفعتها")).toBeInTheDocument();
    expect(screen.queryByText("ملفات للمراجعة")).not.toBeInTheDocument();
    expect(screen.getAllByText("1 ملف").length).toBeGreaterThanOrEqual(2);
  });

  it("renders a useful empty state when there are no client files", () => {
    render(<ClientFilesBoard files={[]} />);
    expect(
      screen.getByText(/لا توجد ملفات متاحة حاليًا/),
    ).toBeInTheDocument();
  });

  it("never leaks raw visibility enums, UUIDs, or storage terms", () => {
    const { container } = render(
      <ClientFilesBoard
        files={[file({ id: "uuid-leak-probe", visibility: "final_delivery" })]}
      />,
    );
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/final_delivery|internal_only|client_uploaded/);
    expect(text).not.toMatch(/storage|bucket|deliverable-assets/i);
    expect(text).not.toMatch(/uuid-leak-probe/);
  });

  it("uses «تنزيل» and never «تنزيل آمن»", () => {
    render(
      <ClientFilesBoard files={[file({ visibility: "final_delivery" })]} />,
    );
    expect(screen.getByRole("button", { name: "تنزيل" })).toBeInTheDocument();
    expect(screen.queryByText(/تنزيل آمن/)).not.toBeInTheDocument();
  });

  it("triggers a short-lived signed download on click", async () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    render(
      <ClientFilesBoard files={[file({ id: "d1", visibility: "final_delivery" })]} />,
    );
    const btn = screen.getByRole("button", { name: "تنزيل" });
    btn.click();
    await waitFor(() => expect(download).toHaveBeenCalledWith("d1"));
    await waitFor(() =>
      expect(openSpy).toHaveBeenCalledWith(
        "https://example.test/file",
        "_blank",
        "noopener,noreferrer",
      ),
    );
    openSpy.mockRestore();
  });

  it("makes the whole card keyboard-openable for previewable types", () => {
    render(
      <ClientFilesBoard
        files={[file({ id: "img", visibility: "client_visible", fileType: "image/png" })]}
      />,
    );
    const card = screen.getByRole("button", {
      name: /فتح معاينة ملف العميل/,
    });
    expect(card).toHaveAttribute("tabindex", "0");
  });
});

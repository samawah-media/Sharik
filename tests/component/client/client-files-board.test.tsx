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
    expect(screen.getByTestId("client-files-empty")).toBeInTheDocument();
  });

  it("never leaks raw visibility enums, UUIDs, or storage terms into the HTML", () => {
    const { container } = render(
      <ClientFilesBoard
        files={[
          file({
            id: "b5f1a2e0-0000-4000-8000-000000000001",
            visibility: "final_delivery",
            name: "ملف العميل",
          }),
          file({ id: "c2", visibility: "contract_file", name: "العقد" }),
        ]}
      />,
    );
    const html = container.innerHTML;
    // Check the full DOM serialisation, not just textContent.
    expect(html).not.toMatch(/final_delivery|internal_only|client_uploaded|contract_file|report_file|brand_asset/);
    expect(html).not.toMatch(/storage|bucket|deliverable-assets/i);
    // The file UUID must not appear as an attribute or text.
    expect(html).not.toMatch(/b5f1a2e0-0000-4000-8000-000000000001/);
    expect(html).not.toMatch(/data-file-visibility/);
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
    screen.getByRole("button", { name: "تنزيل" }).click();
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

  it("makes only previewable cards keyboard-openable", () => {
    render(
      <ClientFilesBoard
        files={[
          file({ id: "img", visibility: "client_visible", fileType: "image/png", name: "صورة" }),
          file({ id: "zip", visibility: "contract_file", fileType: "application/zip", name: "أرشيف" }),
        ]}
      />,
    );
    // Image card is keyboard-openable.
    expect(
      screen.getByRole("button", { name: /فتح معاينة صورة/ }),
    ).toHaveAttribute("tabindex", "0");
    // Non-previewable archive has no openable control; only «تنزيل» is interactive.
    expect(screen.queryByRole("button", { name: /فتح معاينة أرشيف/ })).toBeNull();
  });

  it("does not request a signed preview URL for any file on render", () => {
    render(
      <ClientFilesBoard
        files={[
          file({ id: "img", visibility: "client_visible", fileType: "image/png" }),
          file({ id: "pdf", visibility: "contract_file", fileType: "application/pdf" }),
          file({ id: "zip", visibility: "final_delivery", fileType: "application/zip" }),
        ]}
      />,
    );
    // No auto N+1 preview requests when the page opens (images are lazy-loaded
    // only when visible; non-visual files never request a preview).
    expect(preview).not.toHaveBeenCalled();
  });
});

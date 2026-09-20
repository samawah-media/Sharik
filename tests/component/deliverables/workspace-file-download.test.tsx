import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  WorkspaceFileDownload,
  WorkspaceFilePreview,
} from "@/ui/deliverables/workspace-files";

const { createDownload } = vi.hoisted(() => ({ createDownload: vi.fn() }));

vi.mock("@/server/actions/deliverable-workspace-actions", () => ({
  createWorkspaceFileDownload: createDownload,
}));

const fetchMock = vi.fn();
const createObjectURL = vi.fn(() => "blob:workspace-download");
const revokeObjectURL = vi.fn();
const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, "click");

beforeEach(() => {
  createDownload.mockReset();
  createDownload.mockResolvedValue({
    ok: true,
    url: "https://example.test/team-file",
    fileName: "قالب الآراء.png",
  });
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({
    ok: true,
    blob: vi.fn().mockResolvedValue(new Blob(["team-file"])),
  });
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
  createObjectURL.mockClear();
  revokeObjectURL.mockClear();
  anchorClick.mockReset();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("WorkspaceFileDownload", () => {
  it("downloads once with the authorized Arabic name and cleans browser resources", async () => {
    let clickedDownload = "";
    anchorClick.mockImplementation(function (this: HTMLAnchorElement) {
      clickedDownload = this.download;
    });
    render(<WorkspaceFileDownload fileId="file-1" />);

    screen.getByRole("button", { name: "تنزيل" }).click();

    await waitFor(() => expect(anchorClick).toHaveBeenCalledTimes(1));
    expect(createDownload).toHaveBeenCalledWith("file-1");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("https://example.test/team-file");
    expect(clickedDownload).toBe("قالب الآراء.png");
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:workspace-download");
    expect(document.querySelector("a[download]")).toBeNull();
  });

  it("keeps Arabic failure feedback and creates no anchor for a non-OK fetch", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 403 });
    render(<WorkspaceFileDownload fileId="file-1" />);

    screen.getByRole("button", { name: "تنزيل" }).click();

    expect(
      await screen.findByText("تعذر تنزيل الملف أو انتهت صلاحية الوصول."),
    ).toBeInTheDocument();
    expect(anchorClick).not.toHaveBeenCalled();
    expect(createObjectURL).not.toHaveBeenCalled();
    expect(revokeObjectURL).not.toHaveBeenCalled();
  });

  it("removes the anchor and revokes the object URL when the browser click fails", async () => {
    anchorClick.mockImplementation(() => {
      throw new Error("browser download click failed");
    });
    render(<WorkspaceFileDownload fileId="file-1" />);

    screen.getByRole("button", { name: "تنزيل" }).click();

    expect(
      await screen.findByText("تعذر تنزيل الملف أو انتهت صلاحية الوصول."),
    ).toBeInTheDocument();
    expect(anchorClick).toHaveBeenCalledTimes(1);
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:workspace-download");
    expect(document.querySelector("a[download]")).toBeNull();
  });
});

describe("WorkspaceFilePreview", () => {
  it("shows fallback message when video preview loading encounters an error", async () => {
    createDownload.mockResolvedValue({
      ok: true,
      url: "https://example.test/video.mp4",
      fileName: "video.mp4",
    });

    render(
      <WorkspaceFilePreview
        fileId="video-1"
        fileType="video/mp4"
        label="معاينة الفيديو"
      />,
    );

    screen.getByRole("button", { name: "معاينة" }).click();
    const video = await screen.findByLabelText("معاينة الفيديو");
    expect(video).toBeInTheDocument();

    fireEvent.error(video);

    expect(
      await screen.findByText("تعذرت المعاينة المرئية. يمكنك تنزيل الملف مباشرة."),
    ).toBeInTheDocument();
  });

  it("clears a previous playback error after a successful retry", async () => {
    createDownload
      .mockResolvedValueOnce({
        ok: true,
        url: "https://example.test/video-expired.mp4",
        fileName: "video.mp4",
      })
      .mockResolvedValueOnce({
        ok: true,
        url: "https://example.test/video-refreshed.mp4",
        fileName: "video.mp4",
      });
    render(
      <WorkspaceFilePreview
        fileId="video-1"
        fileType="video/mp4"
        label="معاينة الفيديو"
      />,
    );

    const preview = screen.getByRole("button", { name: "معاينة" });
    fireEvent.click(preview);
    fireEvent.error(await screen.findByLabelText("معاينة الفيديو"));
    expect(
      await screen.findByText("تعذرت المعاينة المرئية. يمكنك تنزيل الملف مباشرة."),
    ).toBeInTheDocument();

    fireEvent.click(preview);
    await waitFor(() =>
      expect(screen.queryByText(/تعذرت المعاينة المرئية/)).not.toBeInTheDocument(),
    );
    expect(screen.getByLabelText("معاينة الفيديو")).toHaveAttribute(
      "src",
      "https://example.test/video-refreshed.mp4",
    );
  });

  it("shows the safe fallback when the preview action rejects", async () => {
    createDownload.mockRejectedValueOnce(new Error("network unavailable"));
    render(
      <WorkspaceFilePreview
        fileId="video-1"
        fileType="video/mp4"
        label="معاينة الفيديو"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "معاينة" }));

    expect(
      await screen.findByText(
        "المعاينة غير متاحة لهذا الدور أو انتهت صلاحيتها.",
      ),
    ).toBeInTheDocument();
  });
});

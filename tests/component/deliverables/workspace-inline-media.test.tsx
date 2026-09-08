import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceInlineMedia } from "@/ui/deliverables/workspace-files";

const { previewFile } = vi.hoisted(() => ({ previewFile: vi.fn() }));
vi.mock("@/server/actions/deliverable-workspace-actions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/actions/deliverable-workspace-actions")>()),
  createWorkspaceFilePreview: previewFile,
}));

type PreviewResult = { ok: true; url: string } | { ok: false };
const deferredPreview = () => {
  let resolve!: (result: PreviewResult) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<PreviewResult>((accept, refuse) => {
    resolve = accept;
    reject = refuse;
  });
  return { promise, resolve, reject };
};
const fallback = "تعذرت معاينة الأصل المرئي بأمان.";
const media = (fileId: string, fileType = "image/png") => (
  <WorkspaceInlineMedia fileId={fileId} fileType={fileType} label="معاينة العمل" />
);

beforeEach(() => { previewFile.mockReset(); });
afterEach(() => cleanup());

describe("WorkspaceInlineMedia signed preview lifecycle", () => {
  it.each(["image/png", "video/mp4"])("shows honest fallback after %s resource load fails", async (fileType) => {
    previewFile.mockResolvedValue({ ok: true, url: "/signed-preview" });
    const { container } = render(media("file-a", fileType));
    const element = fileType.startsWith("image/")
      ? await screen.findByRole("img", { name: "معاينة العمل" })
      : await screen.findByLabelText("معاينة العمل");
    expect(element).toHaveAttribute("src", "/signed-preview");
    if (fileType.startsWith("video/")) {
      expect(element).toHaveAttribute("controls");
      expect(element).toHaveAttribute("preload", "metadata");
    }
    fireEvent.error(element);
    expect(await screen.findByText(fallback)).toBeVisible();
    expect(container.querySelector("img, video")).toBeNull();
    expect(previewFile).toHaveBeenCalledTimes(1);
  });

  it.each(["denied", "rejected"])("shows fallback for a %s preview action, never a raw URL", async (outcome) => {
    const request = deferredPreview();
    previewFile.mockReturnValue(request.promise);
    const { container } = render(media("file-a"));
    expect(screen.getByLabelText("جارٍ تحميل المعاينة")).toBeVisible();
    await act(async () => {
      if (outcome === "denied") request.resolve({ ok: false });
      else request.reject(new Error("private diagnostic must not reach UI"));
    });
    expect(await screen.findByText(fallback)).toBeVisible();
    expect(container.querySelector("img, video, a[href]")).toBeNull();
    expect(container).not.toHaveTextContent("private diagnostic");
  });

  it("removes the old URL immediately while a replacement file is pending", async () => {
    const next = deferredPreview();
    previewFile.mockResolvedValueOnce({ ok: true, url: "/signed-a" }).mockReturnValueOnce(next.promise);
    const { rerender, container } = render(media("file-a"));
    expect(await screen.findByRole("img")).toHaveAttribute("src", "/signed-a");
    rerender(media("file-b"));
    expect(screen.getByLabelText("جارٍ تحميل المعاينة")).toBeVisible();
    expect(container.querySelector("[src]")).toBeNull();
    await act(async () => next.resolve({ ok: true, url: "/signed-b" }));
    expect(await screen.findByRole("img")).toHaveAttribute("src", "/signed-b");
  });

  it.each(["denial", "load error"])("recovers on a new file after previous %s", async (failure) => {
    const next = deferredPreview();
    previewFile.mockResolvedValueOnce(failure === "denial" ? { ok: false } : { ok: true, url: "/signed-a" })
      .mockReturnValueOnce(next.promise);
    const { rerender } = render(media("file-a"));
    if (failure === "load error") fireEvent.error(await screen.findByRole("img"));
    expect(await screen.findByText(fallback)).toBeVisible();
    rerender(media("file-b"));
    expect(screen.queryByText(fallback)).not.toBeInTheDocument();
    expect(screen.getByLabelText("جارٍ تحميل المعاينة")).toBeVisible();
    await act(async () => next.resolve({ ok: true, url: "/signed-b" }));
    expect(await screen.findByRole("img")).toHaveAttribute("src", "/signed-b");
  });

  it.each(["success", "denial", "rejection"])("ignores late old-file %s after the new preview succeeds", async (outcome) => {
    const old = deferredPreview();
    previewFile.mockReturnValueOnce(old.promise).mockResolvedValueOnce({ ok: true, url: "/signed-b" });
    const { rerender } = render(media("file-a"));
    rerender(media("file-b"));
    expect(await screen.findByRole("img")).toHaveAttribute("src", "/signed-b");
    await act(async () => {
      if (outcome === "rejection") old.reject(new Error("stale transport failure"));
      else old.resolve(outcome === "success" ? { ok: true, url: "/signed-a" } : { ok: false });
    });
    expect(screen.getByRole("img")).toHaveAttribute("src", "/signed-b");
    expect(screen.queryByText(fallback)).not.toBeInTheDocument();
  });

  it("keeps the newly requested A preview when the first A request resolves after A→B→A navigation", async () => {
    const firstA = deferredPreview();
    const requestB = deferredPreview();
    const secondA = deferredPreview();
    previewFile
      .mockReturnValueOnce(firstA.promise)
      .mockReturnValueOnce(requestB.promise)
      .mockReturnValueOnce(secondA.promise);
    const { rerender, container } = render(media("file-a"));

    rerender(media("file-b"));
    await act(async () => requestB.resolve({ ok: true, url: "/signed-b" }));
    expect(screen.getByRole("img")).toHaveAttribute("src", "/signed-b");

    rerender(media("file-a"));
    expect(screen.getByLabelText("جارٍ تحميل المعاينة")).toBeVisible();
    expect(container.querySelector("[src]")).toBeNull();
    await act(async () => secondA.resolve({ ok: true, url: "/signed-a-new" }));
    expect(screen.getByRole("img")).toHaveAttribute("src", "/signed-a-new");

    await act(async () => firstA.resolve({ ok: true, url: "/signed-a-old" }));
    expect(screen.getByRole("img")).toHaveAttribute("src", "/signed-a-new");
    expect(screen.queryByText(fallback)).not.toBeInTheDocument();
  });

  it.each(["success", "rejection"])("leaves the container empty when pending %s settles after unmount", async (outcome) => {
    const request = deferredPreview();
    previewFile.mockReturnValue(request.promise);
    const { unmount, container } = render(media("file-a"));
    unmount();
    await act(async () => {
      if (outcome === "success") request.resolve({ ok: true, url: "/signed-a" });
      else request.reject(new Error("unmounted transport failure"));
    });
    expect(container).toBeEmptyDOMElement();
  });
});

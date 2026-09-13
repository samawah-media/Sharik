import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ContentPreviewCard } from "@/ui/deliverables/content-preview-card";

afterEach(cleanup);

describe("content preview card localization", () => {
  it("keeps supplied media inside a bounded compact-card preview", () => {
      render(
        <ContentPreviewCard
          compact
          media={<video aria-label="معاينة طويلة" src="/tall-preview.mp4" />}
          title="منشور طويل"
        />,
      );

      const mediaFrame = screen.getByTestId("content-preview-media");
      expect(mediaFrame).toHaveClass("h-36", "overflow-hidden");
      expect(mediaFrame).not.toHaveClass("min-h-36", "min-h-52");
      expect(mediaFrame).toHaveClass(
        "[&>*]:h-full",
        "[&>*]:w-full",
        "[&>*]:object-cover",
      );
  });

  it("keeps full-detail media uncropped", () => {
    render(
      <ContentPreviewCard
        fullText
        media={<video aria-label="معاينة كاملة" src="/full-preview.mp4" />}
        title="مراجعة العميل"
      />,
    );

    const mediaFrame = screen.getByTestId("content-preview-media");
    expect(mediaFrame).toHaveClass("min-h-52");
    expect(mediaFrame).not.toHaveClass("h-52", "overflow-hidden", "[&>*]:object-cover");
  });

  it.each([
    [undefined, false],
    [false, false],
    [true, false],
    [true, true],
  ])(
    "only removes text clamps with fullText=%s (compact=%s)",
    (fullText, compact) => {
      const title = "عنوان كامل للمراجعة ".repeat(20);
      const caption = "نص طويل محفوظ للمراجعة\n".repeat(30);
      render(
        <ContentPreviewCard
          title={title}
          caption={caption}
          fullText={fullText}
          compact={compact}
          media={<video aria-label="فيديو النسخة" src="/review.mp4" controls />}
        />,
      );
      const titleElement = screen.getByText(title.trim());
      const captionElement = screen.getByText(
        caption.trim().replace(/\s+/g, " "),
      );
      expect(titleElement.classList.contains("line-clamp-2")).toBe(!fullText);
      expect(captionElement.classList.contains("line-clamp-3")).toBe(!fullText);
      expect(titleElement.textContent).toBe(title);
      expect(captionElement.textContent).toBe(caption);
      expect(screen.getByLabelText("فيديو النسخة")).toHaveAttribute(
        "src",
        "/review.mp4",
      );
    },
  );

  it("renders known channel and format labels in Arabic", () => {
    render(
      <ContentPreviewCard
        channel="Instagram"
        format="Post"
        title="منشور تجريبي"
      />,
    );

    expect(screen.getAllByText("إنستغرام").length).toBeGreaterThan(0);
    expect(screen.getByText("منشور")).toBeVisible();
    expect(screen.queryByText("Instagram")).toBeNull();
    expect(screen.queryByText("Post")).toBeNull();
    expect(
      screen.getByText("لا يوجد نص محفوظ في النسخة الحالية"),
    ).toBeVisible();
  });

  it("uses calm Arabic fallbacks for unknown technical values", () => {
    render(
      <ContentPreviewCard
        channel="future_network"
        format="future_format"
        title="مخرج مخصص"
      />,
    );

    expect(screen.getAllByText("قناة رقمية").length).toBeGreaterThan(0);
    expect(screen.getByText("صيغة مخصصة")).toBeVisible();
    expect(screen.queryByText("future_network")).toBeNull();
    expect(screen.queryByText("future_format")).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { sanitizeDownloadFilename } from "@/modules/files/download-filename";

describe("sanitizeDownloadFilename", () => {
  it("preserves an ordinary Arabic filename and extension", () => {
    expect(sanitizeDownloadFilename("قالب الآراء النهائية.png")).toBe(
      "قالب الآراء النهائية.png",
    );
  });

  it.each([
    [null, "ملف"],
    [undefined, "ملف"],
    [" . ", "ملف"],
  ])("uses the Arabic fallback for an empty safe name", (value, expected) => {
    expect(sanitizeDownloadFilename(value)).toBe(expected);
  });

  it("removes control, path, reserved, and bidi override characters", () => {
    expect(
      sanitizeDownloadFilename(
        "قالب\r\n\0/\\:<\">|?*\u202e\u202d\u2067الآراء.png",
      ),
    ).toBe("قالبالآراء.png");
  });

  it("removes trailing dots and spaces without changing the extension", () => {
    expect(sanitizeDownloadFilename("قالب الآراء.png...   ")).toBe(
      "قالب الآراء.png",
    );
  });

  it("does not URI-decode percent-encoded control text", () => {
    expect(sanitizeDownloadFilename("قالب%0D%0Aالآراء.png")).toBe(
      "قالب%0D%0Aالآراء.png",
    );
  });
});

import { describe, expect, it } from "vitest";
import { normalizeArabicSearchText } from "@/modules/localization/arabic-search";

describe("arabic search normalization", () => {
  it("strips harakat so a plain query matches diacritized stored text", () => {
    // Production break: a deliverable saved as "مُسَوَّق" is unfindable when
    // a team member types "مسوق" on a keyboard without harakat keys.
    expect(normalizeArabicSearchText("مُسَوَّق")).toBe("مسوق");
  });

  it("strips tatweel so stretched display names stay searchable", () => {
    // Production break: names pasted as "تصمـــيم" never match the typed
    // query "تصميم" because the tatweel characters break the substring.
    expect(normalizeArabicSearchText("تصمـــيم")).toBe("تصميم");
  });

  it("folds composed alef and hamza forms through decomposition", () => {
    // Production break: contract names like "أحمد" and "إعلان" and "آمال"
    // are stored with hamza carriers, while users type bare alef "احمد".
    expect(normalizeArabicSearchText("أحمد")).toBe("احمد");
    expect(normalizeArabicSearchText("إعلان")).toBe("اعلان");
    expect(normalizeArabicSearchText("آمال")).toBe("امال");
    expect(normalizeArabicSearchText("مسؤول")).toBe("مسوول");
    expect(normalizeArabicSearchText("رئيس")).toBe("رييس");
  });

  it("collapses repeated and mixed whitespace into single spaces", () => {
    // Production break: names copied from external tools contain double
    // spaces and newlines, so a normally typed multi-word query misses.
    expect(normalizeArabicSearchText("عقد   الحضور\n\tالرقمي ")).toBe(
      "عقد الحضور الرقمي",
    );
  });

  it("keeps mixed Arabic and Latin text intact apart from lowercasing", () => {
    // Production break: contracts reference Latin identifiers such as
    // "SEO"; dropping or transliterating them would break real searches.
    expect(normalizeArabicSearchText("حملة SEO لعام 2026")).toBe(
      "حملة seo لعام 2026",
    );
  });

  it("returns an empty string for empty or whitespace-only input", () => {
    // Production break: a whitespace-only query must behave like an empty
    // query and show all rows instead of an accidental zero-match list.
    expect(normalizeArabicSearchText("")).toBe("");
    expect(normalizeArabicSearchText("   ")).toBe("");
  });

  it("strips rare Quranic and extended Arabic combining marks", () => {
    // Production break: Quranic or legacy copy such as "كِتَاب\u06D6" or
    // "سطر\u08D3" keeps hidden combining marks outside the core harakat
    // range, so the same plain word "كتاب" or "سطر" never matches it.
    expect(normalizeArabicSearchText("كِتَاب\u06D6")).toBe("كتاب");
    expect(normalizeArabicSearchText("سطر\u08D3")).toBe("سطر");
    expect(normalizeArabicSearchText("كِتَاب\u06D6")).toBe(
      normalizeArabicSearchText("كتاب"),
    );
  });

  it("preserves Latin and non-mark Arabic code points so unrelated text is untouched", () => {
    // Production break: a mark-stripping regex without an Arabic-script
    // guard would corrupt Latin names like "José" (NFD: "jose" + U+0301)
    // and drop non-mark Arabic code points such as U+06E5 and U+06E9.
    expect(normalizeArabicSearchText("José")).toBe("jose\u0301");
    expect(normalizeArabicSearchText("José")).not.toBe("jose");
    expect(normalizeArabicSearchText("صفحة\u06E5\u06E9")).toBe(
      "صفحة\u06E5\u06E9",
    );
  });

  it("preserves unrelated characters instead of over-normalizing", () => {
    // Production break: folding distinct letters (alef maqsura, taa
    // marbuta) or stripping punctuation and digits would make different
    // clients and contracts indistinguishable in search.
    expect(normalizeArabicSearchText("مستشفى")).toBe("مستشفى");
    expect(normalizeArabicSearchText("باقة (أساسية) ١٢٣")).toBe(
      "باقة (اساسية) ١٢٣",
    );
    expect(normalizeArabicSearchText("تقرير Q3")).toBe("تقرير q3");
  });
});

import { describe, expect, it } from "vitest";
import {
  isValidContactPhone,
  normalizeContactPhone,
} from "@/modules/clients/contact-phone";

describe("contact-phone normalization and validation", () => {
  it("removes spaces, parentheses, dots, and dashes", () => {
    expect(normalizeContactPhone("+966 50 123 4567")).toBe("+966501234567");
    expect(normalizeContactPhone("(966) 50.123.4567")).toBe("966501234567");
  });

  it("converts only a leading 00 prefix to + (mandatory regression)", () => {
    expect(normalizeContactPhone("00966-50-123-4567")).toBe("+966501234567");
    expect(normalizeContactPhone("00966501234567")).toBe("+966501234567");
  });

  it("does NOT corrupt numbers that contain 00 elsewhere (mandatory regression)", () => {
    expect(normalizeContactPhone("01000012345")).toBe("01000012345");
    expect(normalizeContactPhone("0501002003")).toBe("0501002003");
    expect(normalizeContactPhone("+01000012345")).toBe("+01000012345");
  });

  it("returns empty string for blank input", () => {
    expect(normalizeContactPhone("")).toBe("");
    expect(normalizeContactPhone("   ")).toBe("");
    expect(normalizeContactPhone(undefined)).toBe("");
    expect(normalizeContactPhone(null)).toBe("");
  });

  it("accepts valid international and local numbers (mandatory cases)", () => {
    expect(isValidContactPhone("01000012345")).toBe(true);
    expect(isValidContactPhone("0501002003")).toBe(true);
    expect(isValidContactPhone("00966501234567")).toBe(true);
    expect(isValidContactPhone("+966501234567")).toBe(true);
    expect(isValidContactPhone("+1 415 555 2671")).toBe(true);
  });

  it("rejects numbers with a + in the middle or more than one + (mandatory)", () => {
    expect(isValidContactPhone("966+501234567")).toBe(false);
    expect(isValidContactPhone("++966501234567")).toBe(false);
    expect(isValidContactPhone("+966+501234567")).toBe(false);
  });

  it("rejects non-numeric garbage", () => {
    expect(isValidContactPhone("abc-not-a-phone")).toBe(false);
    expect(isValidContactPhone("hello world")).toBe(false);
  });

  it("rejects numbers that are too short or too long", () => {
    expect(isValidContactPhone("12345")).toBe(false);
    expect(isValidContactPhone("123456")).toBe(false);
    expect(isValidContactPhone("+12345678901234567")).toBe(false);
  });

  it("does not store or echo PII — pure function, no side effects", () => {
    const original = "+966 50 999 8888";
    const normalized = normalizeContactPhone(original);
    expect(normalized).toBe("+966509998888");
    expect(original).toBe("+966 50 999 8888");
  });
});

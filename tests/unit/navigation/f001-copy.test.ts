import { describe, expect, it } from "vitest";
import {
  f001CopyArSA,
  requiredF001CopyKeys,
} from "@/ui/copy/ar-SA/f001";

describe("F-001 Arabic Saudi copy catalog", () => {
  it("covers every required Phase 7 state with readable Arabic copy", () => {
    for (const key of requiredF001CopyKeys) {
      expect(f001CopyArSA[key], key).toMatch(/[\u0600-\u06ff]/);
      expect(f001CopyArSA[key], key).not.toMatch(/[ØÙ]/);
    }
  });
});

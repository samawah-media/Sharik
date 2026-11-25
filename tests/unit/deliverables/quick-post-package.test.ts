import { describe, expect, it } from "vitest";
import { isPostPackageLine } from "@/modules/packages/package-quantity";

describe("quick post package matching", () => {
  it.each([
    ["post", "item", true],
    [" POST ", "items", true],
    [undefined, " منشورات ", true],
    [undefined, "posts", true],
    ["reel", "posts", false],
    ["post", "reel", false],
    ["post", "hours", false],
    [undefined, "item", false],
  ] as const)(
    "matches hint %s with unit %s",
    (deliverableTypeHint, unitLabel, expected) => {
      expect(isPostPackageLine({ deliverableTypeHint, unitLabel })).toBe(
        expected,
      );
    },
  );
});

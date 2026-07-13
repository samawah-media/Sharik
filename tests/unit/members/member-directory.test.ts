import { describe, expect, it } from "vitest";
import {
  createMemberDirectory,
  resolveMemberDisplays,
} from "@/modules/members/member-directory";

describe("scoped member directory", () => {
  it("returns display-safe names, roles, and initials without exposing unknown ids", () => {
    const directory = createMemberDirectory([
      { user_id: "user_a", display_name: "سارة القحطاني", role_label: "كاتبة محتوى" },
    ]);

    expect(resolveMemberDisplays(directory, ["user_a", "user_other"]))
      .toEqual([
        expect.objectContaining({
          displayName: "سارة القحطاني",
          roleLabel: "كاتبة محتوى",
          initial: "س",
        }),
      ]);
    expect(resolveMemberDisplays(directory, ["user_other"])).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import {
  createMemberDirectory,
  repairArabicMojibake,
  resolveMemberDisplays,
  safeMemberDisplayName,
} from "@/modules/members/member-directory";

describe("scoped member directory", () => {
  it("repairs recoverable UTF-8 Arabic mojibake at the display boundary", () => {
    const corrupt = (value: string) =>
      Array.from(new TextEncoder().encode(value), (byte) =>
        String.fromCharCode(byte),
      ).join("");

    expect(repairArabicMojibake(corrupt("مدير سماوة"))).toBe("مدير سماوة");
    expect(repairArabicMojibake("Samawah Team")).toBe("Samawah Team");

    const directory = createMemberDirectory([
      {
        user_id: "user_a",
        display_name: corrupt("أحمد العتيبي"),
        role_label: corrupt("مدير مشروع"),
      },
    ]);
    expect(directory.user_a).toMatchObject({
      displayName: "أحمد العتيبي",
      roleLabel: "مدير مشروع",
      initial: "أ",
    });
  });

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

  it("replaces raw identifiers, synthetic email-like names, and raw role labels", () => {
    expect(safeMemberDisplayName("00000000-0000-4000-8000-000000000000")).toBe(
      "عضو فريق",
    );
    expect(safeMemberDisplayName("fixture.user@example.com")).toBe("عضو فريق");

    const directory = createMemberDirectory([
      {
        user_id: "user_a",
        display_name: "fixture.user@example.com",
        role_label: "account_manager",
      },
    ]);

    expect(directory.user_a).toMatchObject({
      displayName: "عضو فريق",
      roleLabel: "مدير الحساب",
      initial: "ع",
    });
  });
});

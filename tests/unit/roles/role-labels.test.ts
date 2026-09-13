import { describe, expect, it } from "vitest";
import { humanRoleLabel, roleLabelAr } from "@/modules/roles/role-labels";

describe("Arabic role labels", () => {
  it("maps technical role keys to human Arabic labels", () => {
    expect(roleLabelAr("tenant_administrator")).toBe("مدير النظام");
    expect(roleLabelAr("account_manager")).toBe("مدير الحساب");
    expect(roleLabelAr("content_writer")).toBe("كاتب المحتوى");
    expect(roleLabelAr("designer")).toBe("المصمم");
  });

  it("keeps existing human labels and falls back safely", () => {
    expect(humanRoleLabel("مدير مشروع")).toBe("مدير مشروع");
    expect(roleLabelAr("unknown_future_role")).toBe("عضو فريق");
  });
});

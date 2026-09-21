import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";
import { VersionContentForm } from "@/ui/deliverables/workspace-forms";

// The form imports server actions and routing; this slice only renders its fields.
vi.mock("@/server/actions/deliverable-workspace-actions", () => ({
  saveOrSubmitVersionContent: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const deliverable: DeliverableSafeSummary = {
  id: "10000000-0000-4000-8000-000000000001",
  tenantId: "10000000-0000-4000-8000-000000000002",
  clientId: "10000000-0000-4000-8000-000000000003",
  name: "مخرج اختبار",
  type: "post",
  status: "in_progress",
  priority: "normal",
  contributorUserIds: [],
  requiresInternalApproval: true,
  requiresClientApproval: true,
  progressPercentage: 30,
  approvedExtra: false,
  revision: 1,
  createdAt: "2026-09-08T00:00:00Z",
  updatedAt: "2026-09-08T00:00:00Z",
};

afterEach(cleanup);

describe("SIL-59 workspace field guidance", () => {
  it.each([
    ["الموجز", "وش المطلوب؟ وضّح الفكرة والجمهور وأهم التفاصيل للفريق.", "brief"],
    ["المحتوى", "اكتب النص اللي بيظهر داخل التصميم أو الفيديو.", "contentBody"],
    ["الكابشن", "اكتب النص اللي بينزل مع المنشور، مثل الدعوة للتفاعل والوسوم.", "caption"],
  ])("%s has visible accessible help without changing its name", (label, help, fieldName) => {
    render(<VersionContentForm deliverable={deliverable} />);

    const field = screen.getByLabelText(label, { exact: true });
    expect(field).toHaveAccessibleName(label);
    expect(field).toHaveAccessibleDescription(help);
    expect(field).toHaveAttribute("name", fieldName);
    expect(screen.getByText(help)).toBeVisible();
  });
});

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";
import type { DeliverableVersionWorkspace } from "@/modules/deliverables/deliverable-workspace";
import { VersionContentForm } from "@/ui/deliverables/workspace-forms";

const { saveVersion, refresh } = vi.hoisted(() => ({
  saveVersion: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/server/actions/deliverable-workspace-actions", () => ({
  saveOrSubmitVersionContent: saveVersion,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

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
const draft: DeliverableVersionWorkspace = {
  id: "10000000-0000-4000-8000-000000000004",
  versionNumber: 2,
  status: "draft",
  submittedAt: "2026-09-08T00:00:00Z",
  brief: "موجز الكاتب",
  body: "محتوى الكاتب",
  caption: "كابشن الكاتب",
  channel: "Instagram",
  format: "Post",
  objective: "زيادة التفاعل",
  kpi: "مئة مشاركة",
  sourceReference: "مرجع الكاتب",
};
const actions = [
  { name: "حفظ مسودة", submit: false, feedback: "تم حفظ المسودة." },
  {
    name: "حفظ وإرسال للمراجعة الداخلية",
    submit: true,
    feedback: "تم إرسال النسخة للمراجعة الداخلية.",
  },
];

beforeEach(() => {
  saveVersion.mockReset().mockResolvedValue({ ok: true });
  refresh.mockReset();
});
afterEach(cleanup);

describe("UI3 real version content form", () => {
  it("clears a prior success before a later failed attempt without refreshing", async () => {
    const onMutationStarted = vi.fn();
    const onMutated = vi.fn();
    render(
      <VersionContentForm
        deliverable={deliverable}
        currentVersion={draft}
        onMutationStarted={onMutationStarted}
        onMutated={onMutated}
      />,
    );

    const saveDraft = screen.getByRole("button", { name: "حفظ مسودة" });
    fireEvent.click(saveDraft);
    expect(await screen.findByText("تم حفظ المسودة.")).toBeVisible();

    saveVersion.mockResolvedValueOnce({ ok: false, reason: "denied" });
    fireEvent.click(saveDraft);

    expect(
      await screen.findByText(
        "تعذر حفظ النسخة. راجع الصلاحية والحالة ثم حاول مجددًا.",
      ),
    ).toBeVisible();
    expect(screen.queryByText("تم حفظ المسودة.")).not.toBeInTheDocument();
    expect(onMutationStarted).toHaveBeenCalledTimes(2);
    expect(onMutated).toHaveBeenCalledExactlyOnceWith(
      draft.id,
      "تم حفظ المسودة.",
    );
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("notifies the workspace after a successful mutation", async () => {
    const onMutated = vi.fn();
    render(
      <VersionContentForm
        deliverable={deliverable}
        currentVersion={draft}
        onMutated={onMutated}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "حفظ وإرسال للمراجعة الداخلية" }));

    await screen.findByText("تم إرسال النسخة للمراجعة الداخلية.");
    expect(onMutated).toHaveBeenCalledExactlyOnceWith(
      draft.id,
      "تم إرسال النسخة للمراجعة الداخلية.",
    );
  });

  it.each(actions)("$name preserves the draft identity and sends every edited field", async ({ name, submit, feedback }) => {
    render(<VersionContentForm deliverable={deliverable} currentVersion={draft} />);
    expect(screen.getByLabelText("المحتوى")).toHaveValue("محتوى الكاتب");
    const fields = [
      ["رقم النسخة", "3"],
      ["القناة", "LinkedIn"],
      ["الصيغة", "Article"],
      ["الهدف", "هدف معدل"],
      ["مؤشر النجاح", "مئتا مشاركة"],
      ["الموجز", "موجز معدل"],
      ["المحتوى", "محتوى معدل"],
      ["الكابشن", "كابشن معدل"],
      ["مرجع المصدر", "مرجع معدل"],
    ];
    for (const [label, value] of fields) {
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
    }
    fireEvent.click(screen.getByRole("button", { name }));

    expect(await screen.findByText(feedback)).toBeVisible();
    expect(saveVersion).toHaveBeenCalledExactlyOnceWith({
      clientId: deliverable.clientId,
      deliverableId: deliverable.id,
      versionId: draft.id,
      versionNumber: 3,
      submit,
      brief: "موجز معدل",
      contentBody: "محتوى معدل",
      caption: "كابشن معدل",
      channel: "LinkedIn",
      format: "Article",
      objective: "هدف معدل",
      kpi: "مئتا مشاركة",
      sourceReference: "مرجع معدل",
      idempotencyKey: expect.any(String),
    });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("المحتوى")).toHaveValue("محتوى معدل");
  });

  it.each(actions)("$name failure keeps inputs editable and can be retried", async ({ name, submit, feedback }) => {
    const onMutated = vi.fn();
    saveVersion.mockResolvedValueOnce({ ok: false, reason: "denied" });
    render(
      <VersionContentForm
        deliverable={deliverable}
        currentVersion={draft}
        onMutated={onMutated}
      />,
    );
    fireEvent.change(screen.getByLabelText("المحتوى"), { target: { value: "محتوى غير محفوظ" } });
    const button = screen.getByRole("button", { name });
    fireEvent.click(button);

    expect(await screen.findByText("تعذر حفظ النسخة. راجع الصلاحية والحالة ثم حاول مجددًا.")).toBeVisible();
    for (const [label, value] of [
      ["القناة", "Instagram"], ["الصيغة", "Post"],
      ["الهدف", "زيادة التفاعل"], ["مؤشر النجاح", "مئة مشاركة"],
      ["الموجز", "موجز الكاتب"], ["المحتوى", "محتوى غير محفوظ"],
      ["الكابشن", "كابشن الكاتب"], ["مرجع المصدر", "مرجع الكاتب"],
    ]) {
      expect(screen.getByLabelText(label)).toHaveValue(value);
      expect(screen.getByLabelText(label)).toBeEnabled();
    }
    expect(screen.getByLabelText("رقم النسخة")).toHaveValue(2);
    expect(screen.queryByText(feedback)).not.toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
    expect(onMutated).not.toHaveBeenCalled();
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.change(screen.getByLabelText("المحتوى"), { target: { value: "محتوى بعد التصحيح" } });
    fireEvent.click(button);

    expect(await screen.findByText(feedback)).toBeVisible();
    expect(screen.queryByText(/تعذر حفظ النسخة/)).not.toBeInTheDocument();
    expect(saveVersion).toHaveBeenCalledTimes(2);
    expect(saveVersion).toHaveBeenLastCalledWith(expect.objectContaining({
      versionId: draft.id, submit, contentBody: "محتوى بعد التصحيح",
    }));
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(onMutated).toHaveBeenCalledExactlyOnceWith(draft.id, feedback);
  });

  it.each([
    ["not_started", true], ["in_progress", true],
    ["internal_changes_requested", true], ["client_changes_requested", true],
    ["ready_for_internal_review", false], ["internally_approved", false],
    ["waiting_client_approval", false], ["client_approved", false],
    ["ready_for_delivery", false], ["delivered", false],
    ["cancelled", false], ["archived", false],
  ] as const)("%s retains its editability boundary", (status, editable) => {
    render(<VersionContentForm deliverable={{ ...deliverable, status }} currentVersion={draft} />);
    expect(Boolean(screen.queryByRole("button", { name: "حفظ مسودة" }))).toBe(editable);
    expect(Boolean(screen.queryByLabelText("المحتوى"))).toBe(editable);
    expect(saveVersion).not.toHaveBeenCalled();
  });
});

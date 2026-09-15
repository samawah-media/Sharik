import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ClientApprovalPanel } from "@/ui/client/client-approval-panel";
import { clientStatusLabel } from "@/modules/deliverables/client-labels";
import userEvent from "@testing-library/user-event";

afterEach(() => cleanup());

const approvalItem = {
  clientId: "client_a",
  deliverableId: "r007_visible_deliverable",
  versionId: "r007_visible_version",
  expectedRevision: 3,
  displayName: "مخرج تجريبي آمن",
  typeLabel: "منشور",
  status: "waiting_client_approval",
  statusLabel: clientStatusLabel("waiting_client_approval"),
  versionLabel: "النسخة المعتمدة للعميل",
  dueDateLabel: "2026-07-12",
};

describe("R-007 client approval panel", () => {
  it("keeps compact decisions bound to their own payload and required reason", async () => {
    const user = userEvent.setup();
    const approveAction = vi.fn<(payload: FormData) => Promise<void>>().mockResolvedValue(undefined);
    const requestChangesAction = vi.fn<(payload: FormData) => Promise<void>>().mockResolvedValue(undefined);
    render(
      <ClientApprovalPanel
        canApprove
        item={approvalItem}
        showSummary={false}
        approveAction={approveAction}
        requestChangesAction={requestChangesAction}
      />,
    );
    const approve = screen.getByRole("button", {
      name: "اعتماد النسخة",
    }) as HTMLButtonElement;
    const changes = screen.getByRole("button", {
      name: "طلب تعديل",
    }) as HTMLButtonElement;
    const reason = screen.getByRole("textbox", { name: "سبب التعديل" });
    expect(reason).toBeRequired();
    expect(reason).toHaveAttribute("maxlength", "500");
    expect(reason).toHaveAttribute(
      "placeholder",
      "وش التعديل المطلوب على النسخة؟",
    );
    expect(changes.form!.checkValidity()).toBe(false);
    expect(approve.form!.checkValidity()).toBe(true);
    await user.type(reason, "يرجى تعديل عنوان النسخة");
    expect(changes.form!.checkValidity()).toBe(true);
    for (const [button, action, key, submittedReason, serverAction] of [
      [
        approve,
        "approve",
        "r007-client-approve-r007_visible_deliverable-3",
        "client_approval",
        approveAction,
      ],
      [
        changes,
        "request_changes",
        "r007-client-changes-r007_visible_deliverable-3",
        "يرجى تعديل عنوان النسخة",
        requestChangesAction,
      ],
    ] as const) {
      const payload = new FormData(button.form!);
      await user.click(button);
      await waitFor(() => expect(serverAction).toHaveBeenCalledTimes(1));
      const submittedPayload = serverAction.mock.calls[0][0];
      for (const [name, value] of Object.entries({
        clientApprovalAction: action,
        clientId: "client_a",
        deliverableId: "r007_visible_deliverable",
        versionId: "r007_visible_version",
        expectedRevision: "3",
        idempotencyKey: key,
        reason: submittedReason,
      })) {
        expect(payload.getAll(name)).toEqual([value]);
        expect(submittedPayload.getAll(name)).toEqual([value]);
      }
    }
    expect(approve.form).not.toBe(changes.form);
  });

  it.each([
    [false, true, "لا يتوفر إجراء على هذه النسخة الآن."],
    [true, false, "إجراءات الموافقة غير متاحة الآن."],
  ])(
    "keeps compact controls unavailable when actionable=%s and actions=%s",
    (isActionable, hasActions, message) => {
      render(
        <ClientApprovalPanel
          canApprove
          showSummary={false}
          item={{ ...approvalItem, isActionable }}
          approveAction={hasActions ? async () => undefined : undefined}
          requestChangesAction={hasActions ? async () => undefined : undefined}
        />,
      );
      expect(screen.getByText(message)).toBeVisible();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    },
  );

  it("blocks an approver decision when the review payload is missing", () => {
    render(
      <ClientApprovalPanel
        canApprove
        item={{
          ...approvalItem,
          isActionable: false,
          actionabilityReason: "missing_review_payload",
        }}
        approveAction={async () => undefined}
        requestChangesAction={async () => undefined}
      />,
    );

    const panel = screen.getByRole("region", { name: "قرار اعتماد العميل" });
    expect(
      within(panel).getByText(
        "هذه النسخة غير مكتملة ولا يمكن اتخاذ قرار عليها. يجري تجهيز محتوى صالح للمراجعة.",
        { exact: true },
      ),
    ).toBeVisible();
    expect(panel.querySelector("form")).not.toBeInTheDocument();
    expect(within(panel).queryByRole("button")).not.toBeInTheDocument();
    expect(within(panel).queryByRole("textbox")).not.toBeInTheDocument();
    expect(
      within(panel).queryByText("بانتظار قرارك", { selector: "p" }),
    ).not.toBeInTheDocument();
  });

  it("renders approve and change-request controls only for client approvers", () => {
    const approveAction = vi.fn();
    const requestChangesAction = vi.fn();

    render(
      <ClientApprovalPanel
        approveAction={approveAction}
        canApprove
        item={approvalItem}
        requestChangesAction={requestChangesAction}
      />,
    );

    const panel = screen.getByRole("region", { name: "قرار اعتماد العميل" });
    expect(panel).toHaveAttribute("dir", "rtl");
    expect(within(panel).getByText("مخرج تجريبي آمن")).toBeInTheDocument();
    expect(
      within(panel).getByRole("button", { name: "اعتماد النسخة" }),
    ).toBeInTheDocument();
    expect(
      within(panel).getByRole("button", { name: "طلب تعديل" }),
    ).toBeInTheDocument();
    expect(document.querySelector('input[name="versionId"]')).toHaveValue(
      "r007_visible_version",
    );
    expect(
      document.querySelector('input[name="expectedRevision"]'),
    ).toHaveValue("3");
    expect(within(panel).queryByText("ملاحظات داخلية")).not.toBeInTheDocument();
    expect(within(panel).queryByText("tenant_a")).not.toBeInTheDocument();
    expect(within(panel).queryByText("audit")).not.toBeInTheDocument();
  });

  it("keeps client viewers in read-only mode", () => {
    render(<ClientApprovalPanel canApprove={false} item={approvalItem} />);

    const panel = screen.getByRole("region", { name: "قرار اعتماد العميل" });
    expect(
      within(panel).getByText(/لا يملك صلاحية الاعتماد أو طلب التعديل/),
    ).toBeInTheDocument();
    expect(
      within(panel).queryByRole("button", { name: "اعتماد النسخة" }),
    ).not.toBeInTheDocument();
    expect(
      within(panel).queryByRole("button", { name: "طلب تعديل" }),
    ).not.toBeInTheDocument();
    expect(within(panel).getByText("مخرج تجريبي آمن")).toBeInTheDocument();
  });

  it.each([true, false])(
    "keeps the human version label beside the compact heading for canApprove=%s",
    (canApprove) => {
      render(
        <ClientApprovalPanel
          canApprove={canApprove}
          item={approvalItem}
          showSummary={false}
        />,
      );
      const heading = screen.getByRole("heading", {
        name: canApprove ? "قرار الاعتماد" : "صلاحية الحساب",
      });
      const version = within(heading.parentElement!).getByText(
        "النسخة المعتمدة للعميل",
      );
      expect(version).toBeVisible();
      expect(version.tagName).not.toBe("P");
      expect(screen.queryByText(approvalItem.displayName)).not.toBeInTheDocument();
    },
  );

  it.each([
    [true, true, true],
    [true, false, false],
    [false, true, false],
  ])(
    "only asks an actionable approver for a decision (%s, %s)",
    (canApprove, isActionable, asksForDecision) => {
      render(
        <ClientApprovalPanel
          canApprove={canApprove}
          item={{ ...approvalItem, isActionable }}
        />,
      );
      expect(Boolean(screen.queryByText("بانتظار قرارك", { selector: "p" }))).toBe(
        asksForDecision,
      );
    },
  );

  it.each(["approve", "request_changes"])(
    "blocks both decisions when the %s server action is missing",
    (missingAction) => {
      render(
        <ClientApprovalPanel
          canApprove
          item={approvalItem}
          approveAction={missingAction === "approve" ? undefined : async () => undefined}
          requestChangesAction={missingAction === "request_changes" ? undefined : async () => undefined}
        />,
      );
      expect(screen.getByText("إجراءات الموافقة غير متاحة الآن.")).toBeVisible();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    },
  );
});

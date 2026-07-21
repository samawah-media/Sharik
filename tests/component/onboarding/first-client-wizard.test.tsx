import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { MemberDisplay } from "@/modules/members/member-directory";
import { FirstClientWizard } from "@/ui/management/first-client-wizard";

const mockMembers: MemberDisplay[] = [
  { userId: "user-admin", displayName: "مدير سماوة", roleLabel: "إدارة", initial: "م" },
  { userId: "user-writer", displayName: "كاتب المحتوى", roleLabel: "كاتب محتوى", initial: "ك" },
  { userId: "user-designer", displayName: "المصمم", roleLabel: "مصمم", initial: "ا" },
];

const noopAction = vi.fn(async () => ({
  status: "idle" as const,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("FirstClientWizard", () => {
  it("renders step 0 (client info) by default with Arabic RTL form", () => {
    render(
      <FirstClientWizard
        runId="test-run-001"
        eligibleMembers={mockMembers}
        action={noopAction}
      />,
    );

    expect(
      screen.getByRole("form", { name: "معالج إضافة أول عميل" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("اسم العميل")).toBeInTheDocument();
    expect(screen.getAllByText("بيانات العميل").length).toBeGreaterThan(0);
  });

  it("prevents advancing to step 1 with an empty client name", () => {
    render(
      <FirstClientWizard
        runId="test-run-001"
        eligibleMembers={mockMembers}
        action={noopAction}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "التالي" }));
    expect(
      screen.getByText(/اسم العميل مطلوب/),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("اسم العقد")).not.toBeInTheDocument();
  });

  it("advances to step 1 when client name is valid", () => {
    render(
      <FirstClientWizard
        runId="test-run-001"
        eligibleMembers={mockMembers}
        action={noopAction}
      />,
    );

    fireEvent.change(screen.getByLabelText("اسم العميل"), {
      target: { value: "عميل تجريبي" },
    });
    fireEvent.click(screen.getByRole("button", { name: "التالي" }));
    expect(screen.getByLabelText("اسم العقد")).toBeInTheDocument();
  });

  it("allows navigating back from step 1 to step 0", () => {
    render(
      <FirstClientWizard
        runId="test-run-001"
        eligibleMembers={mockMembers}
        action={noopAction}
      />,
    );

    fireEvent.change(screen.getByLabelText("اسم العميل"), {
      target: { value: "عميل تجريبي" },
    });
    fireEvent.click(screen.getByRole("button", { name: "التالي" }));
    fireEvent.click(screen.getByRole("button", { name: "السابق" }));
    expect(screen.getByLabelText("اسم العميل")).toBeInTheDocument();
  });

  it("shows team members with human names on step 3", () => {
    render(
      <FirstClientWizard
        runId="test-run-001"
        eligibleMembers={mockMembers}
        action={noopAction}
      />,
    );

    fireEvent.change(screen.getByLabelText("اسم العميل"), {
      target: { value: "عميل تجريبي" },
    });
    fireEvent.click(screen.getByRole("button", { name: "التالي" }));
    fireEvent.change(screen.getByLabelText("اسم العقد"), {
      target: { value: "عقد تجريبي" },
    });
    fireEvent.click(screen.getByRole("button", { name: "التالي" }));
    fireEvent.change(screen.getByLabelText("اسم الباقة"), {
      target: { value: "باقة تجريبية" },
    });
    fireEvent.change(screen.getByLabelText("اسم الخدمة للسطر 1"), {
      target: { value: "منشورات" },
    });
    fireEvent.click(screen.getByRole("button", { name: "التالي" }));

    expect(screen.getByLabelText("المسؤول")).toBeInTheDocument();
    expect(screen.getByText("كاتب المحتوى")).toBeInTheDocument();
    expect(screen.getByText("المصمم")).toBeInTheDocument();
    expect(screen.queryByText("user-writer")).not.toBeInTheDocument();
  });

  it("reaches the review step and shows submit button", () => {
    render(
      <FirstClientWizard
        runId="test-run-001"
        eligibleMembers={mockMembers}
        action={noopAction}
      />,
    );

    fireEvent.change(screen.getByLabelText("اسم العميل"), {
      target: { value: "عميل تجريبي" },
    });
    fireEvent.click(screen.getByRole("button", { name: "التالي" }));

    fireEvent.change(screen.getByLabelText("اسم العقد"), {
      target: { value: "عقد تجريبي" },
    });
    fireEvent.click(screen.getByRole("button", { name: "التالي" }));

    fireEvent.change(screen.getByLabelText("اسم الباقة"), {
      target: { value: "باقة تجريبية" },
    });
    fireEvent.change(screen.getByLabelText("اسم الخدمة للسطر 1"), {
      target: { value: "منشورات" },
    });
    fireEvent.click(screen.getByRole("button", { name: "التالي" }));
    fireEvent.click(screen.getByRole("button", { name: "التالي" }));

    fireEvent.change(screen.getByLabelText("اسم المخرج"), {
      target: { value: "مخرج تجريبي" },
    });
    fireEvent.click(screen.getByRole("button", { name: "التالي" }));

    expect(
      screen.getByRole("button", { name: "إنشاء العميل والبدء" }),
    ).toBeInTheDocument();
    expect(screen.getByText("مراجعة وإنشاء")).toBeInTheDocument();
  });

  it("contains all hidden form fields for server action submission", () => {
    render(
      <FirstClientWizard
        runId="test-run-001"
        eligibleMembers={mockMembers}
        action={noopAction}
      />,
    );

    const form = screen.getByRole("form", { name: "معالج إضافة أول عميل" });
    expect(form.querySelector('input[name="runId"]')).toHaveValue("test-run-001");
    expect(form.querySelector('input[name="contractStatus"]')).toHaveValue("active");
    expect(form.querySelector('input[name="packageStatus"]')).toHaveValue("active");
    expect(form.querySelector('input[name="packageLinesJson"]')).toBeInTheDocument();
    expect(form.querySelector('input[name="requiresInternalApproval"]')).toHaveValue("true");
  });
});

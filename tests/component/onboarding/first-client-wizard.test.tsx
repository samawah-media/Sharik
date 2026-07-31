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

describe("FirstClientWizard — X010-B-2", () => {
  it("renders step 0 (client info) with clear Arabic company/contact labels", () => {
    render(
      <FirstClientWizard
        runId="test-run-001"
        eligibleMembers={mockMembers}
        action={noopAction}
      />,
    );

    expect(
      screen.getByRole("form", { name: "معالج إضافة عميل جديد" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("اسم الشركة أو الجهة")).toBeInTheDocument();
    expect(screen.getByLabelText("اسم مسؤول التواصل")).toBeInTheDocument();
    expect(screen.getByLabelText("البريد الإلكتروني")).toBeInTheDocument();
    expect(screen.getByLabelText("رقم الهاتف / واتساب")).toBeInTheDocument();
  });

  it("prevents advancing to step 1 with an empty company name and keeps the field", () => {
    render(
      <FirstClientWizard
        runId="test-run-001"
        eligibleMembers={mockMembers}
        action={noopAction}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "التالي" }));
    expect(
      screen.getByText(/اسم الشركة أو الجهة مطلوب/),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("اسم العقد")).not.toBeInTheDocument();
  });

  it("preserves entered values after a validation error (no data loss)", () => {
    render(
      <FirstClientWizard
        runId="test-run-001"
        eligibleMembers={mockMembers}
        action={noopAction}
      />,
    );

    const companyInput = screen.getByLabelText("اسم الشركة أو الجهة");
    fireEvent.change(companyInput, { target: { value: "شركة النور" } });
    expect(companyInput).toHaveValue("شركة النور");
    fireEvent.click(screen.getByRole("button", { name: "التالي" }));
    expect(companyInput).toHaveValue("شركة النور");
  });

  it("advances to step 1 when company name is valid", () => {
    render(
      <FirstClientWizard
        runId="test-run-001"
        eligibleMembers={mockMembers}
        action={noopAction}
      />,
    );

    fireEvent.change(screen.getByLabelText("اسم الشركة أو الجهة"), {
      target: { value: "عميل تجريبي" },
    });
    fireEvent.click(screen.getByRole("button", { name: "التالي" }));
    expect(screen.getByLabelText("اسم العقد")).toBeInTheDocument();
  });

  it("rejects an obviously invalid phone number on step 0", () => {
    render(
      <FirstClientWizard
        runId="test-run-001"
        eligibleMembers={mockMembers}
        action={noopAction}
      />,
    );

    fireEvent.change(screen.getByLabelText("اسم الشركة أو الجهة"), {
      target: { value: "عميل تجريبي" },
    });
    fireEvent.change(screen.getByLabelText("رقم الهاتف / واتساب"), {
      target: { value: "abc-not-a-phone" },
    });
    fireEvent.click(screen.getByRole("button", { name: "التالي" }));
    expect(screen.getByText(/رقم الهاتف \/ واتساب غير صحيح/)).toBeInTheDocument();
    expect(screen.queryByLabelText("اسم العقد")).not.toBeInTheDocument();
  });

  it("accepts a valid international phone and advances", () => {
    render(
      <FirstClientWizard
        runId="test-run-001"
        eligibleMembers={mockMembers}
        action={noopAction}
      />,
    );

    fireEvent.change(screen.getByLabelText("اسم الشركة أو الجهة"), {
      target: { value: "عميل تجريبي" },
    });
    fireEvent.change(screen.getByLabelText("رقم الهاتف / واتساب"), {
      target: { value: "+966 50 123 4567" },
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

    fireEvent.change(screen.getByLabelText("اسم الشركة أو الجهة"), {
      target: { value: "عميل تجريبي" },
    });
    fireEvent.click(screen.getByRole("button", { name: "التالي" }));
    fireEvent.click(screen.getByRole("button", { name: "السابق" }));
    expect(screen.getByLabelText("اسم الشركة أو الجهة")).toBeInTheDocument();
  });

  it("adds and removes multiple package services without creating a new package", () => {
    render(
      <FirstClientWizard
        runId="test-run-001"
        eligibleMembers={mockMembers}
        action={noopAction}
      />,
    );

    fireEvent.change(screen.getByLabelText("اسم الشركة أو الجهة"), {
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

    fireEvent.click(screen.getByRole("button", { name: "إضافة خدمة" }));
    expect(screen.getByLabelText("اسم الخدمة للسطر 2")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("اسم الخدمة للسطر 2"), {
      target: { value: "ريلز" },
    });

    fireEvent.click(screen.getAllByRole("button", { name: "حذف هذه الخدمة" })[0]);
    expect(screen.queryByLabelText("اسم الخدمة للسطر 2")).not.toBeInTheDocument();
  });

  it("uses progressive disclosure for optional contract details", () => {
    render(
      <FirstClientWizard
        runId="test-run-001"
        eligibleMembers={mockMembers}
        action={noopAction}
      />,
    );

    fireEvent.change(screen.getByLabelText("اسم الشركة أو الجهة"), {
      target: { value: "عميل تجريبي" },
    });
    fireEvent.click(screen.getByRole("button", { name: "التالي" }));

    expect(screen.queryByLabelText("مرجع العقد")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /تفاصيل إضافية/ }));
    expect(screen.getByLabelText("مرجع العقد")).toBeInTheDocument();
  });

  it("shows team members with human names and Arabic role labels on step 3", () => {
    render(
      <FirstClientWizard
        runId="test-run-001"
        eligibleMembers={mockMembers}
        action={noopAction}
      />,
    );

    fireEvent.change(screen.getByLabelText("اسم الشركة أو الجهة"), {
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

    expect(screen.getByLabelText("المسؤول الرئيسي عن العمل")).toBeInTheDocument();
    expect(screen.getByText("كاتب المحتوى")).toBeInTheDocument();
    expect(screen.getByText("المصمم")).toBeInTheDocument();
    expect(screen.queryByText("user-writer")).not.toBeInTheDocument();
  });

  it("hides empty optional fields in the review step", () => {
    render(
      <FirstClientWizard
        runId="test-run-001"
        eligibleMembers={mockMembers}
        action={noopAction}
      />,
    );

    fireEvent.change(screen.getByLabelText("اسم الشركة أو الجهة"), {
      target: { value: "شركة النور" },
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
    expect(screen.getByText("شركة النور")).toBeInTheDocument();
    expect(screen.queryByText("المرجع:")).not.toBeInTheDocument();
  });

  it("contains all hidden form fields for server action submission including phone", () => {
    render(
      <FirstClientWizard
        runId="test-run-001"
        eligibleMembers={mockMembers}
        action={noopAction}
      />,
    );

    const form = screen.getByRole("form", { name: "معالج إضافة عميل جديد" });
    expect(form.querySelector('input[name="runId"]')).toHaveValue("test-run-001");
    expect(form.querySelector('input[name="contractStatus"]')).toHaveValue("active");
    expect(form.querySelector('input[name="packageStatus"]')).toHaveValue("active");
    expect(form.querySelector('input[name="packageLinesJson"]')).toBeInTheDocument();
    expect(form.querySelector('input[name="clientContactPhone"]')).toBeInTheDocument();
    expect(form.querySelector('input[name="requiresInternalApproval"]')).toHaveValue("true");
  });
});

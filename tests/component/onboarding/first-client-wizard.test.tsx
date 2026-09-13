import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { formatArabicDate, formatArabicDateRange } from "@/modules/localization/arabic-display";
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

describe("FirstClientWizard — X010-B-7C-8 field validation", () => {
  it("focuses the company name field, not the phone, on empty submit and wires an inline error", async () => {
    render(
      <FirstClientWizard
        runId="test-run-001"
        eligibleMembers={mockMembers}
        action={noopAction}
      />,
    );

    const companyInput = screen.getByLabelText("اسم الشركة أو الجهة");
    const phoneInput = screen.getByLabelText("رقم الهاتف / واتساب");

    fireEvent.click(screen.getByRole("button", { name: "التالي" }));

    await waitFor(() => expect(companyInput).toHaveFocus());
    expect(phoneInput).not.toHaveFocus();

    expect(companyInput).toHaveAttribute("aria-invalid", "true");
    expect(companyInput).toHaveAttribute(
      "aria-describedby",
      "onboarding-error-clientName",
    );
    expect(
      screen.getByText(/اسم الشركة أو الجهة مطلوب/),
    ).toBeInTheDocument();
    expect(screen.getByText(/اسم الشركة أو الجهة مطلوب/)).toHaveAttribute(
      "id",
      "onboarding-error-clientName",
    );

    // The optional empty phone must not be flagged as the first error.
    expect(phoneInput).not.toHaveAttribute("aria-invalid");
  });

  it("clears only the corrected field error and preserves other entered values", async () => {
    render(
      <FirstClientWizard
        runId="test-run-001"
        eligibleMembers={mockMembers}
        action={noopAction}
      />,
    );

    const companyInput = screen.getByLabelText("اسم الشركة أو الجهة");
    const contactInput = screen.getByLabelText("اسم مسؤول التواصل");
    fireEvent.change(contactInput, { target: { value: "أحمد الاسم" } });

    fireEvent.click(screen.getByRole("button", { name: "التالي" }));
    await waitFor(() =>
      expect(companyInput).toHaveAttribute("aria-invalid", "true"),
    );

    fireEvent.change(companyInput, { target: { value: "شركة النور" } });

    expect(companyInput).not.toHaveAttribute("aria-invalid");
    expect(screen.queryByText(/اسم الشركة أو الجهة مطلوب/)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/تعذّر المتابعة — راجع الحقول/),
    ).not.toBeInTheDocument();
    expect(contactInput).toHaveValue("أحمد الاسم");
    expect(companyInput).toHaveValue("شركة النور");
  });

  it("focuses the invalid phone field when the company name is valid", async () => {
    render(
      <FirstClientWizard
        runId="test-run-001"
        eligibleMembers={mockMembers}
        action={noopAction}
      />,
    );

    const companyInput = screen.getByLabelText("اسم الشركة أو الجهة");
    const phoneInput = screen.getByLabelText("رقم الهاتف / واتساب");

    fireEvent.change(companyInput, { target: { value: "عميل تجريبي" } });
    fireEvent.change(phoneInput, { target: { value: "abc-not-a-phone" } });
    fireEvent.click(screen.getByRole("button", { name: "التالي" }));

    await waitFor(() => expect(phoneInput).toHaveFocus());
    expect(companyInput).not.toHaveAttribute("aria-invalid");
    expect(phoneInput).toHaveAttribute("aria-invalid", "true");
    expect(phoneInput).toHaveAttribute(
      "aria-describedby",
      "onboarding-error-clientContactPhone",
    );
    expect(screen.queryByLabelText("اسم العقد")).not.toBeInTheDocument();
  });

  it("binds the deliverable date-ordering error to the offending date field", async () => {
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
    fireEvent.click(screen.getByRole("button", { name: "التالي" }));

    fireEvent.change(screen.getByLabelText("اسم المخرج"), {
      target: { value: "مخرج تجريبي" },
    });
    fireEvent.change(screen.getByLabelText("تاريخ البدء"), {
      target: { value: "2026-07-10" },
    });
    fireEvent.change(screen.getByLabelText("الموعد الداخلي"), {
      target: { value: "2026-07-01" },
    });
    fireEvent.click(screen.getByRole("button", { name: "التالي" }));

    const internalDate = screen.getByLabelText("الموعد الداخلي");
    await waitFor(() => expect(internalDate).toHaveFocus());
    expect(internalDate).toHaveAttribute("aria-invalid", "true");
    expect(internalDate).toHaveAttribute(
      "aria-describedby",
      "onboarding-error-internalDueDate",
    );
    expect(screen.getByText(/المواعيد غير مرتبة بشكل صحيح/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "إنشاء العميل والبدء" })).not.toBeInTheDocument();
  });

  it("reopens optional package dates and focuses the invalid hidden end date", async () => {
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

    fireEvent.click(
      screen.getByRole("button", { name: "تحديد فترة الباقة (اختياري)" }),
    );
    fireEvent.change(screen.getByLabelText("بداية فترة الباقة"), {
      target: { value: "2026-08-31" },
    });
    fireEvent.change(screen.getByLabelText("نهاية فترة الباقة"), {
      target: { value: "2026-08-01" },
    });
    fireEvent.click(screen.getByRole("button", { name: "إخفاء فترة الباقة" }));

    fireEvent.click(screen.getByRole("button", { name: "التالي" }));

    const packageEndDate = await screen.findByLabelText("نهاية فترة الباقة");
    await waitFor(() => expect(packageEndDate).toHaveFocus());
    expect(packageEndDate).toHaveAttribute("aria-invalid", "true");
    expect(packageEndDate).toHaveAttribute(
      "aria-describedby",
      "onboarding-error-packagePeriodEnd",
    );
    expect(screen.getByText(/بداية فترة الباقة بعد نهايتها/)).toBeInTheDocument();
  });
});

describe("FirstClientWizard — X010-B-7C-8 review step", () => {
  const fillAndReachReview = () => {
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
    fireEvent.change(screen.getByLabelText("اسم مسؤول التواصل"), {
      target: { value: "أحمد الاسم" },
    });
    fireEvent.change(screen.getByLabelText("رقم الهاتف / واتساب"), {
      target: { value: "+966 50 123 4567" },
    });
    fireEvent.change(screen.getByLabelText("البريد الإلكتروني"), {
      target: { value: "ahmed@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "التالي" }));

    fireEvent.change(screen.getByLabelText("اسم العقد"), {
      target: { value: "عقد تجريبي" },
    });
    fireEvent.change(screen.getByLabelText("تاريخ بداية العقد"), {
      target: { value: "2026-07-01" },
    });
    fireEvent.change(screen.getByLabelText("تاريخ نهاية العقد"), {
      target: { value: "2026-08-31" },
    });
    fireEvent.click(screen.getByRole("button", { name: "تفاصيل إضافية (اختياري)" }));
    fireEvent.change(screen.getByLabelText("مرجع العقد"), {
      target: { value: "REF-100" },
    });
    fireEvent.click(screen.getByRole("button", { name: "التالي" }));

    fireEvent.change(screen.getByLabelText("اسم الباقة"), {
      target: { value: "باقة تجريبية" },
    });
    fireEvent.change(screen.getByLabelText("اسم الخدمة للسطر 1"), {
      target: { value: "منشورات" },
    });
    fireEvent.click(screen.getByRole("button", { name: "التالي" }));

    fireEvent.change(screen.getByLabelText("المسؤول الرئيسي عن العمل"), {
      target: { value: "user-writer" },
    });
    fireEvent.click(
      screen.getByLabelText("إضافة المصمم كعضو فريق مشارك"),
    );
    fireEvent.click(screen.getByRole("button", { name: "التالي" }));

    fireEvent.change(screen.getByLabelText("اسم المخرج"), {
      target: { value: "مخرج تجريبي" },
    });
    fireEvent.change(screen.getByLabelText("وصف المخرج"), {
      target: { value: "وصف تجريبي هادف" },
    });
    fireEvent.change(screen.getByLabelText("نوع المخرج"), {
      target: { value: "design" },
    });
    fireEvent.change(screen.getByLabelText("الأولوية"), {
      target: { value: "high" },
    });
    fireEvent.change(screen.getByLabelText("تاريخ البدء"), {
      target: { value: "2026-07-10" },
    });
    fireEvent.change(screen.getByLabelText("الموعد الداخلي"), {
      target: { value: "2026-07-15" },
    });
    fireEvent.change(screen.getByLabelText("موعد العميل"), {
      target: { value: "2026-07-20" },
    });
    fireEvent.change(screen.getByLabelText("الموعد النهائي"), {
      target: { value: "2026-07-25" },
    });
    fireEvent.click(screen.getByLabelText("يتطلب اعتماد العميل"));
    fireEvent.click(screen.getByRole("button", { name: "التالي" }));

    return screen.getByRole("button", { name: "إنشاء العميل والبدء" });
  };

  it("presents the owner and contributors with human names and Arabic roles", () => {
    const submitButton = fillAndReachReview();

    expect(submitButton).toBeInTheDocument();
    expect(screen.getByText(/كاتب المحتوى — كاتب محتوى/)).toBeInTheDocument();
    expect(screen.getByText("المصمم:")).toBeInTheDocument();
    expect(screen.getByText("مصمم")).toBeInTheDocument();

    // No raw identifiers anywhere in the review text.
    expect(screen.queryByText(/user-writer/)).not.toBeInTheDocument();
    expect(screen.queryByText(/user-designer/)).not.toBeInTheDocument();
    expect(screen.queryByText(/user-admin/)).not.toBeInTheDocument();
  });

  it("presents all four deliverable dates in Arabic and the approval settings", () => {
    fillAndReachReview();

    expect(screen.getByText(formatArabicDate("2026-07-10"))).toBeInTheDocument();
    expect(screen.getByText(formatArabicDate("2026-07-15"))).toBeInTheDocument();
    expect(screen.getByText(formatArabicDate("2026-07-20"))).toBeInTheDocument();
    expect(screen.getByText(formatArabicDate("2026-07-25"))).toBeInTheDocument();

    expect(screen.getByText("يتطلب تعميدًا داخليًا:")).toBeInTheDocument();
    expect(screen.getByText("نعم")).toBeInTheDocument();
    expect(screen.getByText("يتطلب اعتماد العميل:")).toBeInTheDocument();
    expect(screen.getByText("لا")).toBeInTheDocument();
  });

  it("presents deliverable metadata and contract/client details without raw enums", () => {
    fillAndReachReview();

    expect(screen.getByText("النوع:")).toBeInTheDocument();
    expect(screen.getByText("تصميم")).toBeInTheDocument();
    expect(screen.getByText("الأولوية:")).toBeInTheDocument();
    expect(screen.getByText("مرتفعة")).toBeInTheDocument();
    expect(screen.getByText("الوصف:")).toBeInTheDocument();
    expect(screen.getByText("وصف تجريبي هادف")).toBeInTheDocument();
    expect(screen.getByText("REF-100")).toBeInTheDocument();
    expect(screen.getByText("أحمد الاسم")).toBeInTheDocument();
    expect(screen.getByText("ahmed@example.com")).toBeInTheDocument();
    expect(
      screen.getByText(formatArabicDateRange("2026-07-01", "2026-08-31")),
    ).toBeInTheDocument();

    expect(screen.queryByText(/design|high|post|normal/)).not.toBeInTheDocument();
  });
});

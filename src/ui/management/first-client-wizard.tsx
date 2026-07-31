"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import type { MemberDisplay } from "@/modules/members/member-directory";
import type { OnboardingFormState } from "@/modules/onboarding/onboarding-form-state";
import { initialOnboardingFormState } from "@/modules/onboarding/onboarding-form-state";
import { isCountUnitLabel } from "@/modules/packages/package-quantity";
import { isValidContactPhone, normalizeContactPhone } from "@/modules/clients/contact-phone";
import { onboardFirstClientAction } from "@/server/actions/onboarding";
import { Button } from "@/ui/core/button";

type PackageLineDraft = {
  serviceLabel: string;
  deliverableTypeHint: string;
  unitLabel: string;
  committedQuantity: string;
};

type WizardData = {
  clientName: string;
  clientContactName: string;
  clientContactEmail: string;
  clientContactPhone: string;
  contractName: string;
  contractReference: string;
  contractSummary: string;
  contractPeriodStart: string;
  contractPeriodEnd: string;
  packageName: string;
  packagePeriodStart: string;
  packagePeriodEnd: string;
  packageLines: PackageLineDraft[];
  deliverableName: string;
  deliverableDescription: string;
  deliverableType: string;
  deliverablePriority: string;
  ownerUserId: string;
  contributorUserIds: string[];
  startDate: string;
  internalDueDate: string;
  clientDueDate: string;
  finalDueDate: string;
  requiresInternalApproval: boolean;
  requiresClientApproval: boolean;
  reservedQuantity: string;
};

const stepLabels = [
  "بيانات العميل",
  "العقد",
  "الباقة",
  "الفريق",
  "أول مخرج",
  "مراجعة وإنشاء",
] as const;

const typeOptions = [
  { value: "post", label: "منشور" },
  { value: "reel", label: "ريلز" },
  { value: "story", label: "ستوري" },
  { value: "design", label: "تصميم" },
  { value: "report", label: "تقرير" },
  { value: "video", label: "فيديو" },
  { value: "campaign", label: "حملة" },
  { value: "article", label: "مقال" },
];

const priorityOptions = [
  { value: "low", label: "منخفضة" },
  { value: "normal", label: "عادية" },
  { value: "high", label: "مرتفعة" },
  { value: "urgent", label: "عاجلة" },
];

const initialData: WizardData = {
  clientName: "",
  clientContactName: "",
  clientContactEmail: "",
  clientContactPhone: "",
  contractName: "",
  contractReference: "",
  contractSummary: "",
  contractPeriodStart: "",
  contractPeriodEnd: "",
  packageName: "",
  packagePeriodStart: "",
  packagePeriodEnd: "",
  packageLines: [
    {
      serviceLabel: "",
      deliverableTypeHint: "",
      unitLabel: "منشور",
      committedQuantity: "1",
    },
  ],
  deliverableName: "",
  deliverableDescription: "",
  deliverableType: "post",
  deliverablePriority: "normal",
  ownerUserId: "",
  contributorUserIds: [],
  startDate: "",
  internalDueDate: "",
  clientDueDate: "",
  finalDueDate: "",
  requiresInternalApproval: true,
  requiresClientApproval: true,
  reservedQuantity: "1",
};

const fieldClass =
  "rounded-md border border-border bg-background px-3 py-2";

const helperClass = "text-xs text-muted";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} type="submit" variant="primary">
      {pending ? "جار الإنشاء..." : "إنشاء العميل والبدء"}
    </Button>
  );
}

function StepIndicator({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <ol
      aria-label="خطوات الإنشاء"
      className="flex flex-wrap gap-2"
      dir="rtl"
    >
      {stepLabels.slice(0, total).map((label, index) => (
        <li key={label}>
          <span
            aria-current={index === current ? "step" : undefined}
            className={
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold " +
              (index === current
                ? "bg-accent text-white"
                : index < current
                  ? "bg-accent-soft text-accent"
                  : "border border-border text-muted")
            }
          >
            <span>{index + 1}</span>
            <span>{label}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export function FirstClientWizard({
  runId,
  eligibleMembers = [],
  memberDirectoryAvailable = true,
  action,
}: {
  runId: string;
  eligibleMembers?: MemberDisplay[];
  memberDirectoryAvailable?: boolean;
  action?: (
    previousState: OnboardingFormState,
    formData: FormData,
  ) => Promise<OnboardingFormState>;
}) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(initialData);
  const dataRef = useRef<WizardData>(initialData);
  const formRef = useRef<HTMLFormElement | null>(null);
  const errorFieldRef = useRef<HTMLFieldSetElement | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [showContractDetails, setShowContractDetails] = useState(false);
  const [showPackageDetails, setShowPackageDetails] = useState(false);
  const [state, formAction] = useActionState(
    action ?? onboardFirstClientAction,
    initialOnboardingFormState,
  );

  useEffect(() => {
    formRef.current?.setAttribute("data-hydrated", "true");
  }, []);

  const update = <K extends keyof WizardData>(key: K, value: WizardData[K]) => {
    const nextData = { ...dataRef.current, [key]: value };
    dataRef.current = nextData;
    setData(nextData);
    setStepError(null);
  };

  const updateLine = (
    index: number,
    field: keyof PackageLineDraft,
    value: string,
  ) => {
    const nextData = {
      ...dataRef.current,
      packageLines: dataRef.current.packageLines.map((line, i) =>
        i === index ? { ...line, [field]: value } : line,
      ),
    };
    dataRef.current = nextData;
    setData(nextData);
    setStepError(null);
  };

  const addLine = () => {
    const nextData = {
      ...dataRef.current,
      packageLines: [
        ...dataRef.current.packageLines,
        {
          serviceLabel: "",
          deliverableTypeHint: "",
          unitLabel: "منشور",
          committedQuantity: "1",
        },
      ],
    };
    dataRef.current = nextData;
    setData(nextData);
  };

  const removeLine = (index: number) => {
    const nextData = {
      ...dataRef.current,
      packageLines:
        dataRef.current.packageLines.length > 1
          ? dataRef.current.packageLines.filter((_, i) => i !== index)
          : dataRef.current.packageLines,
    };
    dataRef.current = nextData;
    setData(nextData);
  };

  const focusFirstError = () => {
    const fieldset = errorFieldRef.current;
    if (!fieldset) {
      return;
    }
    const focusable = fieldset.querySelector<HTMLElement>(
      "input, select, textarea",
    );
    focusable?.focus();
  };

  const validateStep = (target: number): string | null => {
    const currentData = dataRef.current;

    if (target === 0) {
      if (currentData.clientName.trim().length < 2)
        return "اسم الشركة أو الجهة مطلوب (حرفان على الأقل).";
      if (
        currentData.clientContactPhone.trim().length > 0 &&
        !isValidContactPhone(currentData.clientContactPhone)
      )
        return "رقم الهاتف / واتساب غير صحيح. استخدم رمز الدولة والأرقام فقط.";
    }

    if (target === 1) {
      if (currentData.contractName.trim().length < 2)
        return "اسم العقد مطلوب (حرفان على الأقل).";
      if (
        currentData.contractPeriodStart &&
        currentData.contractPeriodEnd &&
        currentData.contractPeriodStart > currentData.contractPeriodEnd
      )
        return "تاريخ بداية العقد بعد تاريخ نهايته.";
    }

    if (target === 2) {
      if (currentData.packageName.trim().length < 2)
        return "اسم الباقة مطلوب (حرفان على الأقل).";
      if (
        currentData.packagePeriodStart &&
        currentData.packagePeriodEnd &&
        currentData.packagePeriodStart > currentData.packagePeriodEnd
      )
        return "بداية فترة الباقة بعد نهايتها.";
      for (const line of currentData.packageLines) {
        if (line.serviceLabel.trim().length < 2)
          return "كل خدمة في الباقة تحتاج اسمًا (حرفان على الأقل).";
        if (line.unitLabel.trim().length < 1)
          return "وحدة القياس مطلوبة لكل خدمة.";
        const qty = Number(line.committedQuantity);
        if (!Number.isFinite(qty) || qty < 0)
          return "الكمية المتفق عليها يجب أن تكون صفر أو أكثر.";
        if (
          isCountUnitLabel(line.unitLabel) &&
          !Number.isInteger(qty)
        )
          return "الكمية لوحدات العدّ (مثل منشور) يجب أن تكون عددًا صحيحًا بدون كسور.";
      }
    }

    if (target === 4) {
      if (currentData.deliverableName.trim().length < 2)
        return "اسم المخرج مطلوب (حرفان على الأقل).";
      if (currentData.deliverableType.trim().length < 1)
        return "نوع المخرج مطلوب.";
      const dates = [
        currentData.startDate,
        currentData.internalDueDate,
        currentData.clientDueDate,
        currentData.finalDueDate,
      ].filter(Boolean);
      if (
        dates.some((d, i) => i > 0 && d < dates[i - 1])
      )
        return "المواعيد غير مرتبة بشكل صحيح.";
      const firstLineQty = Number(
        currentData.packageLines[0]?.committedQuantity ?? 0,
      );
      const reserved = Number(currentData.reservedQuantity);
      if (Number.isFinite(reserved) && reserved > firstLineQty)
        return "الكمية المحجوزة أكبر من سعة أول خدمة في الباقة.";
      const firstLineUnit = currentData.packageLines[0]?.unitLabel ?? "";
      if (
        isCountUnitLabel(firstLineUnit) &&
        Number.isFinite(reserved) &&
        !Number.isInteger(reserved)
      )
        return "الكمية المحجوزة لوحدات العدّ يجب أن تكون عددًا صحيحًا.";
    }

    return null;
  };

  const next = () => {
    const error = validateStep(step);
    if (error) {
      setStepError(error);
      requestAnimationFrame(focusFirstError);
      return;
    }
    setStepError(null);
    setStep((s) => Math.min(s + 1, stepLabels.length - 1));
  };

  const back = () => {
    setStepError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const toggleContributor = (userId: string) => {
    const nextData = {
      ...dataRef.current,
      contributorUserIds: dataRef.current.contributorUserIds.includes(userId)
        ? dataRef.current.contributorUserIds.filter((id) => id !== userId)
        : [...dataRef.current.contributorUserIds, userId],
    };
    dataRef.current = nextData;
    setData(nextData);
  };

  const packageLinesJson = JSON.stringify(
    data.packageLines.map((line) => ({
      serviceLabel: line.serviceLabel,
      deliverableTypeHint: line.deliverableTypeHint || undefined,
      unitLabel: line.unitLabel,
      committedQuantity: Number(line.committedQuantity) || 0,
    })),
  );

  const normalizedPhone = normalizeContactPhone(data.clientContactPhone);

  return (
    <form
      action={formAction}
      aria-label="معالج إضافة عميل جديد"
      data-hydrated="false"
      dir="rtl"
      ref={formRef}
    >
      <input name="runId" type="hidden" value={runId} />
      <input name="clientName" type="hidden" value={data.clientName} />
      <input name="clientContactName" type="hidden" value={data.clientContactName} />
      <input name="clientContactEmail" type="hidden" value={data.clientContactEmail} />
      <input name="clientContactPhone" type="hidden" value={normalizedPhone} />
      <input name="contractName" type="hidden" value={data.contractName} />
      <input name="contractReference" type="hidden" value={data.contractReference} />
      <input name="contractSummary" type="hidden" value={data.contractSummary} />
      <input name="contractPeriodStart" type="hidden" value={data.contractPeriodStart} />
      <input name="contractPeriodEnd" type="hidden" value={data.contractPeriodEnd} />
      <input name="contractStatus" type="hidden" value="active" />
      <input name="packageName" type="hidden" value={data.packageName} />
      <input name="packagePeriodStart" type="hidden" value={data.packagePeriodStart} />
      <input name="packagePeriodEnd" type="hidden" value={data.packagePeriodEnd} />
      <input name="packageStatus" type="hidden" value="active" />
      <input name="packageLinesJson" type="hidden" value={packageLinesJson} />
      <input name="deliverableName" type="hidden" value={data.deliverableName} />
      <input name="deliverableDescription" type="hidden" value={data.deliverableDescription} />
      <input name="deliverableType" type="hidden" value={data.deliverableType} />
      <input name="deliverablePriority" type="hidden" value={data.deliverablePriority} />
      <input name="ownerUserId" type="hidden" value={data.ownerUserId} />
      {data.contributorUserIds.map((userId) => (
        <input key={userId} name="contributorUserIds" type="hidden" value={userId} />
      ))}
      <input name="startDate" type="hidden" value={data.startDate} />
      <input name="internalDueDate" type="hidden" value={data.internalDueDate} />
      <input name="clientDueDate" type="hidden" value={data.clientDueDate} />
      <input name="finalDueDate" type="hidden" value={data.finalDueDate} />
      <input name="requiresInternalApproval" type="hidden" value={data.requiresInternalApproval ? "true" : "false"} />
      <input name="requiresClientApproval" type="hidden" value={data.requiresClientApproval ? "true" : "false"} />
      <input name="reservedQuantity" type="hidden" value={data.reservedQuantity} />

      <div className="grid gap-5">
        <StepIndicator current={step} total={stepLabels.length} />

        {step === 0 ? (
          <fieldset className="grid gap-4" aria-label="بيانات العميل" ref={errorFieldRef}>
            <legend className="sr-only">بيانات العميل</legend>
            <p className={helperClass}>
              أدخل اسم الجهة التي ستتولى العمل معها. هذا الاسم يظهر في كل المساحة.
            </p>
            <label className="grid gap-2 text-sm font-medium">
              اسم الشركة أو الجهة
              <input
                aria-label="اسم الشركة أو الجهة"
                className={fieldClass}
                onChange={(e) => update("clientName", e.target.value)}
                value={data.clientName}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                اسم مسؤول التواصل
                <input
                  aria-label="اسم مسؤول التواصل"
                  className={fieldClass}
                  onChange={(e) => update("clientContactName", e.target.value)}
                  value={data.clientContactName}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                رقم الهاتف / واتساب
                <input
                  aria-label="رقم الهاتف / واتساب"
                  className={fieldClass}
                  dir="ltr"
                  inputMode="tel"
                  onChange={(e) => update("clientContactPhone", e.target.value)}
                  placeholder="+9665XXXXXXXX"
                  value={data.clientContactPhone}
                />
              </label>
            </div>
            <label className="grid gap-2 text-sm font-medium">
              البريد الإلكتروني
              <input
                aria-label="البريد الإلكتروني"
                className={fieldClass}
                dir="ltr"
                onChange={(e) => update("clientContactEmail", e.target.value)}
                type="email"
                value={data.clientContactEmail}
              />
            </label>
          </fieldset>
        ) : null}

        {step === 1 ? (
          <fieldset className="grid gap-4" aria-label="بيانات العقد" ref={errorFieldRef}>
            <legend className="sr-only">بيانات العقد</legend>
            <label className="grid gap-2 text-sm font-medium">
              اسم العقد
              <input
                aria-label="اسم العقد"
                className={fieldClass}
                onChange={(e) => update("contractName", e.target.value)}
                value={data.contractName}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                تاريخ بداية العقد
                <input
                  aria-label="تاريخ بداية العقد"
                  className={fieldClass}
                  onChange={(e) => update("contractPeriodStart", e.target.value)}
                  type="date"
                  value={data.contractPeriodStart}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                تاريخ نهاية العقد
                <input
                  aria-label="تاريخ نهاية العقد"
                  className={fieldClass}
                  onChange={(e) => update("contractPeriodEnd", e.target.value)}
                  type="date"
                  value={data.contractPeriodEnd}
                />
              </label>
            </div>
            <div className="rounded-lg border border-border p-3">
              <button
                aria-expanded={showContractDetails}
                aria-controls="contract-details"
                className="text-sm font-semibold text-accent"
                onClick={() => setShowContractDetails((prev) => !prev)}
                type="button"
              >
                {showContractDetails ? "إخفاء تفاصيل إضافية" : "تفاصيل إضافية (اختياري)"}
              </button>
              {showContractDetails ? (
                <div id="contract-details" className="mt-3 grid gap-4">
                  <label className="grid gap-2 text-sm font-medium">
                    مرجع العقد — اختياري
                    <input
                      aria-label="مرجع العقد"
                      className={fieldClass}
                      onChange={(e) => update("contractReference", e.target.value)}
                      value={data.contractReference}
                    />
                    <span className={helperClass}>
                      مرجع داخلي يساعدك على تمييز العقد لاحقًا (مثل رقم اتفاقية أو كود). يظهر للفريق فقط ولا يُرسل للعميل.
                    </span>
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    ملخص العقد
                    <textarea
                      aria-label="ملخص العقد"
                      className={`${fieldClass} min-h-24`}
                      onChange={(e) => update("contractSummary", e.target.value)}
                      value={data.contractSummary}
                    />
                  </label>
                </div>
              ) : null}
            </div>
          </fieldset>
        ) : null}

        {step === 2 ? (
          <fieldset className="grid gap-4" aria-label="بيانات الباقة" ref={errorFieldRef}>
            <legend className="sr-only">بيانات الباقة</legend>
            <p className={helperClass}>
              الباقة تجمع كل الخدمات المتفق عليها مع العميل في عقد واحد. يمكنك إضافة أكثر من خدمة دون الحاجة لإنشاء باقة لكل خدمة.
            </p>
            <label className="grid gap-2 text-sm font-medium">
              اسم الباقة
              <input
                aria-label="اسم الباقة"
                className={fieldClass}
                onChange={(e) => update("packageName", e.target.value)}
                value={data.packageName}
              />
            </label>
            <div className="rounded-lg border border-border p-3">
              <button
                aria-expanded={showPackageDetails}
                aria-controls="package-details"
                className="text-sm font-semibold text-accent"
                onClick={() => setShowPackageDetails((prev) => !prev)}
                type="button"
              >
                {showPackageDetails ? "إخفاء فترة الباقة" : "تحديد فترة الباقة (اختياري)"}
              </button>
              {showPackageDetails ? (
                <div id="package-details" className="mt-3 grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium">
                    بداية فترة الباقة
                    <input
                      aria-label="بداية فترة الباقة"
                      className={fieldClass}
                      onChange={(e) => update("packagePeriodStart", e.target.value)}
                      type="date"
                      value={data.packagePeriodStart}
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    نهاية فترة الباقة
                    <input
                      aria-label="نهاية فترة الباقة"
                      className={fieldClass}
                      onChange={(e) => update("packagePeriodEnd", e.target.value)}
                      type="date"
                      value={data.packagePeriodEnd}
                    />
                  </label>
                </div>
              ) : null}
            </div>
            <div className="grid gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold">خدمات الباقة</span>
                <Button onClick={addLine} size="sm" type="button" variant="secondary">
                  إضافة خدمة
                </Button>
              </div>
              <p className={helperClass}>
                «الكمية المتفق عليها» هي إجمالي ما اتفقتم عليه. يُخصم منها المسلّم فقط عند التسليم. وحدات العدّ (مثل منشور) تقبل أعدادًا صحيحة فقط، أما الساعات والوحدات القابلة للتجزئة فتقبل الكسور.
              </p>
              {data.packageLines.map((line, index) => {
                const isCount = isCountUnitLabel(line.unitLabel);
                return (
                  <div
                    key={index}
                    className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-2"
                  >
                    <label className="grid gap-1.5 text-sm font-medium">
                      اسم الخدمة
                      <input
                        aria-label={`اسم الخدمة للسطر ${index + 1}`}
                        className={fieldClass}
                        onChange={(e) => updateLine(index, "serviceLabel", e.target.value)}
                        value={line.serviceLabel}
                      />
                    </label>
                    <label className="grid gap-1.5 text-sm font-medium">
                      وحدة القياس
                      <input
                        aria-label={`وحدة القياس للسطر ${index + 1}`}
                        className={fieldClass}
                        onChange={(e) => updateLine(index, "unitLabel", e.target.value)}
                        value={line.unitLabel}
                      />
                    </label>
                    <label className="grid gap-1.5 text-sm font-medium">
                      الكمية المتفق عليها
                      <input
                        aria-label={`الكمية المتفق عليها للسطر ${index + 1}`}
                        className={fieldClass}
                        inputMode={isCount ? "numeric" : "decimal"}
                        pattern={isCount ? "[0-9]+" : undefined}
                        onChange={(e) => updateLine(index, "committedQuantity", e.target.value)}
                        type="text"
                        value={line.committedQuantity}
                      />
                      {isCount ? (
                        <span className={helperClass}>عدد صحيح فقط (وحدة عدّ).</span>
                      ) : null}
                    </label>
                    <label className="grid gap-1.5 text-sm font-medium">
                      نوع المخرج — اختياري
                      <input
                        aria-label={`نوع المخرج للسطر ${index + 1}`}
                        className={fieldClass}
                        onChange={(e) => updateLine(index, "deliverableTypeHint", e.target.value)}
                        value={line.deliverableTypeHint}
                      />
                    </label>
                    {data.packageLines.length > 1 ? (
                      <Button
                        className="sm:col-span-2"
                        onClick={() => removeLine(index)}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        حذف هذه الخدمة
                      </Button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </fieldset>
        ) : null}

        {step === 3 ? (
          <fieldset className="grid gap-4" aria-label="تعيين الفريق" ref={errorFieldRef}>
            <legend className="sr-only">تعيين الفريق</legend>
            <label className="grid gap-2 text-sm font-medium">
              المسؤول الرئيسي عن العمل
              <select
                aria-label="المسؤول الرئيسي عن العمل"
                className={fieldClass}
                onChange={(e) => update("ownerUserId", e.target.value)}
                value={data.ownerUserId}
              >
                <option value="">بدون مسؤول حاليًا</option>
                {eligibleMembers.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.displayName}
                    {member.roleLabel ? ` — ${member.roleLabel}` : ""}
                  </option>
                ))}
              </select>
              <span className={helperClass}>
                المسؤول هو من يقود تنفيذ المخرج ويظهر كمالك للعمل ضمن نطاق هذا العميل فقط.
              </span>
            </label>
            <fieldset className="grid gap-2 text-sm font-medium">
              <legend>أعضاء الفريق المشاركون</legend>
              <span className={helperClass}>
                يساعدون في التنفيذ ضمن نطاق هذا العميل. لا يرسلون العمل للعميل مباشرةً.
              </span>
              <div className="grid max-h-60 gap-2 overflow-y-auto rounded-md border border-border bg-background p-3">
                {memberDirectoryAvailable && eligibleMembers.length > 0 ? (
                  eligibleMembers.map((member) => (
                    <label
                      className="flex min-h-11 items-center gap-2"
                      key={member.userId}
                    >
                      <input
                        aria-label={`إضافة ${member.displayName} كعضو فريق مشارك`}
                        checked={data.contributorUserIds.includes(member.userId)}
                        onChange={() => toggleContributor(member.userId)}
                        type="checkbox"
                        value={member.userId}
                      />
                      <span>{member.displayName}</span>
                      {member.roleLabel ? (
                        <span className="text-xs text-muted">{member.roleLabel}</span>
                      ) : null}
                    </label>
                  ))
                ) : (
                  <p className="text-muted">لا يوجد أعضاء متاحون للإسناد.</p>
                )}
              </div>
            </fieldset>
            {!memberDirectoryAvailable ? (
              <p className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
                تعذر تحميل قائمة الفريق. يمكنك المتابعة بدون إسناد وإضافته لاحقًا.
              </p>
            ) : null}
          </fieldset>
        ) : null}

        {step === 4 ? (
          <fieldset className="grid gap-4" aria-label="أول مخرج" ref={errorFieldRef}>
            <legend className="sr-only">أول مخرج</legend>
            <label className="grid gap-2 text-sm font-medium">
              اسم المخرج
              <input
                aria-label="اسم المخرج"
                className={fieldClass}
                onChange={(e) => update("deliverableName", e.target.value)}
                value={data.deliverableName}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              الوصف
              <textarea
                aria-label="وصف المخرج"
                className={`${fieldClass} min-h-20`}
                onChange={(e) => update("deliverableDescription", e.target.value)}
                value={data.deliverableDescription}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                نوع المخرج
                <select
                  aria-label="نوع المخرج"
                  className={fieldClass}
                  onChange={(e) => update("deliverableType", e.target.value)}
                  value={data.deliverableType}
                >
                  {typeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                  {typeOptions.some((o) => o.value === data.deliverableType) ? null : (
                    <option value={data.deliverableType}>
                      {data.deliverableType}
                    </option>
                  )}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium">
                الأولوية
                <select
                  aria-label="الأولوية"
                  className={fieldClass}
                  onChange={(e) => update("deliverablePriority", e.target.value)}
                  value={data.deliverablePriority}
                >
                  {priorityOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="grid gap-2 text-sm font-medium">
              الكمية المحجوزة من أول خدمة في الباقة
              <input
                aria-label="الكمية المحجوزة"
                className={fieldClass}
                inputMode={
                  isCountUnitLabel(data.packageLines[0]?.unitLabel ?? "")
                    ? "numeric"
                    : "decimal"
                }
                pattern={
                  isCountUnitLabel(data.packageLines[0]?.unitLabel ?? "")
                    ? "[1-9][0-9]*"
                    : undefined
                }
                onChange={(e) => update("reservedQuantity", e.target.value)}
                type="text"
                value={data.reservedQuantity}
              />
              <span className={helperClass}>
                تُحجز من الكمية المتفق عليها عند إنشاء المخرج وتُستهلك عند التسليم.
              </span>
            </label>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="grid gap-2 text-sm font-medium">
                تاريخ البدء
                <input
                  aria-label="تاريخ البدء"
                  className={fieldClass}
                  onChange={(e) => update("startDate", e.target.value)}
                  type="date"
                  value={data.startDate}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                موعد داخلي
                <input
                  aria-label="الموعد الداخلي"
                  className={fieldClass}
                  onChange={(e) => update("internalDueDate", e.target.value)}
                  type="date"
                  value={data.internalDueDate}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                موعد العميل
                <input
                  aria-label="موعد العميل"
                  className={fieldClass}
                  onChange={(e) => update("clientDueDate", e.target.value)}
                  type="date"
                  value={data.clientDueDate}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                الموعد النهائي
                <input
                  aria-label="الموعد النهائي"
                  className={fieldClass}
                  onChange={(e) => update("finalDueDate", e.target.value)}
                  type="date"
                  value={data.finalDueDate}
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  checked={data.requiresInternalApproval}
                  onChange={(e) => update("requiresInternalApproval", e.target.checked)}
                  type="checkbox"
                />
                يتطلب تعميدًا داخليًا
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  checked={data.requiresClientApproval}
                  onChange={(e) => update("requiresClientApproval", e.target.checked)}
                  type="checkbox"
                />
                يتطلب اعتماد العميل
              </label>
            </div>
          </fieldset>
        ) : null}

        {step === 5 ? (
          <section aria-label="مراجعة البيانات" className="grid gap-4">
            <div className="rounded-lg border border-border p-4">
              <h3 className="font-semibold">العميل</h3>
              <dl className="mt-2 grid gap-1 text-sm text-muted">
                <div><dt className="inline font-medium text-foreground">الجهة: </dt><dd className="inline">{data.clientName || "—"}</dd></div>
                {data.clientContactName ? (
                  <div><dt className="inline font-medium text-foreground">مسؤول التواصل: </dt><dd className="inline">{data.clientContactName}</dd></div>
                ) : null}
                {data.clientContactPhone ? (
                  <div><dt className="inline font-medium text-foreground">الهاتف / واتساب: </dt><dd className="inline" dir="ltr">{data.clientContactPhone}</dd></div>
                ) : null}
                {data.clientContactEmail ? (
                  <div><dt className="inline font-medium text-foreground">البريد: </dt><dd className="inline" dir="ltr">{data.clientContactEmail}</dd></div>
                ) : null}
              </dl>
            </div>
            <div className="rounded-lg border border-border p-4">
              <h3 className="font-semibold">العقد</h3>
              <dl className="mt-2 grid gap-1 text-sm text-muted">
                <div><dt className="inline font-medium text-foreground">الاسم: </dt><dd className="inline">{data.contractName || "—"}</dd></div>
                {data.contractReference ? (
                  <div><dt className="inline font-medium text-foreground">المرجع: </dt><dd className="inline">{data.contractReference}</dd></div>
                ) : null}
                {data.contractPeriodStart || data.contractPeriodEnd ? (
                  <div><dt className="inline font-medium text-foreground">الفترة: </dt><dd className="inline">{data.contractPeriodStart || "—"}</dd> — <dd className="inline">{data.contractPeriodEnd || "—"}</dd></div>
                ) : null}
              </dl>
            </div>
            <div className="rounded-lg border border-border p-4">
              <h3 className="font-semibold">الباقة</h3>
              <dl className="mt-2 grid gap-1 text-sm text-muted">
                <div><dt className="inline font-medium text-foreground">الاسم: </dt><dd className="inline">{data.packageName || "—"}</dd></div>
                {data.packageLines.map((line, i) => (
                  <div key={i}>
                    <dt className="inline font-medium text-foreground">{line.serviceLabel || "—"}</dt>
                    {" — "}
                    <dd className="inline">{line.committedQuantity} {line.unitLabel}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="rounded-lg border border-border p-4">
              <h3 className="font-semibold">أول مخرج</h3>
              <dl className="mt-2 grid gap-1 text-sm text-muted">
                <div><dt className="inline font-medium text-foreground">الاسم: </dt><dd className="inline">{data.deliverableName || "—"}</dd></div>
                <div><dt className="inline font-medium text-foreground">النوع: </dt><dd className="inline">{typeOptions.find((t) => t.value === data.deliverableType)?.label ?? data.deliverableType}</dd></div>
                <div><dt className="inline font-medium text-foreground">المسؤول: </dt><dd className="inline">{eligibleMembers.find((m) => m.userId === data.ownerUserId)?.displayName ?? "—"}</dd></div>
              </dl>
            </div>
          </section>
        ) : null}

        {stepError ? (
          <p
            aria-live="polite"
            className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
          >
            {stepError}
          </p>
        ) : null}

        {state.status === "error" && state.message ? (
          <p
            aria-live="polite"
            className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
          >
            {state.message}
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          {step > 0 ? (
            <Button onClick={back} type="button" variant="ghost">
              السابق
            </Button>
          ) : (
            <span />
          )}
          {step < stepLabels.length - 1 ? (
            <Button onClick={next} type="button" variant="primary">
              التالي
            </Button>
          ) : (
            <SubmitButton />
          )}
        </div>
      </div>
    </form>
  );
}

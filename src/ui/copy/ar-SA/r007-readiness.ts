import type { R007ReadinessArea } from "@/modules/release/r007-readiness-boundary";

export const r007ReadinessCopy = {
  eyebrow: "جاهزية R-007",
  title: "جاهزية التوسع التجريبي للمالك",
  description:
    "هذه الصفحة تلخص حدود R-007 قبل أي توسع تجريبي أوسع. R-006 مقبول كخط أساس لتجربة داخلية فقط، وليس قبول إنتاج.",
  baselineTitle: "حدود خط الأساس",
  gatesTitle: "بوابات جاهزية V1",
  blockedTitle: "محظور بدون قرار جديد",
  decisionsTitle: "قرار المالك التالي",
  routeLabel: "مراجعة جاهزية R-007",
  baselineItems: [
    "R-006 مقبول لتجربة داخلية فقط.",
    "لا يوجد قبول إنتاج ضمن R-007.",
    "لا استخدام لبيانات عملاء خارج النطاق المصرح.",
    "لا تعديل لقاعدة بيانات مستضافة بدون قرار مالك جديد.",
  ],
  blockedItems: [
    "تعديل قاعدة بيانات مستضافة.",
    "استخدام بيانات عملاء خارج النطاق المصرح.",
    "اعتبار R-007 قبول إنتاج.",
    "إضافة تبعية أو تغيير معماري بدون ADR عند الحاجة.",
  ],
  decisions: [
    "تأكيد أن حدود جاهزية R-007 صحيحة.",
    "تحديد هل يتم تفويض توسع تجريبي أوسع لاحقا.",
    "إبقاء قبول الإنتاج كقرار منفصل.",
  ],
  gates: {
    deliverables: {
      label: "المخرجات",
      description: "الحالة، التقدم، شروط العرض للعميل، والتسليم.",
    },
    sla: {
      label: "SLA",
      description: "إيقاف وقت انتظار العميل واستئناف العمل عند طلب التعديل.",
    },
    approvals: {
      label: "الاعتمادات",
      description: "تعميد داخلي أولا ثم اعتماد عميل مرتبط بالنسخة.",
    },
    files: {
      label: "الملفات",
      description: "فصل الداخلي عن الظاهر للعميل وحماية التحميل.",
    },
    permissions: {
      label: "الصلاحيات",
      description: "عزل العميل والدور والنطاق مع رفض افتراضي.",
    },
    audit_logs: {
      label: "سجل التدقيق",
      description: "توثيق القرارات الحساسة والرفض وتغيرات الحالة.",
    },
    client_portal: {
      label: "بوابة العميل",
      description: "واجهة RTL بسيطة تعرض المسموح فقط.",
    },
    release_evidence: {
      label: "أدلة الإصدار",
      description: "ملخص آمن للاختبارات والمخاطر والقرار التالي.",
    },
  } satisfies Record<
    R007ReadinessArea,
    { label: string; description: string }
  >,
} as const;

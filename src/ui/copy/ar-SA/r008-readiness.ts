import type { R008PilotGateArea } from "@/modules/release/r008-pilot-gates";

export const r008ReadinessCopy = {
  eyebrow: "جاهزية R-008",
  title: "بوابات التنفيذ التجريبي المحلي",
  description:
    "هذه الصفحة تلخص المسار المسموح حاليًا: تقوية محلية فقط، مع إبقاء قاعدة البيانات المستضافة والنشر وبيانات غير هدنة وقبول الإنتاج محجوبة حتى قرار مالك صريح.",
  baselineTitle: "حدود القرار الحالي",
  gatesTitle: "حالة البوابات",
  blockedTitle: "محجوب الآن",
  decisionsTitle: "قرارات المالك التالية",
  routeLabel: "مراجعة جاهزية R-008",
  baselineItems: [
    "R-007 مقبول كمراجعة جاهزية فقط وليس قبول إنتاج.",
    "R-006 يبقى خط أساس لتجربة داخلية مصرح بها فقط.",
    "المسار الحالي محلي فقط وبأدلة آمنة.",
    "لا توجد طفرة قاعدة بيانات مستضافة أو نشر أو ترقية.",
  ],
  blockedItems: [
    "أي تعديل على قاعدة بيانات مستضافة.",
    "أي نشر أو ترقية لاستضافة.",
    "أي استخدام لبيانات عميل خارج نطاق هدنة المصرح.",
    "أي ادعاء مرشح إنتاج أو قبول إنتاج بدون قرار منفصل.",
  ],
  decisions: [
    "متابعة التقوية المحلية وإثبات العزل.",
    "تفويض UAT مستضاف محدود لاحقًا بحدود مكتوبة.",
    "طلب إصلاحات قبل أي توسع.",
    "بدء حزمة قبول إنتاج منفصلة عند الجاهزية.",
  ],
  gateStatus: {
    passed: "مكتمل",
    allowed: "مسموح",
    in_progress: "قيد التنفيذ",
    blocked: "محجوب",
    owner_approval_required: "يتطلب قرار مالك",
    separate_owner_decision_required: "قرار منفصل",
  },
  gates: {
    r007_readiness_boundary: {
      label: "حد R-007",
      description: "يحافظ على قبول R-007 كمراجعة جاهزية فقط.",
    },
    local_owner_controlled_hardening: {
      label: "التقوية المحلية",
      description: "مسموحة ضمن أدلة محلية آمنة فقط.",
    },
    tenant_client_isolation_proof: {
      label: "إثبات العزل",
      description: "إثبات أن كل دور يرى نطاق العميل المصرح فقط.",
    },
    hosted_database_mutation: {
      label: "قاعدة بيانات مستضافة",
      description: "محجوبة حتى قرار مالك يحدد البيئة والخطة والتراجع.",
    },
    deploy_or_promote: {
      label: "نشر أو ترقية",
      description: "غير مسموح ضمن هذا المسار المحلي.",
    },
    non_hadna_data: {
      label: "بيانات غير هدنة",
      description: "محجوبة حتى تفويض بيانات صريح.",
    },
    production_candidate_review: {
      label: "مرشح إنتاج",
      description: "يتطلب بوابة مالك وأدلة أمان وتشغيل لاحقة.",
    },
    production_acceptance: {
      label: "قبول الإنتاج",
      description: "قرار منفصل لا ينتج من اكتمال R-008.",
    },
  } satisfies Record<
    R008PilotGateArea,
    { label: string; description: string }
  >,
} as const;

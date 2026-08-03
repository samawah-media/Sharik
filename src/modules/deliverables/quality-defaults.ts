export const defaultQualityChecklistLabels = [
  "سلامة اللغة والإملاء.",
  "مطابقة هوية العميل.",
  "صحة المقاسات أو الصيغة.",
  "مطابقة متطلبات العمل.",
  "مراجعة النص والرابط وCTA إن وجدت.",
  "جاهزية الملف النهائي.",
] as const;

export const createDefaultQualityChecklist = () =>
  defaultQualityChecklistLabels.map((label, index) => ({
    label: String(label),
    status: "pending" as const,
    note: "",
    sortOrder: index,
  }));

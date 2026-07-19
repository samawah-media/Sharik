import type { FileAssetVisibility } from "@/modules/files/file-visibility-rules";

export const deliverableStatusLabels: Record<string, string> = {
  not_started: "لم يبدأ",
  in_progress: "قيد التنفيذ",
  ready_for_internal_review: "جاهز للمراجعة الداخلية",
  internal_changes_requested: "يحتاج تعديل داخلي",
  internally_approved: "معتمد داخليًا",
  waiting_client_approval: "بانتظار اعتماد العميل",
  client_changes_requested: "يحتاج تعديل من العميل",
  client_approved: "معتمد من العميل",
  ready_for_delivery: "جاهز للتسليم",
  delivered: "تم التسليم",
  cancelled: "ملغي",
  archived: "مؤرشف",
};

export const deliverableTypeLabels: Record<string, string> = {
  post: "منشور",
  reel: "ريلز",
  story: "ستوري",
  design: "تصميم",
  report: "تقرير",
  video: "فيديو",
  campaign: "حملة",
  article: "مقال",
  marketing_coordination: "تنسيق تسويقي",
};

export const priorityLabels: Record<string, string> = {
  low: "منخفضة",
  normal: "عادية",
  high: "مرتفعة",
  urgent: "عاجلة",
};

export const taskStatusLabels: Record<string, string> = {
  todo: "غير مبدوءة",
  in_progress: "قيد التنفيذ",
  done: "مكتملة",
  cancelled: "ملغية",
};

export const versionStatusLabels: Record<string, string> = {
  draft: "مسودة",
  ready_for_internal_review: "جاهزة للمراجعة الداخلية",
  internal_changes_requested: "تحتاج تعديل داخلي",
  internally_approved: "معتمدة داخليًا",
  client_visible: "ظاهرة للعميل",
  waiting_client_approval: "بانتظار قرار العميل",
  client_changes_requested: "طلب العميل تعديلها",
  client_approved: "معتمدة من العميل",
  delivered: "مُسلَّمة",
  cancelled: "ملغية",
};

export const qualityCheckStatusLabels: Record<string, string> = {
  pending: "قيد الانتظار",
  passed: "ناجحة",
  changes_required: "تطلب تعديلًا",
  not_applicable: "لا تنطبق",
};

export const approvalDecisionLabels: Record<string, string> = {
  approved: "مقبول",
  changes_required: "يحتاج تعديلًا",
  rejected: "مرفوض",
  client_approval: "اعتماد العميل",
  client_changes: "تعديلات العميل",
  internal_approval: "الاعتماد الداخلي",
  internal_changes: "تعديلات داخلية",
};

export const fileVisibilityLabels: Record<FileAssetVisibility, string> = {
  internal_only: "ملف داخلي",
  client_visible: "ملف متاح",
  client_uploaded: "ملف مرفوع من العميل",
  final_delivery: "تسليم نهائي",
  contract_file: "ملف العقد",
  report_file: "تقرير",
  brand_asset: "أصل للهوية",
};

export const deliverableStatusLabel = (status: string) =>
  deliverableStatusLabels[status] ?? "حالة غير معروفة";

export const deliverableTypeLabel = (type: string) =>
  deliverableTypeLabels[type] ?? "مخرج مخصص";

export const priorityLabel = (priority: string) =>
  priorityLabels[priority] ?? "عادية";

export const taskStatusLabel = (status: string) =>
  taskStatusLabels[status] ?? status;

export const versionStatusLabel = (status: string) =>
  versionStatusLabels[status] ?? status;

export const qualityCheckStatusLabel = (status: string) =>
  qualityCheckStatusLabels[status] ?? status;

export const approvalDecisionLabel = (decision: string) =>
  approvalDecisionLabels[decision] ?? decision;

export const fileVisibilityLabel = (visibility: FileAssetVisibility | string) =>
  fileVisibilityLabels[visibility as FileAssetVisibility] ?? visibility;

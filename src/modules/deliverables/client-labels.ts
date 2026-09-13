import type { DeliverableLifecycleStatus } from "./deliverable-rules";

export const clientDeliverableStatusLabels: Partial<
  Record<DeliverableLifecycleStatus, string>
> = {
  not_started: "قيد المتابعة",
  in_progress: "قيد العمل",
  waiting_client_approval: "بانتظار قرارك",
  client_changes_requested: "قيد التعديل لدى فريق سماوة",
  client_approved: "تم اعتماد العمل",
  ready_for_delivery: "جارٍ تجهيز التسليم",
  delivered: "تم التسليم",
};

export const clientStatusLabel = (status: string): string =>
  clientDeliverableStatusLabels[status as DeliverableLifecycleStatus] ??
  "قيد المتابعة";

export const clientVisibleStatusLabel = (
  status: string,
  canApprove: boolean,
): string => {
  if (status === "waiting_client_approval" && !canApprove) {
    return "قيد المراجعة";
  }
  return clientStatusLabel(status);
};

const approverNextAction: Partial<Record<DeliverableLifecycleStatus, string>> =
  {
    waiting_client_approval: "راجع النسخة ثم اعتمدها أو اطلب تعديلًا",
    client_changes_requested:
      "استلم فريق سماوة ملاحظاتك، والعمل الآن قيد التعديل",
    client_approved: "تم الاعتماد، يجري تجهيز التسليم",
    ready_for_delivery: "التسليم قيد التجهيز",
    delivered: "تم تسليم العمل",
  };

const viewerNextAction: Partial<Record<DeliverableLifecycleStatus, string>> = {
  waiting_client_approval:
    "يمكنك الاطلاع على النسخة، والقرار لدى المسؤول عن الاعتماد",
  client_changes_requested: "استلم فريق سماوة الملاحظات، والعمل الآن قيد التعديل",
  client_approved: "تم الاعتماد، يجري تجهيز التسليم",
  ready_for_delivery: "التسليم قيد التجهيز",
  delivered: "تم تسليم العمل",
  not_started: "العمل لم يبدأ بعد",
  in_progress: "العمل قيد التنفيذ داخل فريق سماوة",
};

export const clientNextAction = (
  status: string,
  canApprove = true,
): string => {
  const map = canApprove ? approverNextAction : viewerNextAction;
  return map[status as DeliverableLifecycleStatus] ?? "تابع حالة العمل";
};

export const clientWorkSectionIds = [
  "waiting_client_approval",
  "client_changes_requested",
  "client_approved",
  "ready_for_delivery",
  "delivered",
] as const;

export const clientWorkSectionHeading = (
  sectionId: string,
  canApprove: boolean,
): string => clientVisibleStatusLabel(sectionId, canApprove);

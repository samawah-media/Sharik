export const roleLabelsAr = {
  tenant_owner: "مالك المساحة",
  tenant_administrator: "مدير النظام",
  samawah_admin: "إدارة سماوة",
  project_manager: "مدير المشروع",
  marketing_manager: "مدير التسويق",
  account_manager: "مدير الحساب",
  content_writer: "كاتب المحتوى",
  designer: "المصمم",
  performance_specialist: "أخصائي الأداء",
  client_admin: "مدير العميل",
  client_approver: "مسؤول الاعتماد",
  client_viewer: "مشاهد العميل",
} as const;

export type KnownRoleKey = keyof typeof roleLabelsAr;

export const roleLabelAr = (roleKey?: string | null) =>
  roleKey && roleKey in roleLabelsAr
    ? roleLabelsAr[roleKey as KnownRoleKey]
    : "عضو فريق";

export const humanRoleLabel = (value?: string | null) => {
  if (!value) return undefined;
  return value in roleLabelsAr ? roleLabelAr(value) : value;
};

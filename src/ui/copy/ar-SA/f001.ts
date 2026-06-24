export const f001CopyArSA = {
  "f001.loading": "جاري تحميل المساحة الآمنة.",
  "f001.empty": "لا توجد عناصر متاحة بعد.",
  "f001.invitation.pending": "الدعوة بانتظار القبول.",
  "f001.invitation.accepted": "تم قبول الدعوة.",
  "f001.invitation.expired": "انتهت صلاحية الدعوة.",
  "f001.invitation.revoked": "الدعوة غير متاحة.",
  "f001.invitation.superseded": "يوجد رابط أحدث لهذه الدعوة.",
  "f001.invitation.mismatch": "البريد غير مطابق للدعوة.",
  "f001.access.permissionDenied": "لا يمكن الوصول إلى هذه الصفحة",
  "f001.access.notFound": "المورد غير متاح",
  "f001.access.sessionExpired": "انتهت الجلسة",
  "f001.access.saveFailure": "تعذر حفظ التغييرات بأمان.",
  "f001.access.networkFailure": "تعذر الاتصال. حاول مرة أخرى.",
  "f001.access.membershipDisabled": "تم تعطيل العضوية",
  "f001.access.noAssignedClients": "لا يوجد عملاء مسندون",
} as const;

export type F001CopyKey = keyof typeof f001CopyArSA;

export const requiredF001CopyKeys = [
  "f001.loading",
  "f001.empty",
  "f001.invitation.pending",
  "f001.invitation.accepted",
  "f001.invitation.expired",
  "f001.invitation.revoked",
  "f001.invitation.superseded",
  "f001.invitation.mismatch",
  "f001.access.permissionDenied",
  "f001.access.notFound",
  "f001.access.sessionExpired",
  "f001.access.saveFailure",
  "f001.access.networkFailure",
  "f001.access.membershipDisabled",
  "f001.access.noAssignedClients",
] as const satisfies readonly F001CopyKey[];

import type { PostgrestError } from "@supabase/postgrest-js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const saveFailureMessage = "تعذر حفظ المخرج بأمان.";
export const validationFailureMessage = "راجع بيانات المخرج ثم حاول مرة أخرى.";
export const permissionFailureMessage = "لا يمكنك حفظ هذا المخرج.";
export const capacityFailureMessage =
  "لا توجد سعة كافية لهذا السطر. اختر سطرًا آخر أو استخدم مسار المخرج الإضافي المعتمد.";
export const duplicateFailureMessage = "تم تسجيل طلب إنشاء هذا المخرج مسبقًا.";
export const invalidOwnerFailureMessage =
  "معرّف المسؤول غير صالح. اترك الحقل فارغًا أو اختر مسؤولًا من القائمة.";
export const invalidContributorFailureMessage =
  "أحد معرّفات المساهمين غير صالح. اترك الحقل فارغًا أو اختر المساهمين من القائمة.";
export const invalidIdentifierFailureMessage =
  "تأكّد من معرّفات المسؤول والمساهمين ثم حاول مرة أخرى.";

export type DeliverableWriteError = {
  code?: string;
  message?: string;
};

const isUuid = (value: string): boolean => UUID_PATTERN.test(value);

export const validateDeliverableIdentifierFields = ({
  ownerUserId,
  contributorUserIds,
}: {
  ownerUserId?: string;
  contributorUserIds?: string[];
}): string | null => {
  if (typeof ownerUserId === "string" && ownerUserId.length > 0) {
    if (!isUuid(ownerUserId)) {
      return invalidOwnerFailureMessage;
    }
  }

  if (Array.isArray(contributorUserIds)) {
    for (const id of contributorUserIds) {
      if (typeof id !== "string" || id.length === 0) {
        continue;
      }

      if (!isUuid(id)) {
        return invalidContributorFailureMessage;
      }
    }
  }

  return null;
};

export const mapDeliverableWriteError = (error: DeliverableWriteError): string => {
  const { code, message } = error;

  if (code === "23505") {
    return duplicateFailureMessage;
  }

  if (code === "42501" && message === "insufficient package capacity") {
    return capacityFailureMessage;
  }

  if (code === "42501") {
    return permissionFailureMessage;
  }

  if (code === "P0001") {
    return validationFailureMessage;
  }

  // PostgREST casts RPC parameters before the function executes; an invalid
  // UUID reaches the database as 22P02. Surface the same actionable Arabic
  // guidance used by the action-side identifier pre-check, and never echo the
  // raw Postgres message (which contains the user-typed value) back to the
  // browser.
  if (code === "22P02") {
    return invalidIdentifierFailureMessage;
  }

  // Constraint violations (FK, NOT NULL, CHECK) reflect invalid form input
  // that slipped past pre-validation. The raw Postgres message is internal
  // detail and must never be exposed.
  if (code === "23502" || code === "23503" || code === "23514") {
    return validationFailureMessage;
  }

  return saveFailureMessage;
};

export const asDeliverableWriteError = (
  error: PostgrestError | DeliverableWriteError | undefined | null,
): DeliverableWriteError => {
  if (!error) {
    return {};
  }

  const code = typeof error.code === "string" ? error.code : undefined;
  const message = typeof error.message === "string" ? error.message : undefined;

  return { code, message };
};


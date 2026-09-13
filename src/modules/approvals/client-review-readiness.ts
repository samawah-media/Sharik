export type ClientReviewPayload = {
  caption?: string | null;
  body?: string | null;
  files?: readonly {
    fileSize: number;
    visibility: string;
  }[];
};

const placeholderValues = new Set([
  "-",
  "--",
  "–",
  "—",
  "_",
  ".",
  "...",
  "n/a",
  "na",
  "none",
  "null",
  "tbd",
  "لا يوجد",
  "لا يوجد محتوى",
  "غير متاح",
  "غير متاحة",
  "غير متوفر",
  "غير محدد",
  "لاحقا",
  "لاحقًا",
]);

export function isMeaningfulReviewText(value?: string | null) {
  const normalized = value
    ?.trim()
    .replace(/\s+/gu, " ")
    .toLocaleLowerCase("ar");

  return Boolean(
    normalized &&
      !placeholderValues.has(normalized) &&
      /\p{L}/u.test(normalized),
  );
}

export function firstMeaningfulReviewText(
  ...values: Array<string | null | undefined>
) {
  return values.find((value) => isMeaningfulReviewText(value)) ?? undefined;
}

export function hasClientReviewPayload(payload: ClientReviewPayload) {
  if (
    isMeaningfulReviewText(payload.caption) ||
    isMeaningfulReviewText(payload.body)
  ) {
    return true;
  }

  return Boolean(
    payload.files?.some(
      (file) => file.visibility === "client_visible" && file.fileSize > 0,
    ),
  );
}

const arabicDateFormatter = new Intl.DateTimeFormat("ar-SA-u-ca-gregory", {
  day: "numeric",
  month: "long",
  timeZone: "Asia/Riyadh",
  year: "numeric",
});

const arabicDateTimeFormatter = new Intl.DateTimeFormat("ar-SA-u-ca-gregory", {
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  month: "long",
  timeZone: "Asia/Riyadh",
  year: "numeric",
});

const parseDisplayDate = (dateValue?: string) => {
  if (!dateValue) return undefined;

  const normalizedValue = /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
    ? `${dateValue}T12:00:00.000Z`
    : dateValue;
  const date = new Date(normalizedValue);

  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDisplayDate = (
  dateValue: string | undefined,
  formatter: Intl.DateTimeFormat,
) => {
  const date = parseDisplayDate(dateValue);

  if (date === undefined) return "غير محدد";
  if (date === null) return "تاريخ غير صالح";

  return formatter.format(date);
};

export const formatArabicDate = (value?: string) =>
  formatDisplayDate(value, arabicDateFormatter);

export const formatDueDateLabel = (label?: string) => {
  if (!label?.trim()) return formatArabicDate();

  // This field accepts both persisted ISO dates and already-human labels.
  return /^\d{4}-\d{2}-\d{2}(?:$|T)/.test(label)
    ? formatArabicDate(label)
    : label;
};

export const formatArabicDateTime = (value?: string) =>
  formatDisplayDate(value, arabicDateTimeFormatter);

export const formatArabicDateRange = (start?: string, end?: string) => {
  if (!start && !end) return "الفترة غير محددة";
  if (!start) return `حتى ${formatArabicDate(end)}`;
  if (!end) return `من ${formatArabicDate(start)}`;

  return `من ${formatArabicDate(start)} إلى ${formatArabicDate(end)}`;
};

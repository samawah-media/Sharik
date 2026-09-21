const unsafeFilenameCharacters = /[\u0000\r\n<>:"/\\|?*\u202a-\u202e\u2066-\u2069]/gu;
const trailingDotsAndSpaces = /[. ]+$/u;

export function sanitizeDownloadFilename(
  value: string | null | undefined,
): string {
  const sanitized = (value ?? "")
    .replace(unsafeFilenameCharacters, "")
    .replace(trailingDotsAndSpaces, "");

  return sanitized || "ملف";
}

// X010-B-2: client contact phone/WhatsApp normalization and validation.
// Pure, dependency-free, and never logs or persists PII outside the audited
// client write path. Keeps normalization deterministic so the idempotency
// fingerprint stays stable for the same business value.

const PHONE_PATTERN = /^\+?[0-9]{7,15}$/;

const stripPhoneNoise = (value: string) =>
  value.replace(/[\s().-]/g, "");

export const normalizeContactPhone = (value: string | undefined | null) => {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return "";
  }

  let cleaned = stripPhoneNoise(trimmed);

  // Convert a leading international prefix "00" to "+" exactly once. Only the
  // start of the value is touched so legitimate numbers that contain "00"
  // elsewhere (e.g. 01000012345) are preserved verbatim.
  if (cleaned.startsWith("00")) {
    cleaned = `+${cleaned.slice(2)}`;
  }

  return cleaned;
};

export const isValidContactPhone = (value: string | undefined | null) => {
  const normalized = normalizeContactPhone(value);
  if (normalized.length === 0) {
    return false;
  }

  return PHONE_PATTERN.test(normalized);
};

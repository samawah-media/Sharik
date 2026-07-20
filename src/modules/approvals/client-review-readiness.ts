export type ClientReviewPayload = {
  caption?: string | null;
  body?: string | null;
  files?: readonly {
    fileSize: number;
    visibility: string;
  }[];
};

const hasText = (value?: string | null) => Boolean(value?.trim());

export function hasClientReviewPayload(payload: ClientReviewPayload) {
  if (hasText(payload.caption) || hasText(payload.body)) {
    return true;
  }

  return Boolean(
    payload.files?.some(
      (file) => file.visibility === "client_visible" && file.fileSize > 0,
    ),
  );
}

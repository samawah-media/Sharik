"use server";

import { revalidatePath } from "next/cache";
import {
  activeHussamTrelloCards,
  HUSSAM_TRELLO_EXPECTED_ACTIVE_CARDS,
  HUSSAM_TRELLO_TARGET_CLIENT_ID,
  hussamAttachmentCandidates,
  importedAttachmentMimeTypes,
  trelloAttachmentIdempotencyKey,
  trelloDeliverableIdempotencyKey,
  type HussamAttachmentCandidate,
  type ImportedAttachmentMimeType,
} from "@/modules/imports/trello-hussam";
import {
  authorizedHussamImportContext,
  fetchHussamTrelloBoard,
  type HussamImportContext,
} from "@/server/imports/trello-hussam-context";

const ATTACHMENT_BATCH_SIZE = 3;
const MAX_ATTACHMENT_BYTES = 104_857_600;
const allowedMimeTypes = new Set<string>(importedAttachmentMimeTypes);

export type HussamAttachmentImportPreview = {
  eligibleCount: number;
  importedCount: number;
  remainingCount: number;
  excludedSharePointCount: number;
  excludedUnsupportedCount: number;
  excludedTooLargeCount: number;
  excludedUnavailableCount: number;
};

export type HussamAttachmentImportState = {
  status: "idle" | "progress" | "success" | "error";
  message?: string;
  processedCount?: number;
  remainingCount?: number;
};

type ImportContext = HussamImportContext;
type ImportedDeliverable = {
  id: string;
  currentVersionId: string;
  cardId: string;
};
type DownloadedAttachment = {
  bytes: Uint8Array;
  fileName: string;
  mimeType: ImportedAttachmentMimeType;
};

function extensionForMime(mimeType: ImportedAttachmentMimeType): string {
  return {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "application/pdf": "pdf",
    "text/plain": "txt",
  }[mimeType];
}

function inferredMimeType(
  declaredType: string,
  fileName: string,
): ImportedAttachmentMimeType | undefined {
  const normalizedType = declaredType.split(";", 1)[0].trim().toLowerCase();
  if (allowedMimeTypes.has(normalizedType)) {
    return normalizedType as ImportedAttachmentMimeType;
  }
  const extension = fileName.toLowerCase().split(".").pop();
  return {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    mp4: "video/mp4",
    webm: "video/webm",
    pdf: "application/pdf",
    txt: "text/plain",
  }[extension ?? ""] as ImportedAttachmentMimeType | undefined;
}

function responseFileName(response: Response, fallback: string): string {
  const disposition = response.headers.get("content-disposition") ?? "";
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) return decodeURIComponent(encoded).slice(0, 255);
  const quoted = disposition.match(/filename="([^"]+)"/i)?.[1];
  return (quoted || fallback).slice(0, 255);
}

async function stableUuid(sourceKey: string): Promise<string> {
  const digest = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(sourceKey)),
  ).slice(0, 16);
  digest[6] = (digest[6] & 0x0f) | 0x40;
  digest[8] = (digest[8] & 0x3f) | 0x80;
  const hex = [...digest]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function listImportedDeliverables(
  context: ImportContext,
  cardIds: string[],
): Promise<Map<string, ImportedDeliverable>> {
  const keys = cardIds.map(trelloDeliverableIdempotencyKey);
  const response = await context.supabase
    .from("deliverables")
    .select("id, current_version_id, idempotency_key")
    .eq("tenant_id", context.tenantId)
    .eq("client_id", HUSSAM_TRELLO_TARGET_CLIENT_ID)
    .in("idempotency_key", keys);
  if (response.error) throw new Error("DELIVERABLE_LOOKUP_FAILED");
  const cardIdByKey = new Map(
    cardIds.map((cardId) => [trelloDeliverableIdempotencyKey(cardId), cardId]),
  );
  return new Map(
    (response.data ?? []).flatMap((row) => {
      const cardId = cardIdByKey.get(row.idempotency_key ?? "");
      return cardId && row.current_version_id
        ? [
            [
              cardId,
              { id: row.id, currentVersionId: row.current_version_id, cardId },
            ] as const,
          ]
        : [];
    }),
  );
}

async function importedAttachmentIds(
  context: ImportContext,
  candidates: HussamAttachmentCandidate[],
): Promise<Set<string>> {
  const fileIdPairs = await Promise.all(
    candidates.map(
      async (candidate) =>
        [
          await stableUuid(
            `${trelloAttachmentIdempotencyKey(candidate.attachmentId)}:file`,
          ),
          candidate.attachmentId,
        ] as const,
    ),
  );
  if (!fileIdPairs.length) return new Set();
  const attachmentIdByFileId = new Map(fileIdPairs);
  const response = await context.supabase
    .from("file_assets")
    .select("id")
    .eq("tenant_id", context.tenantId)
    .eq("client_id", HUSSAM_TRELLO_TARGET_CLIENT_ID)
    .in("id", [...attachmentIdByFileId.keys()]);
  if (response.error) throw new Error("FILE_LOOKUP_FAILED");
  return new Set(
    (response.data ?? []).flatMap((row) => {
      const attachmentId = attachmentIdByFileId.get(row.id);
      return attachmentId ? [attachmentId] : [];
    }),
  );
}

async function attachmentImportSnapshot(context: ImportContext) {
  const board = await fetchHussamTrelloBoard();
  const cards = activeHussamTrelloCards(board);
  if (cards.length !== HUSSAM_TRELLO_EXPECTED_ACTIVE_CARDS) {
    throw new Error("ACTIVE_CARD_COUNT_CHANGED");
  }
  const candidates = hussamAttachmentCandidates(cards);
  const eligible = candidates.filter((candidate) => !candidate.exclusion);
  const [deliverables, importedIds] = await Promise.all([
    listImportedDeliverables(
      context,
      cards.map((card) => card.id),
    ),
    importedAttachmentIds(context, eligible),
  ]);
  const remaining = eligible.filter(
    (candidate) =>
      deliverables.has(candidate.cardId) &&
      !importedIds.has(candidate.attachmentId),
  );
  return { candidates, eligible, remaining, deliverables, importedIds };
}

export async function loadHussamAttachmentImportPreview(): Promise<
  | { ok: true; preview: HussamAttachmentImportPreview }
  | { ok: false; reason: "denied" | "unavailable" }
> {
  const context = await authorizedHussamImportContext();
  if (!context) return { ok: false, reason: "denied" };
  try {
    const snapshot = await attachmentImportSnapshot(context);
    const exclusions = (reason: HussamAttachmentCandidate["exclusion"]) =>
      snapshot.candidates.filter((candidate) => candidate.exclusion === reason)
        .length;
    return {
      ok: true,
      preview: {
        eligibleCount: snapshot.eligible.length,
        importedCount: snapshot.importedIds.size,
        remainingCount: snapshot.remaining.length,
        excludedSharePointCount: exclusions("sharepoint"),
        excludedUnsupportedCount: exclusions("unsupported_type"),
        excludedTooLargeCount: exclusions("too_large"),
        excludedUnavailableCount: exclusions("unavailable_source"),
      },
    };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

async function downloadAttachment(
  candidate: HussamAttachmentCandidate,
): Promise<DownloadedAttachment> {
  const response = await fetchAllowedAttachment(candidate);
  if (!response.ok) throw new Error("ATTACHMENT_DOWNLOAD_FAILED");
  const declaredLength = Number(response.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_ATTACHMENT_BYTES)
    throw new Error("ATTACHMENT_TOO_LARGE");
  const fileName = responseFileName(response, candidate.displayName);
  const mimeType =
    candidate.mimeType ??
    inferredMimeType(response.headers.get("content-type") ?? "", fileName);
  if (!mimeType) throw new Error("ATTACHMENT_TYPE_UNSUPPORTED");
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (!bytes.length || bytes.length > MAX_ATTACHMENT_BYTES) {
    throw new Error("ATTACHMENT_SIZE_INVALID");
  }
  return { bytes, fileName, mimeType };
}

function allowedDownloadHost(
  hostname: string,
  source: HussamAttachmentCandidate["source"],
): boolean {
  if (source === "trello") {
    return (
      hostname === "trello.com" ||
      hostname === "files.trello.com" ||
      hostname === "files-dl.trello.com"
    );
  }
  return (
    hostname === "drive.usercontent.google.com" ||
    hostname.endsWith(".googleusercontent.com")
  );
}

async function fetchAllowedAttachment(
  candidate: HussamAttachmentCandidate,
): Promise<Response> {
  let currentUrl = new URL(candidate.downloadUrl);
  for (let redirectCount = 0; redirectCount <= 5; redirectCount += 1) {
    if (!allowedDownloadHost(currentUrl.hostname, candidate.source)) {
      throw new Error("ATTACHMENT_HOST_DENIED");
    }
    const response = await fetch(currentUrl, {
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(90_000),
    });
    if (response.status < 300 || response.status >= 400) return response;
    const location = response.headers.get("location");
    if (!location) throw new Error("ATTACHMENT_REDIRECT_INVALID");
    currentUrl = new URL(location, currentUrl);
  }
  throw new Error("ATTACHMENT_REDIRECT_LIMIT");
}

async function beginUploadAttempt({
  context,
  candidate,
  deliverable,
  downloaded,
  fileId,
  storagePath,
}: {
  context: ImportContext;
  candidate: HussamAttachmentCandidate;
  deliverable: ImportedDeliverable;
  downloaded: DownloadedAttachment;
  fileId: string;
  storagePath: string;
}) {
  const idempotencyKey = trelloAttachmentIdempotencyKey(candidate.attachmentId);
  const attempts = await context.supabase.rpc(
    "s015_list_unsettled_file_upload_attempts",
    {
      target_client_id: HUSSAM_TRELLO_TARGET_CLIENT_ID,
      target_deliverable_id: deliverable.id,
      target_version_id: deliverable.currentVersionId,
    },
  );
  if (attempts.error) throw new Error("UPLOAD_ATTEMPT_LOOKUP_FAILED");
  const existing = (attempts.data ?? []).find(
    (attempt: { planned_file_id: string }) =>
      attempt.planned_file_id === fileId,
  ) as { id: string; status: string } | undefined;
  if (existing?.status === "failed") {
    const attemptId = crypto.randomUUID();
    const retryKey = `${idempotencyKey}-retry-${attemptId}`;
    const retry = await context.supabase.rpc("s015_retry_file_upload_attempt", {
      target_failed_attempt_id: existing.id,
      target_attempt_id: attemptId,
      target_file_id: fileId,
      target_storage_path: storagePath,
      target_run_id: `trello-files-${HUSSAM_TRELLO_TARGET_CLIENT_ID}`,
      request_idempotency_key: retryKey,
      cancel_audit_event_id: crypto.randomUUID(),
      retry_audit_event_id: crypto.randomUUID(),
    });
    if (retry.error) throw new Error("UPLOAD_RETRY_FAILED");
    return { attemptId };
  }
  if (existing) return { attemptId: existing.id };

  const attemptId = await stableUuid(`${idempotencyKey}:attempt`);
  const started = await context.supabase.rpc("s015_begin_file_upload_attempt", {
    target_attempt_id: attemptId,
    target_file_id: fileId,
    target_client_id: HUSSAM_TRELLO_TARGET_CLIENT_ID,
    target_deliverable_id: deliverable.id,
    target_version_id: deliverable.currentVersionId,
    target_bucket_id: "deliverable-assets",
    target_storage_path: storagePath,
    target_file_name: downloaded.fileName,
    target_file_type: downloaded.mimeType,
    target_file_size: downloaded.bytes.length,
    target_visibility: "internal_only",
    target_is_final: false,
    target_replaces_file_id: null,
    target_run_id: `trello-files-${HUSSAM_TRELLO_TARGET_CLIENT_ID}`,
    request_idempotency_key: idempotencyKey,
    audit_event_id: crypto.randomUUID(),
  });
  if (started.error) throw new Error("UPLOAD_ATTEMPT_START_FAILED");
  return { attemptId };
}

async function uploadAttachment(
  context: ImportContext,
  candidate: HussamAttachmentCandidate,
  deliverable: ImportedDeliverable,
) {
  const downloaded = await downloadAttachment(candidate);
  const idempotencyKey = trelloAttachmentIdempotencyKey(candidate.attachmentId);
  const fileId = await stableUuid(`${idempotencyKey}:file`);
  const extension = extensionForMime(downloaded.mimeType);
  const storagePath = `${context.tenantId}/${HUSSAM_TRELLO_TARGET_CLIENT_ID}/${deliverable.id}/${deliverable.currentVersionId}/${fileId}.${extension}`;
  const attempt = await beginUploadAttempt({
    context,
    candidate,
    deliverable,
    downloaded,
    fileId,
    storagePath,
  });
  const upload = await context.supabase.storage
    .from("deliverable-assets")
    .upload(storagePath, downloaded.bytes, {
      contentType: downloaded.mimeType,
      upsert: false,
    });
  // Complete the durable attempt even when Storage reports an existing object:
  // a previous invocation may have uploaded it and stopped before registration.
  const completed = await context.supabase.rpc(
    "s015_complete_file_upload_attempt",
    {
      target_attempt_id: attempt.attemptId,
      request_id: crypto.randomUUID(),
      audit_event_id: crypto.randomUUID(),
    },
  );
  if (!completed.error) return;
  await context.supabase.rpc("s015_fail_file_upload_attempt", {
    target_attempt_id: attempt.attemptId,
    target_failure_code: upload.error
      ? "storage_transfer_failed"
      : "metadata_registration_failed",
    target_progress_percentage: upload.error ? 0 : 99,
    audit_event_id: crypto.randomUUID(),
  });
  throw new Error(
    upload.error ? "STORAGE_UPLOAD_FAILED" : "FILE_REGISTER_FAILED",
  );
}

export async function importNextHussamAttachmentBatchAction(
  _previousState: HussamAttachmentImportState,
  formData: FormData,
): Promise<HussamAttachmentImportState> {
  if (formData.get("confirmed") !== "yes") {
    return { status: "error", message: "يلزم تأكيد نقل المرفقات." };
  }
  const context = await authorizedHussamImportContext();
  if (!context) return { status: "error", message: "لا تملك صلاحية النقل." };
  let snapshot: Awaited<ReturnType<typeof attachmentImportSnapshot>>;
  try {
    snapshot = await attachmentImportSnapshot(context);
  } catch {
    return { status: "error", message: "تعذر تحديث معاينة المرفقات الآمنة." };
  }
  const batch = snapshot.remaining.slice(0, ATTACHMENT_BATCH_SIZE);
  let processedCount = 0;
  for (const candidate of batch) {
    const deliverable = snapshot.deliverables.get(candidate.cardId);
    if (!deliverable) continue;
    try {
      await uploadAttachment(context, candidate, deliverable);
      processedCount += 1;
    } catch {
      return {
        status: "error",
        message: `توقفت الدفعة بعد نقل ${processedCount} ملف. أعد المحاولة لاستكمالها بأمان.`,
        processedCount,
        remainingCount: snapshot.remaining.length - processedCount,
      };
    }
  }
  const remainingCount = snapshot.remaining.length - processedCount;
  revalidatePath(
    `/clients/${HUSSAM_TRELLO_TARGET_CLIENT_ID}/deliverables/board`,
  );
  revalidatePath(
    `/clients/${HUSSAM_TRELLO_TARGET_CLIENT_ID}/imports/trello-hussam`,
  );
  return {
    status: remainingCount ? "progress" : "success",
    message: remainingCount
      ? `نُقلت دفعة من ${processedCount} ملف.`
      : "اكتمل نقل جميع المرفقات المؤهلة.",
    processedCount,
    remainingCount,
  };
}

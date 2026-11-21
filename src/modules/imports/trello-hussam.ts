import { z } from "zod";

export const HUSSAM_TRELLO_BOARD_SHORT_ID = "tNobz5iQ";
export const HUSSAM_TRELLO_BOARD_ID = "6a6a06dc697272f9f9cc5e9c";
export const HUSSAM_TRELLO_EXPECTED_ACTIVE_CARDS = 60;
export const HUSSAM_TRELLO_TARGET_CLIENT_ID =
  "da86c25e-ef85-4d48-a0a9-e23e3aa85321";
export const HUSSAM_TRELLO_CONFIRMATION = "استيراد محتوى الحسام";

const trelloLabelSchema = z.object({ name: z.string() });
const trelloPreviewSchema = z.object({
  url: z.string().url(),
  bytes: z.number().int().positive(),
  width: z.number().int().positive(),
});
const trelloAttachmentSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
  url: z.string().url(),
  mimeType: z.string(),
  bytes: z.number().int().positive().nullable(),
  isUpload: z.boolean(),
  fileName: z.string(),
  previews: z.array(trelloPreviewSchema).default([]),
});
const trelloListSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
  closed: z.boolean(),
  pos: z.number(),
});
const trelloCardSchema = z.object({
  id: z.string().min(1),
  idList: z.string().min(1),
  name: z.string().trim().min(2).max(160),
  desc: z.string().max(20_000),
  closed: z.boolean(),
  due: z.string().nullable(),
  pos: z.number(),
  shortUrl: z.string().url(),
  labels: z.array(trelloLabelSchema),
  attachments: z.array(trelloAttachmentSchema).default([]),
});

export const trelloHussamBoardSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
  lists: z.array(trelloListSchema),
  cards: z.array(trelloCardSchema),
});

export type TrelloHussamBoard = z.infer<typeof trelloHussamBoardSchema>;
export type TrelloHussamCard = z.infer<typeof trelloCardSchema> & {
  listName: string;
};

export type TrelloActionTask = {
  key: string;
  title: string;
  sourceLabel: string;
};

export type ExistingDeliverableIdentity = {
  id: string;
  clientId: string;
  name: string;
  idempotencyKey?: string;
  currentVersionId?: string;
};

export type TrelloCardImportState =
  | "ready"
  | "incomplete_import"
  | "already_imported"
  | "exact_duplicate"
  | "scope_conflict";

export type TrelloCardImportPlan = {
  card: TrelloHussamCard;
  idempotencyKey: string;
  state: TrelloCardImportState;
  existingDeliverableId?: string;
  tasks: TrelloActionTask[];
};

export const importedAttachmentMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "application/pdf",
  "text/plain",
] as const;

export type ImportedAttachmentMimeType =
  (typeof importedAttachmentMimeTypes)[number];
export type HussamAttachmentExclusion =
  | "sharepoint"
  | "unsupported_type"
  | "too_large"
  | "unavailable_source";
export type HussamAttachmentCandidate = {
  attachmentId: string;
  cardId: string;
  displayName: string;
  downloadUrl: string;
  mimeType?: ImportedAttachmentMimeType;
  declaredBytes?: number;
  source: "trello" | "google_drive";
  exclusion?: HussamAttachmentExclusion;
};

const MAX_ATTACHMENT_BYTES = 104_857_600;
const allowedAttachmentTypes = new Set<string>(importedAttachmentMimeTypes);

const actionTasksByLabel = new Map<
  string,
  Omit<TrelloActionTask, "sourceLabel">
>([
  ["يحتاج تصميم", { key: "design", title: "تنفيذ التصميم" }],
  ["يحتاج محتوى", { key: "content", title: "كتابة المحتوى" }],
  ["محتوى بحاجة للتعميد", { key: "approve-content", title: "اعتماد المحتوى" }],
  ["تصميم يحتاج تعميد", { key: "approve-design", title: "اعتماد التصميم" }],
]);

export function activeHussamTrelloCards(
  board: TrelloHussamBoard,
): TrelloHussamCard[] {
  const activeLists = new Map(
    board.lists
      .filter((list) => !list.closed)
      .map((list) => [list.id, list] as const),
  );

  return board.cards
    .filter((card) => !card.closed && activeLists.has(card.idList))
    .map((card) => ({ ...card, listName: activeLists.get(card.idList)!.name }))
    .sort((left, right) => {
      const listPosition =
        activeLists.get(left.idList)!.pos - activeLists.get(right.idList)!.pos;
      return listPosition || left.pos - right.pos;
    });
}

export function trelloDeliverableIdempotencyKey(cardId: string): string {
  return `trello-${HUSSAM_TRELLO_BOARD_ID}-${cardId}`;
}

export function trelloVersionIdempotencyKey(cardId: string): string {
  return `${trelloDeliverableIdempotencyKey(cardId)}-draft`;
}

export function trelloTaskIdempotencyKey(
  cardId: string,
  taskKey: string,
): string {
  return `${trelloDeliverableIdempotencyKey(cardId)}-${taskKey}`;
}

export function trelloActionTasks(
  labels: { name: string }[],
): TrelloActionTask[] {
  return labels.flatMap(({ name }) => {
    const task = actionTasksByLabel.get(name.trim());
    return task ? [{ ...task, sourceLabel: name.trim() }] : [];
  });
}

export function buildTrelloCardImportPlans({
  cards,
  existingDeliverables,
  targetClientId = HUSSAM_TRELLO_TARGET_CLIENT_ID,
}: {
  cards: TrelloHussamCard[];
  existingDeliverables: ExistingDeliverableIdentity[];
  targetClientId?: string;
}): TrelloCardImportPlan[] {
  const existingByKey = new Map(
    existingDeliverables
      .filter((deliverable) => deliverable.idempotencyKey)
      .map((deliverable) => [deliverable.idempotencyKey!, deliverable]),
  );
  const existingTargetByName = new Map(
    existingDeliverables
      .filter((deliverable) => deliverable.clientId === targetClientId)
      .map((deliverable) => [deliverable.name.trim(), deliverable]),
  );

  return cards.map((card) => {
    const idempotencyKey = trelloDeliverableIdempotencyKey(card.id);
    const sourceMatch = existingByKey.get(idempotencyKey);
    const titleMatch = existingTargetByName.get(card.name.trim());
    const state: TrelloCardImportState = sourceMatch
      ? sourceMatch.clientId === targetClientId
        ? sourceMatch.currentVersionId
          ? "already_imported"
          : "incomplete_import"
        : "scope_conflict"
      : titleMatch
        ? "exact_duplicate"
        : "ready";
    return {
      card,
      idempotencyKey,
      state,
      existingDeliverableId: sourceMatch?.id ?? titleMatch?.id,
      tasks: trelloActionTasks(card.labels),
    };
  });
}

export function trelloDueDate(due: string | null): string | null {
  return due ? due.slice(0, 10) : null;
}

function googleDriveFileId(url: string): string | undefined {
  const match = new URL(url).pathname.match(/^\/file\/d\/([a-zA-Z0-9_-]+)\//);
  return match?.[1];
}

export function hussamAttachmentCandidates(
  cards: TrelloHussamCard[],
): HussamAttachmentCandidate[] {
  return cards.flatMap((card) =>
    card.attachments.map((attachment) => {
      const sourceUrl = new URL(attachment.url);
      const base = {
        attachmentId: attachment.id,
        cardId: card.id,
        displayName: attachment.name,
      };
      if (
        sourceUrl.hostname === "sharepoint.com" ||
        sourceUrl.hostname.endsWith(".sharepoint.com")
      ) {
        return {
          ...base,
          downloadUrl: attachment.url,
          source: "trello" as const,
          exclusion: "sharepoint" as const,
        };
      }
      if (sourceUrl.hostname === "drive.google.com") {
        const fileId = googleDriveFileId(attachment.url);
        return fileId
          ? {
              ...base,
              downloadUrl: `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`,
              source: "google_drive" as const,
            }
          : {
              ...base,
              downloadUrl: attachment.url,
              source: "google_drive" as const,
              exclusion: "unavailable_source" as const,
            };
      }
      const expectedTrelloPath = `/1/cards/${card.id}/attachments/${attachment.id}/download/`;
      if (
        !attachment.isUpload ||
        sourceUrl.hostname !== "trello.com" ||
        !sourceUrl.pathname.startsWith(expectedTrelloPath)
      ) {
        return {
          ...base,
          downloadUrl: attachment.url,
          source: "trello" as const,
          exclusion: "unavailable_source" as const,
        };
      }
      if (!allowedAttachmentTypes.has(attachment.mimeType)) {
        return {
          ...base,
          downloadUrl: attachment.url,
          source: "trello" as const,
          exclusion: "unsupported_type" as const,
        };
      }
      if (!attachment.bytes || attachment.bytes > MAX_ATTACHMENT_BYTES) {
        return {
          ...base,
          downloadUrl: attachment.url,
          source: "trello" as const,
          exclusion: "too_large" as const,
        };
      }
      return {
        ...base,
        downloadUrl: attachment.url,
        mimeType: attachment.mimeType as ImportedAttachmentMimeType,
        declaredBytes: attachment.bytes,
        source: "trello" as const,
      };
    }),
  );
}

export function trelloAttachmentIdempotencyKey(attachmentId: string): string {
  return `trello-attachment-${HUSSAM_TRELLO_BOARD_ID}-${attachmentId}`;
}

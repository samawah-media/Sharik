import { z } from "zod";

export const HUSSAM_TRELLO_BOARD_SHORT_ID = "tNobz5iQ";
export const HUSSAM_TRELLO_BOARD_ID = "6a6a06dc697272f9f9cc5e9c";
export const HUSSAM_TRELLO_EXPECTED_ACTIVE_CARDS = 60;
export const HUSSAM_TRELLO_TARGET_CLIENT_ID =
  "da86c25e-ef85-4d48-a0a9-e23e3aa85321";
export const HUSSAM_TRELLO_CONFIRMATION = "استيراد محتوى الحسام";

const trelloLabelSchema = z.object({ name: z.string() });
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

type ImportRoleAssignment = {
  roleKey: string;
  scopeType: string;
  scopeId: string;
};

const actionTasksByLabel = new Map<
  string,
  Omit<TrelloActionTask, "sourceLabel">
>([
  ["يحتاج تصميم", { key: "design", title: "تنفيذ التصميم" }],
  ["يحتاج محتوى", { key: "content", title: "كتابة المحتوى" }],
  ["محتوى بحاجة للتعميد", { key: "approve-content", title: "اعتماد المحتوى" }],
  ["تصميم يحتاج تعميد", { key: "approve-design", title: "اعتماد التصميم" }],
]);

export function isHussamTrelloImportAdministrator({
  tenantId,
  roleAssignments,
}: {
  tenantId: string;
  roleAssignments: ImportRoleAssignment[];
}): boolean {
  return roleAssignments.some(
    (assignment) =>
      assignment.scopeType === "tenant" &&
      assignment.scopeId === tenantId &&
      (assignment.roleKey === "tenant_owner" ||
        assignment.roleKey === "tenant_administrator"),
  );
}

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

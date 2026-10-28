import { describe, expect, it } from "vitest";
import {
  activeHussamTrelloCards,
  buildTrelloCardImportPlans,
  HUSSAM_TRELLO_EXPECTED_ACTIVE_CARDS,
  HUSSAM_TRELLO_TARGET_CLIENT_ID,
  isHussamTrelloImportAdministrator,
  trelloActionTasks,
  trelloDeliverableIdempotencyKey,
  type TrelloHussamBoard,
} from "@/modules/imports/trello-hussam";

const activeList = {
  id: "list-active",
  name: "الحسام- أكتوبر 2026",
  closed: false,
  pos: 1,
};

function card(
  index: number,
  overrides: Partial<TrelloHussamBoard["cards"][number]> = {},
) {
  return {
    id: `card-${index}`,
    idList: activeList.id,
    name: `محتوى ${index}`,
    desc: `وصف ${index}`,
    closed: false,
    due: null,
    pos: index,
    shortUrl: `https://trello.com/c/card-${index}`,
    labels: [],
    ...overrides,
  };
}

describe("Hussam Trello import planning", () => {
  it("keeps exactly the 60 active cards and excludes closed cards and lists", () => {
    const board: TrelloHussamBoard = {
      id: "board",
      name: "الحسام للتطوير العقاري",
      lists: [
        activeList,
        { id: "list-closed", name: "قديم", closed: true, pos: 2 },
      ],
      cards: [
        ...Array.from(
          { length: HUSSAM_TRELLO_EXPECTED_ACTIVE_CARDS },
          (_, index) => card(index),
        ),
        card(61, { closed: true }),
        card(62, { idList: "list-closed" }),
      ],
    };

    expect(activeHussamTrelloCards(board)).toHaveLength(60);
  });

  it("turns only clear action labels into todo task definitions", () => {
    const tasks = trelloActionTasks([
      { name: "يحتاج تصميم" },
      { name: "محتوى بحاجة للتعميد" },
      { name: "تم النشر" },
      { name: "مجدول للنشر" },
      { name: "تم رفضه" },
      { name: "محتوى مقارنة" },
    ]);

    expect(tasks.map((task) => task.title)).toEqual([
      "تنفيذ التصميم",
      "اعتماد المحتوى",
    ]);
  });

  it("separates retries, exact title duplicates, and cross-client conflicts", () => {
    const cards = [card(1), card(2), card(3), card(4), card(5)].map(
      (entry) => ({
        ...entry,
        listName: activeList.name,
      }),
    );
    const plans = buildTrelloCardImportPlans({
      cards,
      existingDeliverables: [
        {
          id: "existing-source",
          clientId: HUSSAM_TRELLO_TARGET_CLIENT_ID,
          name: cards[0].name,
          idempotencyKey: trelloDeliverableIdempotencyKey(cards[0].id),
          currentVersionId: "version-id",
        },
        {
          id: "existing-title",
          clientId: HUSSAM_TRELLO_TARGET_CLIENT_ID,
          name: cards[1].name,
        },
        {
          id: "incomplete-source",
          clientId: HUSSAM_TRELLO_TARGET_CLIENT_ID,
          name: cards[2].name,
          idempotencyKey: trelloDeliverableIdempotencyKey(cards[2].id),
        },
        {
          id: "wrong-client",
          clientId: "another-client",
          name: "محتوى آخر",
          idempotencyKey: trelloDeliverableIdempotencyKey(cards[3].id),
        },
      ],
    });

    expect(plans.map((plan) => plan.state)).toEqual([
      "already_imported",
      "exact_duplicate",
      "incomplete_import",
      "scope_conflict",
      "ready",
    ]);
  });

  it("uses the Trello board and card identifiers in a stable key", () => {
    expect(trelloDeliverableIdempotencyKey("card-123")).toBe(
      "trello-6a6a06dc697272f9f9cc5e9c-card-123",
    );
  });

  it.each([
    ["tenant_owner", "tenant", true],
    ["tenant_administrator", "tenant", true],
    ["project_manager", "tenant", false],
    ["tenant_administrator", "client", false],
  ])(
    "allows only tenant administrators: %s at %s scope",
    (roleKey, scopeType, expected) => {
      expect(
        isHussamTrelloImportAdministrator({
          tenantId: "tenant-1",
          roleAssignments: [{ roleKey, scopeType, scopeId: "tenant-1" }],
        }),
      ).toBe(expected);
    },
  );
});

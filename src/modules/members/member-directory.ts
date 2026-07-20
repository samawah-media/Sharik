const windows1252Bytes = new Map<number, number>([
  [0x20ac, 0x80],
  [0x201a, 0x82],
  [0x0192, 0x83],
  [0x201e, 0x84],
  [0x2026, 0x85],
  [0x2020, 0x86],
  [0x2021, 0x87],
  [0x02c6, 0x88],
  [0x2030, 0x89],
  [0x0160, 0x8a],
  [0x2039, 0x8b],
  [0x0152, 0x8c],
  [0x017d, 0x8e],
  [0x2018, 0x91],
  [0x2019, 0x92],
  [0x201c, 0x93],
  [0x201d, 0x94],
  [0x2022, 0x95],
  [0x2013, 0x96],
  [0x2014, 0x97],
  [0x02dc, 0x98],
  [0x2122, 0x99],
  [0x0161, 0x9a],
  [0x203a, 0x9b],
  [0x0153, 0x9c],
  [0x017e, 0x9e],
  [0x0178, 0x9f],
]);

const mojibakeLeadPattern = /[\u00c2\u00c3\u00d8\u00d9]/u;
const arabicPattern = /[\u0600-\u06ff]/u;

export function repairArabicMojibake(value: string) {
  if (!mojibakeLeadPattern.test(value)) return value;

  const bytes: number[] = [];
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (codePoint === undefined) return value;
    const byte =
      codePoint <= 0xff ? codePoint : windows1252Bytes.get(codePoint);
    if (byte === undefined) return value;
    bytes.push(byte);
  }

  try {
    const repaired = new TextDecoder("utf-8", { fatal: true }).decode(
      Uint8Array.from(bytes),
    );
    return arabicPattern.test(repaired) ? repaired : value;
  } catch {
    return value;
  }
}

export type MemberDisplay = {
  userId: string;
  displayName: string;
  roleLabel?: string;
  avatarUrl?: string;
  initial: string;
};

export type MemberDirectory = Record<string, MemberDisplay>;

export const createMemberDirectory = (
  rows: Array<{
    user_id: string;
    display_name: string;
    role_label?: string | null;
    avatar_url?: string | null;
  }>,
): MemberDirectory =>
  Object.fromEntries(
    rows.map((row) => {
      const displayName = repairArabicMojibake(row.display_name);
      const roleLabel = row.role_label
        ? repairArabicMojibake(row.role_label)
        : undefined;

      return [
        row.user_id,
        {
          userId: row.user_id,
          displayName,
          roleLabel,
          avatarUrl: row.avatar_url ?? undefined,
          initial: Array.from(displayName.trim())[0] ?? "؟",
        },
      ];
    }),
  );

export const resolveMemberDisplays = (
  directory: MemberDirectory,
  userIds: Array<string | undefined>,
) =>
  userIds
    .filter((userId): userId is string => Boolean(userId))
    .map((userId) => directory[userId])
    .filter((member): member is MemberDisplay => Boolean(member));

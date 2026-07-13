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
    rows.map((row) => [
      row.user_id,
      {
        userId: row.user_id,
        displayName: row.display_name,
        roleLabel: row.role_label ?? undefined,
        avatarUrl: row.avatar_url ?? undefined,
        initial: Array.from(row.display_name.trim())[0] ?? "؟",
      },
    ]),
  );

export const resolveMemberDisplays = (
  directory: MemberDirectory,
  userIds: Array<string | undefined>,
) =>
  userIds
    .filter((userId): userId is string => Boolean(userId))
    .map((userId) => directory[userId])
    .filter((member): member is MemberDisplay => Boolean(member));

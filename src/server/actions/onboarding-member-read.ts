import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createMemberDirectory,
  type MemberDisplay,
} from "@/modules/members/member-directory";

type TenantMemberRow = {
  user_id: string;
  display_name: string;
  role_label: string | null;
};

export type TenantMembersResult =
  | { ok: true; members: MemberDisplay[] }
  | { ok: false; members: [] };

export const listTenantTeamMembers = async ({
  tenantId,
}: {
  tenantId: string;
}): Promise<TenantMembersResult> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc(
    "s015_list_onboarding_team_members",
    { target_tenant_id: tenantId },
  );

  if (error) return { ok: false, members: [] };

  const rows = (data ?? []) as TenantMemberRow[];
  const directory = createMemberDirectory(rows);
  return {
    ok: true,
    members: rows
      .map((row) => directory[row.user_id])
      .filter(Boolean),
  };
};

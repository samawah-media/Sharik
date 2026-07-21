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
  const { data, error } = await supabase
    .from("member_profiles")
    .select("user_id, display_name, role_label")
    .eq("tenant_id", tenantId)
    .order("display_name", { ascending: true });

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

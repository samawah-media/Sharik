import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createMemberDirectory,
  type MemberDisplay,
} from "@/modules/members/member-directory";

type EligibleMemberRow = {
  user_id: string;
  display_name: string;
  role_label: string | null;
};

export type EligibleDeliverableMembersResult =
  | { ok: true; members: MemberDisplay[] }
  | { ok: false; members: [] };

export const listEligibleDeliverableMembers = async ({
  tenantId,
  clientId,
}: {
  tenantId: string;
  clientId: string;
}): Promise<EligibleDeliverableMembersResult> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc(
    "s015_list_deliverable_eligible_members",
    {
      target_tenant_id: tenantId,
      target_client_id: clientId,
    },
  );

  if (error) return { ok: false, members: [] };

  const rows = (data ?? []) as EligibleMemberRow[];
  const directory = createMemberDirectory(rows);
  return {
    ok: true,
    members: rows.map((row) => directory[row.user_id]).filter(Boolean),
  };
};

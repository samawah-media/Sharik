"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type InternalTeamMemberRow = {
  membership_id: string;
  user_id: string;
  display_name: string;
  membership_status: "active" | "disabled";
  role_keys: string[];
  client_names: string[];
};

export type InternalTeamMember = {
  membershipId: string;
  userId: string;
  displayName: string;
  status: "active" | "disabled";
  roleKeys: string[];
  clientNames: string[];
};

export async function listInternalTeamMembers() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("s015_list_internal_team_members");

  if (error) {
    return { ok: false as const, members: [] };
  }

  return {
    ok: true as const,
    members: ((data ?? []) as InternalTeamMemberRow[]).map((member) => ({
      membershipId: member.membership_id,
      userId: member.user_id,
      displayName: member.display_name,
      status: member.membership_status,
      roleKeys: member.role_keys,
      clientNames: member.client_names,
    } satisfies InternalTeamMember)),
  };
}

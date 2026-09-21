import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthorizationActor } from "@/modules/authorization/evaluator";
import { isActive } from "@/modules/memberships/membership";
import {
  memberFallbackName,
  safeMemberDisplayName,
} from "@/modules/members/member-directory";
import { roleLabelAr } from "@/modules/roles/role-labels";

export type ShellIdentity = {
  displayName: string;
  roleLabels: string[];
};

const createFallbackShellIdentity = (): ShellIdentity => ({
  displayName: memberFallbackName,
  roleLabels: [roleLabelAr()],
});

const uniqueActiveRoleLabels = (actor: AuthorizationActor): string[] => {
  const labels: string[] = [];

  for (const assignment of actor.roleAssignments) {
    if (!isActive(assignment.status)) continue;

    const label = roleLabelAr(assignment.roleKey);
    if (!labels.includes(label)) {
      labels.push(label);
    }
  }

  return labels;
};

export async function readShellIdentity({
  supabase,
  actor,
}: {
  supabase: SupabaseClient;
  actor: AuthorizationActor;
}): Promise<ShellIdentity> {
  const { data, error } = await supabase
    .from("member_profiles")
    .select("display_name")
    .eq("tenant_id", actor.tenantId)
    .eq("user_id", actor.userId)
    .maybeSingle();

  if (error || !data) {
    return createFallbackShellIdentity();
  }

  const roleLabels = uniqueActiveRoleLabels(actor);
  const fallbackRoleLabels = createFallbackShellIdentity().roleLabels;

  return {
    displayName: safeMemberDisplayName(data.display_name),
    roleLabels: roleLabels.length > 0 ? roleLabels : fallbackRoleLabels,
  };
}

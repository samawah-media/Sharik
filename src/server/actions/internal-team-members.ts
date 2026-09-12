"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MemberActionState } from "@/modules/memberships/member-action-state";

const internalRoleSchema = z.enum([
  "tenant_owner",
  "tenant_administrator",
  "project_manager",
  "marketing_manager",
  "account_manager",
  "content_writer",
  "designer",
  "performance_specialist",
]);

const assignmentSchema = z.object({
  membershipId: z.string().uuid(),
  assignmentId: z.string().uuid(),
  roleKey: internalRoleSchema,
  scopeType: z.enum(["tenant", "client"]),
  scopeId: z.string().uuid(),
  reason: z.string().trim().min(3).max(300),
  idempotencyKey: z.string().trim().min(8).max(200),
});

const assignmentRemovalSchema = assignmentSchema.pick({
  membershipId: true,
  assignmentId: true,
  reason: true,
  idempotencyKey: true,
}).extend({ confirmation: z.literal("confirmed") });

const disableSchema = z.object({
  membershipId: z.string().uuid(),
  confirmation: z.literal("تعطيل"),
  reason: z.string().trim().min(3).max(300),
  idempotencyKey: z.string().trim().min(8).max(200),
});

const safeError = (message = "تعذر حفظ التغيير بأمان. تحقق من الصلاحية ثم حاول مرة أخرى."): MemberActionState => ({
  status: "error",
  message,
});

const actionResult = (
  result: unknown,
  expectedSuccess: "updated" | "removed" | "disabled",
): MemberActionState => {
  if (result === "responsibilities_blocked") {
    return safeError("لا يمكن تعطيل العضو قبل إنهاء أو نقل أعماله ومهامه النشطة.");
  }
  if (result === "self_disable_blocked") {
    return safeError("لا يمكنك تعطيل عضويتك الحالية.");
  }
  if (result === "last_administrator_blocked") {
    return safeError("يجب أن يبقى مدير أو مالك نشط واحد على الأقل للمساحة.");
  }
  if (result !== expectedSuccess) return safeError();
  return { status: "success", message: "تم حفظ التغيير." };
};

type InternalTeamMemberRow = {
  membership_id: string;
  user_id: string;
  display_name: string;
  membership_status: "active" | "disabled";
  role_keys: string[];
  client_names: string[];
  assignments: InternalTeamMemberAssignment[];
  available_clients: InternalTeamClientOption[];
};

export type InternalTeamMemberAssignment = {
  assignmentId: string;
  roleKey: z.infer<typeof internalRoleSchema>;
  scopeType: "tenant" | "client";
  scopeId: string;
  scopeName: string;
  status: "active" | "disabled" | "removed";
};

export type InternalTeamClientOption = {
  clientId: string;
  clientName: string;
};

export type InternalTeamMember = {
  membershipId: string;
  userId: string;
  displayName: string;
  status: "active" | "disabled";
  roleKeys: string[];
  clientNames: string[];
  assignments?: InternalTeamMemberAssignment[];
  availableClients?: InternalTeamClientOption[];
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
      assignments: member.assignments ?? [],
      availableClients: member.available_clients ?? [],
    } satisfies InternalTeamMember)),
  };
}

export async function updateInternalMemberAssignmentAction(
  _previousState: MemberActionState,
  formData: FormData,
): Promise<MemberActionState> {
  const parsed = assignmentSchema.safeParse({
    membershipId: formData.get("membershipId"),
    assignmentId: formData.get("assignmentId"),
    roleKey: formData.get("roleKey"),
    scopeType: formData.get("scopeType"),
    scopeId: formData.get("scopeId"),
    reason: formData.get("reason"),
    idempotencyKey: formData.get("idempotencyKey"),
  });
  if (!parsed.success) return safeError("راجع الدور والنطاق وسبب التعديل.");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc(
    "s015_update_internal_member_assignment",
    {
      target_membership_id: parsed.data.membershipId,
      target_assignment_id: parsed.data.assignmentId,
      new_role_key: parsed.data.roleKey,
      new_scope_type: parsed.data.scopeType,
      new_scope_id: parsed.data.scopeId,
      change_reason: parsed.data.reason,
      audit_event_id: crypto.randomUUID(),
      request_idempotency_key: parsed.data.idempotencyKey,
    },
  );
  if (error) return safeError();
  const state = actionResult(data, "updated");
  if (state.status !== "success") return state;
  revalidatePath("/members");
  return state;
}

export async function removeInternalMemberClientScopeAction(
  _previousState: MemberActionState,
  formData: FormData,
): Promise<MemberActionState> {
  const parsed = assignmentRemovalSchema.safeParse({
    membershipId: formData.get("membershipId"),
    assignmentId: formData.get("assignmentId"),
    confirmation: formData.get("confirmation"),
    reason: formData.get("reason"),
    idempotencyKey: formData.get("idempotencyKey"),
  });
  if (!parsed.success) return safeError("اكتب سبب إزالة نطاق العميل.");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc(
    "s015_remove_internal_member_client_scope",
    {
      target_membership_id: parsed.data.membershipId,
      target_assignment_id: parsed.data.assignmentId,
      change_reason: parsed.data.reason,
      audit_event_id: crypto.randomUUID(),
      request_idempotency_key: parsed.data.idempotencyKey,
    },
  );
  if (error) return safeError();
  const state = actionResult(data, "removed");
  if (state.status !== "success") return state;
  revalidatePath("/members");
  return { status: "success", message: "تمت إزالة نطاق العميل." };
}

export async function disableInternalTeamMembershipAction(
  _previousState: MemberActionState,
  formData: FormData,
): Promise<MemberActionState> {
  const parsed = disableSchema.safeParse({
    membershipId: formData.get("membershipId"),
    confirmation: formData.get("confirmation"),
    reason: formData.get("reason"),
    idempotencyKey: formData.get("idempotencyKey"),
  });
  if (!parsed.success) return safeError("اكتب كلمة تعطيل وسبب الإجراء للتأكيد.");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc(
    "s015_disable_internal_team_membership",
    {
      target_membership_id: parsed.data.membershipId,
      disable_reason: parsed.data.reason,
      audit_event_id: crypto.randomUUID(),
      request_idempotency_key: parsed.data.idempotencyKey,
    },
  );
  if (error) return safeError();
  const state = actionResult(data, "disabled");
  if (state.status === "success") revalidatePath("/members");
  return state.status === "success"
    ? { status: "success", message: "تم تعطيل العضوية وحفظ سجلها." }
    : state;
}

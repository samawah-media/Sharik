"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { InvitationActionState } from "@/modules/invitations/internal-team-invitation-state";

const invitationTokenSchema = z
  .string()
  .trim()
  .min(40)
  .max(200)
  .regex(/^[A-Za-z0-9_-]+$/);

const inviteSchema = z.object({
  displayName: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  roleKey: z.enum(["account_manager", "content_writer", "designer"]),
  clientIds: z.array(z.string().uuid()).min(1).max(100),
  invitationToken: invitationTokenSchema,
  idempotencyKey: z.string().trim().min(8).max(200),
});

const invitationMutationSchema = z.object({
  invitationId: z.string().uuid(),
  invitationToken: invitationTokenSchema.optional(),
  idempotencyKey: z.string().trim().min(8).max(200),
});

type InvitationRow = {
  id: string;
  tenant_id: string;
  invited_display_name: string;
  invited_email: string;
  role_key: string;
  client_ids: string[];
  client_names: string[];
  status: string;
  delivery_state: string;
  expires_at: string;
  created_at: string;
  invitation_token?: string | null;
};

export type InternalTeamInvitation = {
  id: string;
  tenantId: string;
  invitedDisplayName: string;
  invitedEmail: string;
  roleKey: "account_manager" | "content_writer" | "designer";
  clientIds: string[];
  clientNames: string[];
  status: "pending" | "accepted" | "revoked" | "superseded";
  deliveryState: "queued" | "sent" | "failed";
  expiresAt: string;
  createdAt: string;
};

const toInvitation = (row: InvitationRow): InternalTeamInvitation => ({
  id: row.id,
  tenantId: row.tenant_id,
  invitedDisplayName: row.invited_display_name,
  invitedEmail: row.invited_email,
  roleKey: row.role_key as InternalTeamInvitation["roleKey"],
  clientIds: row.client_ids,
  clientNames:
    row.client_names.length > 0 ? row.client_names : ["عميل ضمن النطاق"],
  status: row.status as InternalTeamInvitation["status"],
  deliveryState: row.delivery_state as InternalTeamInvitation["deliveryState"],
  expiresAt: row.expires_at,
  createdAt: row.created_at,
});

const safeMutationError = (): InvitationActionState => ({
  status: "error",
  message: "تعذر تنفيذ الإجراء. تحقق من البيانات والصلاحية ثم حاول مرة أخرى.",
});

const invitationPath = (token: string) => `/invite/${token}`;

export async function listInternalTeamInvitations() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc(
    "s015_list_internal_team_invitations_v3",
  );

  if (error) {
    return {
      ok: false as const,
      reason: "read_failed" as const,
      invitations: [],
    };
  }

  return {
    ok: true as const,
    invitations: ((data ?? []) as InvitationRow[]).map(toInvitation),
  };
}

export async function createInternalTeamInvitationAction(
  _previousState: InvitationActionState,
  formData: FormData,
): Promise<InvitationActionState> {
  const parsed = inviteSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    roleKey: formData.get("roleKey"),
    clientIds: formData.getAll("clientIds"),
    invitationToken: formData.get("invitationToken"),
    idempotencyKey: formData.get("idempotencyKey"),
  });
  if (!parsed.success) return safeMutationError();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc(
    "s015_invite_internal_team_member_v3",
    {
      invited_display_name_input: parsed.data.displayName,
      invited_email_input: parsed.data.email,
      role_key_input: parsed.data.roleKey,
      target_client_ids: parsed.data.clientIds,
      invitation_token_input: parsed.data.invitationToken,
      request_id: crypto.randomUUID(),
      audit_event_id: crypto.randomUUID(),
      request_idempotency_key: parsed.data.idempotencyKey,
    },
  );
  if (error) return safeMutationError();

  const created = ((data ?? []) as InvitationRow[])[0];
  if (!created?.invitation_token) return safeMutationError();

  revalidatePath("/invitations/internal");
  revalidatePath("/members");
  return {
    status: "success",
    message: "تم إنشاء الدعوة. انسخ الرابط وشاركه مع العضو عبر قناة موثوقة.",
    invitationPath: invitationPath(created.invitation_token),
  };
}

export async function resendInternalTeamInvitationAction(
  _previousState: InvitationActionState,
  formData: FormData,
): Promise<InvitationActionState> {
  const parsed = invitationMutationSchema.safeParse({
    invitationId: formData.get("invitationId"),
    invitationToken: formData.get("invitationToken"),
    idempotencyKey: formData.get("idempotencyKey"),
  });
  if (!parsed.success || !parsed.data.invitationToken) {
    return safeMutationError();
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc(
    "s015_resend_internal_team_invitation_v2",
    {
      target_invitation_id: parsed.data.invitationId,
      invitation_token_input: parsed.data.invitationToken,
      audit_event_id: crypto.randomUUID(),
      request_idempotency_key: parsed.data.idempotencyKey,
    },
  );
  if (error) return safeMutationError();

  const refreshedToken = (data as string | null) ?? null;
  if (!refreshedToken) return safeMutationError();

  revalidatePath("/invitations/internal");
  revalidatePath("/members");
  return {
    status: "success",
    message: "تم إنشاء رابط جديد وإبطال الرابط السابق.",
    invitationPath: invitationPath(refreshedToken),
  };
}

export async function revokeInternalTeamInvitationAction(
  _previousState: InvitationActionState,
  formData: FormData,
): Promise<InvitationActionState> {
  const parsed = invitationMutationSchema.safeParse({
    invitationId: formData.get("invitationId"),
    idempotencyKey: formData.get("idempotencyKey"),
  });
  if (!parsed.success) return safeMutationError();

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc(
    "s015_revoke_internal_team_invitation_v2",
    {
      target_invitation_id: parsed.data.invitationId,
      revoke_reason: "revoked_from_team_invitation_ui",
      audit_event_id: crypto.randomUUID(),
      request_idempotency_key: parsed.data.idempotencyKey,
    },
  );
  if (error) return safeMutationError();

  revalidatePath("/invitations/internal");
  revalidatePath("/members");
  return { status: "success", message: "تم إلغاء الدعوة." };
}

const invitationAcceptSchema = z.object({
  invitationToken: invitationTokenSchema,
});

export type InternalInvitationPreview = {
  invitedDisplayName: string;
  roleKey: "account_manager" | "content_writer" | "designer";
  clientNames: string[];
  expiresAt: string;
  status: "pending" | "accepted";
};

type InvitationPreviewRow = {
  invited_display_name: string;
  role_key: InternalInvitationPreview["roleKey"];
  client_names: string[];
  expires_at: string;
  status: InternalInvitationPreview["status"];
};

export async function readInternalInvitationPreview(token: string) {
  const parsed = invitationTokenSchema.safeParse(token);
  if (!parsed.success) return { ok: false as const };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc(
    "s015_read_internal_team_invitation_v2",
    { invitation_token_input: parsed.data },
  );
  const row = ((data ?? []) as InvitationPreviewRow[])[0];
  if (error || !row) return { ok: false as const };

  return {
    ok: true as const,
    invitation: {
      invitedDisplayName: row.invited_display_name,
      roleKey: row.role_key,
      clientNames: row.client_names,
      expiresAt: row.expires_at,
      status: row.status,
    } satisfies InternalInvitationPreview,
  };
}

export async function acceptInternalTeamInvitationAction(formData: FormData) {
  const parsed = invitationAcceptSchema.safeParse({
    invitationToken: formData.get("invitationToken"),
  });
  if (!parsed.success) redirect("/sign-in");

  const tokenFingerprint = createHash("sha256")
    .update(parsed.data.invitationToken)
    .digest("hex")
    .slice(0, 40);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("s015_accept_internal_team_invitation", {
    invitation_token_input: parsed.data.invitationToken,
    request_id: crypto.randomUUID(),
    audit_event_id: crypto.randomUUID(),
    request_idempotency_key: `s015-accept-${tokenFingerprint}`,
  });

  if (error) {
    redirect(`${invitationPath(parsed.data.invitationToken)}?result=denied`);
  }
  revalidatePath("/work");
  revalidatePath("/portfolio");
  redirect("/work?invitation=accepted");
}

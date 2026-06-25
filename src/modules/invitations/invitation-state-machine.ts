import type { InvitationRecord } from "./invitation-repository";

export type InvitationLifecycleError =
  | "INVITATION_EXPIRED"
  | "INVITATION_REVOKED"
  | "INVITATION_SUPERSEDED"
  | "INVITATION_ALREADY_USED"
  | "EMAIL_MISMATCH"
  | "INVITATION_NOT_FOUND";

export type InvitationAcceptDecision =
  | { ok: true; idempotent: false }
  | { ok: true; idempotent: true }
  | { ok: false; error: InvitationLifecycleError };

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const isInvitationExpired = ({
  invitation,
  now,
}: {
  invitation: Pick<InvitationRecord, "expiresAt" | "status">;
  now: Date;
}) =>
  invitation.status === "pending" &&
  now.getTime() >= new Date(invitation.expiresAt).getTime();

export const getInvitationLifecycleError = ({
  invitation,
  now,
}: {
  invitation: InvitationRecord;
  now: Date;
}): Exclude<InvitationLifecycleError, "EMAIL_MISMATCH" | "INVITATION_NOT_FOUND"> | undefined => {
  if (invitation.status === "revoked") {
    return "INVITATION_REVOKED";
  }

  if (invitation.status === "superseded") {
    return "INVITATION_SUPERSEDED";
  }

  if (invitation.status === "accepted") {
    return "INVITATION_ALREADY_USED";
  }

  if (isInvitationExpired({ invitation, now })) {
    return "INVITATION_EXPIRED";
  }

  return undefined;
};

export const evaluateInvitationAcceptance = ({
  invitation,
  acceptingEmail,
  acceptingUserId,
  now,
}: {
  invitation: InvitationRecord | undefined;
  acceptingEmail: string;
  acceptingUserId: string;
  now: Date;
}): InvitationAcceptDecision => {
  if (!invitation) {
    return { ok: false, error: "INVITATION_NOT_FOUND" };
  }

  if (normalizeEmail(acceptingEmail) !== normalizeEmail(invitation.invitedEmail)) {
    return { ok: false, error: "EMAIL_MISMATCH" };
  }

  if (
    invitation.status === "accepted" &&
    invitation.acceptedBy === acceptingUserId
  ) {
    return { ok: true, idempotent: true };
  }

  const lifecycleError = getInvitationLifecycleError({ invitation, now });

  if (lifecycleError) {
    return { ok: false, error: lifecycleError };
  }

  return { ok: true, idempotent: false };
};

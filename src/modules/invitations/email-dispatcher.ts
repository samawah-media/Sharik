import type { InvitationRecord } from "./invitation-repository";

export type InvitationEmail = {
  to: string;
  invitationId: string;
  token: string;
  tenantId: string;
  clientIds: string[];
};

export type InvitationEmailDispatcher = {
  sendInternalInvitation(invitation: InvitationRecord): Promise<{
    ok: boolean;
    messageId?: string;
  }>;
  sendClientInvitation(invitation: InvitationRecord): Promise<{
    ok: boolean;
    messageId?: string;
  }>;
};

export class LocalInvitationEmailDispatcher
  implements InvitationEmailDispatcher
{
  readonly sent: InvitationEmail[] = [];

  async sendInternalInvitation(invitation: InvitationRecord) {
    return this.capture(invitation);
  }

  async sendClientInvitation(invitation: InvitationRecord) {
    return this.capture(invitation);
  }

  private capture(invitation: InvitationRecord) {
    this.sent.push({
      to: invitation.invitedEmail,
      invitationId: invitation.id,
      token: invitation.token,
      tenantId: invitation.tenantId,
      clientIds: invitation.clientIds,
    });

    return { ok: true, messageId: `local-${invitation.id}` };
  }
}

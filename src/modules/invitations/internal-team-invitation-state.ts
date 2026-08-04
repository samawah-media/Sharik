export type InvitationActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  invitationPath?: string;
};

export const initialInvitationActionState: InvitationActionState = {
  status: "idle",
};

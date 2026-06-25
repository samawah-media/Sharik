import { InvitationStatusView } from "@/ui/invitations/invitation-status";

const tokenStatus = (token: string) => {
  if (token.includes("expired")) return "expired" as const;
  if (token.includes("revoked")) return "revoked" as const;
  if (token.includes("superseded")) return "superseded" as const;
  if (token.includes("used")) return "already-used" as const;
  if (token.includes("mismatch")) return "email-mismatch" as const;
  if (token.includes("accepted")) return "accepted" as const;
  return "pending" as const;
};

export default async function InviteStatusPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <InvitationStatusView status={tokenStatus(token)} />;
}

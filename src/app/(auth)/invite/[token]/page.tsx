import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  readInternalInvitationPreview,
} from "@/server/actions/internal-team-invitations";
import { canUseRouteActorFixtures } from "@/server/navigation/route-guards";
import { InternalInvitationAcceptance } from "@/ui/invitations/internal-invitation-acceptance";
import { InvitationStatusView } from "@/ui/invitations/invitation-status";

const fixtureTokenStatus = (token: string) => {
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
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams?: Promise<{ result?: string }>;
}) {
  const { token } = await params;
  if (canUseRouteActorFixtures()) {
    return <InvitationStatusView status={fixtureTokenStatus(token)} />;
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) {
    redirect(`/sign-in?next=${encodeURIComponent(`/invite/${token}`)}`);
  }

  const preview = await readInternalInvitationPreview(token);
  if (!preview.ok) return <InvitationStatusView status="revoked" />;

  const query = await searchParams;
  return (
    <main className="mx-auto grid min-h-dvh w-full max-w-xl content-center px-4 py-8">
      <InternalInvitationAcceptance
        denied={query?.result === "denied"}
        invitation={preview.invitation}
        invitationToken={token}
      />
    </main>
  );
}

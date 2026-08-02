import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  canUseRouteActorFixtures,
  guardClientDetailRoute,
  resolveRouteRuntime,
} from "@/server/navigation/route-guards";
import { PageHeader } from "@/ui/layout/page-header";
import { ClientFilesBoard } from "@/ui/client/client-files-board";
import type { GroupedFile } from "@/modules/files/file-groups";
import {
  AccessDeniedState,
  MembershipDisabledState,
  NoAssignedClientState,
  SessionExpiredState,
} from "@/ui/shared/access-states";

export const dynamic = "force-dynamic";

type ClientFileRow = {
  id: string;
  file_name: string | null;
  file_type: string;
  file_size: number;
  visibility: string;
  version_number: number;
  is_final: boolean;
  created_at: string;
  deliverable_id: string | null;
  deliverable?: { name: string | null }[] | null;
};

export default async function ClientFilesPage({
  searchParams,
}: {
  searchParams?: Promise<{ as?: string }>;
}) {
  const params = await searchParams;
  const runtime = await resolveRouteRuntime(
    params?.as ?? (canUseRouteActorFixtures() ? "client_viewer_a" : undefined),
  );

  if (!runtime.ok) {
    if (
      runtime.reason === "auth_required" ||
      runtime.reason === "session_expired"
    ) {
      return <SessionExpiredState />;
    }
    if (runtime.reason === "membership_disabled") {
      return <MembershipDisabledState returnHref="/sign-in" />;
    }
    return <AccessDeniedState returnHref="/sign-in" />;
  }

  const { actor, clients } = runtime;
  const primaryClient = clients.find((client) =>
    actor.roleAssignments.some(
      (assignment) =>
        assignment.status === "active" &&
        assignment.scopeType === "client" &&
        assignment.scopeId === client.id,
    ),
  );

  if (!primaryClient) {
    return <NoAssignedClientState returnHref="/sign-in" />;
  }

  const access = guardClientDetailRoute({
    actor,
    clientId: primaryClient.id,
    clients,
  });

  if (!access.allowed) {
    return <AccessDeniedState />;
  }

  const supabase = await createSupabaseServerClient();
  const { data: rows } = await supabase
    .from("file_assets")
    .select(
      "id, file_name, file_type, file_size, visibility, version_number, is_final, created_at, deliverable_id, deliverable:deliverables(name)",
    )
    .eq("tenant_id", actor.tenantId)
    .eq("client_id", primaryClient.id)
    .in("visibility", [
      "client_visible",
      "client_uploaded",
      "final_delivery",
      "contract_file",
      "report_file",
      "brand_asset",
    ])
    .eq("upload_state", "ready")
    .or("visibility.neq.final_delivery,is_final.eq.true")
    .order("created_at", { ascending: false });

  const files: GroupedFile[] = (rows ?? []).map((row: ClientFileRow) => ({
    id: row.id,
    name: row.file_name ?? "ملف",
    fileType: row.file_type,
    fileSize: Number(row.file_size),
    visibility: row.visibility as GroupedFile["visibility"],
    versionNumber: row.version_number,
    isFinal: row.is_final,
    createdAt: row.created_at,
    deliverableName: row.deliverable?.[0]?.name ?? undefined,
  }));

  return (
    <main className="grid gap-5" dir="rtl">
      <PageHeader
        description="كل ملفاتك المعتمدة والتسليمات النهائية في مكان واحد."
        title="ملفاتي"
      />
      <ClientFilesBoard files={files} />
    </main>
  );
}

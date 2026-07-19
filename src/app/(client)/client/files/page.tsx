import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  canUseRouteActorFixtures,
  guardClientDetailRoute,
  resolveRouteRuntime,
} from "@/server/navigation/route-guards";
import { PageHeader } from "@/ui/layout/page-header";
import {
  WorkspaceFileDownload,
  WorkspaceFilePreview,
} from "@/ui/deliverables/workspace-files";
import {
  AccessDeniedState,
  MembershipDisabledState,
  NoAssignedClientState,
  SessionExpiredState,
} from "@/ui/shared/access-states";

export const dynamic = "force-dynamic";

const visibilityLabels: Record<string, string> = {
  client_visible: "ملف متاح",
  client_uploaded: "ملف مرفوع من العميل",
  final_delivery: "تسليم نهائي",
  contract_file: "ملف العقد",
  report_file: "تقرير",
  brand_asset: "أصل للهوية",
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${Math.round(bytes / 1024)} KB`;
  return `${Math.round(bytes / 1_048_576)} MB`;
}

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
  const { data: files } = await supabase
    .from("file_assets")
    .select(
      "id, file_name, file_type, file_size, visibility, version_number, is_final, created_at",
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

  const safeFiles = files ?? [];

  return (
    <main className="grid gap-5" dir="rtl">
      <PageHeader
        description="ملفاتك المعتمدة والتسليمات النهائية"
        title="الملفات"
      />
      {safeFiles.length > 0 ? (
        <ul className="grid gap-3">
          {safeFiles.map((file) => (
            <li
              className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
              data-file-visibility={file.visibility}
              key={file.id}
            >
              <div className="min-w-0">
                <p className="break-words text-sm font-semibold" dir="auto">
                  {file.file_name || "ملف"}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {visibilityLabels[file.visibility] ?? file.visibility}
                  {" · "}
                  {formatSize(Number(file.file_size))}
                  {" · "}
                  نسخة {file.version_number}
                </p>
              </div>
              <WorkspaceFilePreview
                fileId={file.id}
                fileType={file.file_type}
                label={file.file_name || "ملف"}
              />
              <WorkspaceFileDownload fileId={file.id} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center">
          <p className="text-sm text-muted">
            لا توجد ملفات متاحة حاليًا. تظهر الملفات المعتمدة والتسليمات
            النهائية هنا فور توفرها.
          </p>
        </div>
      )}
    </main>
  );
}

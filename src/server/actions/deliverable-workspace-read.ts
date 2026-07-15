import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createMemberDirectory,
  type MemberDirectory,
} from "@/modules/members/member-directory";
import type {
  DeliverableActivityWorkspace,
  DeliverableWorkspace,
  DeliverableWorkspaceSummary,
  TaskCapabilities,
} from "@/modules/deliverables/deliverable-workspace";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ScopedDeliverable = { id: string; currentVersionId?: string };

const member = (directory: MemberDirectory, id?: string | null) =>
  id ? directory[id] : undefined;

const MANAGEMENT_ROLES = [
  "tenant_owner",
  "tenant_administrator",
  "project_manager",
  "marketing_manager",
] as const;

const TEAM_ROLES = [
  "account_manager",
  "content_writer",
  "designer",
  "performance_specialist",
] as const;

type ActorTaskAuthority = { isManagement: boolean; isTeam: boolean };

const NO_TASK_AUTHORITY: ActorTaskAuthority = {
  isManagement: false,
  isTeam: false,
};

async function resolveActorTaskAuthority({
  supabase,
  tenantId,
  clientId,
  actorUserId,
}: {
  supabase: SupabaseClient;
  tenantId: string;
  clientId: string;
  actorUserId: string;
}): Promise<ActorTaskAuthority> {
  const membershipResponse = await supabase
    .from("tenant_memberships")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("auth_user_id", actorUserId)
    .eq("status", "active");
  const membershipIds = (membershipResponse.data ?? []).map((row) => row.id);
  if (membershipResponse.error || membershipIds.length === 0) {
    return NO_TASK_AUTHORITY;
  }

  const roleResponse = await supabase
    .from("role_assignments")
    .select("role_key, scope_type, scope_id")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .in("membership_id", membershipIds);
  if (roleResponse.error) return NO_TASK_AUTHORITY;

  const activeRoles = roleResponse.data ?? [];
  const isManagement = activeRoles.some(
    (role) =>
      MANAGEMENT_ROLES.includes(
        role.role_key as (typeof MANAGEMENT_ROLES)[number],
      ) &&
      ((role.scope_type === "tenant" && role.scope_id === tenantId) ||
        (role.scope_type === "client" && role.scope_id === clientId)),
  );
  const isTeam = activeRoles.some(
    (role) =>
      TEAM_ROLES.includes(role.role_key as (typeof TEAM_ROLES)[number]) &&
      role.scope_type === "client" &&
      role.scope_id === clientId,
  );

  return { isManagement, isTeam };
}

function taskCapabilitiesForDeliverable({
  authority,
  actorUserId,
  deliverableOwnerUserId,
  deliverableContributorIds,
}: {
  authority: ActorTaskAuthority;
  actorUserId: string;
  deliverableOwnerUserId?: string | null;
  deliverableContributorIds?: string[] | null;
}): TaskCapabilities {
  const isOwnerOrContributor =
    (deliverableOwnerUserId === actorUserId ||
      (deliverableContributorIds ?? []).includes(actorUserId)) &&
    authority.isTeam;

  return {
    canCreateTask: authority.isManagement || isOwnerOrContributor,
    canAssignOthers: authority.isManagement,
    canReassignTask: authority.isManagement,
    canUpdateOwnTaskStatus:
      authority.isManagement || isOwnerOrContributor || authority.isTeam,
    canDeleteTask: authority.isManagement,
    canEditTaskFields: authority.isManagement || isOwnerOrContributor,
  };
}

export async function listScopedDeliverableWorkspaceSummaries({
  tenantId,
  clientId,
  deliverables,
  supabase,
}: {
  tenantId: string;
  clientId: string;
  deliverables: ScopedDeliverable[];
  supabase?: SupabaseClient;
}): Promise<Record<string, DeliverableWorkspaceSummary>> {
  if (deliverables.length === 0) return {};

  const client = supabase ?? (await createSupabaseServerClient());
  const deliverableIds = deliverables.map((deliverable) => deliverable.id);

  const [versions, tasks, files, comments] = await Promise.all([
    client
      .from("deliverable_versions")
      .select("deliverable_id")
      .eq("tenant_id", tenantId)
      .eq("client_id", clientId)
      .in("deliverable_id", deliverableIds),
    client
      .from("deliverable_tasks")
      .select("deliverable_id")
      .eq("tenant_id", tenantId)
      .eq("client_id", clientId)
      .in("deliverable_id", deliverableIds),
    client
      .from("file_assets")
      .select("deliverable_id")
      .eq("tenant_id", tenantId)
      .eq("client_id", clientId)
      .in("deliverable_id", deliverableIds)
      .eq("upload_state", "ready"),
    client
      .from("comments")
      .select("deliverable_id")
      .eq("tenant_id", tenantId)
      .eq("client_id", clientId)
      .in("deliverable_id", deliverableIds),
  ]);

  const countByDeliverable = (
    rows: { deliverable_id: string }[] | null | undefined,
  ) => {
    const counts = new Map<string, number>();
    for (const row of rows ?? []) {
      counts.set(row.deliverable_id, (counts.get(row.deliverable_id) ?? 0) + 1);
    }
    return counts;
  };
  const versionCounts = countByDeliverable(versions.data);
  const taskCounts = countByDeliverable(tasks.data);
  const fileCounts = countByDeliverable(files.data);
  const commentCounts = countByDeliverable(comments.data);

  return Object.fromEntries(
    deliverables.map((deliverable) => [
      deliverable.id,
      {
        deliverableId: deliverable.id,
        currentVersionId: deliverable.currentVersionId,
        counts: {
          versions: versionCounts.get(deliverable.id) ?? 0,
          tasks: taskCounts.get(deliverable.id) ?? 0,
          files: fileCounts.get(deliverable.id) ?? 0,
          comments: commentCounts.get(deliverable.id) ?? 0,
        },
      },
    ]),
  );
}

export async function listScopedDeliverableWorkspaces({
  tenantId,
  clientId,
  deliverables,
  supabase,
  actorUserId,
}: {
  tenantId: string;
  clientId: string;
  deliverables: ScopedDeliverable[];
  supabase?: SupabaseClient;
  actorUserId?: string;
}): Promise<Record<string, DeliverableWorkspace>> {
  if (deliverables.length === 0) return {};

  const client = supabase ?? (await createSupabaseServerClient());
  const deliverableIds = deliverables.map((deliverable) => deliverable.id);
  const scoped = <T extends { deliverable_id: string }>(rows: T[] | null) =>
    rows ?? [];
  const actorTaskAuthority = actorUserId
    ? await resolveActorTaskAuthority({
        supabase: client,
        tenantId,
        clientId,
        actorUserId,
      })
    : NO_TASK_AUTHORITY;

  const [
    versions,
    tasks,
    files,
    comments,
    quality,
    approvals,
    sla,
    audits,
    eligibleAssignees,
    deliverableRows,
  ] = await Promise.all([
    client
      .from("deliverable_versions")
      .select(
        "id, deliverable_id, version_number, status, submitted_by, submitted_at, brief, content_body, caption, channel, format, objective, kpi, source_reference",
      )
      .eq("tenant_id", tenantId)
      .eq("client_id", clientId)
      .in("deliverable_id", deliverableIds)
      .order("version_number", { ascending: false }),
    client
      .from("deliverable_tasks")
      .select(
        "id, deliverable_id, version_id, title, description, status, priority, assignee_user_id, due_date, sort_order",
      )
      .eq("tenant_id", tenantId)
      .eq("client_id", clientId)
      .in("deliverable_id", deliverableIds)
      .order("sort_order", { ascending: true }),
    client
      .from("file_assets")
      .select(
        "id, deliverable_id, version_id, file_name, file_type, file_size, visibility, version_number, is_final, created_at",
      )
      .eq("tenant_id", tenantId)
      .eq("client_id", clientId)
      .in("deliverable_id", deliverableIds)
      .eq("upload_state", "ready")
      .order("created_at", { ascending: false }),
    client
      .from("comments")
      .select(
        "id, deliverable_id, version_id, author_user_id, comment_type, visibility, body, body_format, body_json, created_at",
      )
      .eq("tenant_id", tenantId)
      .eq("client_id", clientId)
      .in("deliverable_id", deliverableIds)
      .order("created_at", { ascending: true }),
    client
      .from("deliverable_quality_checks")
      .select(
        "id, deliverable_id, version_id, label, status, note, checked_by, checked_at, sort_order",
      )
      .eq("tenant_id", tenantId)
      .eq("client_id", clientId)
      .in("deliverable_id", deliverableIds)
      .order("sort_order", { ascending: true }),
    client
      .from("approval_decisions")
      .select(
        "id, deliverable_id, version_id, approval_kind, decision, actor_user_id, decided_at",
      )
      .eq("tenant_id", tenantId)
      .eq("client_id", clientId)
      .in("deliverable_id", deliverableIds)
      .order("decided_at", { ascending: false }),
    client
      .from("sla_timeline_segments")
      .select("id, deliverable_id, kind, reason, started_at")
      .eq("tenant_id", tenantId)
      .eq("client_id", clientId)
      .in("deliverable_id", deliverableIds)
      .order("started_at", { ascending: false }),
    client
      .from("audit_events")
      .select("id, target_id, action, actor_user_id, created_at")
      .eq("tenant_id", tenantId)
      .eq("client_id", clientId)
      .in("target_type", ["deliverable", "deliverable_version"])
      .order("created_at", { ascending: false })
      .limit(200),
    actorTaskAuthority.isManagement
      ? client.rpc("s015_list_task_eligible_assignees", {
          target_tenant_id: tenantId,
          target_client_id: clientId,
        })
      : Promise.resolve({
          data: [] as Array<{ user_id: string }>,
          error: null,
        }),
    client
      .from("deliverables")
      .select("id, owner_user_id, contributor_user_ids")
      .eq("tenant_id", tenantId)
      .eq("client_id", clientId)
      .in("id", deliverableIds),
  ]);

  const required = [
    versions,
    tasks,
    files,
    comments,
    quality,
    approvals,
    sla,
    eligibleAssignees,
    deliverableRows,
  ];
  if (required.some((result) => result.error)) return {};

  const deliverableMap = new Map<
    string,
    { ownerUserId?: string | null; contributorIds?: string[] | null }
  >();
  for (const row of (deliverableRows.data ?? []) as Array<{
    id: string;
    owner_user_id?: string | null;
    contributor_user_ids?: string[] | null;
  }>) {
    deliverableMap.set(row.id, {
      ownerUserId: row.owner_user_id,
      contributorIds: row.contributor_user_ids,
    });
  }

  const memberIds = Array.from(
    new Set(
      [
        ...(versions.data ?? []).map((row) => row.submitted_by),
        ...(tasks.data ?? []).map((row) => row.assignee_user_id),
        ...(comments.data ?? []).map((row) => row.author_user_id),
        ...(quality.data ?? []).map((row) => row.checked_by),
        ...(approvals.data ?? []).map((row) => row.actor_user_id),
        ...(audits.data ?? []).map((row) => row.actor_user_id),
        ...(
          (eligibleAssignees.data ?? []) as Array<{ user_id?: string | null }>
        ).map((row) => row.user_id),
      ].filter((id): id is string => Boolean(id)),
    ),
  );
  const profileResult = memberIds.length
    ? await client
        .from("member_profiles")
        .select("user_id, display_name, role_label, avatar_url")
        .eq("tenant_id", tenantId)
        .in("user_id", memberIds)
    : { data: [], error: null };
  if (profileResult.error) return {};
  const directory = createMemberDirectory(profileResult.data ?? []);

  const assigneeMembershipIds = new Set(
    ((eligibleAssignees.data ?? []) as Array<{ user_id?: string | null }>)
      .map((row) => row.user_id)
      .filter((id): id is string => Boolean(id)),
  );
  const dedupedAssignees = Array.from(assigneeMembershipIds)
    .map((id) => directory[id])
    .filter((m): m is NonNullable<typeof m> => Boolean(m));

  const entries = await Promise.all(
    deliverables.map(async (deliverable) => {
      const versionRows = scoped(versions.data).filter(
        (row) => row.deliverable_id === deliverable.id,
      );
      const taskRows = scoped(tasks.data).filter(
        (row) => row.deliverable_id === deliverable.id,
      );
      const fileRows = scoped(files.data).filter(
        (row) => row.deliverable_id === deliverable.id,
      );
      const commentRows = scoped(comments.data).filter(
        (row) => row.deliverable_id === deliverable.id,
      );
      const qualityRows = scoped(quality.data).filter(
        (row) => row.deliverable_id === deliverable.id,
      );
      const approvalRows = scoped(approvals.data).filter(
        (row) => row.deliverable_id === deliverable.id,
      );
      const slaRows = scoped(sla.data).filter(
        (row) => row.deliverable_id === deliverable.id,
      );

      const deliverableMeta = deliverableMap.get(deliverable.id);
      const capabilities = actorUserId
        ? taskCapabilitiesForDeliverable({
            authority: actorTaskAuthority,
            actorUserId,
            deliverableOwnerUserId: deliverableMeta?.ownerUserId,
            deliverableContributorIds: deliverableMeta?.contributorIds,
          })
        : {
            canCreateTask: false,
            canAssignOthers: false,
            canReassignTask: false,
            canUpdateOwnTaskStatus: false,
            canDeleteTask: false,
            canEditTaskFields: false,
          };

      const activity: DeliverableActivityWorkspace[] = [
        ...versionRows.map((row) => ({
          id: `version-${row.id}`,
          kind: "version" as const,
          label: `تم رفع النسخة ${row.version_number}`,
          createdAt: row.submitted_at,
          actor: member(directory, row.submitted_by),
        })),
        ...commentRows.map((row) => ({
          id: `comment-${row.id}`,
          kind: "comment" as const,
          label:
            row.visibility === "internal_only"
              ? "تعليق داخلي"
              : "تعليق ظاهر للعميل",
          createdAt: row.created_at,
          actor: member(directory, row.author_user_id),
        })),
        ...approvalRows.map((row) => ({
          id: `approval-${row.id}`,
          kind: "approval" as const,
          label: `${row.approval_kind === "internal" ? "قرار داخلي" : "قرار العميل"}: ${row.decision}`,
          createdAt: row.decided_at,
          actor: member(directory, row.actor_user_id),
        })),
        ...slaRows.map((row) => ({
          id: `sla-${row.id}`,
          kind: "sla" as const,
          label: `SLA: ${row.kind}`,
          createdAt: row.started_at,
        })),
      ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      const workspace: DeliverableWorkspace = {
        deliverableId: deliverable.id,
        currentActorUserId: actorUserId,
        currentVersionId: deliverable.currentVersionId,
        eligibleAssignees: capabilities.canAssignOthers ? dedupedAssignees : [],
        taskCapabilities: capabilities,
        versions: versionRows.map((row) => ({
          id: row.id,
          versionNumber: row.version_number,
          status: row.status,
          submittedAt: row.submitted_at,
          submittedBy: member(directory, row.submitted_by),
          brief: row.brief ?? undefined,
          body: row.content_body ?? undefined,
          caption: row.caption ?? undefined,
          channel: row.channel ?? undefined,
          format: row.format ?? undefined,
          objective: row.objective ?? undefined,
          kpi: row.kpi ?? undefined,
          sourceReference: row.source_reference ?? undefined,
        })),
        tasks: taskRows.map((row) => ({
          id: row.id,
          title: row.title,
          description: row.description ?? undefined,
          status: row.status,
          priority: row.priority,
          assigneeUserId: row.assignee_user_id ?? undefined,
          assignee: member(directory, row.assignee_user_id),
          dueDate: row.due_date ?? undefined,
          sortOrder: row.sort_order,
        })),
        files: fileRows.map((row) => ({
          id: row.id,
          name: row.file_name || "ملف مرفق",
          fileType: row.file_type,
          fileSize: Number(row.file_size),
          visibility: row.visibility,
          versionId: row.version_id ?? undefined,
          versionNumber: row.version_number,
          isFinal: row.is_final,
          createdAt: row.created_at,
        })),
        comments: commentRows.map((row) => ({
          id: row.id,
          versionId: row.version_id ?? undefined,
          type: row.comment_type,
          visibility: row.visibility,
          body: row.body,
          bodyFormat: row.body_format,
          bodyJson: row.body_json ?? undefined,
          author: member(directory, row.author_user_id),
          createdAt: row.created_at,
        })),
        qualityChecks: qualityRows.map((row) => ({
          id: row.id,
          versionId: row.version_id,
          label: row.label,
          status: row.status,
          note: row.note ?? undefined,
          checkedBy: member(directory, row.checked_by),
          checkedAt: row.checked_at ?? undefined,
          sortOrder: row.sort_order,
        })),
        activity,
        counts: {
          versions: versionRows.length,
          tasks: taskRows.length,
          files: fileRows.length,
          comments: commentRows.length,
        },
      };
      return [deliverable.id, workspace] as const;
    }),
  );
  return Object.fromEntries(entries);
}

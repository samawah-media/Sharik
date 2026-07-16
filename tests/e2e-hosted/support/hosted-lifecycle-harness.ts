import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  hostedPersona,
  type HostedPersona,
  type HostedPersonaKey,
} from "./uat-personas";

type HostedLifecycleActor = HostedPersona & { id: string };

type HostedLifecycleActors = Record<HostedPersonaKey, HostedLifecycleActor>;

export type HostedLifecycleSeed = {
  actors: HostedLifecycleActors;
  allocationId: string;
  clientId: string;
  contractId: string;
  deliverableId: string;
  deliverableName: string;
  packageId: string;
  packageLineId: string;
  publishableKey: string;
  qualityLabel: string;
  reservationLedgerId: string;
  runId: string;
  supabaseUrl: string;
  taskTitle: string;
  tenantId: string;
};

const actorKeys: HostedPersonaKey[] = [
  "ADMIN",
  "ACCOUNT_MANAGER",
  "CONTENT_WRITER",
  "DESIGNER",
  "UNASSIGNED",
  "CLIENT_APPROVER",
  "CLIENT_VIEWER",
];

const required = (key: string) => {
  const value = process.env[key];
  if (!value) throw new Error(`Hosted lifecycle requires ${key}.`);
  return value;
};

const expectNoError = <T>(
  response: { data: T; error: { code?: string; message: string } | null },
  label: string,
) => {
  if (response.error) {
    const code = response.error.code ? ` (${response.error.code})` : "";
    throw new Error(`${label} failed${code}: ${response.error.message}`);
  }
  return response.data;
};

const createHostedServiceClient = () => {
  const supabaseUrl = required("S015_UAT_SUPABASE_URL");
  const allowedHostname = required("S015_UAT_SUPABASE_HOSTNAME").toLowerCase();
  const target = new URL(supabaseUrl);
  if (
    target.protocol !== "https:" ||
    target.hostname.toLowerCase() !== allowedHostname ||
    !target.hostname.endsWith(".supabase.co")
  ) {
    throw new Error("Hosted lifecycle refused an unapproved Supabase target.");
  }

  const serviceRoleKey = required("S015_UAT_SERVICE_ROLE_KEY");
  return {
    client: createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    }),
    publishableKey: required("S015_UAT_PUBLISHABLE_KEY"),
    supabaseUrl,
  };
};

const resolveHostedActors = async (client: SupabaseClient) => {
  const credentials = Object.fromEntries(
    actorKeys.map((key) => [key, hostedPersona(key)]),
  ) as Record<HostedPersonaKey, HostedPersona>;
  const response = await client.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (response.error) {
    throw new Error(`Hosted actor inventory failed: ${response.error.message}`);
  }

  return Object.fromEntries(
    actorKeys.map((key) => {
      const persona = credentials[key];
      const user = response.data.users.find(
        (candidate) => candidate.email?.toLowerCase() === persona.email.toLowerCase(),
      );
      if (!user) throw new Error(`Hosted actor mapping is missing ${key}.`);
      return [key, { ...persona, id: user.id }];
    }),
  ) as HostedLifecycleActors;
};

type MembershipRow = {
  auth_user_id: string;
  id: string;
  tenant_id: string;
};

type RoleRow = {
  membership_id: string;
  role_key: string;
  scope_id: string;
  scope_type: string;
  tenant_id: string;
};

const resolveHostedScope = async (
  client: SupabaseClient,
  actors: HostedLifecycleActors,
) => {
  const actorIds = actorKeys.map((key) => actors[key].id);
  const memberships = expectNoError(
    await client
      .from("tenant_memberships")
      .select("id, tenant_id, auth_user_id")
      .in("auth_user_id", actorIds)
      .eq("status", "active"),
    "hosted membership inventory",
  ) as MembershipRow[];
  const roles = expectNoError(
    await client
      .from("role_assignments")
      .select("tenant_id, membership_id, role_key, scope_type, scope_id")
      .in("membership_id", memberships.map((membership) => membership.id))
      .eq("status", "active"),
    "hosted role inventory",
  ) as RoleRow[];

  const roleFor = (key: HostedPersonaKey, allowedRoles: string[]) => {
    const membershipIds = memberships
      .filter((membership) => membership.auth_user_id === actors[key].id)
      .map((membership) => membership.id);
    const role = roles.find(
      (candidate) =>
        membershipIds.includes(candidate.membership_id) &&
        allowedRoles.includes(candidate.role_key),
    );
    if (!role) throw new Error(`Hosted role mapping is missing ${key}.`);
    return role;
  };

  const approverRole = roleFor("CLIENT_APPROVER", ["client_approver"]);
  if (approverRole.scope_type !== "client") {
    throw new Error("Hosted client approver is not client scoped.");
  }
  const tenantId = approverRole.tenant_id;
  const clientId = approverRole.scope_id;

  const clientRoles: Array<[HostedPersonaKey, string[]]> = [
    ["ACCOUNT_MANAGER", ["account_manager"]],
    ["CONTENT_WRITER", ["content_writer"]],
    ["DESIGNER", ["designer"]],
    ["UNASSIGNED", ["content_writer", "designer", "performance_specialist"]],
    ["CLIENT_VIEWER", ["client_viewer"]],
  ];
  for (const [key, expectedRoles] of clientRoles) {
    const role = roleFor(key, expectedRoles);
    if (
      role.tenant_id !== tenantId ||
      role.scope_type !== "client" ||
      role.scope_id !== clientId
    ) {
      throw new Error(`Hosted persona ${key} does not share the approved client scope.`);
    }
  }

  const managementRole = roleFor("ADMIN", [
    "tenant_owner",
    "tenant_administrator",
    "project_manager",
    "marketing_manager",
  ]);
  if (managementRole.tenant_id !== tenantId) {
    throw new Error("Hosted management persona does not share the approved tenant.");
  }

  const clientRow = await client
    .from("clients")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("id", clientId)
    .single();
  expectNoError(clientRow, "hosted client scope check");

  const clientMemberships = expectNoError(
    await client
      .from("client_memberships")
      .select("auth_user_id")
      .eq("tenant_id", tenantId)
      .eq("client_id", clientId)
      .eq("status", "active")
      .in("auth_user_id", [actors.CLIENT_APPROVER.id, actors.CLIENT_VIEWER.id]),
    "hosted client membership inventory",
  ) as Array<{ auth_user_id: string }>;
  const clientMemberIds = new Set(
    clientMemberships.map((membership) => membership.auth_user_id),
  );
  if (
    !clientMemberIds.has(actors.CLIENT_APPROVER.id) ||
    !clientMemberIds.has(actors.CLIENT_VIEWER.id)
  ) {
    throw new Error("Hosted client personas are missing active client memberships.");
  }

  return { clientId, tenantId };
};

const verifyHostedWorkspaceDirectory = async ({
  actors,
  clientId,
  publishableKey,
  supabaseUrl,
  tenantId,
}: {
  actors: HostedLifecycleActors;
  clientId: string;
  publishableKey: string;
  supabaseUrl: string;
  tenantId: string;
}) => {
  const adminClient = createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const signIn = await adminClient.auth.signInWithPassword({
    email: actors.ADMIN.email,
    password: actors.ADMIN.password,
  });
  if (signIn.error) {
    throw new Error(`Hosted directory preflight sign-in failed: ${signIn.error.message}`);
  }

  try {
    const profileKeys: HostedPersonaKey[] = [
      "ADMIN",
      "ACCOUNT_MANAGER",
      "CONTENT_WRITER",
      "DESIGNER",
      "UNASSIGNED",
      "CLIENT_APPROVER",
      "CLIENT_VIEWER",
    ];
    const profiles = expectNoError(
      await adminClient
        .from("member_profiles")
        .select("user_id")
        .eq("tenant_id", tenantId)
        .in(
          "user_id",
          profileKeys.map((key) => actors[key].id),
        ),
      "hosted member profile preflight",
    ) as Array<{ user_id: string }>;
    const visibleProfileIds = new Set(profiles.map((profile) => profile.user_id));
    const missingProfiles = profileKeys.filter(
      (key) => !visibleProfileIds.has(actors[key].id),
    );
    if (missingProfiles.length > 0) {
      throw new Error(
        `Hosted member profile preflight is missing: ${missingProfiles.join(", ")}.`,
      );
    }

    const eligibleAssignees = expectNoError(
      await adminClient.rpc("s015_list_task_eligible_assignees", {
        target_tenant_id: tenantId,
        target_client_id: clientId,
      }),
      "hosted eligible assignee preflight",
    ) as Array<{ user_id: string }>;
    const eligibleIds = new Set(
      eligibleAssignees.map((assignee) => assignee.user_id),
    );
    const requiredAssigneeKeys: HostedPersonaKey[] = [
      "ACCOUNT_MANAGER",
      "CONTENT_WRITER",
      "DESIGNER",
      "UNASSIGNED",
    ];
    const missingAssignees = requiredAssigneeKeys.filter(
      (key) => !eligibleIds.has(actors[key].id),
    );
    if (missingAssignees.length > 0) {
      throw new Error(
        `Hosted eligible assignee preflight is missing: ${missingAssignees.join(", ")}.`,
      );
    }
  } finally {
    await adminClient.auth.signOut();
  }
};

const dateAfter = (days: number) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

export const seedHostedLifecycle = async (): Promise<{
  client: SupabaseClient;
  seed: HostedLifecycleSeed;
}> => {
  const { client, publishableKey, supabaseUrl } = createHostedServiceClient();
  const actors = await resolveHostedActors(client);
  const { clientId, tenantId } = await resolveHostedScope(client, actors);
  await verifyHostedWorkspaceDirectory({
    actors,
    clientId,
    publishableKey,
    supabaseUrl,
    tenantId,
  });
  const token = crypto.randomUUID().replaceAll("-", "").slice(0, 10);
  const runId = `s015-hosted-lifecycle-${token}`;
  const contractId = crypto.randomUUID();
  const packageId = crypto.randomUUID();
  const packageLineId = crypto.randomUUID();
  const deliverableId = crypto.randomUUID();
  const reservationLedgerId = crypto.randomUUID();
  const allocationId = crypto.randomUUID();
  const deliverableName = `اختبار دورة التسليم ${token}`;
  const taskTitle = `مهمة تنفيذ UAT ${token}`;
  const qualityLabel = `فحص جودة UAT ${token}`;

  expectNoError(
    await client.from("contracts").insert({
      id: contractId,
      tenant_id: tenantId,
      client_id: clientId,
      name: `عقد UAT اصطناعي ${token}`,
      reference: `S015-UAT-${token}`,
      status: "active",
    }),
    "hosted lifecycle contract seed",
  );
  expectNoError(
    await client.from("packages").insert({
      id: packageId,
      tenant_id: tenantId,
      client_id: clientId,
      contract_id: contractId,
      name: `باقة UAT اصطناعية ${token}`,
      status: "active",
    }),
    "hosted lifecycle package seed",
  );
  expectNoError(
    await client.from("package_lines").insert({
      id: packageLineId,
      tenant_id: tenantId,
      client_id: clientId,
      package_id: packageId,
      service_label: "مخرج UAT اصطناعي",
      deliverable_type_hint: "post",
      unit_label: "مخرج",
      committed_quantity: 1,
      status: "active",
    }),
    "hosted lifecycle package line seed",
  );
  expectNoError(
    await client.from("deliverables").insert({
      id: deliverableId,
      tenant_id: tenantId,
      client_id: clientId,
      contract_id: contractId,
      package_id: packageId,
      package_line_id: packageLineId,
      name: deliverableName,
      description: "بيانات اصطناعية لاختبار دورة العمل المستضافة فقط.",
      type: "post",
      status: "in_progress",
      priority: "high",
      progress_percentage: 30,
      owner_user_id: actors.CONTENT_WRITER.id,
      contributor_user_ids: [actors.ACCOUNT_MANAGER.id, actors.DESIGNER.id],
      start_date: dateAfter(0),
      internal_due_date: dateAfter(2),
      client_due_date: dateAfter(4),
      final_due_date: dateAfter(6),
      requires_internal_approval: true,
      requires_client_approval: true,
      approved_extra: false,
      created_by: actors.ADMIN.id,
      idempotency_key: `${runId}-deliverable`,
      import_run_id: runId,
    }),
    "hosted lifecycle deliverable seed",
  );
  expectNoError(
    await client.from("package_ledger_entries").insert({
      id: reservationLedgerId,
      tenant_id: tenantId,
      client_id: clientId,
      contract_id: contractId,
      package_id: packageId,
      package_line_id: packageLineId,
      deliverable_id: deliverableId,
      entry_type: "quantity_reserved",
      quantity: 1,
      reason: "hosted_lifecycle_reservation",
      actor_user_id: actors.ADMIN.id,
      idempotency_key: `${runId}-reservation`,
    }),
    "hosted lifecycle reservation seed",
  );
  expectNoError(
    await client.from("deliverable_allocations").insert({
      id: allocationId,
      tenant_id: tenantId,
      client_id: clientId,
      deliverable_id: deliverableId,
      package_line_id: packageLineId,
      reserved_quantity: 1,
      status: "reserved",
      reservation_ledger_entry_id: reservationLedgerId,
    }),
    "hosted lifecycle allocation seed",
  );
  expectNoError(
    await client.from("sla_timeline_segments").insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      client_id: clientId,
      deliverable_id: deliverableId,
      kind: "running",
      started_at: new Date().toISOString(),
      reason: "hosted_lifecycle_started",
    }),
    "hosted lifecycle SLA seed",
  );

  return {
    client,
    seed: {
      actors,
      allocationId,
      clientId,
      contractId,
      deliverableId,
      deliverableName,
      packageId,
      packageLineId,
      publishableKey,
      qualityLabel,
      reservationLedgerId,
      runId,
      supabaseUrl,
      taskTitle,
      tenantId,
    },
  };
};

export const createHostedActorClient = async ({
  seed,
  actor,
}: {
  seed: HostedLifecycleSeed;
  actor: HostedLifecycleActor;
}) => {
  const client = createClient(seed.supabaseUrl, seed.publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await client.auth.signInWithPassword({
    email: actor.email,
    password: actor.password,
  });
  if (error) {
    throw new Error(`Hosted actor sign-in failed: ${error.message}`);
  }
  return client;
};

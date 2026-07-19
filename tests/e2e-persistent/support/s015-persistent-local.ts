import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, type Page } from "@playwright/test";
import { canUseRouteActorFixtures } from "@/server/navigation/route-fixture-env";

type EnvMap = Record<string, string | undefined>;

type ActorKey =
  | "tenantAdmin"
  | "accountManager"
  | "assignedWriter"
  | "assignedDesigner"
  | "unassignedWriter"
  | "unassignedDesigner"
  | "clientViewer"
  | "clientApprover"
  | "sameTenantOtherClient"
  | "otherTenantAdmin";

export type PersistentActor = {
  id: string;
  email: string;
  password: string;
};

export type PersistentSeed = {
  supabaseUrl: string;
  publishableKey: string;
  actors: Record<ActorKey, PersistentActor>;
  tenantA: string;
  tenantB: string;
  clientA: string;
  clientB: string;
  tenantBClient: string;
  contractId: string;
  packageId: string;
  packageLineId: string;
  reservationLedgerId: string;
  allocationId: string;
  mainDeliverableId: string;
  designerDeliverableId: string;
  accountDeliverableId: string;
};

export const persistentDeliverableNames = {
  main: "منشور هدنة - رحلة الاعتماد",
  designer: "تصميم هدنة - مهمة المصمم",
  account: "تقرير هدنة - متابعة مدير الحساب",
  clientB: "مخرج Glass - نطاق عميل آخر",
  tenantB: "مخرج Glass - نطاق مستأجر آخر",
  smoke: "منشور هدنة - فحص الموافقة",
} as const;

const runId = crypto.randomUUID().replaceAll("-", "").slice(0, 12);
const actorPassword = `S015-${crypto.randomUUID()}!aA1`;

const uuidCache = new Map<string, string>();
const uuid = (suffix: string) => {
  const key = `a:${suffix}`;
  const existing = uuidCache.get(key);
  if (existing) {
    return existing;
  }
  const generated = crypto.randomUUID();
  uuidCache.set(key, generated);
  return generated;
};
const uuidB = (suffix: string) => {
  const key = `b:${suffix}`;
  const existing = uuidCache.get(key);
  if (existing) {
    return existing;
  }
  const generated = crypto.randomUUID();
  uuidCache.set(key, generated);
  return generated;
};

const ids = {
  tenantA: uuid("000000000001"),
  tenantB: uuidB("000000000001"),
  clientA: uuid("000000000301"),
  clientB: uuid("000000000302"),
  tenantBClient: uuidB("000000000301"),
  contractId: uuid("000000000901"),
  packageId: uuid("000000000902"),
  packageLineId: uuid("000000000903"),
  reservationLedgerId: uuid("000000000904"),
  allocationId: uuid("000000000905"),
  mainDeliverableId: uuid("000000000520"),
  designerDeliverableId: uuid("000000000521"),
  accountDeliverableId: uuid("000000000522"),
  clientBDeliverableId: uuid("000000000523"),
  tenantBDeliverableId: uuidB("000000000520"),
};

const actors: Record<ActorKey, PersistentActor> = {
  tenantAdmin: {
    id: uuid("000000000207"),
    email: `s015-persistent-admin-${runId}@hadna.example.test`,
    password: actorPassword,
  },
  accountManager: {
    id: uuid("000000000201"),
    email: `s015-persistent-account-${runId}@hadna.example.test`,
    password: actorPassword,
  },
  assignedWriter: {
    id: uuid("000000000203"),
    email: `s015-persistent-writer-${runId}@hadna.example.test`,
    password: actorPassword,
  },
  assignedDesigner: {
    id: uuid("000000000204"),
    email: `s015-persistent-designer-${runId}@hadna.example.test`,
    password: actorPassword,
  },
  unassignedWriter: {
    id: uuid("000000000205"),
    email: `s015-persistent-unassigned-writer-${runId}@hadna.example.test`,
    password: actorPassword,
  },
  unassignedDesigner: {
    id: uuid("000000000208"),
    email: `s015-persistent-unassigned-designer-${runId}@hadna.example.test`,
    password: actorPassword,
  },
  clientViewer: {
    id: uuid("000000000202"),
    email: `s015-persistent-viewer-${runId}@hadna.example.test`,
    password: actorPassword,
  },
  clientApprover: {
    id: uuid("000000000206"),
    email: `s015-persistent-approver-${runId}@hadna.example.test`,
    password: actorPassword,
  },
  sameTenantOtherClient: {
    id: uuid("000000000209"),
    email: `s015-persistent-client-b-${runId}@hadna.example.test`,
    password: actorPassword,
  },
  otherTenantAdmin: {
    id: uuidB("000000000207"),
    email: `s015-persistent-tenant-b-${runId}@hadna.example.test`,
    password: actorPassword,
  },
};

const parseDotEnv = (path: string): EnvMap => {
  if (!existsSync(path)) {
    return {};
  }

  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        const key = line.slice(0, index).trim();
        const rawValue = line.slice(index + 1).trim();
        return [key, rawValue.replace(/^["']|["']$/gu, "")];
      }),
  );
};

const readSupabaseStatusEnv = (): EnvMap => {
  const command = process.platform === "win32" ? "npx.cmd" : "npx";
  const args = ["supabase@2.107.0", "status", "-o", "env"];
  const options = {
    encoding: "utf8" as const,
    env: {
      ...process.env,
      DO_NOT_TRACK: "1",
      SUPABASE_TELEMETRY_DISABLED: "1",
    },
    windowsHide: true,
  };
  const result =
    process.platform === "win32"
      ? spawnSync(
          process.env.ComSpec ?? "cmd.exe",
          ["/d", "/s", "/c", [command, ...args].join(" ")],
          options,
        )
      : spawnSync(command, args, options);

  if (result.status !== 0) {
    throw new Error("Local Supabase status is unavailable.");
  }

  return Object.fromEntries(
    result.stdout
      .split(/\r?\n/u)
      .filter((line) => line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        const rawValue = line.slice(index + 1).trim();
        return [line.slice(0, index), rawValue.replace(/^["']|["']$/gu, "")];
      }),
  );
};

export const assertPersistentFixtureModeDisabled = () => {
  expect(
    canUseRouteActorFixtures({
      appEnv: "test-persistent",
      nodeEnv: process.env.NODE_ENV,
    }),
  ).toBe(false);
};

export const loadPersistentLocalEnv = (): {
  supabaseUrl: string;
  publishableKey: string;
  serviceRoleKey: string;
} => {
  const localEnv = parseDotEnv(resolve(".env.local"));
  const statusEnv = readSupabaseStatusEnv();
  const envUrlCandidates = [
    statusEnv.API_URL,
    localEnv.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ];
  const supabaseUrl = envUrlCandidates.find(isLocalSupabaseUrl);
  const publishableKey =
    supabaseUrl === statusEnv.API_URL
      ? (statusEnv.PUBLISHABLE_KEY ?? statusEnv.ANON_KEY)
      : supabaseUrl === localEnv.NEXT_PUBLIC_SUPABASE_URL
        ? localEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
        : process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceRoleKey =
    supabaseUrl === statusEnv.API_URL
      ? (statusEnv.SERVICE_ROLE_KEY ?? statusEnv.SECRET_KEY)
      : (localEnv.SUPABASE_SERVICE_ROLE_KEY ??
        process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
    throw new Error(
      "Persistent E2E requires local Supabase public and service keys.",
    );
  }
  assertLocalSupabaseUrl(supabaseUrl);

  return { supabaseUrl, publishableKey, serviceRoleKey };
};

const assertLocalSupabaseUrl = (value?: string) => {
  if (!value) {
    throw new Error("Persistent E2E requires a Supabase URL.");
  }

  const url = new URL(value);
  if (
    url.protocol !== "http:" ||
    !["localhost", "127.0.0.1", "host.docker.internal"].includes(url.hostname)
  ) {
    throw new Error("Persistent E2E refused a non-local Supabase URL.");
  }
};

const isLocalSupabaseUrl = (value?: string) => {
  if (!value) {
    return false;
  }

  const url = new URL(value);
  return (
    url.protocol === "http:" &&
    ["localhost", "127.0.0.1", "host.docker.internal"].includes(url.hostname)
  );
};

const expectNoError = <T>(
  result: { data: T; error: unknown },
  label: string,
): T => {
  if (result.error) {
    const error = result.error as { code?: string; message?: string };
    throw new Error(
      `${label} failed${error.code ? ` (${error.code})` : ""}${
        error.message ? `: ${error.message}` : ""
      }`,
    );
  }

  return result.data;
};

const membershipRows = [
  ["000000000101", "tenantAdmin", ids.tenantA],
  ["000000000102", "accountManager", ids.tenantA],
  ["000000000103", "assignedWriter", ids.tenantA],
  ["000000000104", "assignedDesigner", ids.tenantA],
  ["000000000105", "unassignedWriter", ids.tenantA],
  ["000000000108", "unassignedDesigner", ids.tenantA],
  ["000000000106", "clientViewer", ids.tenantA],
  ["000000000107", "clientApprover", ids.tenantA],
  ["000000000109", "sameTenantOtherClient", ids.tenantA],
  ["000000000110", "otherTenantAdmin", ids.tenantB],
] as const;

const roleRows = [
  [
    "000000000401",
    "tenantAdmin",
    "tenant_administrator",
    "tenant",
    ids.tenantA,
  ],
  ["000000000402", "accountManager", "account_manager", "client", ids.clientA],
  ["000000000403", "assignedWriter", "content_writer", "client", ids.clientA],
  ["000000000404", "assignedDesigner", "designer", "client", ids.clientA],
  ["000000000405", "unassignedWriter", "content_writer", "client", ids.clientA],
  ["000000000408", "unassignedDesigner", "designer", "client", ids.clientA],
  ["000000000406", "clientViewer", "client_viewer", "client", ids.clientA],
  ["000000000407", "clientApprover", "client_approver", "client", ids.clientA],
  [
    "000000000409",
    "sameTenantOtherClient",
    "client_viewer",
    "client",
    ids.clientB,
  ],
  [
    "000000000410",
    "otherTenantAdmin",
    "tenant_administrator",
    "tenant",
    ids.tenantB,
  ],
] as const;

const createServiceClient = () => {
  const env = loadPersistentLocalEnv();
  return {
    ...env,
    client: createClient(env.supabaseUrl, env.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }),
  };
};

export const seedPersistentLifecycle = async (): Promise<{
  client: SupabaseClient;
  seed: PersistentSeed;
}> => {
  assertPersistentFixtureModeDisabled();
  const { client, supabaseUrl, publishableKey } = createServiceClient();

  await assertLocalStackReachable(supabaseUrl);
  await createSyntheticAuthUsers(client);
  await seedCoreRows(client);

  return {
    client,
    seed: {
      supabaseUrl,
      publishableKey,
      actors,
      tenantA: ids.tenantA,
      tenantB: ids.tenantB,
      clientA: ids.clientA,
      clientB: ids.clientB,
      tenantBClient: ids.tenantBClient,
      contractId: ids.contractId,
      packageId: ids.packageId,
      packageLineId: ids.packageLineId,
      reservationLedgerId: ids.reservationLedgerId,
      allocationId: ids.allocationId,
      mainDeliverableId: ids.mainDeliverableId,
      designerDeliverableId: ids.designerDeliverableId,
      accountDeliverableId: ids.accountDeliverableId,
    },
  };
};

export const seedPersistentReadOnlySmoke = async () => {
  assertPersistentFixtureModeDisabled();
  const { client, supabaseUrl, publishableKey } = createServiceClient();

  await assertLocalStackReachable(supabaseUrl);
  await createSyntheticAuthUsers(client);
  await seedReadOnlyRows(client);

  return {
    client,
    seed: {
      supabaseUrl,
      publishableKey,
      actors,
      tenantA: ids.tenantA,
      tenantB: ids.tenantB,
      clientA: ids.clientA,
      clientB: ids.clientB,
      tenantBClient: ids.tenantBClient,
      contractId: ids.contractId,
      packageId: ids.packageId,
      packageLineId: ids.packageLineId,
      reservationLedgerId: ids.reservationLedgerId,
      allocationId: ids.allocationId,
      mainDeliverableId: ids.mainDeliverableId,
      designerDeliverableId: ids.designerDeliverableId,
      accountDeliverableId: ids.accountDeliverableId,
    },
  };
};

export const seedPersistentVersionFiles = async ({
  client,
  seed,
  versionId,
}: {
  client: SupabaseClient;
  seed: PersistentSeed;
  versionId: string;
}) => {
  expectNoError(
    await client.from("file_assets").insert([
      {
        id: crypto.randomUUID(),
        tenant_id: seed.tenantA,
        client_id: seed.clientA,
        deliverable_id: seed.mainDeliverableId,
        version_id: versionId,
        owner_user_id: seed.actors.assignedWriter.id,
        visibility: "internal_only",
        storage_path: `internal/s015/${versionId}.psd`,
        file_type: "image/vnd.adobe.photoshop",
        file_size: 10,
        version_number: 3,
        is_final: false,
      },
      {
        id: crypto.randomUUID(),
        tenant_id: seed.tenantA,
        client_id: seed.clientA,
        deliverable_id: seed.mainDeliverableId,
        version_id: versionId,
        owner_user_id: seed.actors.assignedWriter.id,
        visibility: "final_delivery",
        storage_path: `final/s015/${versionId}.png`,
        file_type: "image/png",
        file_size: 10,
        version_number: 3,
        is_final: true,
      },
    ]),
    "version file seed",
  );
};

const assertLocalStackReachable = async (supabaseUrl: string) => {
  const health = await fetch(new URL("/auth/v1/health", supabaseUrl));
  if (!health.ok) {
    throw new Error("Local Supabase stack is not reachable.");
  }
};

const createSyntheticAuthUsers = async (client: SupabaseClient) => {
  for (const actor of Object.values(actors)) {
    const result = await client.auth.admin.createUser({
      email: actor.email,
      password: actor.password,
      email_confirm: true,
      user_metadata: { synthetic: "s015-persistent-e2e" },
    });

    if (
      result.error &&
      !result.error.message.toLowerCase().includes("already")
    ) {
      throw new Error(
        `Synthetic auth user setup failed: ${result.error.message}`,
      );
    }

    if (result.data.user?.id) {
      actor.id = result.data.user.id;
    }
  }
};

const seedIdentityRows = async (client: SupabaseClient) => {
  expectNoError(
    await client.from("tenants").upsert([
      { id: ids.tenantA, name: "سماوة" },
      { id: ids.tenantB, name: "سماوة - نطاق آخر" },
    ]),
    "tenant seed",
  );

  expectNoError(
    await client.from("clients").upsert([
      {
        id: ids.clientA,
        tenant_id: ids.tenantA,
        name: "هدنة",
        slug: `s015-persistent-a-${runId}`,
      },
      {
        id: ids.clientB,
        tenant_id: ids.tenantA,
        name: "Glass",
        slug: `s015-persistent-b-${runId}`,
      },
      {
        id: ids.tenantBClient,
        tenant_id: ids.tenantB,
        name: "Glass",
        slug: `s015-persistent-tenant-b-${runId}`,
      },
    ]),
    "client seed",
  );

  expectNoError(
    await client.from("tenant_memberships").upsert(
      membershipRows.map(([suffix, key, tenantId]) => ({
        id: tenantId === ids.tenantA ? uuid(suffix) : uuidB(suffix),
        tenant_id: tenantId,
        auth_user_id: actors[key].id,
        status: "active",
      })),
    ),
    "tenant membership seed",
  );

  expectNoError(
    await client.from("client_memberships").upsert([
      {
        id: uuid("000000000206"),
        tenant_id: ids.tenantA,
        client_id: ids.clientA,
        auth_user_id: actors.clientViewer.id,
        status: "active",
      },
      {
        id: uuid("000000000207"),
        tenant_id: ids.tenantA,
        client_id: ids.clientA,
        auth_user_id: actors.clientApprover.id,
        status: "active",
      },
      {
        id: uuid("000000000209"),
        tenant_id: ids.tenantA,
        client_id: ids.clientB,
        auth_user_id: actors.sameTenantOtherClient.id,
        status: "active",
      },
    ]),
    "client membership seed",
  );

  const membershipByActor = new Map(
    membershipRows.map(([suffix, key, tenantId]) => [
      key,
      tenantId === ids.tenantA ? uuid(suffix) : uuidB(suffix),
    ]),
  );

  expectNoError(
    await client.from("role_assignments").upsert(
      roleRows.map(([suffix, key, roleKey, scopeType, scopeId]) => ({
        id: scopeId === ids.tenantB ? uuidB(suffix) : uuid(suffix),
        tenant_id: key === "otherTenantAdmin" ? ids.tenantB : ids.tenantA,
        membership_id: membershipByActor.get(key),
        role_key: roleKey,
        scope_type: scopeType,
        scope_id: scopeId,
        status: "active",
      })),
    ),
    "role assignment seed",
  );

  expectNoError(
    await client.from("member_profiles").upsert([
      {
        tenant_id: ids.tenantA,
        user_id: actors.tenantAdmin.id,
        display_name: "مدير سماوة التجريبي",
        role_label: "إدارة",
      },
      {
        tenant_id: ids.tenantA,
        user_id: actors.accountManager.id,
        display_name: "مدير الحساب التجريبي",
        role_label: "مدير حساب",
      },
      {
        tenant_id: ids.tenantA,
        user_id: actors.assignedWriter.id,
        display_name: "كاتب المحتوى المسند",
        role_label: "كاتب محتوى",
      },
      {
        tenant_id: ids.tenantA,
        user_id: actors.assignedDesigner.id,
        display_name: "المصمم المسند",
        role_label: "مصمم",
      },
      {
        tenant_id: ids.tenantA,
        user_id: actors.unassignedWriter.id,
        display_name: "كاتب المهمة التجريبية",
        role_label: "كاتب محتوى",
      },
      {
        tenant_id: ids.tenantA,
        user_id: actors.unassignedDesigner.id,
        display_name: "المصمم غير المسند",
        role_label: "مصمم",
      },
    ]),
    "member profile seed",
  );
};

const seedCoreRows = async (client: SupabaseClient) => {
  await seedIdentityRows(client);

  expectNoError(
    await client.from("contracts").upsert({
      id: ids.contractId,
      tenant_id: ids.tenantA,
      client_id: ids.clientA,
      name: "عقد هدنة للتشغيل التسويقي",
      reference: `S015-PERSISTENT-${runId}`,
      status: "active",
    }),
    "contract seed",
  );

  expectNoError(
    await client.from("packages").upsert({
      id: ids.packageId,
      tenant_id: ids.tenantA,
      client_id: ids.clientA,
      contract_id: ids.contractId,
      name: "باقة هدنة",
      status: "active",
    }),
    "package seed",
  );

  expectNoError(
    await client.from("package_lines").upsert({
      id: ids.packageLineId,
      tenant_id: ids.tenantA,
      client_id: ids.clientA,
      package_id: ids.packageId,
      service_label: "منشورات هدنة",
      deliverable_type_hint: "post",
      unit_label: "item",
      committed_quantity: 1,
      status: "active",
    }),
    "package line seed",
  );

  expectNoError(
    await client.from("deliverables").upsert([
      {
        id: ids.mainDeliverableId,
        tenant_id: ids.tenantA,
        client_id: ids.clientA,
        contract_id: ids.contractId,
        package_id: ids.packageId,
        package_line_id: ids.packageLineId,
        name: persistentDeliverableNames.main,
        type: "post",
        status: "in_progress",
        progress_percentage: 30,
        idempotency_key: `local-hadna-main-${runId}`,
        requires_internal_approval: true,
        requires_client_approval: true,
        owner_user_id: actors.assignedWriter.id,
      },
      {
        id: ids.designerDeliverableId,
        tenant_id: ids.tenantA,
        client_id: ids.clientA,
        name: persistentDeliverableNames.designer,
        type: "design",
        status: "in_progress",
        progress_percentage: 30,
        idempotency_key: `local-hadna-designer-${runId}`,
        requires_internal_approval: true,
        requires_client_approval: true,
        owner_user_id: actors.assignedDesigner.id,
      },
      {
        id: ids.accountDeliverableId,
        tenant_id: ids.tenantA,
        client_id: ids.clientA,
        name: persistentDeliverableNames.account,
        type: "post",
        status: "in_progress",
        progress_percentage: 30,
        idempotency_key: `local-hadna-account-${runId}`,
        requires_internal_approval: true,
        requires_client_approval: true,
        owner_user_id: actors.accountManager.id,
      },
      {
        id: ids.clientBDeliverableId,
        tenant_id: ids.tenantA,
        client_id: ids.clientB,
        name: persistentDeliverableNames.clientB,
        type: "post",
        status: "in_progress",
        progress_percentage: 30,
        idempotency_key: `local-hadna-client-b-${runId}`,
        requires_internal_approval: true,
        requires_client_approval: true,
      },
      {
        id: ids.tenantBDeliverableId,
        tenant_id: ids.tenantB,
        client_id: ids.tenantBClient,
        name: persistentDeliverableNames.tenantB,
        type: "post",
        status: "in_progress",
        progress_percentage: 30,
        idempotency_key: `local-hadna-tenant-b-${runId}`,
        requires_internal_approval: true,
        requires_client_approval: true,
      },
    ]),
    "deliverable seed",
  );

  expectNoError(
    await client.from("package_ledger_entries").insert({
      id: ids.reservationLedgerId,
      tenant_id: ids.tenantA,
      client_id: ids.clientA,
      contract_id: ids.contractId,
      package_id: ids.packageId,
      package_line_id: ids.packageLineId,
      deliverable_id: ids.mainDeliverableId,
      entry_type: "quantity_reserved",
      quantity: 1,
      reason: "persistent_browser_reservation",
      actor_user_id: actors.tenantAdmin.id,
      idempotency_key: `s015-persistent-reserved-${runId}`,
    }),
    "reservation ledger seed",
  );

  expectNoError(
    await client.from("deliverable_allocations").upsert({
      id: ids.allocationId,
      tenant_id: ids.tenantA,
      client_id: ids.clientA,
      deliverable_id: ids.mainDeliverableId,
      package_line_id: ids.packageLineId,
      reserved_quantity: 1,
      status: "reserved",
      reservation_ledger_entry_id: ids.reservationLedgerId,
    }),
    "allocation seed",
  );

  expectNoError(
    await client.from("sla_timeline_segments").upsert({
      id: uuid("000000000906"),
      tenant_id: ids.tenantA,
      client_id: ids.clientA,
      deliverable_id: ids.mainDeliverableId,
      kind: "running",
      started_at: new Date().toISOString(),
      reason: "persistent_browser_started",
    }),
    "SLA seed",
  );
};

const seedReadOnlyRows = async (client: SupabaseClient) => {
  await seedIdentityRows(client);

  expectNoError(
    await client.from("deliverables").upsert({
      id: ids.mainDeliverableId,
      tenant_id: ids.tenantA,
      client_id: ids.clientA,
      name: persistentDeliverableNames.smoke,
      type: "post",
      status: "waiting_client_approval",
      progress_percentage: 80,
      idempotency_key: `local-hadna-smoke-${runId}`,
      requires_internal_approval: true,
      requires_client_approval: true,
      owner_user_id: actors.assignedWriter.id,
    }),
    "smoke deliverable seed",
  );

  expectNoError(
    await client.from("deliverable_versions").upsert({
      id: uuid("000000000621"),
      tenant_id: ids.tenantA,
      client_id: ids.clientA,
      deliverable_id: ids.mainDeliverableId,
      version_number: 1,
      status: "client_visible",
      submitted_by: actors.assignedWriter.id,
    }),
    "smoke version seed",
  );

  expectNoError(
    await client
      .from("deliverables")
      .update({ current_version_id: uuid("000000000621") })
      .eq("id", ids.mainDeliverableId),
    "smoke current version seed",
  );

  expectNoError(
    await client.from("comments").upsert([
      {
        id: uuid("000000000701"),
        tenant_id: ids.tenantA,
        client_id: ids.clientA,
        deliverable_id: ids.mainDeliverableId,
        version_id: uuid("000000000621"),
        author_user_id: actors.assignedWriter.id,
        comment_type: "internal_comment",
        visibility: "internal_only",
        body: "S015_INTERNAL_SMOKE_SECRET",
      },
      {
        id: uuid("000000000702"),
        tenant_id: ids.tenantA,
        client_id: ids.clientA,
        deliverable_id: ids.mainDeliverableId,
        version_id: uuid("000000000621"),
        author_user_id: actors.tenantAdmin.id,
        comment_type: "system_comment",
        visibility: "client_visible",
        body: "S015 client-visible smoke note",
      },
    ]),
    "smoke comments seed",
  );
};

export const resetLocalDatabase = () => {
  const command = process.platform === "win32" ? "npx.cmd" : "npx";
  const args = ["supabase@2.107.0", "db", "reset", "--local", "--no-seed"];
  const options = {
    stdio: "inherit" as const,
    env: {
      ...process.env,
      DO_NOT_TRACK: "1",
      SUPABASE_TELEMETRY_DISABLED: "1",
    },
    windowsHide: true,
  };
  const result =
    process.platform === "win32"
      ? spawnSync(
          process.env.ComSpec ?? "cmd.exe",
          ["/d", "/s", "/c", [command, ...args].join(" ")],
          options,
        )
      : spawnSync(command, args, options);

  if (result.status !== 0) {
    throw new Error(
      "Local Supabase reset failed during persistent E2E cleanup.",
    );
  }
};

export const resetLocalDatabaseIfLifecycleSeeded = async () => {
  const { client } = createServiceClient();
  const existingSeed = await client
    .from("package_ledger_entries")
    .select("id", { count: "exact", head: true })
    .eq("id", ids.reservationLedgerId);
  expectNoError(existingSeed, "persistent lifecycle isolation check");
  if ((existingSeed.count ?? 0) > 0) resetLocalDatabase();
};

export const createPersistentActorClient = async ({
  seed,
  actor,
}: {
  seed: PersistentSeed;
  actor: PersistentActor;
}) => {
  const client = createClient(seed.supabaseUrl, seed.publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await client.auth.signInWithPassword({
    email: actor.email,
    password: actor.password,
  });
  if (error)
    throw new Error(`Persistent actor sign-in failed: ${error.message}`);
  return client;
};

export const signInViaUi = async (page: Page, actor: PersistentActor) => {
  await page.context().clearCookies();
  await page.goto("/sign-in", { waitUntil: "domcontentloaded" });
  const form = page.locator("form").filter({
    has: page.locator('input[name="email"]'),
  });
  await form.locator('input[name="email"]').fill(actor.email);
  await form.locator('input[name="password"]').fill(actor.password);
  await form.locator('button[type="submit"]').click();
  await expect(page).not.toHaveURL(/\/sign-in(?:\?|$)/u);
};

export const expectNoHorizontalOverflow = async (page: Page) => {
  const overflowsViewport = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflowsViewport).toBe(false);
};

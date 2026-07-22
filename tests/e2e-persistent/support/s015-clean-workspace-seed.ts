import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect } from "@playwright/test";
import {
  cleanWorkspaceAuditEventId,
  cleanWorkspaceMembershipId,
  cleanWorkspaceTenantId,
  CLEAN_WORKSPACE_PROVISIONED_ACTION,
  CLEAN_WORKSPACE_ROLLBACK_ACTION,
  CLEAN_WORKSPACE_TENANT_NAME,
  planCleanWorkspaceRolesForUser,
} from "@/modules/uat/clean-workspace";
import {
  assertPersistentFixtureModeDisabled,
  loadPersistentLocalEnv,
  resetLocalDatabase,
  type PersistentActor,
} from "./s015-persistent-local";

type PersonaKey =
  | "tenantAdmin"
  | "accountManager"
  | "contentWriter"
  | "designer"
  | "unassignedWriter"
  | "clientViewer";

export type CleanWorkspaceSeed = {
  client: SupabaseClient;
  supabaseUrl: string;
  publishableKey: string;
  runId: string;
  legacyTenantId: string;
  legacyGlassClientId: string;
  actors: Record<PersonaKey, PersistentActor>;
  legacyBaseline: {
    auditRows: number;
    ledgerRows: number;
  };
};

const RESERVED_LEGACY_AUDIT_COUNT = 1;
const RESERVED_LEGACY_LEDGER_COUNT = 1;

const uuidCache = new Map<string, string>();
const uuid = (suffix: string) => {
  const existing = uuidCache.get(suffix);
  if (existing) {
    return existing;
  }
  const generated = crypto.randomUUID();
  uuidCache.set(suffix, generated);
  return generated;
};

export const seedLegacyWorkspaceForCleanTrial =
  async (): Promise<CleanWorkspaceSeed> => {
    assertPersistentFixtureModeDisabled();
    resetLocalDatabase();
    const env = loadPersistentLocalEnv();
    const client = createClient(env.supabaseUrl, env.serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    await assertReachable(env.supabaseUrl);

    const runId = `x009b-local-${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
    const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 8);

    const actors: Record<PersonaKey, PersistentActor> = {
      tenantAdmin: {
        id: "",
        email: `x009b-admin-${suffix}@hadna.example.test`,
        password: `X009B-${crypto.randomUUID()}!aA1`,
      },
      accountManager: {
        id: "",
        email: `x009b-account-${suffix}@hadna.example.test`,
        password: `X009B-${crypto.randomUUID()}!aA1`,
      },
      contentWriter: {
        id: "",
        email: `x009b-writer-${suffix}@hadna.example.test`,
        password: `X009B-${crypto.randomUUID()}!aA1`,
      },
      designer: {
        id: "",
        email: `x009b-designer-${suffix}@hadna.example.test`,
        password: `X009B-${crypto.randomUUID()}!aA1`,
      },
      unassignedWriter: {
        id: "",
        email: `x009b-unassigned-${suffix}@hadna.example.test`,
        password: `X009B-${crypto.randomUUID()}!aA1`,
      },
      clientViewer: {
        id: "",
        email: `x009b-viewer-${suffix}@hadna.example.test`,
        password: `X009B-${crypto.randomUUID()}!aA1`,
      },
    };

    for (const actor of Object.values(actors)) {
      const result = await client.auth.admin.createUser({
        email: actor.email,
        password: actor.password,
        email_confirm: true,
        user_metadata: { synthetic: "x009b-clean-workspace-trial" },
      });
      if (
        result.error &&
        !result.error.message.toLowerCase().includes("already")
      ) {
        throw new Error(`Clean trial auth user setup failed: ${result.error.message}`);
      }
      if (result.data.user?.id) {
        actor.id = result.data.user.id;
      }
    }

    const legacyTenantId = uuid("0001");
    const legacyGlassClientId = uuid("0002");
    const legacyContractId = uuid("0003");
    const legacyPackageId = uuid("0004");
    const legacyPackageLineId = uuid("0005");
    const legacyDeliverableId = uuid("0006");
    const legacyVersionId = uuid("0007");
    const legacyLedgerId = uuid("0008");
    const legacyAllocationId = uuid("0009");
    const legacyMembershipSuffixByPersona: Record<PersonaKey, string> = {
      tenantAdmin: "0101",
      accountManager: "0102",
      contentWriter: "0103",
      designer: "0104",
      unassignedWriter: "0105",
      clientViewer: "0106",
    };
    const legacyMembershipId = (persona: PersonaKey) =>
      uuid(legacyMembershipSuffixByPersona[persona]);

    const legacyMemberships: Record<PersonaKey, string> = {
      tenantAdmin: legacyMembershipId("tenantAdmin"),
      accountManager: legacyMembershipId("accountManager"),
      contentWriter: legacyMembershipId("contentWriter"),
      designer: legacyMembershipId("designer"),
      unassignedWriter: legacyMembershipId("unassignedWriter"),
      clientViewer: legacyMembershipId("clientViewer"),
    };

    const insert = async (rows: { table: string; rows: unknown[] }) => {
      const { error } = await client.from(rows.table).insert(rows.rows);
      if (error) {
        throw new Error(
          `Clean trial seed ${rows.table} failed: ${error.message}`,
        );
      }
    };

    await insert({
      table: "tenants",
      rows: [{ id: legacyTenantId, name: "سماوة - Hadna/Glass", status: "active" }],
    });
    await insert({
      table: "clients",
      rows: [
        {
          id: legacyGlassClientId,
          tenant_id: legacyTenantId,
          name: "Glass",
          slug: `x009b-glass-${suffix}`,
          status: "active",
          created_by: actors.tenantAdmin.id,
        },
      ],
    });
    await insert({
      table: "tenant_memberships",
      rows: (Object.keys(legacyMemberships) as PersonaKey[]).map((persona) => ({
        id: legacyMemberships[persona],
        tenant_id: legacyTenantId,
        auth_user_id: actors[persona].id,
        status: "active",
      })),
    });
    await insert({
      table: "client_memberships",
      rows: [
        {
          id: uuid("0201"),
          tenant_id: legacyTenantId,
          client_id: legacyGlassClientId,
          auth_user_id: actors.clientViewer.id,
          status: "active",
        },
      ],
    });
    await insert({
      table: "role_assignments",
      rows: [
        {
          id: uuid("0301"),
          tenant_id: legacyTenantId,
          membership_id: legacyMemberships.tenantAdmin,
          role_key: "tenant_administrator",
          scope_type: "tenant",
          scope_id: legacyTenantId,
          status: "active",
        },
        {
          id: uuid("0302"),
          tenant_id: legacyTenantId,
          membership_id: legacyMemberships.accountManager,
          role_key: "account_manager",
          scope_type: "client",
          scope_id: legacyGlassClientId,
          status: "active",
        },
        {
          id: uuid("0303"),
          tenant_id: legacyTenantId,
          membership_id: legacyMemberships.contentWriter,
          role_key: "content_writer",
          scope_type: "client",
          scope_id: legacyGlassClientId,
          status: "active",
        },
        {
          id: uuid("0304"),
          tenant_id: legacyTenantId,
          membership_id: legacyMemberships.designer,
          role_key: "designer",
          scope_type: "client",
          scope_id: legacyGlassClientId,
          status: "active",
        },
        {
          id: uuid("0305"),
          tenant_id: legacyTenantId,
          membership_id: legacyMemberships.unassignedWriter,
          role_key: "content_writer",
          scope_type: "client",
          scope_id: legacyGlassClientId,
          status: "active",
        },
        {
          id: uuid("0306"),
          tenant_id: legacyTenantId,
          membership_id: legacyMemberships.clientViewer,
          role_key: "client_viewer",
          scope_type: "client",
          scope_id: legacyGlassClientId,
          status: "active",
        },
      ],
    });
    await insert({
      table: "member_profiles",
      rows: [
        {
          tenant_id: legacyTenantId,
          user_id: actors.tenantAdmin.id,
          display_name: "مدير سماوة القديم",
          role_label: "إدارة",
        },
        {
          tenant_id: legacyTenantId,
          user_id: actors.accountManager.id,
          display_name: "مدير الحساب القديم",
          role_label: "مدير حساب",
        },
        {
          tenant_id: legacyTenantId,
          user_id: actors.contentWriter.id,
          display_name: "الكاتب القديم",
          role_label: "كاتب محتوى",
        },
        {
          tenant_id: legacyTenantId,
          user_id: actors.designer.id,
          display_name: "المصمم القديم",
          role_label: "مصمم",
        },
        {
          tenant_id: legacyTenantId,
          user_id: actors.unassignedWriter.id,
          display_name: "كاتب غير مُسند",
          role_label: "كاتب محتوى",
        },
      ],
    });
    await insert({
      table: "contracts",
      rows: [
        {
          id: legacyContractId,
          tenant_id: legacyTenantId,
          client_id: legacyGlassClientId,
          name: "عقد جلاس التاريخي",
          reference: `X009B-LEGACY-${suffix}`,
          status: "active",
        },
      ],
    });
    await insert({
      table: "packages",
      rows: [
        {
          id: legacyPackageId,
          tenant_id: legacyTenantId,
          client_id: legacyGlassClientId,
          contract_id: legacyContractId,
          name: "باقة جلاس التاريخية",
          status: "active",
        },
      ],
    });
    await insert({
      table: "package_lines",
      rows: [
        {
          id: legacyPackageLineId,
          tenant_id: legacyTenantId,
          client_id: legacyGlassClientId,
          package_id: legacyPackageId,
          service_label: "منشورات جلاس",
          deliverable_type_hint: "post",
          unit_label: "item",
          committed_quantity: 1,
          status: "active",
        },
      ],
    });
    await insert({
      table: "deliverables",
      rows: [
        {
          id: legacyDeliverableId,
          tenant_id: legacyTenantId,
          client_id: legacyGlassClientId,
          contract_id: legacyContractId,
          package_id: legacyPackageId,
          package_line_id: legacyPackageLineId,
          name: "مخرج جلاس التاريخي",
          type: "post",
          status: "in_progress",
          progress_percentage: 30,
          idempotency_key: `x009b-legacy-${suffix}`,
          requires_internal_approval: true,
          requires_client_approval: true,
          owner_user_id: actors.contentWriter.id,
        },
      ],
    });
    await insert({
      table: "deliverable_versions",
      rows: [
        {
          id: legacyVersionId,
          tenant_id: legacyTenantId,
          client_id: legacyGlassClientId,
          deliverable_id: legacyDeliverableId,
          version_number: 1,
          status: "draft",
          caption: "X009B_LEGACY_INTERNAL_SECRET",
          submitted_by: actors.contentWriter.id,
        },
      ],
    });
    await insert({
      table: "package_ledger_entries",
      rows: [
        {
          id: legacyLedgerId,
          tenant_id: legacyTenantId,
          client_id: legacyGlassClientId,
          contract_id: legacyContractId,
          package_id: legacyPackageId,
          package_line_id: legacyPackageLineId,
          deliverable_id: legacyDeliverableId,
          entry_type: "quantity_reserved",
          quantity: 1,
          reason: "x009b_legacy_historical_reservation",
          actor_user_id: actors.tenantAdmin.id,
          idempotency_key: `x009b-legacy-ledger-${suffix}`,
        },
      ],
    });
    await insert({
      table: "deliverable_allocations",
      rows: [
        {
          id: legacyAllocationId,
          tenant_id: legacyTenantId,
          client_id: legacyGlassClientId,
          deliverable_id: legacyDeliverableId,
          package_line_id: legacyPackageLineId,
          reserved_quantity: 1,
          status: "reserved",
          reservation_ledger_entry_id: legacyLedgerId,
        },
      ],
    });
    await insert({
      table: "audit_events",
      rows: [
        {
          id: uuid("0400"),
          tenant_id: legacyTenantId,
          client_id: legacyGlassClientId,
          actor_user_id: actors.tenantAdmin.id,
          action: "x009b_legacy_baseline",
          decision: "allowed",
          target_type: "tenant",
          target_id: legacyTenantId,
          reason: "historical legacy evidence preserved across quarantine",
        },
      ],
    });

    return {
      client,
      supabaseUrl: env.supabaseUrl,
      publishableKey: env.publishableKey,
      runId,
      legacyTenantId,
      legacyGlassClientId,
      actors,
      legacyBaseline: {
        auditRows: RESERVED_LEGACY_AUDIT_COUNT,
        ledgerRows: RESERVED_LEGACY_LEDGER_COUNT,
      },
    };
  };

const assertReachable = async (supabaseUrl: string) => {
  const healthUrl = new URL("/auth/v1/health", supabaseUrl);
  for (let attempt = 0; attempt < 18; attempt += 1) {
    try {
      const response = await fetch(healthUrl, { cache: "no-store" });
      if (response.ok) return;
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 5_000));
  }
  throw new Error("Local Supabase stack is not reachable for clean trial seed.");
};

type InternalPersonaKey = Exclude<PersonaKey, "clientViewer">;
const INTERNAL_PERSONAS: InternalPersonaKey[] = [
  "tenantAdmin",
  "accountManager",
  "contentWriter",
  "designer",
  "unassignedWriter",
];
const LEGACY_ROLE_KEYS: Record<InternalPersonaKey, string> = {
  tenantAdmin: "tenant_administrator",
  accountManager: "account_manager",
  contentWriter: "content_writer",
  designer: "designer",
  unassignedWriter: "content_writer",
};

export const applyCleanWorkspace = async (seed: CleanWorkspaceSeed) => {
  const cleanTenantId = cleanWorkspaceTenantId(seed.runId);
  const admin = seed.client;

  const { error: tenantError } = await admin.from("tenants").upsert({
    id: cleanTenantId,
    name: CLEAN_WORKSPACE_TENANT_NAME,
    status: "active",
  });
  expect(tenantError, "clean tenant upsert").toBeNull();

  for (const persona of INTERNAL_PERSONAS) {
    const userId = seed.actors[persona].id;
    const membershipId = cleanWorkspaceMembershipId({
      runId: seed.runId,
      authUserId: userId,
    });
    const { error: membershipError } = await admin.from("tenant_memberships").upsert({
      id: membershipId,
      tenant_id: cleanTenantId,
      auth_user_id: userId,
      status: "active",
      disabled_at: null,
    });
    expect(membershipError, `clean membership ${persona}`).toBeNull();

    const plan = planCleanWorkspaceRolesForUser({
      runId: seed.runId,
      authUserId: userId,
      legacyRoles: [
        {
          roleKey: LEGACY_ROLE_KEYS[persona],
          scopeType: persona === "tenantAdmin" ? "tenant" : "client",
        },
      ],
    });
    expect(plan.length, `clean role plan ${persona}`).toBeGreaterThan(0);
    for (const role of plan) {
      const { error: roleError } = await admin.from("role_assignments").upsert({
        id: role.assignmentId,
        tenant_id: cleanTenantId,
        membership_id: membershipId,
        role_key: role.roleKey,
        scope_type: "tenant",
        scope_id: cleanTenantId,
        status: "active",
      });
      expect(roleError, `clean role ${persona}`).toBeNull();
    }

    const { error: profileError } = await admin.from("member_profiles").upsert({
      tenant_id: cleanTenantId,
      user_id: userId,
      display_name: seed.actors[persona].email.split("@")[0] ?? persona,
      role_label: plan[0]?.roleKey ?? null,
      sync_run_id: `x009b-profiles-${seed.runId}`,
      updated_at: new Date().toISOString(),
    });
    expect(profileError, `clean profile ${persona}`).toBeNull();
  }

  const { error: auditError } = await admin.from("audit_events").upsert({
    id: cleanWorkspaceAuditEventId({ runId: seed.runId, suffix: "provisioned" }),
    tenant_id: cleanTenantId,
    client_id: null,
    actor_user_id: null,
    action: CLEAN_WORKSPACE_PROVISIONED_ACTION,
    decision: "allowed",
    target_type: "tenant",
    target_id: cleanTenantId,
    reason: `run_id=${seed.runId};local_persistent_apply`,
  }, { onConflict: "id", ignoreDuplicates: true });
  expect(auditError, "clean provisioned audit").toBeNull();

  const { data: legacyMemberships, error: legacyLookupError } = await admin
    .from("tenant_memberships")
    .select("id, auth_user_id")
    .eq("tenant_id", seed.legacyTenantId)
    .in(
      "auth_user_id",
      INTERNAL_PERSONAS.map((persona) => seed.actors[persona].id),
    )
    .eq("status", "active");
  expect(legacyLookupError, "legacy lookup").toBeNull();
  const legacyIds = (legacyMemberships ?? []).map((row) => row.id);
  const { error: legacyDisable } = await admin
    .from("tenant_memberships")
    .update({ status: "disabled", disabled_at: new Date().toISOString() })
    .in("id", legacyIds)
    .eq("status", "active");
  expect(legacyDisable, "legacy disable").toBeNull();

  return { cleanTenantId };
};

export const rollbackCleanWorkspace = async (seed: CleanWorkspaceSeed) => {
  const cleanTenantId = cleanWorkspaceTenantId(seed.runId);
  const admin = seed.client;

  const { error: cleanDisableError } = await admin
    .from("tenant_memberships")
    .update({ status: "disabled", disabled_at: new Date().toISOString() })
    .eq("tenant_id", cleanTenantId)
    .eq("status", "active");
  expect(cleanDisableError, "clean disable on rollback").toBeNull();

  const { data: legacyMemberships, error: legacyLookupError } = await admin
    .from("tenant_memberships")
    .select("id")
    .eq("tenant_id", seed.legacyTenantId)
    .in(
      "auth_user_id",
      INTERNAL_PERSONAS.map((persona) => seed.actors[persona].id),
    )
    .eq("status", "disabled");
  expect(legacyLookupError, "legacy lookup on rollback").toBeNull();
  const legacyIds = (legacyMemberships ?? []).map((row) => row.id);
  const { error: legacyRestoreError } = await admin
    .from("tenant_memberships")
    .update({ status: "active", disabled_at: null })
    .in("id", legacyIds)
    .eq("status", "disabled");
  expect(legacyRestoreError, "legacy restore").toBeNull();

  const { error: auditError } = await admin.from("audit_events").upsert({
    id: cleanWorkspaceAuditEventId({ runId: seed.runId, suffix: "rolled_back" }),
    tenant_id: cleanTenantId,
    client_id: null,
    actor_user_id: null,
    action: CLEAN_WORKSPACE_ROLLBACK_ACTION,
    decision: "allowed",
    target_type: "tenant",
    target_id: cleanTenantId,
    reason: `run_id=${seed.runId};local_persistent_rollback`,
  }, { onConflict: "id", ignoreDuplicates: true });
  expect(auditError, "clean rollback audit").toBeNull();
};

export const assertCleanWorkspaceCounts = async (
  seed: CleanWorkspaceSeed,
  expectations: {
    cleanActiveMemberships: number;
    cleanOperationalZero: boolean;
    legacyAuditRows: number;
    legacyLedgerRows: number;
  },
) => {
  const cleanTenantId = cleanWorkspaceTenantId(seed.runId);
  const admin = seed.client;

  const cleanMemberships = await admin
    .from("tenant_memberships")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", cleanTenantId)
    .eq("status", "active");
  expect(cleanMemberships.error, "clean membership count").toBeNull();
  expect(cleanMemberships.count ?? 0).toBe(expectations.cleanActiveMemberships);

  if (expectations.cleanOperationalZero) {
    for (const table of [
      "clients",
      "contracts",
      "packages",
      "deliverables",
      "deliverable_versions",
      "approval_decisions",
      "file_assets",
      "package_ledger_entries",
      "deliverable_allocations",
    ]) {
      const result = await admin
        .from(table)
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", cleanTenantId);
      expect(result.error, `clean operational count ${table}`).toBeNull();
      expect(result.count ?? 0).toBe(0);
    }
  }

  const legacyAudit = await admin
    .from("audit_events")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", seed.legacyTenantId);
  expect(legacyAudit.error, "legacy audit count").toBeNull();
  expect(legacyAudit.count ?? 0).toBe(expectations.legacyAuditRows);

  const legacyLedger = await admin
    .from("package_ledger_entries")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", seed.legacyTenantId);
  expect(legacyLedger.error, "legacy ledger count").toBeNull();
  expect(legacyLedger.count ?? 0).toBe(expectations.legacyLedgerRows);
};

export const createPersistentActorClient = async (
  seed: CleanWorkspaceSeed,
  persona: PersonaKey,
) => {
  const client = createClient(seed.supabaseUrl, seed.publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const actor = seed.actors[persona];
  const { error } = await client.auth.signInWithPassword({
    email: actor.email,
    password: actor.password,
  });
  if (error) {
    throw new Error(`Clean trial actor sign-in failed: ${error.message}`);
  }
  return client;
};

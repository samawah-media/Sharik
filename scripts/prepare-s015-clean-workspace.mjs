// X009-B: prepare the clean owner-entry UAT workspace (Spec 015 only).
//
// Creates a new empty tenant inside the approved non-Production UAT
// environment, migrates approved internal Samawah team identities into it as
// their natural entry, and quarantines the legacy Glass/Hadna tenant by making
// those same identities' legacy membership inactive. Legacy audit and
// package-ledger history is never deleted; it remains reachable only through
// the quarantined legacy tenant. Client personas never receive clean-workspace
// access automatically.
//
// Modes: --dry-run | --apply | --rollback | --status
// All mutations are run-ID scoped, Preview/UAT only, idempotent, and
// reversible. Output is category/count only and never prints IDs, emails,
// credentials, or customer content.
//
// Identifier contract mirrors src/modules/uat/clean-workspace.ts exactly so
// that dry-run/apply/replay/rollback stay stable.

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const mode = process.argv.find(
  (value) =>
    value === "--dry-run" ||
    value === "--apply" ||
    value === "--rollback" ||
    value === "--status",
);
if (!mode) throw new Error("CLEAN_WORKSPACE_MODE_REQUIRED");

const CLEAN_WORKSPACE_TENANT_NAME = "سماوة — مساحة المالك";
const CLEAN_WORKSPACE_CATEGORY = "x009b_clean_owner_entry_workspace";
const CLEAN_WORKSPACE_PROVISIONED_ACTION =
  "x009b_clean_workspace_provisioned";
const CLEAN_WORKSPACE_ROLLBACK_ACTION = "x009b_clean_workspace_rolled_back";
const CLEAN_WORKSPACE_INTERNAL_ROLE_KEYS = new Set([
  "tenant_owner",
  "tenant_administrator",
  "project_manager",
  "marketing_manager",
  "account_manager",
  "content_writer",
  "designer",
  "performance_specialist",
]);
const CLIENT_ONLY_ROLE_KEYS = new Set([
  "client_admin",
  "client_approver",
  "client_viewer",
]);

const toStableUuid = (value) => {
  const bytes = Buffer.from(
    createHash("sha256").update(value).digest().subarray(0, 16),
  );
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

const tenantIdFor = (runId) => toStableUuid(`x009b:tenant:${runId}`);
const membershipIdFor = (runId, authUserId) =>
  toStableUuid(`x009b:membership:${runId}:${authUserId}`);
const roleAssignmentIdFor = (runId, authUserId, roleKey) =>
  toStableUuid(`x009b:role:${runId}:${authUserId}:${roleKey}`);
const auditEventIdFor = (runId, suffix) =>
  toStableUuid(`x009b:audit:${runId}:${suffix}`);

const INTERNAL_PERSONAS = [
  "ADMIN",
  "ACCOUNT_MANAGER",
  "CONTENT_WRITER",
  "DESIGNER",
  "UNASSIGNED",
];

await loadSecureEnv(
  path.resolve(
    process.cwd(),
    process.env.S015_UAT_SECURE_ENV_FILE ?? ".env.s015-team-uat.local",
  ),
);
if (process.env.S015_UAT_PROJECT_ENV_FILE) {
  await loadSecureEnv(path.resolve(process.env.S015_UAT_PROJECT_ENV_FILE));
}

process.env.S015_UAT_SUPABASE_URL ??= process.env.NEXT_PUBLIC_SUPABASE_URL;
process.env.S015_UAT_PUBLISHABLE_KEY ??=
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const required = (key) => {
  const value = process.env[key];
  if (!value) throw new Error(`CLEAN_WORKSPACE_INPUT_REQUIRED:${key}`);
  return value;
};

const runId = required("S015_UAT_CLEAN_WORKSPACE_RUN_ID");
if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{2,80}$/.test(runId)) {
  throw new Error("CLEAN_WORKSPACE_RUN_ID_INVALID");
}

const targetCategory = required("S015_UAT_TARGET_CATEGORY").toLowerCase();
if (!new Set(["preview", "uat", "preview-uat"]).has(targetCategory)) {
  throw new Error("CLEAN_WORKSPACE_NON_UAT_TARGET_REFUSED");
}

const supabaseUrl = required("S015_UAT_SUPABASE_URL");
const supabaseTarget = new URL(supabaseUrl);
// The owner-approved UAT hostname allowlist is the authoritative boundary. The
// Supabase URL must match it exactly and remain a supabase.co host; any
// mismatch is an ambiguous target and a hard stop before mutation.
const allowedHostname = (
  process.env.S015_UAT_ALLOWED_HOSTNAME ??
  process.env.S015_UAT_SUPABASE_HOSTNAME ??
  ""
).toLowerCase();
if (!allowedHostname) {
  throw new Error("CLEAN_WORKSPACE_HOSTNAME_ALLOWLIST_REQUIRED");
}
if (
  supabaseTarget.protocol !== "https:" ||
  supabaseTarget.hostname.toLowerCase() !== allowedHostname ||
  !supabaseTarget.hostname.endsWith(".supabase.co")
) {
  throw new Error("CLEAN_WORKSPACE_SUPABASE_TARGET_REFUSED");
}

if (
  mode === "--apply" &&
  process.env.S015_CLEAN_WORKSPACE_APPLY_CONFIRM !== "1"
) {
  throw new Error("CLEAN_WORKSPACE_APPLY_CONFIRMATION_REQUIRED");
}
if (
  mode === "--rollback" &&
  process.env.S015_CLEAN_WORKSPACE_ROLLBACK_CONFIRM !== "1"
) {
  throw new Error("CLEAN_WORKSPACE_ROLLBACK_CONFIRMATION_REQUIRED");
}

const cleanTenantId = tenantIdFor(runId);
const publishableKey = required("S015_UAT_PUBLISHABLE_KEY");

const personaEmails = Object.fromEntries(
  INTERNAL_PERSONAS.map((key) => [
    key,
    required(`S015_${key}_EMAIL`).toLowerCase(),
  ]),
);
const personaPasswords = Object.fromEntries(
  INTERNAL_PERSONAS.map((key) => [key, required(`S015_${key}_PASSWORD`)]),
);
const personaLabels = Object.fromEntries(
  INTERNAL_PERSONAS.map((key) => [
    key,
    process.env[`S015_${key}_LABEL`]?.trim() || key,
  ]),
);

const discovered = {};
for (const key of INTERNAL_PERSONAS) {
  const client = createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const signIn = await client.auth.signInWithPassword({
    email: personaEmails[key],
    password: personaPasswords[key],
  });
  if (signIn.error || !signIn.data.user) {
    throw new Error(`CLEAN_WORKSPACE_SIGN_IN_FAILED:${key}`);
  }
  const userId = signIn.data.user.id;
  const memberships = expectNoError(
    await client
      .from("tenant_memberships")
      .select("id, tenant_id, status")
      .eq("auth_user_id", userId),
    `CLEAN_WORKSPACE_MEMBERSHIP_INVENTORY_FAILED:${key}`,
  );
  const activeMemberships = memberships.filter(
    (membership) => membership.status === "active",
  );
  if (activeMemberships.length !== 1) {
    throw new Error(
      `CLEAN_WORKSPACE_LEGACY_MEMBERSHIP_AMBIGUOUS:${key}:${activeMemberships.length}`,
    );
  }
  const legacyMembership = activeMemberships[0];
  const roles = expectNoError(
    await client
      .from("role_assignments")
      .select("role_key, scope_type, status")
      .eq("membership_id", legacyMembership.id)
      .eq("status", "active"),
    `CLEAN_WORKSPACE_ROLE_INVENTORY_FAILED:${key}`,
  );
  await client.auth.signOut();
  discovered[key] = {
    userId,
    legacyTenantId: legacyMembership.tenant_id,
    legacyMembershipId: legacyMembership.id,
    legacyRoles: roles.map((role) => ({
      roleKey: role.role_key,
      scopeType: role.scope_type,
    })),
  };
}

const legacyTenantIds = new Set(
  Object.values(discovered).map((entry) => entry.legacyTenantId),
);
if (legacyTenantIds.size !== 1) {
  throw new Error("CLEAN_WORKSPACE_LEGACY_TENANT_NOT_SHARED");
}
const legacyTenantId = [...legacyTenantIds][0];
if (legacyTenantId === cleanTenantId) {
  throw new Error("CLEAN_WORKSPACE_LEGACY_TENANT_COLLIDES_WITH_CLEAN");
}

const plannedMemberships = INTERNAL_PERSONAS.map((key) => {
  const entry = discovered[key];
  const plannedRoles = [];
  const seen = new Set();
  for (const role of entry.legacyRoles) {
    if (CLIENT_ONLY_ROLE_KEYS.has(role.roleKey)) continue;
    if (!CLEAN_WORKSPACE_INTERNAL_ROLE_KEYS.has(role.roleKey)) continue;
    if (seen.has(role.roleKey)) continue;
    seen.add(role.roleKey);
    plannedRoles.push({
      roleKey: role.roleKey,
      assignmentId: roleAssignmentIdFor(runId, entry.userId, role.roleKey),
    });
  }
  return {
    key,
    userId: entry.userId,
    label: personaLabels[key],
    membershipId: membershipIdFor(runId, entry.userId),
    legacyMembershipId: entry.legacyMembershipId,
    plannedRoles,
  };
});

const personasWithoutInternalRole = plannedMemberships.filter(
  (entry) => entry.plannedRoles.length === 0,
);
if (personasWithoutInternalRole.length > 0) {
  throw new Error(
    `CLEAN_WORKSPACE_INTERNAL_ROLE_MISSING:${personasWithoutInternalRole.map((entry) => entry.key).join(",")}`,
  );
}

if (mode === "--dry-run") {
  console.log(
    JSON.stringify({
      status: "validated",
      category: CLEAN_WORKSPACE_CATEGORY,
      runId,
      targetCategory,
      planned: {
        cleanTenant: { name: CLEAN_WORKSPACE_TENANT_NAME },
        internalPersonas: plannedMemberships.length,
        tenantScopedRoleAssignments: plannedMemberships.reduce(
          (sum, entry) => sum + entry.plannedRoles.length,
          0,
        ),
        clientPersonasMigrated: 0,
        legacyQuarantine: {
          tenantCategory: "legacy_uat_hadna_glass",
          membershipAction: "set_inactive_reversible",
          auditLedgerAction: "unchanged",
        },
      },
      currentLegacy: {
        activeInternalMemberships: plannedMemberships.length,
        sharedLegacyTenant: true,
      },
    }),
  );
  process.exit(0);
}

const serviceRoleKey =
  process.env.S015_UAT_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey) {
  throw new Error("CLEAN_WORKSPACE_SERVICE_ROLE_REQUIRED");
}
const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

if (mode === "--status") {
  await printStatus();
  process.exit(0);
}

if (mode === "--rollback") {
  await runRollback();
  await printStatus();
  process.exit(0);
}

await runApply();
await printStatus();
process.exit(0);

async function runApply() {
  expectNoError(
    await admin.from("tenants").upsert(
      {
        id: cleanTenantId,
        name: CLEAN_WORKSPACE_TENANT_NAME,
        status: "active",
      },
      { onConflict: "id" },
    ),
    "CLEAN_WORKSPACE_TENANT_UPSERT_FAILED",
  );

  expectNoError(
    await admin.from("tenant_memberships").upsert(
      plannedMemberships.map((entry) => ({
        id: entry.membershipId,
        tenant_id: cleanTenantId,
        auth_user_id: entry.userId,
        status: "active",
        disabled_at: null,
      })),
      { onConflict: "id" },
    ),
    "CLEAN_WORKSPACE_MEMBERSHIP_UPSERT_FAILED",
  );

  const roleRows = [];
  for (const entry of plannedMemberships) {
    for (const role of entry.plannedRoles) {
      roleRows.push({
        id: role.assignmentId,
        tenant_id: cleanTenantId,
        membership_id: entry.membershipId,
        role_key: role.roleKey,
        scope_type: "tenant",
        scope_id: cleanTenantId,
        status: "active",
      });
    }
  }
  if (roleRows.length > 0) {
    expectNoError(
      await admin
        .from("role_assignments")
        .upsert(roleRows, { onConflict: "id" }),
      "CLEAN_WORKSPACE_ROLE_UPSERT_FAILED",
    );
  }

  expectNoError(
    await admin.from("member_profiles").upsert(
      plannedMemberships.map((entry) => ({
        tenant_id: cleanTenantId,
        user_id: entry.userId,
        display_name: entry.label,
        role_label: entry.plannedRoles[0]?.roleKey ?? null,
        sync_run_id: `x009b-profiles-${runId}`,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "tenant_id,user_id" },
    ),
    "CLEAN_WORKSPACE_PROFILE_UPSERT_FAILED",
  );

  expectNoError(
    await admin.from("audit_events").upsert(
      {
        id: auditEventIdFor(runId, "provisioned"),
        tenant_id: cleanTenantId,
        client_id: null,
        actor_user_id: null,
        action: CLEAN_WORKSPACE_PROVISIONED_ACTION,
        decision: "allowed",
        target_type: "tenant",
        target_id: cleanTenantId,
        reason: `run_id=${runId};internal_personas=${plannedMemberships.length}`,
      },
      { onConflict: "id", ignoreDuplicates: true },
    ),
    "CLEAN_WORKSPACE_AUDIT_PROVISION_FAILED",
  );

  const legacyDisable = await admin
    .from("tenant_memberships")
    .update({ status: "disabled", disabled_at: new Date().toISOString() })
    .in(
      "id",
      plannedMemberships.map((entry) => entry.legacyMembershipId),
    )
    .eq("status", "active");
  expectNoError(legacyDisable, "CLEAN_WORKSPACE_LEGACY_DISABLE_FAILED");
}

async function runRollback() {
  const cleanDisable = await admin
    .from("tenant_memberships")
    .update({ status: "disabled", disabled_at: new Date().toISOString() })
    .eq("tenant_id", cleanTenantId)
    .eq("status", "active");
  expectNoError(cleanDisable, "CLEAN_WORKSPACE_CLEAN_DISABLE_FAILED");

  const legacyRestore = await admin
    .from("tenant_memberships")
    .update({ status: "active", disabled_at: null })
    .in(
      "id",
      plannedMemberships.map((entry) => entry.legacyMembershipId),
    )
    .eq("status", "disabled");
  expectNoError(legacyRestore, "CLEAN_WORKSPACE_LEGACY_RESTORE_FAILED");

  expectNoError(
    await admin.from("audit_events").upsert(
      {
        id: auditEventIdFor(runId, "rolled_back"),
        tenant_id: cleanTenantId,
        client_id: null,
        actor_user_id: null,
        action: CLEAN_WORKSPACE_ROLLBACK_ACTION,
        decision: "allowed",
        target_type: "tenant",
        target_id: cleanTenantId,
        reason: `run_id=${runId};restored_legacy_entry`,
      },
      { onConflict: "id", ignoreDuplicates: true },
    ),
    "CLEAN_WORKSPACE_AUDIT_ROLLBACK_FAILED",
  );
}

async function printStatus() {
  const cleanTenant = expectNoError(
    await admin
      .from("tenants")
      .select("id, name, status")
      .eq("id", cleanTenantId)
      .maybeSingle(),
    "CLEAN_WORKSPACE_TENANT_STATUS_FAILED",
  );

  const cleanMembershipCount = await countExact(
    admin.from("tenant_memberships").select("id", { count: "exact", head: true }).eq("tenant_id", cleanTenantId).eq("status", "active"),
  );
  const cleanRoleCount = await countExact(
    admin.from("role_assignments").select("id", { count: "exact", head: true }).eq("tenant_id", cleanTenantId).eq("status", "active"),
  );
  const cleanProfileCount = await countExact(
    admin.from("member_profiles").select("tenant_id", { count: "exact", head: true }).eq("tenant_id", cleanTenantId),
  );

  const operationalCounts = {
    clients: await countExact(
      admin.from("clients").select("id", { count: "exact", head: true }).eq("tenant_id", cleanTenantId),
    ),
    contracts: await countExact(
      admin.from("contracts").select("id", { count: "exact", head: true }).eq("tenant_id", cleanTenantId),
    ),
    packages: await countExact(
      admin.from("packages").select("id", { count: "exact", head: true }).eq("tenant_id", cleanTenantId),
    ),
    package_lines: await countExact(
      admin.from("package_lines").select("id", { count: "exact", head: true }).eq("tenant_id", cleanTenantId),
    ),
    deliverables: await countExact(
      admin.from("deliverables").select("id", { count: "exact", head: true }).eq("tenant_id", cleanTenantId),
    ),
    versions: await countExact(
      admin.from("deliverable_versions").select("id", { count: "exact", head: true }).eq("tenant_id", cleanTenantId),
    ),
    tasks: await countExact(
      admin.from("deliverable_tasks").select("id", { count: "exact", head: true }).eq("tenant_id", cleanTenantId),
    ),
    approvals: await countExact(
      admin.from("approval_decisions").select("id", { count: "exact", head: true }).eq("tenant_id", cleanTenantId),
    ),
    files: await countExact(
      admin.from("file_assets").select("id", { count: "exact", head: true }).eq("tenant_id", cleanTenantId),
    ),
    ledger_entries: await countExact(
      admin.from("package_ledger_entries").select("id", { count: "exact", head: true }).eq("tenant_id", cleanTenantId),
    ),
    reservations: await countExact(
      admin.from("deliverable_allocations").select("id", { count: "exact", head: true }).eq("tenant_id", cleanTenantId),
    ),
  };

  const legacyMembershipActive = await countExact(
    admin
      .from("tenant_memberships")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", legacyTenantId)
      .in(
        "auth_user_id",
        plannedMemberships.map((entry) => entry.userId),
      )
      .eq("status", "active"),
  );
  const legacyAuditUnchanged = await countExact(
    admin.from("audit_events").select("id", { count: "exact", head: true }).eq("tenant_id", legacyTenantId),
  );
  const cleanAuditProvisioned = await countExact(
    admin.from("audit_events").select("id", { count: "exact", head: true }).eq("tenant_id", cleanTenantId).eq("action", CLEAN_WORKSPACE_PROVISIONED_ACTION),
  );
  const cleanAuditRolledBack = await countExact(
    admin.from("audit_events").select("id", { count: "exact", head: true }).eq("tenant_id", cleanTenantId).eq("action", CLEAN_WORKSPACE_ROLLBACK_ACTION),
  );

  console.log(
    JSON.stringify({
      status: "reported",
      category: CLEAN_WORKSPACE_CATEGORY,
      runId,
      targetCategory,
      cleanWorkspace: {
        present: Boolean(cleanTenant),
        name: cleanTenant?.name ?? null,
        activeInternalMemberships: cleanMembershipCount,
        activeTenantScopedRoles: cleanRoleCount,
        memberProfiles: cleanProfileCount,
        operationalCounts,
        auditEvents: {
          provisioned: cleanAuditProvisioned,
          rolledBack: cleanAuditRolledBack,
        },
      },
      legacyQuarantine: {
        tenantCategory: "legacy_uat_hadna_glass",
        internalMembershipsStillActive: legacyMembershipActive,
        auditLedgerRowsPreserved: legacyAuditUnchanged,
      },
    }),
  );
}

async function countExact(request) {
  const result = await request;
  expectNoError(result, "CLEAN_WORKSPACE_COUNT_FAILED");
  return result.count ?? 0;
}

function expectNoError(response, code) {
  if (response.error) {
    throw new Error(
      `${code}:${response.error.code ?? "unknown"}:${response.error.message ?? "unknown"}`,
    );
  }
  return response.data;
}

async function loadSecureEnv(filePath) {
  const content = await readFile(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    const value = line
      .slice(separator + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    process.env[key] ??= value;
  }
}

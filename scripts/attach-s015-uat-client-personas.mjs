import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";
import {
  createS015ClientPersonaScopeIds,
  createS015PersonaScopeJournalId,
  isS015ClientPersonaScopeRunId,
  planS015PersonaTenantMembership,
  S015_CLIENT_PERSONAS,
} from "./lib/s015-client-persona-scope.mjs";

const mode = process.argv.find((value) =>
  new Set(["--dry-run", "--apply", "--status", "--rollback"]).has(value),
);
if (!mode) throw new Error("CLIENT_PERSONA_SCOPE_MODE_REQUIRED");

await loadSecureEnv(
  path.resolve(
    process.cwd(),
    process.env.S015_UAT_SECURE_ENV_FILE ?? ".env.s015-team-uat.local",
  ),
);
if (process.env.S015_UAT_PROJECT_ENV_FILE) {
  await loadSecureEnv(path.resolve(process.env.S015_UAT_PROJECT_ENV_FILE));
}

const required = (key) => {
  const value = process.env[key]?.trim();
  if (!value) throw new Error(`CLIENT_PERSONA_SCOPE_INPUT_REQUIRED:${key}`);
  return value;
};

const targetCategory = required("S015_UAT_TARGET_CATEGORY").toLowerCase();
if (!new Set(["preview", "uat", "preview-uat"]).has(targetCategory)) {
  throw new Error("CLIENT_PERSONA_SCOPE_NON_UAT_TARGET_REFUSED");
}
if (
  mode === "--apply" &&
  process.env.S015_CLIENT_PERSONA_SCOPE_APPLY_CONFIRM !== "1"
) {
  throw new Error("CLIENT_PERSONA_SCOPE_APPLY_CONFIRMATION_REQUIRED");
}
if (
  mode === "--rollback" &&
  process.env.S015_CLIENT_PERSONA_SCOPE_ROLLBACK_CONFIRM !== "1"
) {
  throw new Error("CLIENT_PERSONA_SCOPE_ROLLBACK_CONFIRMATION_REQUIRED");
}

const runId = required("S015_UAT_CLIENT_SCOPE_RUN_ID");
if (!isS015ClientPersonaScopeRunId(runId)) {
  throw new Error("CLIENT_PERSONA_SCOPE_RUN_ID_INVALID");
}

const supabaseUrl = required("NEXT_PUBLIC_SUPABASE_URL");
const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const serviceRoleKey =
  process.env.S015_UAT_SERVICE_ROLE_KEY ??
  required("SUPABASE_SERVICE_ROLE_KEY");
const target = new URL(supabaseUrl);
const allowedHostname = required("S015_UAT_SUPABASE_HOSTNAME").toLowerCase();
if (
  target.protocol !== "https:" ||
  target.hostname.toLowerCase() !== allowedHostname ||
  !target.hostname.endsWith(".supabase.co")
) {
  throw new Error("CLIENT_PERSONA_SCOPE_TARGET_REFUSED");
}

const targetClientId = required("S015_UAT_CLIENT_ID");
const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const targetClient = expectNoError(
  await admin
    .from("clients")
    .select("id, tenant_id")
    .eq("id", targetClientId)
    .eq("status", "active")
    .single(),
  "CLIENT_PERSONA_SCOPE_CLIENT_MISSING",
);
const targetTenantId = targetClient.tenant_id;

const personas = [];
for (const persona of S015_CLIENT_PERSONAS) {
  const session = createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const signIn = await session.auth.signInWithPassword({
    email: required(`S015_${persona.key}_EMAIL`),
    password: required(`S015_${persona.key}_PASSWORD`),
  });
  if (signIn.error || !signIn.data.user) {
    throw new Error(`CLIENT_PERSONA_SCOPE_SIGN_IN_FAILED:${persona.key}`);
  }

  const userId = signIn.data.user.id;
  const memberships = expectNoError(
    await admin
      .from("tenant_memberships")
      .select("id, tenant_id, status")
      .eq("auth_user_id", userId),
    `CLIENT_PERSONA_SCOPE_MEMBERSHIP_READ_FAILED:${persona.key}`,
  );
  const [clientMemberships, roleAssignments, suspensionJournal] =
    await Promise.all([
      admin
        .from("client_memberships")
        .select("id, client_id, status")
        .eq("tenant_id", targetTenantId)
        .eq("auth_user_id", userId),
      admin
        .from("role_assignments")
        .select("id, membership_id, scope_type, scope_id, status")
        .eq("tenant_id", targetTenantId),
      admin
        .from("audit_events")
        .select("target_type, target_id")
        .eq("action", "x009d_uat_client_persona_scope_suspended")
        .eq("reason", `run_id=${runId};persona=${userId}`),
    ]);
  const readableClientMemberships = expectNoError(
    clientMemberships,
    `CLIENT_PERSONA_SCOPE_CLIENT_MEMBERSHIP_READ_FAILED:${persona.key}`,
  );
  const readableRoleAssignments = expectNoError(
    roleAssignments,
    `CLIENT_PERSONA_SCOPE_ROLE_READ_FAILED:${persona.key}`,
  );
  const readableSuspensionJournal = expectNoError(
    suspensionJournal,
    `CLIENT_PERSONA_SCOPE_JOURNAL_READ_FAILED:${persona.key}`,
  );
  const generatedIds = createS015ClientPersonaScopeIds({
    runId,
    userId,
    roleKey: persona.roleKey,
  });
  let membershipPlan;
  try {
    membershipPlan = planS015PersonaTenantMembership({
      memberships,
      targetTenantId,
      generatedMembershipId: generatedIds.tenantMembershipId,
    });
  } catch (error) {
    throw new Error(`${error.message}:${persona.key}`);
  }
  const activeForeignClientMembershipIds = readableClientMemberships
    .filter(
      (membership) =>
        membership.client_id !== targetClientId &&
        membership.status === "active",
    )
    .map((membership) => membership.id);
  const activeForeignRoleAssignmentIds = readableRoleAssignments
    .filter(
      (assignment) =>
        assignment.membership_id === membershipPlan.tenantMembershipId &&
        assignment.scope_type === "client" &&
        assignment.scope_id !== targetClientId &&
        assignment.status === "active",
    )
    .map((assignment) => assignment.id);
  const journaledClientMembershipIds = readableSuspensionJournal
    .filter((entry) => entry.target_type === "client_membership")
    .map((entry) => entry.target_id);
  const journaledRoleAssignmentIds = readableSuspensionJournal
    .filter((entry) => entry.target_type === "role_assignment")
    .map((entry) => entry.target_id);

  personas.push({
    ...persona,
    userId,
    label: process.env[`S015_${persona.key}_LABEL`]?.trim() || persona.key,
    activeExternalMembershipId: membershipPlan.activeExternalMembershipId,
    createsTenantMembership: membershipPlan.createsTenantMembership,
    activeForeignClientMembershipIds,
    activeForeignRoleAssignmentIds,
    suspendedClientMembershipIds: [
      ...new Set([
        ...activeForeignClientMembershipIds,
        ...journaledClientMembershipIds,
      ]),
    ],
    suspendedRoleAssignmentIds: [
      ...new Set([
        ...activeForeignRoleAssignmentIds,
        ...journaledRoleAssignmentIds,
      ]),
    ],
    ids: {
      ...generatedIds,
      tenantMembershipId: membershipPlan.tenantMembershipId,
    },
  });
  await session.auth.signOut();
}

if (mode === "--dry-run") {
  printResult("validated");
  process.exit(0);
}
if (mode === "--status") {
  await printStatus();
  process.exit(0);
}
if (mode === "--rollback") {
  await rollback();
  await printStatus();
  process.exit(0);
}

try {
  await apply();
} catch (error) {
  await compensate();
  throw error;
}
await printStatus();

async function apply() {
  const createdTenantMemberships = personas.filter(
    (persona) => persona.createsTenantMembership,
  );
  if (createdTenantMemberships.length > 0) {
    expectNoError(
      await admin.from("tenant_memberships").upsert(
        createdTenantMemberships.map((persona) => ({
          id: persona.ids.tenantMembershipId,
          tenant_id: targetTenantId,
          auth_user_id: persona.userId,
          status: "active",
          disabled_at: null,
        })),
        { onConflict: "id" },
      ),
      "CLIENT_PERSONA_SCOPE_TENANT_MEMBERSHIP_FAILED",
    );
  }
  expectNoError(
    await admin.from("client_memberships").upsert(
      personas.map((persona) => ({
        id: persona.ids.clientMembershipId,
        tenant_id: targetTenantId,
        client_id: targetClientId,
        auth_user_id: persona.userId,
        status: "active",
        disabled_at: null,
      })),
      { onConflict: "id" },
    ),
    "CLIENT_PERSONA_SCOPE_CLIENT_MEMBERSHIP_FAILED",
  );
  expectNoError(
    await admin.from("role_assignments").upsert(
      personas.map((persona) => ({
        id: persona.ids.roleAssignmentId,
        tenant_id: targetTenantId,
        membership_id: persona.ids.tenantMembershipId,
        role_key: persona.roleKey,
        scope_type: "client",
        scope_id: targetClientId,
        status: "active",
      })),
      { onConflict: "id" },
    ),
    "CLIENT_PERSONA_SCOPE_ROLE_FAILED",
  );
  expectNoError(
    await admin.from("member_profiles").upsert(
      personas.map((persona) => ({
        tenant_id: targetTenantId,
        user_id: persona.userId,
        display_name: persona.label,
        role_label: persona.roleKey,
        sync_run_id: `x009d-${runId}`,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "tenant_id,user_id" },
    ),
    "CLIENT_PERSONA_SCOPE_PROFILE_FAILED",
  );
  const suspensionEvents = personas.flatMap((persona) => [
    ...persona.activeForeignClientMembershipIds.map((resourceId) => ({
      id: createS015PersonaScopeJournalId({
        runId,
        resourceType: "client_membership",
        resourceId,
      }),
      tenant_id: targetTenantId,
      client_id: targetClientId,
      actor_user_id: null,
      action: "x009d_uat_client_persona_scope_suspended",
      decision: "allowed",
      target_type: "client_membership",
      target_id: resourceId,
      reason: `run_id=${runId};persona=${persona.userId}`,
    })),
    ...persona.activeForeignRoleAssignmentIds.map((resourceId) => ({
      id: createS015PersonaScopeJournalId({
        runId,
        resourceType: "role_assignment",
        resourceId,
      }),
      tenant_id: targetTenantId,
      client_id: targetClientId,
      actor_user_id: null,
      action: "x009d_uat_client_persona_scope_suspended",
      decision: "allowed",
      target_type: "role_assignment",
      target_id: resourceId,
      reason: `run_id=${runId};persona=${persona.userId}`,
    })),
  ]);
  if (suspensionEvents.length > 0) {
    expectNoError(
      await admin
        .from("audit_events")
        .upsert(suspensionEvents, { onConflict: "id", ignoreDuplicates: true }),
      "CLIENT_PERSONA_SCOPE_SUSPENSION_AUDIT_FAILED",
    );
  }
  await setSuspendedClientScope("disabled");
  const activeExternalMembershipIds = personas
    .map((persona) => persona.activeExternalMembershipId)
    .filter(Boolean);
  if (activeExternalMembershipIds.length > 0) {
    expectNoError(
      await admin
        .from("tenant_memberships")
        .update({ status: "disabled", disabled_at: new Date().toISOString() })
        .in("id", activeExternalMembershipIds)
        .eq("status", "active"),
      "CLIENT_PERSONA_SCOPE_EXTERNAL_DISABLE_FAILED",
    );
  }
  expectNoError(
    await admin.from("audit_events").upsert(
      personas.map((persona) => ({
        id: persona.ids.applyAuditId,
        tenant_id: targetTenantId,
        client_id: targetClientId,
        actor_user_id: null,
        action: "x009d_uat_client_persona_attached",
        decision: "allowed",
        target_type: "client_membership",
        target_id: persona.ids.clientMembershipId,
        reason: `run_id=${runId};role=${persona.roleKey}`,
      })),
      { onConflict: "id", ignoreDuplicates: true },
    ),
    "CLIENT_PERSONA_SCOPE_AUDIT_FAILED",
  );
}

async function compensate() {
  await disableTargetScope();
  await restoreExternalMemberships();
  await setSuspendedClientScope("active");
}

async function rollback() {
  await disableTargetScope();
  await restoreExternalMemberships();
  await setSuspendedClientScope("active");
  expectNoError(
    await admin.from("audit_events").upsert(
      personas.map((persona) => ({
        id: persona.ids.rollbackAuditId,
        tenant_id: targetTenantId,
        client_id: targetClientId,
        actor_user_id: null,
        action: "x009d_uat_client_persona_scope_rolled_back",
        decision: "allowed",
        target_type: "client_membership",
        target_id: persona.ids.clientMembershipId,
        reason: `run_id=${runId};role=${persona.roleKey}`,
      })),
      { onConflict: "id", ignoreDuplicates: true },
    ),
    "CLIENT_PERSONA_SCOPE_ROLLBACK_AUDIT_FAILED",
  );
}

async function setSuspendedClientScope(status) {
  const clientMembershipIds = personas.flatMap(
    (persona) => persona.suspendedClientMembershipIds,
  );
  const roleAssignmentIds = personas.flatMap(
    (persona) => persona.suspendedRoleAssignmentIds,
  );
  if (clientMembershipIds.length > 0) {
    expectNoError(
      await admin
        .from("client_memberships")
        .update({
          status,
          disabled_at: status === "active" ? null : new Date().toISOString(),
        })
        .in("id", clientMembershipIds),
      "CLIENT_PERSONA_SCOPE_FOREIGN_CLIENT_MEMBERSHIP_FAILED",
    );
  }
  if (roleAssignmentIds.length > 0) {
    expectNoError(
      await admin
        .from("role_assignments")
        .update({ status })
        .in("id", roleAssignmentIds),
      "CLIENT_PERSONA_SCOPE_FOREIGN_ROLE_FAILED",
    );
  }
}

async function disableTargetScope() {
  expectNoError(
    await admin
      .from("role_assignments")
      .update({ status: "disabled" })
      .in(
        "id",
        personas.map((persona) => persona.ids.roleAssignmentId),
      ),
    "CLIENT_PERSONA_SCOPE_ROLE_DISABLE_FAILED",
  );
  expectNoError(
    await admin
      .from("client_memberships")
      .update({ status: "disabled", disabled_at: new Date().toISOString() })
      .in(
        "id",
        personas.map((persona) => persona.ids.clientMembershipId),
      ),
    "CLIENT_PERSONA_SCOPE_CLIENT_DISABLE_FAILED",
  );
  const createdTenantMembershipIds = personas
    .filter((persona) => persona.createsTenantMembership)
    .map((persona) => persona.ids.tenantMembershipId);
  if (createdTenantMembershipIds.length > 0) {
    expectNoError(
      await admin
        .from("tenant_memberships")
        .update({ status: "disabled", disabled_at: new Date().toISOString() })
        .in("id", createdTenantMembershipIds),
      "CLIENT_PERSONA_SCOPE_TENANT_DISABLE_FAILED",
    );
  }
}

async function restoreExternalMemberships() {
  const activeExternalMembershipIds = personas
    .map((persona) => persona.activeExternalMembershipId)
    .filter(Boolean);
  if (activeExternalMembershipIds.length > 0) {
    expectNoError(
      await admin
        .from("tenant_memberships")
        .update({ status: "active", disabled_at: null })
        .in("id", activeExternalMembershipIds),
      "CLIENT_PERSONA_SCOPE_EXTERNAL_RESTORE_FAILED",
    );
  }
}

async function printStatus() {
  const [tenantMemberships, clientMemberships, roles] = await Promise.all([
    countActive(
      "tenant_memberships",
      "id",
      personas.map((p) => p.ids.tenantMembershipId),
    ),
    countActive(
      "client_memberships",
      "id",
      personas.map((p) => p.ids.clientMembershipId),
    ),
    countActive(
      "role_assignments",
      "id",
      personas.map((p) => p.ids.roleAssignmentId),
    ),
  ]);
  printResult("status", {
    activeTenantMemberships: tenantMemberships,
    activeClientMemberships: clientMemberships,
    activeRoleAssignments: roles,
  });
}

async function countActive(table, column, values) {
  const response = await admin
    .from(table)
    .select(column, { count: "exact", head: true })
    .in(column, values)
    .eq("status", "active");
  expectNoError(response, `CLIENT_PERSONA_SCOPE_STATUS_FAILED:${table}`);
  return response.count ?? 0;
}

function printResult(status, counts = {}) {
  console.log(
    JSON.stringify({
      status,
      category: "x009d_uat_client_persona_scope",
      targetCategory,
      runId,
      counts: {
        personas: personas.length,
        approvers: 1,
        viewers: 1,
        ...counts,
      },
    }),
  );
}

function expectNoError(response, code) {
  if (response.error) {
    throw new Error(`${code}:${response.error.code ?? "unknown"}`);
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

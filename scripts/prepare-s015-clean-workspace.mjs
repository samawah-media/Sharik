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
// X010-B-7C-9 hardened rollover semantics: every approved persona selects
// exactly one ACTIVE source membership while any number of historical inactive
// memberships are tolerated. Apply fully provisions and verifies the empty
// target, persists one deterministic append-only binding audit row recording
// the exact source tenant/membership set, and only then disables that set.
// Replay of an applied run is a verified no-op; conflicting replay and
// missing/inconsistent binding identity fail closed. Rollback resolves the
// binding and restores only the recorded source memberships while disabling
// only this run's target memberships.
//
// Modes: --dry-run | --apply | --rollback | --status
// All mutations are run-ID scoped, Preview/UAT only, idempotent, and
// reversible. Output is category/count only and never prints IDs, emails,
// credentials, or customer content.
// Recovery checks HTTP results and preserves a verified active set where
// possible. Requests are not atomic: a temporary dual-active interval exists,
// and RECOVERY_INCOMPLETE requires operator review, not a blind retry.
//
// Identifier contract mirrors src/modules/uat/clean-workspace.ts exactly so
// that dry-run/apply/replay/rollback stay stable. The synchronization-guard
// unit test (tests/unit/uat/clean-workspace.test.ts) fails when the mirrored
// constants, binding reason format, or fail-closed codes drift.

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
const CLEAN_WORKSPACE_ROLLBACK_ACTION =
  "x009b_clean_workspace_rolled_back";
const CLEAN_WORKSPACE_SOURCE_BINDING_ACTION =
  "x010b7c9_clean_workspace_source_binding";
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
const bindingAuditEventIdFor = (runId) =>
  auditEventIdFor(runId, "source-binding");

// Canonical binding reason — mirrored from
// src/modules/uat/clean-workspace.ts (buildCleanWorkspaceSourceBindingReason).
const BINDING_UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const buildBindingReason = (binding) =>
  "run_id=" +
  binding.runId +
  ";source_tenant=" +
  binding.sourceTenantId +
  ";source_memberships=" +
  [...binding.sourceMembershipIds].filter(Boolean).sort().join(",");
const parseBindingReason = (reason) => {
  if (!reason) return null;
  const fields = new Map();
  for (const segment of reason.split(";")) {
    const separator = segment.indexOf("=");
    if (separator < 1) return null;
    fields.set(segment.slice(0, separator), segment.slice(separator + 1));
  }
  const runId = fields.get("run_id");
  const sourceTenantId = fields.get("source_tenant");
  const memberships = fields.get("source_memberships");
  if (!runId || !sourceTenantId || memberships === undefined) return null;
  if (!BINDING_UUID_PATTERN.test(sourceTenantId)) return null;
  const sourceMembershipIds = memberships
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .sort();
  if (
    sourceMembershipIds.length === 0 ||
    sourceMembershipIds.some((id) => !BINDING_UUID_PATTERN.test(id))
  ) {
    return null;
  }
  return { runId, sourceTenantId, sourceMembershipIds };
};
const bindingsMatch = (left, right) =>
  buildBindingReason(left) === buildBindingReason(right);

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
  process.env.S015_UAT_SUPABASE_HOSTNAME ?? ""
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
const serviceRoleKey =
  process.env.S015_UAT_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (mode !== "--dry-run" && !serviceRoleKey) {
  throw new Error("CLEAN_WORKSPACE_SERVICE_ROLE_REQUIRED");
}
const admin = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

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

// ---------------------------------------------------------------------------
// Source discovery (X010-B-7C-9): select exactly one ACTIVE source membership
// per persona. Historical inactive memberships are tolerated and ignored.
// ---------------------------------------------------------------------------
const discoverSourcePlan = async () => {
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
    const inventoryClient = admin ?? client;
    const memberships = expectNoError(
      await inventoryClient
        .from("tenant_memberships")
        .select("id, tenant_id, status")
        .eq("auth_user_id", userId),
      `CLEAN_WORKSPACE_MEMBERSHIP_INVENTORY_FAILED:${key}`,
    );
    const activeMemberships = memberships.filter(
      (membership) => membership.status === "active",
    );
    if (activeMemberships.length === 0) {
      throw new Error(`CLEAN_WORKSPACE_ACTIVE_SOURCE_MISSING:${key}`);
    }
    if (activeMemberships.length > 1) {
      throw new Error(
        `CLEAN_WORKSPACE_ACTIVE_SOURCE_AMBIGUOUS:${key}:${activeMemberships.length}`,
      );
    }
    const sourceMembership = activeMemberships[0];
    if (sourceMembership.tenant_id === cleanTenantId) {
      throw new Error(
        `CLEAN_WORKSPACE_SOURCE_TENANT_COLLIDES_WITH_TARGET:${key}`,
      );
    }
    const roles = expectNoError(
      await inventoryClient
        .from("role_assignments")
        .select("role_key, scope_type, status")
        .eq("membership_id", sourceMembership.id)
        .eq("status", "active"),
      `CLEAN_WORKSPACE_ROLE_INVENTORY_FAILED:${key}`,
    );
    await client.auth.signOut();
    discovered[key] = {
      userId,
      sourceTenantId: sourceMembership.tenant_id,
      sourceMembershipId: sourceMembership.id,
      sourceRoles: roles.map((role) => ({
        roleKey: role.role_key,
        scopeType: role.scope_type,
      })),
    };
  }

  const sourceTenantIds = new Set(
    Object.values(discovered).map((entry) => entry.sourceTenantId),
  );
  if (sourceTenantIds.size !== 1) {
    throw new Error("CLEAN_WORKSPACE_SOURCE_TENANT_MISMATCH");
  }
  const sourceTenantId = [...sourceTenantIds][0];
  if (sourceTenantId === cleanTenantId) {
    throw new Error("CLEAN_WORKSPACE_SOURCE_TENANT_COLLIDES_WITH_TARGET");
  }

  const plannedMemberships = INTERNAL_PERSONAS.map((key) => {
    const entry = discovered[key];
    const plannedRoles = [];
    const seen = new Set();
    for (const role of entry.sourceRoles) {
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
      sourceMembershipId: entry.sourceMembershipId,
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

  return {
    sourceTenantId,
    plannedMemberships,
    binding: {
      runId,
      sourceTenantId,
      sourceMembershipIds: plannedMemberships.map(
        (entry) => entry.sourceMembershipId,
      ),
    },
  };
};

// ---------------------------------------------------------------------------
// Binding resolution: later processes identify the quarantined source through
// the deterministic append-only audit row, never through re-derivation.
// ---------------------------------------------------------------------------
const loadBinding = async () => {
  if (!admin) return null;
  const row = expectNoError(
    await admin
      .from("audit_events")
      .select("id, reason")
      .eq("id", bindingAuditEventIdFor(runId))
      .maybeSingle(),
    "CLEAN_WORKSPACE_BINDING_LOOKUP_FAILED",
  );
  if (!row) return null;
  const binding = parseBindingReason(row.reason);
  if (!binding || binding.runId !== runId) {
    throw new Error("CLEAN_WORKSPACE_BINDING_IDENTITY_INVALID");
  }
  return binding;
};

const validateBindingIdentity = async (binding) => {
  const rows = expectNoError(
    await admin
      .from("tenant_memberships")
      .select("id, tenant_id, status, auth_user_id")
      .in("id", binding.sourceMembershipIds),
    "CLEAN_WORKSPACE_BINDING_LOOKUP_FAILED",
  );
  if (!rows || rows.length !== binding.sourceMembershipIds.length) {
    throw new Error("CLEAN_WORKSPACE_BINDING_IDENTITY_INVALID");
  }
  for (const row of rows) {
    if (row.tenant_id !== binding.sourceTenantId) {
      throw new Error("CLEAN_WORKSPACE_BINDING_IDENTITY_INVALID");
    }
  }
  return rows;
};

if (mode === "--status") {
  await printStatus();
  process.exit(0);
}

if (mode === "--rollback") {
  await runRollback();
  await printStatus();
  process.exit(0);
}

if (mode === "--apply") {
  await runApply();
  await printStatus();
  process.exit(0);
}

// --dry-run
await runDryRun();
process.exit(0);

async function runDryRun() {
  const binding = await loadBinding();
  let plan = null;

  if (binding) {
    const rows = await validateBindingIdentity(binding);
    const activeRecorded = rows.filter((row) => row.status === "active");
    if (activeRecorded.length === 0) {
      // Already applied: report the applied state without any mutation.
      console.log(
        JSON.stringify({
          status: "already_applied",
          category: CLEAN_WORKSPACE_CATEGORY,
          runId,
          targetCategory,
          sourceBinding: { recorded: true, resolved: "verified" },
          planned: null,
        }),
      );
      return;
    }
    if (activeRecorded.length !== rows.length) {
      throw new Error("CLEAN_WORKSPACE_BINDING_IDENTITY_INVALID");
    }
    // Sources are active again (for example after a rollback). A future apply
    // is only valid when discovery still selects the bound set.
    plan = await discoverSourcePlan();
    if (!bindingsMatch(binding, plan.binding)) {
      throw new Error("CLEAN_WORKSPACE_BINDING_CONFLICT");
    }
  } else {
    plan = await discoverSourcePlan();
  }

  console.log(
    JSON.stringify({
      status: "validated",
      category: CLEAN_WORKSPACE_CATEGORY,
      runId,
      targetCategory,
      sourceBinding: { recorded: Boolean(binding) },
      sourceSelection: {
        strategy: "single_active_per_persona",
        historicalInactiveTolerated: true,
      },
      planned: {
        cleanTenant: { name: CLEAN_WORKSPACE_TENANT_NAME },
        internalPersonas: plan.plannedMemberships.length,
        tenantScopedRoleAssignments: plan.plannedMemberships.reduce(
          (sum, entry) => sum + entry.plannedRoles.length,
          0,
        ),
        clientPersonasMigrated: 0,
        sourceQuarantine: {
          membershipAction: "set_inactive_reversible_after_verified_provisioning_and_binding",
          auditLedgerAction: "unchanged_append_only",
        },
      },
    }),
  );
}

async function runApply() {
  const binding = await loadBinding();

  if (binding) {
    const rows = await validateBindingIdentity(binding);
    const activeRecorded = rows.filter((row) => row.status === "active");

    if (activeRecorded.length === rows.length) {
      // Bound sources are active again (for example after a rollback). The
      // replay may proceed only when discovery still selects the bound set.
      const plan = await discoverSourcePlan();
      if (!bindingsMatch(binding, plan.binding)) {
        throw new Error("CLEAN_WORKSPACE_BINDING_CONFLICT");
      }
      await applyWithRecovery(plan);
      return;
    }

    if (activeRecorded.length === 0) {
      // Already-applied replay: verify the provisioned target, then no-op.
      await verifyTargetProvisioned();
      return;
    }

    throw new Error("CLEAN_WORKSPACE_BINDING_IDENTITY_INVALID");
  }

  const plan = await discoverSourcePlan();
  await applyWithRecovery(plan);
}

async function applyWithRecovery(plan) {
  try {
    await applyWorkspace(plan);
  } catch (error) {
    try {
      await compensateFailedApply(plan);
    } catch {
      // A failed compensation is not a successful rollback. Do not leak SDK
      // payloads or imply that a sequence of HTTP requests was transactional.
      throw new Error("CLEAN_WORKSPACE_RECOVERY_INCOMPLETE:APPLY");
    }
    throw error;
  }
}

async function applyWorkspace(plan) {
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
      plan.plannedMemberships.map((entry) => ({
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
  for (const entry of plan.plannedMemberships) {
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
      plan.plannedMemberships.map((entry) => ({
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
        reason: `run_id=${runId};internal_personas=${plan.plannedMemberships.length}`,
      },
      { onConflict: "id", ignoreDuplicates: true },
    ),
    "CLEAN_WORKSPACE_AUDIT_PROVISION_FAILED",
  );

  // Fully provisioned and verified before the source is touched.
  await verifyTargetProvisioned();

  // Deterministic append-only binding to the exact source set — written
  // before the source memberships are disabled so later status/replay/
  // rollback processes can resolve the same identity.
  expectNoError(
    await admin.from("audit_events").upsert(
      {
        id: bindingAuditEventIdFor(runId),
        tenant_id: cleanTenantId,
        client_id: null,
        actor_user_id: null,
        action: CLEAN_WORKSPACE_SOURCE_BINDING_ACTION,
        decision: "allowed",
        target_type: "tenant",
        target_id: cleanTenantId,
        reason: buildBindingReason(plan.binding),
      },
      { onConflict: "id", ignoreDuplicates: true },
    ),
    "CLEAN_WORKSPACE_AUDIT_BINDING_FAILED",
  );

  const sourceDisable = await admin
    .from("tenant_memberships")
    .update({ status: "disabled", disabled_at: new Date().toISOString() })
    .in(
      "id",
      plan.plannedMemberships.map((entry) => entry.sourceMembershipId),
    )
    .eq("status", "active");
  expectNoError(sourceDisable, "CLEAN_WORKSPACE_SOURCE_DISABLE_FAILED");
}

// The target must be a fully provisioned, still-empty workspace before the
// source may be quarantined; otherwise fail closed and compensate.
async function verifyTargetProvisioned() {
  const activeTargetMemberships = await countExact(
    admin
      .from("tenant_memberships")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", cleanTenantId)
      .eq("status", "active"),
  );
  if (activeTargetMemberships !== INTERNAL_PERSONAS.length) {
    throw new Error("CLEAN_WORKSPACE_TARGET_VERIFICATION_FAILED");
  }

  const activeTargetRoles = await countExact(
    admin
      .from("role_assignments")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", cleanTenantId)
      .eq("status", "active"),
  );
  if (activeTargetRoles < INTERNAL_PERSONAS.length) {
    throw new Error("CLEAN_WORKSPACE_TARGET_VERIFICATION_FAILED");
  }

  const operationalTables = [
    "clients",
    "contracts",
    "packages",
    "package_lines",
    "deliverables",
    "deliverable_versions",
    "deliverable_tasks",
    "approval_decisions",
    "file_assets",
    "package_ledger_entries",
    "deliverable_allocations",
  ];
  for (const table of operationalTables) {
    const rows = await countExact(
      admin.from(table).select("id", { count: "exact", head: true }).eq("tenant_id", cleanTenantId),
    );
    if (rows !== 0) {
      throw new Error("CLEAN_WORKSPACE_TARGET_VERIFICATION_FAILED");
    }
  }
}

async function compensateFailedApply(plan) {
  await restoreBoundSource(plan.binding);
  await disableRunTarget(plan.plannedMemberships.map((entry) => entry.membershipId));
}

async function setMembershipStatus(tenantId, membershipIds, status, failureCode) {
  if (membershipIds.length === 0) return;
  expectNoError(
    await admin.from("tenant_memberships")
      .update({ status, disabled_at: status === "active" ? null : new Date().toISOString() })
      .eq("tenant_id", tenantId).in("id", membershipIds)
      .eq("status", status === "active" ? "disabled" : "active"),
    failureCode,
  );
}

async function readMembershipSet(tenantId, membershipIds) {
  return expectNoError(
    await admin.from("tenant_memberships").select("id, status")
      .eq("tenant_id", tenantId).in("id", membershipIds),
    "CLEAN_WORKSPACE_RECOVERY_VERIFICATION_FAILED",
  );
}

async function verifyActiveMembershipSet(tenantId, membershipIds) {
  const rows = await readMembershipSet(tenantId, membershipIds);
  if (rows.length !== membershipIds.length || rows.some((row) => row.status !== "active")) {
    throw new Error("CLEAN_WORKSPACE_RECOVERY_VERIFICATION_FAILED");
  }
}

async function restoreBoundSource(binding) {
  await validateBindingIdentity(binding);
  await setMembershipStatus(binding.sourceTenantId, binding.sourceMembershipIds,
    "active", "CLEAN_WORKSPACE_SOURCE_RESTORE_FAILED");
  await verifyActiveMembershipSet(binding.sourceTenantId, binding.sourceMembershipIds);
}

async function disableRunTarget(membershipIds) {
  await setMembershipStatus(cleanTenantId, membershipIds,
    "disabled", "CLEAN_WORKSPACE_CLEAN_DISABLE_FAILED");
  const rows = await readMembershipSet(cleanTenantId, membershipIds);
  if (rows.some((row) => row.status !== "disabled")) {
    throw new Error("CLEAN_WORKSPACE_RECOVERY_VERIFICATION_FAILED");
  }
}

async function recoverRollbackTarget(binding, sourceBefore, targetBefore) {
  // Source-first restore creates a temporary dual-active interval. Only undo
  // that restore after recovering/verifying the previously active target set.
  // If that cannot be proven, retain the source and require operator recovery.
  if (targetBefore.length !== sourceBefore.length || targetBefore.some((row) => row.status !== "active")) {
    throw new Error("CLEAN_WORKSPACE_RECOVERY_VERIFICATION_FAILED");
  }
  const targetIds = targetBefore.map((row) => row.id);
  await setMembershipStatus(cleanTenantId, targetIds,
    "active", "CLEAN_WORKSPACE_TARGET_RESTORE_FAILED");
  await verifyActiveMembershipSet(cleanTenantId, targetIds);
  const restoredIds = sourceBefore.filter((row) => row.status === "disabled").map((row) => row.id);
  await setMembershipStatus(binding.sourceTenantId, restoredIds,
    "disabled", "CLEAN_WORKSPACE_SOURCE_REQUARANTINE_FAILED");
  const sourceAfter = await readMembershipSet(binding.sourceTenantId, binding.sourceMembershipIds);
  if (sourceAfter.length !== sourceBefore.length || sourceAfter.some((row) =>
    row.status !== sourceBefore.find((before) => before.id === row.id)?.status)) {
    throw new Error("CLEAN_WORKSPACE_RECOVERY_VERIFICATION_FAILED");
  }
}

async function runRollback() {
  const binding = await loadBinding();
  if (!binding) {
    throw new Error("CLEAN_WORKSPACE_BINDING_REQUIRED_FOR_ROLLBACK");
  }
  const sourceBefore = await validateBindingIdentity(binding);
  const targetIds = sourceBefore.map((row) => membershipIdFor(runId, row.auth_user_id));
  const targetBefore = await readMembershipSet(cleanTenantId, targetIds);
  try {
    await restoreBoundSource(binding);
    await disableRunTarget(targetIds);
  } catch (error) {
    try {
      await recoverRollbackTarget(binding, sourceBefore, targetBefore);
    } catch {
      throw new Error("CLEAN_WORKSPACE_RECOVERY_INCOMPLETE:ROLLBACK");
    }
    throw error;
  }

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
        reason: `run_id=${runId};restored_bound_source`,
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

  // Source reporting resolves the binding when present (the only trustworthy
  // identity after apply); pre-apply status falls back to fresh discovery.
  const binding = await loadBinding();
  let sourceReport;
  if (binding) {
    const rows = await validateBindingIdentity(binding);
    const activeRecorded = rows.filter((row) => row.status === "active").length;
    const sourceAudit = await countExact(
      admin.from("audit_events").select("id", { count: "exact", head: true }).eq("tenant_id", binding.sourceTenantId),
    );
    const sourceLedger = await countExact(
      admin.from("package_ledger_entries").select("id", { count: "exact", head: true }).eq("tenant_id", binding.sourceTenantId),
    );
    sourceReport = {
      resolvedBy: "binding",
      boundSourceMembershipsActive: activeRecorded,
      auditRowsPreserved: sourceAudit,
      ledgerRowsPreserved: sourceLedger,
    };
  } else {
    const plan = await discoverSourcePlan();
    const sourceAudit = await countExact(
      admin.from("audit_events").select("id", { count: "exact", head: true }).eq("tenant_id", plan.sourceTenantId),
    );
    const sourceLedger = await countExact(
      admin.from("package_ledger_entries").select("id", { count: "exact", head: true }).eq("tenant_id", plan.sourceTenantId),
    );
    sourceReport = {
      resolvedBy: "discovery",
      boundSourceMembershipsActive: plan.plannedMemberships.length,
      auditRowsPreserved: sourceAudit,
      ledgerRowsPreserved: sourceLedger,
    };
  }

  const cleanAuditProvisioned = await countExact(
    admin.from("audit_events").select("id", { count: "exact", head: true }).eq("tenant_id", cleanTenantId).eq("action", CLEAN_WORKSPACE_PROVISIONED_ACTION),
  );
  const cleanAuditRolledBack = await countExact(
    admin.from("audit_events").select("id", { count: "exact", head: true }).eq("tenant_id", cleanTenantId).eq("action", CLEAN_WORKSPACE_ROLLBACK_ACTION),
  );
  const cleanAuditBinding = await countExact(
    admin.from("audit_events").select("id", { count: "exact", head: true }).eq("tenant_id", cleanTenantId).eq("action", CLEAN_WORKSPACE_SOURCE_BINDING_ACTION),
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
          sourceBinding: cleanAuditBinding,
          rolledBack: cleanAuditRolledBack,
        },
      },
      sourceQuarantine: sourceReport,
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

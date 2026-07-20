import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const mode = process.argv.find(
  (value) =>
    value === "--dry-run" || value === "--apply" || value === "--retire-empty",
);
if (!mode) throw new Error("HUMAN_TRIAL_MODE_REQUIRED");

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
if (
  !process.env.S015_UAT_SUPABASE_HOSTNAME &&
  process.env.S015_UAT_SUPABASE_URL
) {
  process.env.S015_UAT_SUPABASE_HOSTNAME = new URL(
    process.env.S015_UAT_SUPABASE_URL,
  ).hostname;
}

const required = (key) => {
  const value = process.env[key];
  if (!value) throw new Error(`HUMAN_TRIAL_INPUT_REQUIRED:${key}`);
  return value;
};

const targetCategory = required("S015_UAT_TARGET_CATEGORY").toLowerCase();
if (!new Set(["preview", "uat", "preview-uat"]).has(targetCategory)) {
  throw new Error("HUMAN_TRIAL_NON_UAT_TARGET_REFUSED");
}
if (
  mode === "--apply" &&
  process.env.S015_HUMAN_TRIAL_PREPARE_CONFIRM !== "1"
) {
  throw new Error("HUMAN_TRIAL_APPLY_CONFIRMATION_REQUIRED");
}
if (
  mode === "--retire-empty" &&
  process.env.S015_HUMAN_TRIAL_RETIRE_EMPTY_CONFIRM !== "1"
) {
  throw new Error("HUMAN_TRIAL_RETIRE_EMPTY_CONFIRMATION_REQUIRED");
}

const supabaseUrl = required("S015_UAT_SUPABASE_URL");
const supabaseTarget = new URL(supabaseUrl);
if (
  supabaseTarget.protocol !== "https:" ||
  supabaseTarget.hostname.toLowerCase() !==
    required("S015_UAT_SUPABASE_HOSTNAME").toLowerCase() ||
  !supabaseTarget.hostname.endsWith(".supabase.co")
) {
  throw new Error("HUMAN_TRIAL_SUPABASE_TARGET_REFUSED");
}

const publishableKey = required("S015_UAT_PUBLISHABLE_KEY");
const actorKeys = [
  "ADMIN",
  "ACCOUNT_MANAGER",
  "CONTENT_WRITER",
  "DESIGNER",
  "UNASSIGNED",
  "CLIENT_APPROVER",
  "CLIENT_VIEWER",
];
const actorEmails = Object.fromEntries(
  actorKeys.map((key) => [key, required(`S015_${key}_EMAIL`).toLowerCase()]),
);
const actorPasswords = Object.fromEntries(
  actorKeys.map((key) => [key, required(`S015_${key}_PASSWORD`)]),
);

const actors = {};
const actorSessions = {};
const actorRoles = {};
for (const key of actorKeys) {
  const client = createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const signIn = await client.auth.signInWithPassword({
    email: actorEmails[key],
    password: actorPasswords[key],
  });
  if (signIn.error || !signIn.data.user) {
    throw new Error(`HUMAN_TRIAL_SIGN_IN_FAILED:${key}`);
  }
  actors[key] = {
    id: signIn.data.user.id,
  };
  actorSessions[key] = client;

  const memberships = expectNoError(
    await client
      .from("tenant_memberships")
      .select("id, tenant_id")
      .eq("auth_user_id", signIn.data.user.id)
      .eq("status", "active"),
    `HUMAN_TRIAL_MEMBERSHIP_INVENTORY_FAILED:${key}`,
  );
  actorRoles[key] = expectNoError(
    await client
      .from("role_assignments")
      .select("tenant_id, membership_id, role_key, scope_type, scope_id")
      .in(
        "membership_id",
        memberships.map((membership) => membership.id),
      )
      .eq("status", "active"),
    `HUMAN_TRIAL_ROLE_INVENTORY_FAILED:${key}`,
  );
}

const roleFor = (key, accepted) => {
  const role = actorRoles[key].find((candidate) =>
    accepted.includes(candidate.role_key),
  );
  if (!role) throw new Error(`HUMAN_TRIAL_ROLE_MISSING:${key}`);
  return role;
};

const clientApproverRole = roleFor("CLIENT_APPROVER", ["client_approver"]);
if (clientApproverRole.scope_type !== "client")
  throw new Error("HUMAN_TRIAL_CLIENT_SCOPE_INVALID");
const tenantId = clientApproverRole.tenant_id;
const clientId = clientApproverRole.scope_id;

for (const [key, accepted] of [
  ["ACCOUNT_MANAGER", ["account_manager"]],
  ["CONTENT_WRITER", ["content_writer"]],
  ["DESIGNER", ["designer"]],
  ["CLIENT_VIEWER", ["client_viewer"]],
]) {
  const role = roleFor(key, accepted);
  if (
    role.tenant_id !== tenantId ||
    role.scope_type !== "client" ||
    role.scope_id !== clientId
  ) {
    throw new Error(`HUMAN_TRIAL_SCOPE_MISMATCH:${key}`);
  }
}
const managementRole = roleFor("ADMIN", [
  "tenant_owner",
  "tenant_administrator",
  "project_manager",
  "marketing_manager",
]);
if (managementRole.tenant_id !== tenantId)
  throw new Error("HUMAN_TRIAL_MANAGEMENT_SCOPE_MISMATCH");

const admin = actorSessions.ADMIN;

const clientResponse = await admin
  .from("clients")
  .select("id, name, slug")
  .eq("tenant_id", tenantId)
  .eq("id", clientId)
  .single();
const clientRecord = expectNoError(
  clientResponse,
  "HUMAN_TRIAL_CLIENT_MISSING",
);
if (!/glass|جلاس/i.test(`${clientRecord.name} ${clientRecord.slug}`)) {
  throw new Error("HUMAN_TRIAL_EXPECTED_GLASS_SCOPE");
}

const importedResponse = await admin
  .from("deliverables")
  .select(
    "id, status, current_version_id, type, import_run_id, source_metadata",
  )
  .eq("tenant_id", tenantId)
  .eq("client_id", clientId)
  .not("import_run_id", "is", null)
  .order("created_at", { ascending: true });
const importedRows = expectNoError(
  importedResponse,
  "HUMAN_TRIAL_IMPORT_INVENTORY_FAILED",
).filter(
  (row) =>
    row.source_metadata?.sourceKind === "workbook" &&
    row.source_metadata?.sheetCategory === "content_plan" &&
    row.type !== "marketing_coordination" &&
    row.current_version_id,
);
const discoveredRunIds = [
  ...new Set(importedRows.map((row) => row.import_run_id).filter(Boolean)),
];
const requestedRunId = process.env.S015_UAT_IMPORT_RUN_ID;
const importRunId =
  requestedRunId ??
  (discoveredRunIds.length === 1 ? discoveredRunIds[0] : undefined);
if (!importRunId || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{2,80}$/.test(importRunId)) {
  throw new Error("HUMAN_TRIAL_IMPORT_RUN_AMBIGUOUS");
}
const candidates = importedRows.filter(
  (row) => row.import_run_id === importRunId,
);
if (candidates.length < 1)
  throw new Error("HUMAN_TRIAL_CONTENT_CANDIDATE_MISSING");
const candidateVersions = expectNoError(
  await admin
    .from("deliverable_versions")
    .select("id, caption, content_body")
    .eq("tenant_id", tenantId)
    .eq("client_id", clientId)
    .in(
      "id",
      candidates.map((row) => row.current_version_id),
    ),
  "HUMAN_TRIAL_VERSION_CONTENT_INVENTORY_FAILED",
);
const contentVersionIds = new Set(
  candidateVersions
    .filter(
      (version) =>
        version.caption?.trim().length > 0 ||
        version.content_body?.trim().length > 0,
    )
    .map((version) => version.id),
);
const candidateFileAssets = expectNoError(
  await admin
    .from("file_assets")
    .select("version_id")
    .eq("tenant_id", tenantId)
    .eq("client_id", clientId)
    .eq("visibility", "client_visible")
    .gt("file_size", 0)
    .in(
      "version_id",
      candidates.map((row) => row.current_version_id),
    ),
  "HUMAN_TRIAL_REVIEW_FILE_INVENTORY_FAILED",
);
const reviewPayloadVersionIds = new Set([
  ...contentVersionIds,
  ...candidateFileAssets.map((file) => file.version_id),
]);

const requestedCount = Number(process.env.S015_HUMAN_TRIAL_ASSIGN_COUNT ?? 4);
if (
  !Number.isInteger(requestedCount) ||
  requestedCount < 1 ||
  requestedCount > 8
) {
  throw new Error("HUMAN_TRIAL_ASSIGN_COUNT_INVALID");
}
const selected = [...candidates]
  .sort(
    (left, right) =>
      Number(reviewPayloadVersionIds.has(right.current_version_id)) -
      Number(reviewPayloadVersionIds.has(left.current_version_id)),
  )
  .slice(0, requestedCount);
const alreadyPending = candidates.filter(
  (row) => row.status === "waiting_client_approval",
).length;
const emptyPending = candidates.filter(
  (row) =>
    row.status === "waiting_client_approval" &&
    !reviewPayloadVersionIds.has(row.current_version_id),
);

if (mode === "--dry-run") {
  console.log(
    JSON.stringify({
      status: "validated",
      category: "glass_human_trial_preparation",
      counts: {
        candidates: candidates.length,
        withCaptionOrBody: contentVersionIds.size,
        withReviewPayload: reviewPayloadVersionIds.size,
        selected: selected.length,
        alreadyPending,
        emptyPending: emptyPending.length,
      },
    }),
  );
  await signOutActors();
  process.exit(0);
}

if (mode === "--retire-empty") {
  const maintenanceClient = createClient(
    supabaseUrl,
    required("S015_UAT_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const retirement = await maintenanceClient.rpc(
    "s015_retire_empty_uat_review_items",
    {
      target_tenant_id: tenantId,
      target_client_id: clientId,
      target_run_id: importRunId,
    },
  );
  if (retirement.error) {
    throw new Error(
      `HUMAN_TRIAL_EMPTY_REVIEW_RETIREMENT_FAILED:${retirement.error.code ?? "unknown"}`,
    );
  }
  console.log(
    JSON.stringify({
      status: "retired",
      category: "glass_human_trial_empty_review",
      counts: { retired: retirement.data ?? 0 },
    }),
  );
  await signOutActors();
  process.exit(0);
}

if (emptyPending.length > 0) {
  throw new Error("HUMAN_TRIAL_EMPTY_PENDING_REQUIRES_REIMPORT");
}

const profiles = expectNoError(
  await admin
    .from("member_profiles")
    .select("user_id")
    .eq("tenant_id", tenantId)
    .in(
      "user_id",
      actorKeys.map((key) => actors[key].id),
    ),
  "HUMAN_TRIAL_PROFILE_INVENTORY_FAILED",
);
if (profiles.length !== actorKeys.length) {
  throw new Error("HUMAN_TRIAL_PROFILE_INVENTORY_INCOMPLETE");
}

const existingTasks = expectNoError(
  await admin
    .from("deliverable_tasks")
    .select("deliverable_id, assignee_user_id")
    .eq("tenant_id", tenantId)
    .eq("client_id", clientId)
    .in(
      "deliverable_id",
      selected.map((row) => row.id),
    ),
  "HUMAN_TRIAL_TASK_INVENTORY_FAILED",
);
const existingTaskAssignments = new Set(
  existingTasks.map(
    (task) => `${task.deliverable_id}:${task.assignee_user_id ?? "unassigned"}`,
  ),
);

for (const [index, deliverable] of selected.entries()) {
  const dueDate = normalizedDate(deliverable.source_metadata?.publishDay);
  const writerAssignment = `${deliverable.id}:${actors.CONTENT_WRITER.id}`;
  const designerAssignment = `${deliverable.id}:${actors.DESIGNER.id}`;
  if (!existingTaskAssignments.has(writerAssignment)) {
    await auditedRpc(
      admin,
      "s015_upsert_deliverable_task",
      {
        target_client_id: clientId,
        target_deliverable_id: deliverable.id,
        target_task_id: null,
        target_title: "إعداد المحتوى ومراجعته",
        target_description: "تنفيذ المحتوى وفق الخطة المعتمدة داخل مساحة جلاس.",
        target_status: "todo",
        target_priority: index === 0 ? "high" : "normal",
        target_assignee_user_id: actors.CONTENT_WRITER.id,
        target_due_date: dueDate,
        target_sort_order: index * 2,
        request_id: randomUUID(),
        audit_event_id: randomUUID(),
        request_idempotency_key: `human-trial-${importRunId}-${deliverable.id}-writer`,
      },
      "HUMAN_TRIAL_WRITER_ASSIGNMENT_FAILED",
    );
  }
  if (!existingTaskAssignments.has(designerAssignment)) {
    await auditedRpc(
      admin,
      "s015_upsert_deliverable_task",
      {
        target_client_id: clientId,
        target_deliverable_id: deliverable.id,
        target_task_id: null,
        target_title: "إعداد التصميم أو المعاينة",
        target_description:
          "تجهيز الأصل البصري وربطه بالنسخة قبل الإرسال للعميل.",
        target_status: "todo",
        target_priority: index === 0 ? "high" : "normal",
        target_assignee_user_id: actors.DESIGNER.id,
        target_due_date: dueDate,
        target_sort_order: index * 2 + 1,
        request_id: randomUUID(),
        audit_event_id: randomUUID(),
        request_idempotency_key: `human-trial-${importRunId}-${deliverable.id}-designer`,
      },
      "HUMAN_TRIAL_DESIGNER_ASSIGNMENT_FAILED",
    );
  }
}

const submittableStatuses = new Set([
  "not_started",
  "in_progress",
  "internal_changes_requested",
  "client_changes_requested",
]);
const trialDeliverable =
  selected.find(
    (row) =>
      reviewPayloadVersionIds.has(row.current_version_id) &&
      submittableStatuses.has(row.status),
  ) ?? selected[0];
let current = await readTrialDeliverable(trialDeliverable.id);
const version = await readTrialVersion(current);

if (submittableStatuses.has(current.status)) {
  await auditedRpc(
    admin,
    "s015_save_or_submit_version",
    {
      target_client_id: clientId,
      target_deliverable_id: current.id,
      target_version_id: version.id,
      target_version_number: version.version_number,
      target_submit: true,
      target_brief: version.brief ?? "",
      target_content_body: version.content_body ?? "",
      target_caption: version.caption ?? "",
      target_channel: version.channel ?? "",
      target_format: version.format ?? "",
      target_objective: version.objective ?? "",
      target_kpi: version.kpi ?? "",
      target_source_reference: version.source_reference ?? "",
      request_id: randomUUID(),
      audit_event_id: randomUUID(),
      request_idempotency_key: `human-trial-${importRunId}-${current.id}-submit`,
    },
    "HUMAN_TRIAL_VERSION_SUBMIT_FAILED",
  );
  current = await readTrialDeliverable(current.id);
}

if (current.status === "ready_for_internal_review") {
  await auditedRpc(
    admin,
    "s015_upsert_quality_check",
    {
      target_client_id: clientId,
      target_deliverable_id: current.id,
      target_version_id: version.id,
      target_check_id: stableUuid(`${importRunId}:${current.id}:quality`),
      target_label: "مراجعة المحتوى والهوية قبل العميل",
      target_status: "passed",
      target_note: "تمت المراجعة الداخلية ضمن تجهيز تجربة الفريق.",
      target_sort_order: 0,
      request_id: randomUUID(),
      audit_event_id: randomUUID(),
      request_idempotency_key: `human-trial-${importRunId}-${current.id}-quality`,
    },
    "HUMAN_TRIAL_QUALITY_FAILED",
  );
  await internalWorkflow({
    client: admin,
    deliverableId: current.id,
    versionId: version.id,
    runId: importRunId,
    command: "approve_internal",
  });
  current = await readTrialDeliverable(current.id);
}

if (current.status === "internally_approved") {
  await internalWorkflow({
    client: admin,
    deliverableId: current.id,
    versionId: version.id,
    runId: importRunId,
    command: "send_to_client",
  });
  current = await readTrialDeliverable(current.id);
}

if (current.status !== "waiting_client_approval") {
  throw new Error(`HUMAN_TRIAL_UNSUPPORTED_WORKFLOW_STATE:${current.status}`);
}
const resultResponse = await admin
  .from("deliverables")
  .select("id, status", { count: "exact" })
  .eq("tenant_id", tenantId)
  .eq("client_id", clientId)
  .eq("import_run_id", importRunId);
const resultRows = expectNoError(resultResponse, "HUMAN_TRIAL_RESULT_FAILED");
const taskCountResponse = await admin
  .from("deliverable_tasks")
  .select("id", { count: "exact", head: true })
  .eq("tenant_id", tenantId)
  .eq("client_id", clientId)
  .in(
    "deliverable_id",
    selected.map((row) => row.id),
  );
expectNoError(taskCountResponse, "HUMAN_TRIAL_TASK_RESULT_FAILED");
console.log(
  JSON.stringify({
    status: "prepared",
    category: "glass_human_trial_preparation",
    counts: {
      imported: resultRows.length,
      assignedDeliverables: selected.length,
      tasks: taskCountResponse.count ?? 0,
      pendingClientApproval: resultRows.filter(
        (row) => row.status === "waiting_client_approval",
      ).length,
      profiles: actorKeys.length,
    },
  }),
);
await signOutActors();

async function internalWorkflow({
  client,
  deliverableId,
  versionId,
  runId,
  command,
}) {
  return auditedRpc(
    client,
    "s015_execute_internal_workflow",
    {
      target_client_id: clientId,
      target_deliverable_id: deliverableId,
      target_version_id: versionId,
      target_command: command,
      target_version_number: null,
      command_comment: "تجهيز مادة ممثلة لتجربة الفريق والعميل.",
      request_id: randomUUID(),
      audit_event_id: randomUUID(),
      request_idempotency_key: `human-trial-${runId}-${deliverableId}-${command}`,
    },
    `HUMAN_TRIAL_WORKFLOW_FAILED:${command}`,
  );
}

async function readTrialDeliverable(deliverableId) {
  const deliverableResponse = await admin
    .from("deliverables")
    .select("id, status, current_version_id")
    .eq("tenant_id", tenantId)
    .eq("client_id", clientId)
    .eq("id", deliverableId)
    .single();
  return expectNoError(
    deliverableResponse,
    "HUMAN_TRIAL_CURRENT_DELIVERABLE_FAILED",
  );
}

async function readTrialVersion(deliverable) {
  const versionResponse = await admin
    .from("deliverable_versions")
    .select(
      "id, version_number, brief, content_body, caption, channel, format, objective, kpi, source_reference",
    )
    .eq("tenant_id", tenantId)
    .eq("client_id", clientId)
    .eq("deliverable_id", deliverable.id)
    .eq("id", deliverable.current_version_id)
    .single();
  return expectNoError(versionResponse, "HUMAN_TRIAL_VERSION_MISSING");
}

async function auditedRpc(client, name, input, errorCode) {
  const response = await client.rpc(name, input);
  if (response.error)
    throw new Error(
      `${errorCode}:${response.error.code ?? "unknown"}:${response.error.message ?? "unknown"}`,
    );
  return response.data;
}

function expectNoError(response, code) {
  if (response.error)
    throw new Error(`${code}:${response.error.code ?? "unknown"}`);
  return response.data;
}

async function signOutActors() {
  await Promise.all(
    Object.values(actorSessions).map((client) => client.auth.signOut()),
  );
}

function stableUuid(value) {
  const bytes = Buffer.from(
    createHash("sha256").update(value).digest().subarray(0, 16),
  );
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function normalizedDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : null;
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

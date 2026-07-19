import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const mode = process.argv.find(
  (value) => value === "--dry-run" || value === "--apply",
);
if (!mode) throw new Error("HUMAN_TRIAL_MODE_REQUIRED");

await loadSecureEnv(
  path.resolve(
    process.cwd(),
    process.env.S015_UAT_SECURE_ENV_FILE ?? ".env.s015-team-uat.local",
  ),
);

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

const service = createClient(
  supabaseUrl,
  required("S015_UAT_SERVICE_ROLE_KEY"),
  {
    auth: { autoRefreshToken: false, persistSession: false },
  },
);
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

const usersResponse = await service.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});
expectNoError(usersResponse, "HUMAN_TRIAL_AUTH_INVENTORY_FAILED");
const actors = Object.fromEntries(
  actorKeys.map((key) => {
    const user = usersResponse.data.users.find(
      (candidate) => candidate.email?.toLowerCase() === actorEmails[key],
    );
    if (!user) throw new Error(`HUMAN_TRIAL_ACTOR_MISSING:${key}`);
    return [
      key,
      { id: user.id, email: actorEmails[key], password: actorPasswords[key] },
    ];
  }),
);

const memberships = expectNoError(
  await service
    .from("tenant_memberships")
    .select("id, tenant_id, auth_user_id")
    .in(
      "auth_user_id",
      actorKeys.map((key) => actors[key].id),
    )
    .eq("status", "active"),
  "HUMAN_TRIAL_MEMBERSHIP_INVENTORY_FAILED",
);
const roles = expectNoError(
  await service
    .from("role_assignments")
    .select("tenant_id, membership_id, role_key, scope_type, scope_id")
    .in(
      "membership_id",
      memberships.map((membership) => membership.id),
    )
    .eq("status", "active"),
  "HUMAN_TRIAL_ROLE_INVENTORY_FAILED",
);

const roleFor = (key, accepted) => {
  const membershipIds = memberships
    .filter((membership) => membership.auth_user_id === actors[key].id)
    .map((membership) => membership.id);
  const role = roles.find(
    (candidate) =>
      membershipIds.includes(candidate.membership_id) &&
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

const clientResponse = await service
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

const importedResponse = await service
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

const requestedCount = Number(process.env.S015_HUMAN_TRIAL_ASSIGN_COUNT ?? 4);
if (
  !Number.isInteger(requestedCount) ||
  requestedCount < 1 ||
  requestedCount > 8
) {
  throw new Error("HUMAN_TRIAL_ASSIGN_COUNT_INVALID");
}
const selected = candidates.slice(0, requestedCount);
const alreadyPending = candidates.filter(
  (row) => row.status === "waiting_client_approval",
).length;

if (mode === "--dry-run") {
  console.log(
    JSON.stringify({
      status: "validated",
      category: "glass_human_trial_preparation",
      counts: {
        candidates: candidates.length,
        selected: selected.length,
        alreadyPending,
      },
    }),
  );
  process.exit(0);
}

const profilePresentation = {
  ADMIN: ["إدارة سماوة", "إدارة"],
  ACCOUNT_MANAGER: ["مدير حساب جلاس", "مدير حساب"],
  CONTENT_WRITER: ["كاتب محتوى جلاس", "كاتب محتوى"],
  DESIGNER: ["مصمم جلاس", "مصمم"],
  UNASSIGNED: ["عضو فريق غير مسند", "فريق سماوة"],
  CLIENT_APPROVER: ["معتمد جلاس", "معتمد العميل"],
  CLIENT_VIEWER: ["مشاهد جلاس", "مشاهد العميل"],
};
expectNoError(
  await service.from("member_profiles").upsert(
    actorKeys.map((key) => ({
      tenant_id: tenantId,
      user_id: actors[key].id,
      display_name: profilePresentation[key][0],
      role_label: profilePresentation[key][1],
      avatar_url: null,
      sync_run_id: "s015-human-trial-presentation-v1",
      updated_at: new Date().toISOString(),
    })),
    { onConflict: "tenant_id,user_id" },
  ),
  "HUMAN_TRIAL_PROFILE_REPAIR_FAILED",
);

const admin = await actorClient("ADMIN");
const writer = await actorClient("CONTENT_WRITER");
try {
  for (const [index, deliverable] of selected.entries()) {
    const dueDate = normalizedDate(deliverable.source_metadata?.publishDay);
    await auditedRpc(
      admin,
      "s015_upsert_deliverable_task",
      {
        target_client_id: clientId,
        target_deliverable_id: deliverable.id,
        target_task_id: stableUuid(
          `${importRunId}:${deliverable.id}:writer-task`,
        ),
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
    await auditedRpc(
      admin,
      "s015_upsert_deliverable_task",
      {
        target_client_id: clientId,
        target_deliverable_id: deliverable.id,
        target_task_id: stableUuid(
          `${importRunId}:${deliverable.id}:designer-task`,
        ),
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

  const trialDeliverable =
    selected.find((row) => row.status === "not_started") ?? selected[0];
  let current = await readTrialDeliverable(trialDeliverable.id);
  const version = await readTrialVersion(current);

  if (current.status === "not_started") {
    await auditedRpc(
      writer,
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
      command: "send_client",
    });
    current = await readTrialDeliverable(current.id);
  }

  if (current.status !== "waiting_client_approval") {
    throw new Error(`HUMAN_TRIAL_UNSUPPORTED_WORKFLOW_STATE:${current.status}`);
  }
} finally {
  await Promise.all([admin.auth.signOut(), writer.auth.signOut()]);
}

const resultResponse = await service
  .from("deliverables")
  .select("id, status", { count: "exact" })
  .eq("tenant_id", tenantId)
  .eq("client_id", clientId)
  .eq("import_run_id", importRunId);
const resultRows = expectNoError(resultResponse, "HUMAN_TRIAL_RESULT_FAILED");
const taskCountResponse = await service
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

async function actorClient(key) {
  const client = createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const signIn = await client.auth.signInWithPassword({
    email: actors[key].email,
    password: actors[key].password,
  });
  if (signIn.error) throw new Error(`HUMAN_TRIAL_SIGN_IN_FAILED:${key}`);
  return client;
}

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
  const deliverableResponse = await service
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
  const versionResponse = await service
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
    throw new Error(`${errorCode}:${response.error.code ?? "unknown"}`);
  return response.data;
}

function expectNoError(response, code) {
  if (response.error)
    throw new Error(`${code}:${response.error.code ?? "unknown"}`);
  return response.data;
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

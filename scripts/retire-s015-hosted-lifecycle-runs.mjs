import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const mode = process.argv.find((value) =>
  ["--dry-run", "--apply"].includes(value),
);

const required = (key) => {
  const value = process.env[key];
  if (!value) throw new Error(`HOSTED_LIFECYCLE_RETIRE_REQUIRES_${key}`);
  return value;
};

if (!mode) {
  throw new Error("HOSTED_LIFECYCLE_RETIRE_MODE_REQUIRED");
}

const supabaseUrl = required("S015_UAT_SUPABASE_URL");
const allowedHostname = required("S015_UAT_SUPABASE_HOSTNAME").toLowerCase();
const target = new URL(supabaseUrl);
if (
  target.protocol !== "https:" ||
  target.hostname.toLowerCase() !== allowedHostname ||
  !allowedHostname.endsWith(".supabase.co")
) {
  throw new Error("HOSTED_LIFECYCLE_RETIRE_TARGET_DENIED");
}

const runIds = required("S015_UAT_LIFECYCLE_RETIRE_RUN_IDS")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const runIdPattern = /^s015-hosted-lifecycle-[a-f0-9]{10}$/;
if (
  runIds.length === 0 ||
  runIds.length > 10 ||
  new Set(runIds).size !== runIds.length ||
  runIds.some((runId) => !runIdPattern.test(runId))
) {
  throw new Error("HOSTED_LIFECYCLE_RETIRE_RUN_IDS_INVALID");
}

const serviceClient = createClient(
  supabaseUrl,
  required("S015_UAT_SERVICE_ROLE_KEY"),
  { auth: { autoRefreshToken: false, persistSession: false } },
);
const publishableKey = required("S015_UAT_PUBLISHABLE_KEY");

const safeData = (response, label) => {
  if (response.error) {
    throw new Error(
      `${label}_FAILED:${response.error.code ?? "unknown"}`,
    );
  }
  return response.data;
};

const readInventory = async () => {
  const rows = safeData(
    await serviceClient
      .from("deliverables")
      .select(
        "id, tenant_id, client_id, current_version_id, status, import_run_id",
      )
      .in("import_run_id", runIds),
    "HOSTED_LIFECYCLE_RETIRE_INVENTORY",
  );
  if (rows.length !== runIds.length) {
    throw new Error("HOSTED_LIFECYCLE_RETIRE_INVENTORY_MISMATCH");
  }

  const byRunId = new Map(rows.map((row) => [row.import_run_id, row]));
  return runIds.map((runId) => byRunId.get(runId));
};

const allowedStatuses = new Set([
  "not_started",
  "in_progress",
  "ready_for_internal_review",
  "internal_changes_requested",
  "waiting_client_approval",
  "client_changes_requested",
  "cancelled",
]);

const initialInventory = await readInventory();
if (initialInventory.some((row) => !row || !allowedStatuses.has(row.status))) {
  throw new Error("HOSTED_LIFECYCLE_RETIRE_STATUS_DENIED");
}
if (
  new Set(initialInventory.map((row) => row.tenant_id)).size !== 1 ||
  new Set(initialInventory.map((row) => row.client_id)).size !== 1
) {
  throw new Error("HOSTED_LIFECYCLE_RETIRE_SCOPE_MISMATCH");
}

const statusCounts = (rows) =>
  Object.fromEntries(
    Array.from(new Set(rows.map((row) => row.status)))
      .sort()
      .map((status) => [
        status,
        rows.filter((row) => row.status === status).length,
      ]),
  );

if (mode === "--dry-run") {
  console.log(
    JSON.stringify({
      status: "validated",
      category: "hosted_lifecycle_retirement",
      count: initialInventory.length,
      statusCounts: statusCounts(initialInventory),
      wouldMutate: initialInventory.some((row) => row.status !== "cancelled"),
    }),
  );
} else {
  if (
    process.env.S015_TARGET_CATEGORY !== "uat" ||
    process.env.S015_UAT_CONFIRM_NON_PRODUCTION !== "1"
  ) {
    throw new Error("HOSTED_LIFECYCLE_RETIRE_NON_PRODUCTION_CONFIRMATION_REQUIRED");
  }

const createActorClient = async (emailKey, passwordKey, label) => {
  const client = createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const signIn = await client.auth.signInWithPassword({
    email: required(emailKey),
    password: required(passwordKey),
  });
  if (signIn.error) {
    throw new Error(`${label}_SIGN_IN_FAILED`);
  }
  return client;
};

const adminClient = await createActorClient(
  "S015_ADMIN_EMAIL",
  "S015_ADMIN_PASSWORD",
  "HOSTED_LIFECYCLE_RETIRE_ADMIN",
);
const approverClient = await createActorClient(
  "S015_CLIENT_APPROVER_EMAIL",
  "S015_CLIENT_APPROVER_PASSWORD",
  "HOSTED_LIFECYCLE_RETIRE_APPROVER",
);

const refreshRun = async (runId) => {
  const rows = safeData(
    await serviceClient
      .from("deliverables")
      .select(
        "id, tenant_id, client_id, current_version_id, status, import_run_id",
      )
      .eq("import_run_id", runId),
    "HOSTED_LIFECYCLE_RETIRE_REFRESH",
  );
  if (rows.length !== 1) {
    throw new Error("HOSTED_LIFECYCLE_RETIRE_REFRESH_MISMATCH");
  }
  return rows[0];
};

const runRpc = async (client, name, args, label) => {
  const response = await client.rpc(name, args);
  safeData(response, label);
};

let retired = 0;
let alreadyRetired = 0;

try {
  for (const initial of initialInventory) {
    let row = initial;
    const runId = row.import_run_id;
    if (row.status === "cancelled") {
      alreadyRetired += 1;
      continue;
    }

    if (row.status === "ready_for_internal_review") {
      if (!row.current_version_id) {
        throw new Error("HOSTED_LIFECYCLE_RETIRE_CURRENT_VERSION_REQUIRED");
      }
      await runRpc(
        adminClient,
        "s015_execute_internal_workflow",
        {
          target_client_id: row.client_id,
          target_deliverable_id: row.id,
          target_version_id: row.current_version_id,
          target_command: "request_internal_changes",
          target_version_number: null,
          command_comment: "Retire failed synthetic hosted UAT lifecycle run.",
          request_id: crypto.randomUUID(),
          audit_event_id: crypto.randomUUID(),
          request_idempotency_key: `${runId}-retire-internal`,
        },
        "HOSTED_LIFECYCLE_RETIRE_INTERNAL_CHANGES",
      );
      row = await refreshRun(runId);
    }

    if (row.status === "waiting_client_approval") {
      if (!row.current_version_id) {
        throw new Error("HOSTED_LIFECYCLE_RETIRE_CURRENT_VERSION_REQUIRED");
      }
      await runRpc(
        approverClient,
        "s015_client_decide_version",
        {
          target_client_id: row.client_id,
          target_deliverable_id: row.id,
          target_version_id: row.current_version_id,
          target_decision: "changes_requested",
          decision_comment: "Retire failed synthetic hosted UAT lifecycle run.",
          request_id: crypto.randomUUID(),
          audit_event_id: crypto.randomUUID(),
          request_idempotency_key: `${runId}-retire-client`,
        },
        "HOSTED_LIFECYCLE_RETIRE_CLIENT_CHANGES",
      );
      row = await refreshRun(runId);
    }

    if (
      row.status === "internal_changes_requested" ||
      row.status === "client_changes_requested"
    ) {
      await runRpc(
        adminClient,
        "f004_update_deliverable_status",
        {
          target_deliverable_id: row.id,
          audit_event_id: crypto.randomUUID(),
          target_client_id: row.client_id,
          target_status: "in_progress",
          expected_revision: null,
          transition_reason: "Retire failed synthetic hosted UAT lifecycle run.",
          idempotency_key: `${runId}-retire-progress`,
        },
        "HOSTED_LIFECYCLE_RETIRE_TO_PROGRESS",
      );
      row = await refreshRun(runId);
    }

    if (row.status === "in_progress") {
      await runRpc(
        adminClient,
        "f004_update_deliverable_status",
        {
          target_deliverable_id: row.id,
          audit_event_id: crypto.randomUUID(),
          target_client_id: row.client_id,
          target_status: "not_started",
          expected_revision: null,
          transition_reason: "Retire failed synthetic hosted UAT lifecycle run.",
          idempotency_key: `${runId}-retire-not-started`,
        },
        "HOSTED_LIFECYCLE_RETIRE_TO_NOT_STARTED",
      );
      row = await refreshRun(runId);
    }

    if (row.status !== "not_started") {
      throw new Error("HOSTED_LIFECYCLE_RETIRE_UNSUPPORTED_FORWARD_PATH");
    }

    await runRpc(
      adminClient,
      "f002_cancel_not_started_deliverable",
      {
        target_deliverable_id: row.id,
        release_ledger_entry_id: crypto.randomUUID(),
        audit_event_id: crypto.randomUUID(),
        target_client_id: row.client_id,
        cancellation_reason: "Retire failed synthetic hosted UAT lifecycle run.",
        expected_status: "not_started",
        expected_revision: null,
        idempotency_key: `${runId}-retire-cancel`,
      },
      "HOSTED_LIFECYCLE_RETIRE_CANCEL",
    );
    row = await refreshRun(runId);
    if (row.status !== "cancelled") {
      throw new Error("HOSTED_LIFECYCLE_RETIRE_CANCEL_NOT_PERSISTED");
    }
    retired += 1;
  }

  const finalInventory = await readInventory();
  if (finalInventory.some((row) => row.status !== "cancelled")) {
    throw new Error("HOSTED_LIFECYCLE_RETIRE_FINAL_STATUS_MISMATCH");
  }
  const allocationRows = safeData(
    await serviceClient
      .from("deliverable_allocations")
      .select("deliverable_id, status")
      .in(
        "deliverable_id",
        finalInventory.map((row) => row.id),
      ),
    "HOSTED_LIFECYCLE_RETIRE_ALLOCATION_VERIFY",
  );
  if (
    allocationRows.length !== finalInventory.length ||
    allocationRows.some((allocation) => allocation.status !== "released")
  ) {
    throw new Error("HOSTED_LIFECYCLE_RETIRE_ALLOCATION_NOT_RELEASED");
  }

  console.log(
    JSON.stringify({
      status: retired > 0 ? "retired" : "no_op",
      category: "hosted_lifecycle_retirement",
      count: finalInventory.length,
      retired,
      alreadyRetired,
      finalStatus: "cancelled",
      allocationStatus: "released",
    }),
  );
} finally {
  await Promise.all([
    adminClient.auth.signOut(),
    approverClient.auth.signOut(),
  ]);
}
}

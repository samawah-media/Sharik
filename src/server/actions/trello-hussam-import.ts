"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  activeHussamTrelloCards,
  buildTrelloCardImportPlans,
  HUSSAM_TRELLO_BOARD_ID,
  HUSSAM_TRELLO_BOARD_SHORT_ID,
  HUSSAM_TRELLO_CONFIRMATION,
  HUSSAM_TRELLO_EXPECTED_ACTIVE_CARDS,
  HUSSAM_TRELLO_TARGET_CLIENT_ID,
  isHussamTrelloImportAdministrator,
  trelloDueDate,
  trelloHussamBoardSchema,
  trelloTaskIdempotencyKey,
  trelloVersionIdempotencyKey,
  type ExistingDeliverableIdentity,
  type TrelloCardImportPlan,
} from "@/modules/imports/trello-hussam";
import { projectPackageBalance } from "@/modules/packages/package-ledger";
import { resolveRuntimeContext } from "@/server/auth/runtime-context";
import { createDeliverableViaRpc } from "./deliverable-write-rpc";

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export type PackageOption = {
  packageId: string;
  packageName: string;
  contractId: string;
  lineId: string;
  serviceLabel: string;
  unitLabel: string;
  available: number;
};

export type HussamTrelloImportPreview = {
  boardName: string;
  activeCardCount: number;
  readyCount: number;
  alreadyImportedCount: number;
  incompleteImportCount: number;
  exactDuplicateCount: number;
  scopeConflictCount: number;
  taskCount: number;
  cards: TrelloCardImportPlan[];
  packageOptions: PackageOption[];
};

export type HussamTrelloImportState = {
  status: "idle" | "error" | "success";
  message?: string;
  createdCount?: number;
  repairedCount?: number;
  duplicateCount?: number;
  processedCount?: number;
  remainingCount?: number;
};

type ImportContext = {
  supabase: Supabase;
  tenantId: string;
};

const importConfirmationSchema = z.object({
  packageLineId: z.string().uuid(),
  confirmation: z.literal(HUSSAM_TRELLO_CONFIRMATION),
  confirmed: z.literal("yes"),
});

const IMPORT_BATCH_SIZE = 10;
const MAX_TRELLO_RESPONSE_BYTES = 5_000_000;

const toNumber = (value: number | string) =>
  typeof value === "number" ? value : Number(value);

async function authorizedImportContext(): Promise<ImportContext | undefined> {
  const supabase = await createSupabaseServerClient();
  const runtime = await resolveRuntimeContext(supabase);
  if (!runtime.ok) return undefined;

  const isAdministrator = isHussamTrelloImportAdministrator({
    tenantId: runtime.actor.tenantId,
    roleAssignments: runtime.actor.roleAssignments,
  });
  const targetClient = runtime.clients.find(
    (client) =>
      client.id === HUSSAM_TRELLO_TARGET_CLIENT_ID &&
      client.tenantId === runtime.actor.tenantId &&
      client.status === "active",
  );
  return isAdministrator && targetClient
    ? { supabase, tenantId: runtime.actor.tenantId }
    : undefined;
}

async function fetchHussamTrelloBoard() {
  const response = await fetch(
    `https://trello.com/b/${HUSSAM_TRELLO_BOARD_SHORT_ID}.json`,
    {
      cache: "no-store",
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    },
  );
  if (!response.ok) throw new Error("TRELLO_BOARD_UNAVAILABLE");
  const declaredLength = Number(response.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_TRELLO_RESPONSE_BYTES) {
    throw new Error("TRELLO_BOARD_TOO_LARGE");
  }
  const payload = await response.text();
  if (Buffer.byteLength(payload, "utf8") > MAX_TRELLO_RESPONSE_BYTES) {
    throw new Error("TRELLO_BOARD_TOO_LARGE");
  }
  const board = trelloHussamBoardSchema.parse(JSON.parse(payload));
  if (board.id !== HUSSAM_TRELLO_BOARD_ID) {
    throw new Error("TRELLO_BOARD_ID_MISMATCH");
  }
  return board;
}

async function listPackageOptions(
  supabase: Supabase,
  tenantId: string,
): Promise<PackageOption[]> {
  const packagesResponse = await supabase
    .from("packages")
    .select("id, contract_id, name")
    .eq("tenant_id", tenantId)
    .eq("client_id", HUSSAM_TRELLO_TARGET_CLIENT_ID)
    .eq("status", "active")
    .order("created_at", { ascending: false });
  if (packagesResponse.error || !packagesResponse.data?.length) return [];

  const packageIds = packagesResponse.data.map((pkg) => pkg.id);
  const [linesResponse, ledgerResponse] = await Promise.all([
    supabase
      .from("package_lines")
      .select("id, package_id, service_label, unit_label")
      .eq("tenant_id", tenantId)
      .eq("client_id", HUSSAM_TRELLO_TARGET_CLIENT_ID)
      .eq("status", "active")
      .in("package_id", packageIds),
    supabase
      .from("package_ledger_entries")
      .select(
        "id, client_id, package_line_id, entry_type, quantity, deliverable_id, reason, occurred_at",
      )
      .eq("tenant_id", tenantId)
      .eq("client_id", HUSSAM_TRELLO_TARGET_CLIENT_ID)
      .in("package_id", packageIds),
  ]);
  if (linesResponse.error || ledgerResponse.error) return [];

  const packagesById = new Map(
    packagesResponse.data.map((pkg) => [pkg.id, pkg]),
  );
  return (linesResponse.data ?? []).flatMap((line) => {
    const pkg = packagesById.get(line.package_id);
    if (!pkg) return [];
    const balance = projectPackageBalance(
      (ledgerResponse.data ?? [])
        .filter((entry) => entry.package_line_id === line.id)
        .map((entry) => ({
          id: entry.id,
          tenantId,
          clientId: entry.client_id,
          packageLineId: entry.package_line_id,
          entryType: entry.entry_type,
          quantity: toNumber(entry.quantity),
          deliverableId: entry.deliverable_id ?? undefined,
          reason: entry.reason ?? undefined,
          occurredAt: entry.occurred_at,
        })),
    );
    return [
      {
        packageId: pkg.id,
        packageName: pkg.name,
        contractId: pkg.contract_id,
        lineId: line.id,
        serviceLabel: line.service_label,
        unitLabel: line.unit_label,
        available: balance.available,
      },
    ];
  });
}

async function listExistingDeliverables(
  supabase: Supabase,
  tenantId: string,
  plans: { card: { name: string }; idempotencyKey: string }[],
): Promise<ExistingDeliverableIdentity[]> {
  const keys = plans.map((plan) => plan.idempotencyKey);
  const names = plans.map((plan) => plan.card.name);
  const [keyMatches, titleMatches] = await Promise.all([
    supabase
      .from("deliverables")
      .select("id, client_id, name, idempotency_key, current_version_id")
      .eq("tenant_id", tenantId)
      .in("idempotency_key", keys),
    supabase
      .from("deliverables")
      .select("id, client_id, name, idempotency_key, current_version_id")
      .eq("tenant_id", tenantId)
      .eq("client_id", HUSSAM_TRELLO_TARGET_CLIENT_ID)
      .in("name", names),
  ]);
  if (keyMatches.error || titleMatches.error) {
    throw new Error("IMPORT_PREFLIGHT_UNAVAILABLE");
  }

  const rows = [...(keyMatches.data ?? []), ...(titleMatches.data ?? [])];
  return [...new Map(rows.map((row) => [row.id, row])).values()].map((row) => ({
    id: row.id,
    clientId: row.client_id,
    name: row.name,
    idempotencyKey: row.idempotency_key ?? undefined,
    currentVersionId: row.current_version_id ?? undefined,
  }));
}

async function buildImportPreview(context: ImportContext) {
  const [board, packageOptions] = await Promise.all([
    fetchHussamTrelloBoard(),
    listPackageOptions(context.supabase, context.tenantId),
  ]);
  const cards = activeHussamTrelloCards(board);
  const initialPlans = buildTrelloCardImportPlans({
    cards,
    existingDeliverables: [],
  });
  const existingDeliverables = await listExistingDeliverables(
    context.supabase,
    context.tenantId,
    initialPlans,
  );
  const plans = buildTrelloCardImportPlans({ cards, existingDeliverables });
  return { board, plans, packageOptions };
}

export async function loadHussamTrelloImportPreview(): Promise<
  | { ok: true; preview: HussamTrelloImportPreview }
  | { ok: false; reason: "denied" | "unavailable" }
> {
  const context = await authorizedImportContext();
  if (!context) return { ok: false, reason: "denied" };
  try {
    const { board, plans, packageOptions } = await buildImportPreview(context);
    return {
      ok: true,
      preview: {
        boardName: board.name,
        activeCardCount: plans.length,
        readyCount: plans.filter((plan) => plan.state === "ready").length,
        alreadyImportedCount: plans.filter(
          (plan) => plan.state === "already_imported",
        ).length,
        incompleteImportCount: plans.filter(
          (plan) => plan.state === "incomplete_import",
        ).length,
        exactDuplicateCount: plans.filter(
          (plan) => plan.state === "exact_duplicate",
        ).length,
        scopeConflictCount: plans.filter(
          (plan) => plan.state === "scope_conflict",
        ).length,
        taskCount: plans.reduce((count, plan) => count + plan.tasks.length, 0),
        cards: plans,
        packageOptions,
      },
    };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

async function saveDraftVersion(
  supabase: Supabase,
  plan: TrelloCardImportPlan,
  deliverableId: string,
) {
  const deliverableResponse = await supabase
    .from("deliverables")
    .select("current_version_id")
    .eq("client_id", HUSSAM_TRELLO_TARGET_CLIENT_ID)
    .eq("id", deliverableId)
    .single();
  if (deliverableResponse.error) throw new Error("DELIVERABLE_READ_FAILED");

  let versionId = deliverableResponse.data.current_version_id;
  const versionNumber = 1;
  if (versionId) {
    // A concurrent/retried import may already have created the draft. Never
    // overwrite a current version that a human could have started editing.
    return;
  } else {
    versionId = crypto.randomUUID();
  }

  const { error } = await supabase.rpc("s015_save_or_submit_version", {
    target_client_id: HUSSAM_TRELLO_TARGET_CLIENT_ID,
    target_deliverable_id: deliverableId,
    target_version_id: versionId,
    target_version_number: versionNumber,
    target_submit: false,
    target_brief: plan.card.listName,
    target_content_body: plan.card.desc,
    target_caption: "",
    target_channel: "",
    target_format: "post",
    target_objective: "",
    target_kpi: "",
    target_source_reference: plan.card.shortUrl,
    request_id: crypto.randomUUID(),
    audit_event_id: crypto.randomUUID(),
    request_idempotency_key: trelloVersionIdempotencyKey(plan.card.id),
  });
  if (error) throw new Error("VERSION_SAVE_FAILED");
}

async function saveActionTasks(
  supabase: Supabase,
  plan: TrelloCardImportPlan,
  deliverableId: string,
) {
  for (const [sortOrder, task] of plan.tasks.entries()) {
    const { error } = await supabase.rpc("s015_upsert_deliverable_task", {
      target_client_id: HUSSAM_TRELLO_TARGET_CLIENT_ID,
      target_deliverable_id: deliverableId,
      target_task_id: null,
      target_title: task.title,
      target_description: `من وسم Trello: ${task.sourceLabel}`,
      target_status: "todo",
      target_priority: "normal",
      target_assignee_user_id: null,
      target_due_date: trelloDueDate(plan.card.due),
      target_sort_order: sortOrder,
      request_id: crypto.randomUUID(),
      audit_event_id: crypto.randomUUID(),
      request_idempotency_key: trelloTaskIdempotencyKey(plan.card.id, task.key),
    });
    if (error) throw new Error("TASK_SAVE_FAILED");
  }
}

async function importCard(
  context: ImportContext,
  option: PackageOption,
  plan: TrelloCardImportPlan,
) {
  const created = await createDeliverableViaRpc({
    supabase: context.supabase,
    input: {
      deliverableId: crypto.randomUUID(),
      allocationId: crypto.randomUUID(),
      ledgerEntryId: crypto.randomUUID(),
      auditEventId: crypto.randomUUID(),
      clientId: HUSSAM_TRELLO_TARGET_CLIENT_ID,
      contractId: option.contractId,
      packageId: option.packageId,
      packageLineId: option.lineId,
      name: plan.card.name,
      description: plan.card.desc.slice(0, 1_000) || null,
      type: "post",
      priority: "normal",
      ownerUserId: null,
      contributorUserIds: [],
      startDate: null,
      internalDueDate: null,
      clientDueDate: trelloDueDate(plan.card.due),
      finalDueDate: null,
      requiresInternalApproval: true,
      requiresClientApproval: true,
      reservedQuantity: 1,
      idempotencyKey: plan.idempotencyKey,
    },
  });
  if (!created.ok) throw new Error("DELIVERABLE_CREATE_FAILED");
  if (
    created.value.clientId !== HUSSAM_TRELLO_TARGET_CLIENT_ID ||
    created.value.contractId !== option.contractId ||
    created.value.packageId !== option.packageId ||
    created.value.packageLineId !== option.lineId
  ) {
    throw new Error("DELIVERABLE_SCOPE_MISMATCH");
  }
  await saveActionTasks(context.supabase, plan, created.value.id);
  await saveDraftVersion(context.supabase, plan, created.value.id);
}

export async function importHussamTrelloAction(
  _previousState: HussamTrelloImportState,
  formData: FormData,
): Promise<HussamTrelloImportState> {
  const confirmation = importConfirmationSchema.safeParse({
    packageLineId: formData.get("packageLineId"),
    confirmation: formData.get("confirmation"),
    confirmed: formData.get("confirmed"),
  });
  if (!confirmation.success) {
    return {
      status: "error",
      message: "اكتب عبارة التأكيد وفعّل مربع الموافقة.",
    };
  }

  const context = await authorizedImportContext();
  if (!context)
    return { status: "error", message: "لا تملك صلاحية هذا الاستيراد." };

  let preview: Awaited<ReturnType<typeof buildImportPreview>>;
  try {
    preview = await buildImportPreview(context);
  } catch {
    return {
      status: "error",
      message: "تعذر تحديث المعاينة الآمنة. لم تُكتب أي بيانات.",
    };
  }
  if (preview.plans.length !== HUSSAM_TRELLO_EXPECTED_ACTIVE_CARDS) {
    return {
      status: "error",
      message: "تغيّر عدد بطاقات Trello عن 60. راجع المعاينة قبل التنفيذ.",
    };
  }
  if (preview.plans.some((plan) => plan.state === "scope_conflict")) {
    return {
      status: "error",
      message: "يوجد تعارض نطاق في مفاتيح Trello. لم يبدأ الاستيراد.",
    };
  }

  const option = preview.packageOptions.find(
    (candidate) => candidate.lineId === confirmation.data.packageLineId,
  );
  const newPlans = preview.plans.filter((plan) => plan.state === "ready");
  if (!option || option.available < newPlans.length) {
    return {
      status: "error",
      message: "سعة سطر الباقة غير كافية. لم يبدأ الاستيراد.",
    };
  }

  const executablePlans = preview.plans.filter(
    (plan) => plan.state === "ready" || plan.state === "incomplete_import",
  );
  const batch = executablePlans.slice(0, IMPORT_BATCH_SIZE);
  let completed = 0;
  for (const plan of batch) {
    try {
      await importCard(context, option, plan);
      completed += 1;
    } catch {
      revalidatePath(`/clients/${HUSSAM_TRELLO_TARGET_CLIENT_ID}`);
      return {
        status: "error",
        message: `توقف الاستيراد بأمان بعد معالجة ${completed} بطاقة. أعد المحاولة؛ المفاتيح الثابتة تمنع التكرار.`,
      };
    }
  }

  revalidatePath(`/clients/${HUSSAM_TRELLO_TARGET_CLIENT_ID}`);
  revalidatePath(
    `/clients/${HUSSAM_TRELLO_TARGET_CLIENT_ID}/deliverables/board`,
  );
  revalidatePath(
    `/clients/${HUSSAM_TRELLO_TARGET_CLIENT_ID}/imports/trello-hussam`,
  );
  return {
    status: "success",
    message:
      executablePlans.length > completed
        ? `اكتملت دفعة من ${completed} بطاقات، وسيبدأ النظام الدفعة التالية تلقائيًا.`
        : "اكتمل نقل البيانات النصية من Trello دون نقل الملفات.",
    createdCount: batch.filter((plan) => plan.state === "ready").length,
    repairedCount: preview.plans.filter(
      (plan) => plan.state === "incomplete_import",
    ).slice(0, IMPORT_BATCH_SIZE).length,
    duplicateCount: preview.plans.filter(
      (plan) => plan.state === "exact_duplicate",
    ).length,
    processedCount: completed,
    remainingCount: executablePlans.length - completed,
  };
}

import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";

const MODES = new Set(["--dry-run", "--apply", "--rollback-dry-run", "--rollback"]);
const mode = process.argv.find((argument) => MODES.has(argument));
const workbookPath = process.env.S015_UAT_WORKBOOK_PATH;
const runId = process.env.S015_UAT_IMPORT_RUN_ID;

if (!mode || !workbookPath || !runId) {
  throw new Error(
    "UAT_IMPORT_INPUT_REQUIRED: select a mode and set workbook path plus opaque run ID",
  );
}
if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{2,80}$/.test(runId)) {
  throw new Error("UAT_IMPORT_RUN_ID_INVALID");
}

const runtimeNodeModules = process.env.S015_WORKSPACE_NODE_MODULES;
if (!runtimeNodeModules) {
  throw new Error("UAT_IMPORT_ARTIFACT_RUNTIME_REQUIRED");
}

const resolver = createRequire(path.join(runtimeNodeModules, "s015-artifact-resolver.cjs"));
const artifactEntry = resolver.resolve("@oai/artifact-tool");
const { FileBlob, SpreadsheetFile } = await import(pathToFileURL(artifactEntry).href);

const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(workbookPath));
const sheets = [];
for (let index = 0; ; index += 1) {
  let sheet;
  try {
    sheet = workbook.worksheets.getItemAt(index);
  } catch {
    break;
  }
  if (!sheet) break;
  sheets.push({
    name: cleanText(sheet.name),
    rows: sheet.getUsedRange(true)?.values ?? [],
  });
}

if (sheets.length < 2) throw new Error("UAT_IMPORT_EXPECTED_SHEETS_MISSING");

const contentSheet = findSheet(sheets, [
  ["المحتوى النصي", "نص المحتوى"],
  ["الكابشن"],
  ["المنصة/القناة", "المنصة"],
]);
const taskSheet = findSheet(sheets, [
  ["الأداة التسويقية", "الأداة"],
  ["تبدء", "تبدأ", "تاريخ البدء"],
  ["الحالة"],
]);
if (!contentSheet || !taskSheet || contentSheet === taskSheet) {
  throw new Error("UAT_IMPORT_SHEET_MAPPING_UNAVAILABLE");
}

const contentRows = rowsAsRecords(contentSheet.rows);
const taskRows = rowsAsRecords(taskSheet.rows);
const deliverables = contentRows
  .map((record, index) => toContentDeliverable(record, index, contentSheet.name))
  .filter(Boolean);

if (deliverables.length === 0) throw new Error("UAT_IMPORT_CONTENT_ROWS_EMPTY");

const coordinationId = stableUuid(`${runId}:${taskSheet.name}:coordination`);
const coordinationVersionId = stableUuid(`${runId}:${taskSheet.name}:coordination:version:1`);
const coordinationDeliverable = {
  id: coordinationId,
  versionId: coordinationVersionId,
  name: taskSheet.name || "تنسيق أدوات التسويق",
  description: "مخرج تنسيقي مستورد لربط مهام التشغيل الواردة في ورقة مستقلة.",
  type: "marketing_coordination",
  priority: "normal",
  brief: "مهام تشغيلية مستوردة من ورقة مستقلة دون إنشاء قرارات اعتماد.",
  contentBody: "",
  caption: "",
  channel: "",
  format: "coordination",
  objective: "",
  kpi: "",
  sourceReference: sourceReference(taskSheet.name),
  sourceMetadata: {
    sourceKind: "workbook",
    sheetCategory: "marketing_tools",
    rowCount: taskRows.length,
  },
};

const tasks = taskRows
  .map((record, index) => toTask(record, index, taskSheet.name, coordinationDeliverable))
  .filter(Boolean);

const payload = {
  deliverables: [...deliverables, coordinationDeliverable],
  tasks,
};
const counts = {
  deliverables: payload.deliverables.length,
  contentDeliverables: deliverables.length,
  coordinationDeliverables: 1,
  versions: payload.deliverables.length,
  tasks: tasks.length,
  approvalDecisions: 0,
  fileAssets: 0,
};

if (mode === "--dry-run") {
  console.log(JSON.stringify({ status: "validated", category: "uat_workbook", counts }));
  process.exit(0);
}

if (
  process.env.S015_TARGET_CATEGORY !== "uat" ||
  process.env.S015_UAT_CONFIRM_NON_PRODUCTION !== "1"
) {
  throw new Error("UAT_IMPORT_NON_PRODUCTION_CONFIRMATION_REQUIRED");
}

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const tenantId = process.env.S015_UAT_TENANT_ID;
const clientId = process.env.S015_UAT_CLIENT_ID;
const contractId = process.env.S015_UAT_CONTRACT_ID || null;
const packageId = process.env.S015_UAT_PACKAGE_ID || null;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

if (
  !supabaseUrl ||
  !serviceRoleKey ||
  !uuidPattern.test(tenantId ?? "") ||
  !uuidPattern.test(clientId ?? "") ||
  (contractId !== null && !uuidPattern.test(contractId)) ||
  (packageId !== null && !uuidPattern.test(packageId))
) {
  throw new Error("UAT_IMPORT_CONNECTION_OR_SCOPE_REQUIRED");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

if (mode === "--rollback" || mode === "--rollback-dry-run") {
  const dryRun = mode === "--rollback-dry-run";
  const { data, error } = await supabase.rpc("s015_rollback_uat_import", {
    target_tenant_id: tenantId,
    target_client_id: clientId,
    target_run_id: runId,
    dry_run: dryRun,
  });
  if (error) throw new Error(`UAT_IMPORT_ROLLBACK_FAILED:${error.code ?? "unknown"}`);
  console.log(
    JSON.stringify({
      status: dryRun ? "rollback_validated" : "rolled_back",
      category: "uat_workbook",
      counts: summarizeRpcCounts(data),
    }),
  );
  process.exit(0);
}

const { data, error } = await supabase.rpc("s015_import_uat_payload", {
  target_tenant_id: tenantId,
  target_client_id: clientId,
  target_contract_id: contractId,
  target_package_id: packageId,
  target_run_id: runId,
  payload,
});
if (error) throw new Error(`UAT_IMPORT_APPLY_FAILED:${error.code ?? "unknown"}`);
console.log(
  JSON.stringify({
    status: "applied",
    category: "uat_workbook",
    counts: summarizeRpcCounts(data),
  }),
);

function findSheet(candidates, requiredHeaderGroups) {
  return candidates.find((sheet) => {
    const headers = new Set((sheet.rows[0] ?? []).map(cleanText));
    return requiredHeaderGroups.every((aliases) => aliases.some((header) => headers.has(header)));
  });
}

function rowsAsRecords(rows) {
  const headers = (rows[0] ?? []).map(cleanText);
  return rows
    .slice(1)
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index]])))
    .filter((record) => Object.values(record).some((value) => cleanText(value) !== ""));
}

function toContentDeliverable(record, index, sheetName) {
  const description = cleanText(valueFor(record, "وصف المحتوى"));
  const body = cleanText(valueFor(record, "المحتوى النصي", "نص المحتوى"));
  const caption = cleanText(valueFor(record, "الكابشن"));
  if (!description && !body && !caption) return null;

  const rowNumber = index + 2;
  const id = stableUuid(`${runId}:${sheetName}:row:${rowNumber}:deliverable`);
  const approvalSource = {
    contentApproval: cleanText(valueFor(record, "تعميد المحتوى", "اعتماد المحتوى")),
    approvalNotesPresent: cleanText(valueFor(record, "ملاحظات التعميد", "ملاحظات على الاعتماد")) !== "",
    designApproval: cleanText(valueFor(record, "تعميد التصميم", "اعتماد التصميم")),
    suggestionsPresent: cleanText(valueFor(record, "اقتراحات للمحتوى", "اقتراحات")) !== "",
    readyMarker: cleanText(valueFor(record, "جاهز", "جاهز؟")),
  };

  return {
    id,
    versionId: stableUuid(`${runId}:${sheetName}:row:${rowNumber}:version:1`),
    name: description || `محتوى ${rowNumber - 1}`,
    description,
    type: normalizeDeliverableType(valueFor(record, "قالب المحتوى", "التنسيق")),
    priority: "normal",
    brief: description,
    contentBody: body,
    caption,
    channel: cleanText(valueFor(record, "المنصة/القناة", "المنصة")),
    format: cleanText(valueFor(record, "قالب المحتوى", "التنسيق")),
    objective: cleanText(valueFor(record, "الهدف الرئيسي", "الهدف")),
    kpi: cleanText(valueFor(record, "المؤشر", "KPI")),
    sourceReference: sourceReference(sheetName, rowNumber),
    sourceMetadata: {
      sourceKind: "workbook",
      sheetCategory: "content_plan",
      rowNumber,
      stage: cleanText(valueFor(record, "المرحلة")),
      publishDay: normalizeDate(valueFor(record, "اليوم النشر", "يوم النشر")),
      approvalSource,
      designLinkPresent: cleanText(valueFor(record, "رابط التصميم")) !== "",
    },
  };
}

function toTask(record, index, sheetName, coordination) {
  const title = cleanText(valueFor(record, "الأداة التسويقية", "الأداة"));
  if (!title) return null;
  const rowNumber = index + 2;
  return {
    id: stableUuid(`${runId}:${sheetName}:row:${rowNumber}:task`),
    deliverableId: coordination.id,
    versionId: coordination.versionId,
    title,
    description: "",
    status: normalizeTaskStatus(valueFor(record, "الحالة")),
    priority: "normal",
    dueDate: normalizeDate(valueFor(record, "مستهدف", "المستهدف", "تنتهى", "تاريخ الانتهاء")),
    sortOrder: index,
    sourceMetadata: {
      sourceKind: "workbook",
      sheetCategory: "marketing_tools",
      rowNumber,
      startDate: normalizeDate(valueFor(record, "تبدء", "تبدأ", "تاريخ البدء")),
      targetDate: normalizeDate(valueFor(record, "مستهدف", "المستهدف")),
      endDate: normalizeDate(valueFor(record, "تنتهى", "تاريخ الانتهاء")),
      actualDate: normalizeDate(valueFor(record, "الفعلي")),
      sourceStatus: cleanText(valueFor(record, "الحالة")),
    },
  };
}

function normalizeDeliverableType(value) {
  const normalized = cleanText(value).toLowerCase();
  if (/reel|ريل|فيديو/.test(normalized)) return "video";
  if (/story|ستوري/.test(normalized)) return "story";
  if (/report|تقرير/.test(normalized)) return "report";
  return "social_content";
}

function normalizeTaskStatus(value) {
  const normalized = cleanText(value).toLowerCase();
  if (/تم|مكتمل|منجز|done|complete/.test(normalized)) return "done";
  if (/جاري|قيد|in.progress|working/.test(normalized)) return "in_progress";
  if (/ملغ|cancel/.test(normalized)) return "cancelled";
  return "todo";
}

function normalizeDate(value) {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(Math.round((value - 25569) * 86400 * 1000))
      .toISOString()
      .slice(0, 10);
  }
  const text = cleanText(value);
  if (!text) return "";
  const parsed = new Date(text);
  return Number.isNaN(parsed.valueOf()) ? "" : parsed.toISOString().slice(0, 10);
}

function cleanText(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\s+/g, " ").trim();
}

function valueFor(record, ...aliases) {
  for (const alias of aliases) {
    if (Object.hasOwn(record, alias)) return record[alias];
  }
  return undefined;
}

function sourceReference(sheetName, rowNumber) {
  const suffix = rowNumber ? `:row-${rowNumber}` : "";
  return `workbook:${createHash("sha256").update(sheetName).digest("hex").slice(0, 12)}${suffix}`;
}

function stableUuid(value) {
  const bytes = Buffer.from(createHash("sha256").update(value).digest().subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function summarizeRpcCounts(data) {
  const row = Array.isArray(data) ? data[0] : data;
  return {
    deliverables: Number(row?.deliverable_count ?? 0),
    versions: Number(row?.version_count ?? 0),
    tasks: Number(row?.task_count ?? 0),
  };
}

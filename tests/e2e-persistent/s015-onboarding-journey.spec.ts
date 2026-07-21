import { expect, test } from "@playwright/test";
import {
  createPersistentActorClient,
  loadPersistentLocalEnv,
  resetLocalDatabaseIfLifecycleSeeded,
  seedPersistentLifecycle,
  signInViaUi,
  type PersistentSeed,
} from "./support/s015-persistent-local";

test.describe.configure({ mode: "serial", timeout: 600_000 });

let seeded: Awaited<ReturnType<typeof seedPersistentLifecycle>>;
let freshSeed: PersistentSeed;

test.beforeAll(async () => {
  await resetLocalDatabaseIfLifecycleSeeded();
  seeded = await seedPersistentLifecycle();
  freshSeed = seeded.seed;
});

const onboardPath = "/clients/onboard";

test("management can onboard a complete first client through the wizard", async ({
  page,
}) => {
  const clientName = `عميل X009C ${Date.now()}`;
  const contractName = `عقد X009C ${Date.now()}`;
  const packageName = `باقة X009C ${Date.now()}`;
  const deliverableName = `مخرج X009C ${Date.now()}`;

  await signInViaUi(page, freshSeed.actors.tenantAdmin);
  await page.goto(onboardPath, { waitUntil: "domcontentloaded" });

  const form = page.getByRole("form", { name: "معالج إضافة أول عميل" });
  await expect(form).toBeVisible();

  await form.locator('input[aria-label="اسم العميل"]').fill(clientName);
  await expect(form.locator('input[aria-label="اسم العميل"]')).toHaveValue(clientName);
  await form.locator('input[aria-label="اسم جهة التواصل"]').fill("جهة التواصل التجريبية");
  await form.getByRole("button", { name: "التالي" }).click();

  await expect(form.locator('input[aria-label="اسم العقد"]')).toBeVisible();
  await form.locator('input[aria-label="اسم العقد"]').fill(contractName);
  await expect(form.locator('input[aria-label="اسم العقد"]')).toHaveValue(contractName);
  await form.locator('input[aria-label="مرجع العقد"]').fill("X009C-E2E");
  await form.getByRole("button", { name: "التالي" }).click();

  await expect(form.locator('input[aria-label="اسم الباقة"]')).toBeVisible();
  await form.locator('input[aria-label="اسم الباقة"]').fill(packageName);
  await expect(form.locator('input[aria-label="اسم الباقة"]')).toHaveValue(packageName);
  await form.locator('input[aria-label="اسم الخدمة للسطر 1"]').fill("منشورات تجريبية");
  await form.getByRole("button", { name: "التالي" }).click();

  await expect(form.locator('select[aria-label="المسؤول"]')).toBeVisible();
  await form.getByRole("button", { name: "التالي" }).click();

  await expect(form.locator('input[aria-label="اسم المخرج"]')).toBeVisible();
  await form.locator('input[aria-label="اسم المخرج"]').fill(deliverableName);
  await expect(form.locator('input[aria-label="اسم المخرج"]')).toHaveValue(deliverableName);
  await form
    .locator('select[aria-label="نوع المخرج"]')
    .selectOption("post");
  await form.getByRole("button", { name: "التالي" }).click();

  await expect(
    form.getByRole("button", { name: "إنشاء العميل والبدء" }),
  ).toBeVisible();
  await form.getByRole("button", { name: "إنشاء العميل والبدء" }).click();

  await expect(page).toHaveURL(/onboarded=1/u, { timeout: 120_000 });

  const persistedClient = await seeded.client
    .from("clients")
    .select("id, name, slug, status")
    .eq("tenant_id", freshSeed.tenantA)
    .eq("name", clientName)
    .single();
  expect(persistedClient.error).toBeNull();
  expect(persistedClient.data).toMatchObject({ status: "active" });
  const clientId = persistedClient.data!.id;

  const persistedContract = await seeded.client
    .from("contracts")
    .select("id, name, status")
    .eq("tenant_id", freshSeed.tenantA)
    .eq("client_id", clientId)
    .eq("name", contractName)
    .single();
  expect(persistedContract.error).toBeNull();
  expect(persistedContract.data).toMatchObject({ status: "active" });

  const persistedPackage = await seeded.client
    .from("packages")
    .select("id, name, status")
    .eq("tenant_id", freshSeed.tenantA)
    .eq("client_id", clientId)
    .eq("name", packageName)
    .single();
  expect(persistedPackage.error).toBeNull();
  expect(persistedPackage.data).toMatchObject({ status: "active" });
  const packageId = persistedPackage.data!.id;

  const persistedLine = await seeded.client
    .from("package_lines")
    .select("id, service_label, committed_quantity")
    .eq("tenant_id", freshSeed.tenantA)
    .eq("client_id", clientId)
    .eq("package_id", packageId)
    .eq("status", "active")
    .single();
  expect(persistedLine.error).toBeNull();
  expect(persistedLine.data).toMatchObject({
    service_label: "منشورات تجريبية",
    committed_quantity: 1,
  });

  const persistedDeliverable = await seeded.client
    .from("deliverables")
    .select("id, name, type, status, progress_percentage")
    .eq("tenant_id", freshSeed.tenantA)
    .eq("client_id", clientId)
    .eq("name", deliverableName)
    .single();
  expect(persistedDeliverable.error).toBeNull();
  expect(persistedDeliverable.data).toMatchObject({
    type: "post",
    status: "not_started",
    progress_percentage: 0,
  });
  const deliverableId = persistedDeliverable.data!.id;

  const { count: auditCount } = await seeded.client
    .from("audit_events")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", freshSeed.tenantA)
    .eq("client_id", clientId)
    .in("action", [
      "ClientCreated",
      "ContractCreated",
      "PackageCreated",
      "DeliverableCreated",
    ]);
  expect(auditCount ?? 0).toBeGreaterThanOrEqual(4);

  const { count: allocationCount } = await seeded.client
    .from("deliverable_allocations")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", freshSeed.tenantA)
    .eq("client_id", clientId)
    .eq("deliverable_id", deliverableId)
    .eq("status", "reserved");
  expect(allocationCount ?? 0).toBe(1);
});

test("account manager cannot access the onboarding wizard", async ({
  page,
}) => {
  await signInViaUi(page, freshSeed.actors.accountManager);
  await page.goto(onboardPath, { waitUntil: "domcontentloaded" });

  await expect(
    page.getByRole("form", { name: "معالج إضافة أول عميل" }),
  ).toHaveCount(0);
});

test("wizard prevents advancing with empty required client name", async ({
  page,
}) => {
  await signInViaUi(page, freshSeed.actors.tenantAdmin);
  await page.goto(onboardPath, { waitUntil: "domcontentloaded" });

  const form = page.getByRole("form", { name: "معالج إضافة أول عميل" });
  await form.getByRole("button", { name: "التالي" }).click();

  await expect(page.getByText(/اسم العميل مطلوب/u)).toBeVisible();
  await expect(form.locator('input[aria-label="اسم العقد"]')).toHaveCount(0);
});

test("idempotent replay with same run-id does not duplicate entities", async ({
  page,
}) => {
  const adminClient = await createPersistentActorClient({
    seed: freshSeed,
    actor: freshSeed.actors.tenantAdmin,
  });

  const runId = `x009c-replay-${crypto.randomUUID()}`;
  const clientId = crypto.randomUUID();
  const contractId = crypto.randomUUID();
  const packageId = crypto.randomUUID();
  const packageLineId = crypto.randomUUID();
  const deliverableId = crypto.randomUUID();

  const createClient = async () => {
    return adminClient.rpc("f001_create_client_write", {
      client_id: clientId,
      audit_event_id: crypto.randomUUID(),
      client_name: `عميل replay ${runId}`,
      client_slug: `replay-${runId}`.slice(0, 40),
      new_primary_contact_name: null,
      new_primary_contact_email: null,
    });
  };

  const createContract = async () => {
    return adminClient.rpc("f002_create_contract_context", {
      contract_id: contractId,
      audit_event_id: crypto.randomUUID(),
      target_client_id: clientId,
      contract_name: `عقد replay ${runId}`,
      contract_reference: null,
      contract_summary: null,
      period_start_date: null,
      period_end_date: null,
      contract_status: "active",
      idempotency_key: `${runId}:contract`,
    });
  };

  const createPackage = async () => {
    return adminClient.rpc("f002_create_package_commitments", {
      package_id: packageId,
      audit_event_id: crypto.randomUUID(),
      target_client_id: clientId,
      target_contract_id: contractId,
      package_name: `باقة replay ${runId}`,
      package_status: "active",
      period_start_date: null,
      period_end_date: null,
      line_items: [
        {
          id: packageLineId,
          ledger_entry_id: crypto.randomUUID(),
          service_label: "خدمة replay",
          deliverable_type_hint: "post",
          unit_label: "منشور",
          committed_quantity: 5,
        },
      ],
      idempotency_key: `${runId}:package`,
    });
  };

  const createDeliverable = async () => {
    return adminClient.rpc("f002_create_deliverable_reservation", {
      deliverable_id: deliverableId,
      allocation_id: crypto.randomUUID(),
      ledger_entry_id: crypto.randomUUID(),
      audit_event_id: crypto.randomUUID(),
      target_client_id: clientId,
      target_contract_id: contractId,
      target_package_id: packageId,
      target_package_line_id: packageLineId,
      deliverable_name: `مخرج replay ${runId}`,
      deliverable_description: null,
      deliverable_type: "post",
      deliverable_priority: "normal",
      owner_user_id_input: null,
      contributor_user_ids_input: [],
      start_on: null,
      internal_due_on: null,
      client_due_on: null,
      final_due_on: null,
      requires_internal_approval_input: true,
      requires_client_approval_input: true,
      reserved_quantity: 1,
      idempotency_key: `${runId}:deliverable`,
    });
  };

  expect((await createClient()).error).toBeNull();
  expect((await createContract()).error).toBeNull();
  expect((await createPackage()).error).toBeNull();
  expect((await createDeliverable()).error).toBeNull();

  const replayContract = await createContract();
  const replayPackage = await createPackage();
  const replayDeliverable = await createDeliverable();

  expect(replayContract.error).toBeNull();
  expect(replayPackage.error).toBeNull();
  expect(replayDeliverable.error).toBeNull();

  const { count: contractCount } = await seeded.client
    .from("contracts")
    .select("id", { count: "exact", head: true })
    .eq("idempotency_key", `${runId}:contract`);
  expect(contractCount ?? 0).toBe(1);

  const { count: deliverableCount } = await seeded.client
    .from("deliverables")
    .select("id", { count: "exact", head: true })
    .eq("idempotency_key", `${runId}:deliverable`);
  expect(deliverableCount ?? 0).toBe(1);

  const { count: ledgerCount } = await seeded.client
    .from("package_ledger_entries")
    .select("id", { count: "exact", head: true })
    .eq("deliverable_id", deliverableId)
    .eq("entry_type", "quantity_reserved");
  expect(ledgerCount ?? 0).toBe(1);
});

test.afterAll(async () => {
  await resetLocalDatabaseIfLifecycleSeeded();
  loadPersistentLocalEnv();
});

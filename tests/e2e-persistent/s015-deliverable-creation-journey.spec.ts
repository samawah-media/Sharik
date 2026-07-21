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
let freshContractId: string;
let freshPackageId: string;
let freshPackageLineId: string;
let freshSeed: PersistentSeed;

test.beforeAll(async () => {
  await resetLocalDatabaseIfLifecycleSeeded();
  seeded = await seedPersistentLifecycle();
  freshSeed = seeded.seed;

  // Create a fresh contract + package + package_line via the audited management
  // RPC path so the package ledger has a real commitment_added entry and
  // f002_create_deliverable_reservation has actual capacity to reserve.
  const adminClient = await createPersistentActorClient({
    seed: freshSeed,
    actor: freshSeed.actors.tenantAdmin,
  });

  freshContractId = crypto.randomUUID();
  const contractIdempotencyKey = `x009-contract-${crypto.randomUUID()}`;
  const contractRes = await adminClient.rpc("f002_create_contract_context", {
    contract_id: freshContractId,
    audit_event_id: crypto.randomUUID(),
    target_client_id: freshSeed.clientA,
    contract_name: "X009 contract",
    contract_status: "active",
    period_start_date: "2026-01-01",
    period_end_date: "2026-12-31",
    idempotency_key: contractIdempotencyKey,
  });
  expect(contractRes.error).toBeNull();

  freshPackageId = crypto.randomUUID();
  freshPackageLineId = crypto.randomUUID();
  const packageRes = await adminClient.rpc("f002_create_package_commitments", {
    package_id: freshPackageId,
    audit_event_id: crypto.randomUUID(),
    target_client_id: freshSeed.clientA,
    target_contract_id: freshContractId,
    package_name: "X009 package",
    package_status: "active",
    period_start_date: "2026-01-01",
    period_end_date: "2026-12-31",
    line_items: [
      {
        id: freshPackageLineId,
        ledger_entry_id: crypto.randomUUID(),
        service_label: "X009 line",
        deliverable_type_hint: "post",
        unit_label: "post",
        committed_quantity: 5,
      },
    ],
    idempotency_key: `x009-package-${crypto.randomUUID()}`,
  });
  expect(packageRes.error).toBeNull();
});

const newDeliverablePath = () =>
  `/clients/${freshSeed.clientA}/deliverables/new`;

const listDeliverablesPath = () =>
  `/clients/${freshSeed.clientA}/deliverables`;

const countForTenant = async (
  table: "deliverables" | "deliverable_allocations" | "package_ledger_entries" | "audit_events",
  filter: Record<string, string>,
) => {
  const { count, error } = await seeded.client
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", freshSeed.tenantA)
    .eq("client_id", freshSeed.clientA)
    .match(filter);
  expect(error).toBeNull();
  return count ?? 0;
};

test("management can create a deliverable through the real persistent browser flow", async ({
  page,
}) => {
  const deliverableName = `X009 مخرج التجربة ${Date.now()}`;

  await signInViaUi(page, freshSeed.actors.tenantAdmin);
  await page.goto(newDeliverablePath(), { waitUntil: "domcontentloaded" });

  const form = page.getByRole("form", { name: "إنشاء مخرج" });
  await expect(form).toBeVisible();
  await expect(form.locator('input[name="contractId"]')).toHaveValue(
    freshContractId,
  );
  await expect(form.locator('input[name="packageId"]')).toHaveValue(
    freshPackageId,
  );

  await form.locator('input[name="name"]').fill(deliverableName);
  await form.locator('textarea[name="description"]').fill("وصف تجريبي");
  await form.locator('input[name="type"]').fill("post");
  await form
    .locator('select[name="packageLineId"]')
    .selectOption(freshPackageLineId);
  await form.locator('input[name="reservedQuantity"]').fill("2");
  await form
    .locator('select[name="ownerUserId"]')
    .selectOption(freshSeed.actors.assignedWriter.id);
  await form
    .getByRole("checkbox", { name: /المصمم المسند/u })
    .check();

  await form.getByRole("button", { name: "حفظ المخرج وحجز الكمية" }).click();

  await expect(page).toHaveURL(/saved=created/u);

  const persisted = await seeded.client
    .from("deliverables")
    .select("id, name, status, progress_percentage, package_line_id")
    .eq("tenant_id", freshSeed.tenantA)
    .eq("client_id", freshSeed.clientA)
    .eq("name", deliverableName)
    .single();
  expect(persisted.error).toBeNull();
  expect(persisted.data).toMatchObject({
    status: "not_started",
    progress_percentage: 0,
    package_line_id: freshPackageLineId,
  });
  const deliverableId = persisted.data!.id;

  // Reload and confirm the deliverable still appears in the list.
  await page.goto(listDeliverablesPath(), { waitUntil: "domcontentloaded" });
  await expect(page.getByText(deliverableName)).toBeVisible();

  // Exact-once audit, ledger, and allocation side effects.
  expect(
    await countForTenant("deliverables", { id: deliverableId }),
  ).toBe(1);
  expect(
    await countForTenant("deliverable_allocations", {
      deliverable_id: deliverableId,
      status: "reserved",
    }),
  ).toBe(1);
  expect(
    await countForTenant("package_ledger_entries", {
      deliverable_id: deliverableId,
      entry_type: "quantity_reserved",
    }),
  ).toBe(1);
  expect(
    await countForTenant("audit_events", {
      target_id: deliverableId,
      action: "DeliverableCreated",
      decision: "allowed",
    }),
  ).toBe(1);
});

test("tampered owner identifier returns an actionable Arabic error instead of the generic safe-save fallback", async ({
  page,
}) => {
  await signInViaUi(page, freshSeed.actors.tenantAdmin);
  await page.goto(newDeliverablePath(), { waitUntil: "domcontentloaded" });

  const form = page.getByRole("form", { name: "إنشاء مخرج" });
  await form.locator('input[name="name"]').fill(
    `X009 reject ${Date.now()}`,
  );
  await form.locator('input[name="type"]').fill("post");
  await form
    .locator('select[name="packageLineId"]')
    .selectOption(freshPackageLineId);
  await form.locator('select[name="ownerUserId"]').evaluate((selectElement) => {
    const option = document.createElement("option");
    option.value = "أحمد";
    option.textContent = "قيمة غير مصرح بها";
    selectElement.append(option);
    (selectElement as HTMLSelectElement).value = option.value;
  });

  await form.getByRole("button", { name: "حفظ المخرج وحجز الكمية" }).click();

  await expect(page.getByText(/معرّف المسؤول غير صالح/u)).toBeVisible();
  // The raw Postgres 22P02 message must never reach the browser.
  await expect(
    page.getByText(/invalid input syntax for type uuid/u),
  ).toHaveCount(0);
  await expect(page.getByText(/أحمد/u)).toHaveCount(0);
  // Form stays on the same route; no partial redirect to the deliverables list.
  await expect(page).toHaveURL(new RegExp(`${newDeliverablePath()}$`));

  // No deliverable row was created from the rejected submission.
  const { count } = await seeded.client
    .from("deliverables")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", freshSeed.tenantA)
    .eq("client_id", freshSeed.clientA)
    .like("name", "X009 reject%");
  expect(count ?? 0).toBe(0);
});

test("replaying the same idempotency key returns the original deliverable without duplicating side effects", async ({
  page,
}) => {
  const adminClient = await createPersistentActorClient({
    seed: freshSeed,
    actor: freshSeed.actors.tenantAdmin,
  });

  const idempotencyKey = `x009-replay-${crypto.randomUUID()}`;
  const sharedInput = {
    deliverable_id: crypto.randomUUID(),
    allocation_id: crypto.randomUUID(),
    ledger_entry_id: crypto.randomUUID(),
    audit_event_id: crypto.randomUUID(),
    target_client_id: freshSeed.clientA,
    target_contract_id: freshContractId,
    target_package_id: freshPackageId,
    target_package_line_id: freshPackageLineId,
    deliverable_name: "X009 replay deliverable",
    deliverable_description: "synthetic",
    deliverable_type: "post",
    deliverable_priority: "normal",
    owner_user_id_input: null,
    contributor_user_ids_input: [],
    start_on: "2026-07-21",
    internal_due_on: "2026-07-25",
    client_due_on: "2026-07-28",
    final_due_on: "2026-07-30",
    requires_internal_approval_input: true,
    requires_client_approval_input: true,
    reserved_quantity: 1,
    idempotency_key: idempotencyKey,
  };

  const first = await adminClient.rpc(
    "f002_create_deliverable_reservation",
    sharedInput,
  );
  expect(first.error).toBeNull();

  const replay = await adminClient.rpc(
    "f002_create_deliverable_reservation",
    {
      ...sharedInput,
      // New correlation IDs, same idempotency key.
      deliverable_id: crypto.randomUUID(),
      allocation_id: crypto.randomUUID(),
      ledger_entry_id: crypto.randomUUID(),
      audit_event_id: crypto.randomUUID(),
    },
  );
  expect(replay.error).toBeNull();
  expect((replay.data as Array<{ id: string }>)[0].id).toBe(
    (first.data as Array<{ id: string }>)[0].id,
  );

  const deliverableId = (first.data as Array<{ id: string }>)[0].id;
  expect(
    await countForTenant("deliverables", { id: deliverableId }),
  ).toBe(1);
  expect(
    await countForTenant("package_ledger_entries", {
      deliverable_id: deliverableId,
      entry_type: "quantity_reserved",
    }),
  ).toBe(1);
  expect(
    await countForTenant("audit_events", {
      target_id: deliverableId,
      action: "DeliverableCreated",
    }),
  ).toBe(1);

  // Sanity check that the persistent webServer URL is still the local app and
  // that the seeded management persona can still see the persistent list.
  await signInViaUi(page, freshSeed.actors.tenantAdmin);
  await page.goto(listDeliverablesPath(), { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("form", { name: "إنشاء مخرج" })).toHaveCount(0);
});

test.afterAll(async () => {
  // The persistent global teardown resets the local database. Re-assert the
  // local env so a stale hosted value can never leak into evidence.
  loadPersistentLocalEnv();
});

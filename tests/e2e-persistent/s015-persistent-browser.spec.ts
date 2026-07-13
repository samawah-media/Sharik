import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  expectNoHorizontalOverflow,
  seedPersistentLifecycle,
  seedPersistentVersionFiles,
  signInViaUi,
  type PersistentSeed,
} from "./support/s015-persistent-local";

test.describe.configure({ mode: "serial", timeout: 600_000 });

let seeded: Awaited<ReturnType<typeof seedPersistentLifecycle>>;

test.beforeAll(async () => {
  seeded = await seedPersistentLifecycle();
});

const boardPath = (seed: PersistentSeed) =>
  `/clients/${seed.clientA}/deliverables/board`;

const cardFor = (page: Page, name: string) =>
  page.locator("article").filter({ hasText: name });

const submitVersion = async ({
  card,
  note,
  versionNumber,
}: {
  card: Locator;
  note: string;
  versionNumber: number;
}) => {
  await card.locator('input[name="versionNumber"]').fill(String(versionNumber));
  await card.locator('textarea[name="reason"]').fill(note);
  await card
    .locator('form:has(input[name="versionNumber"]) button[type="submit"]')
    .click();
};

const runManagementStep = async ({
  card,
  step,
  reason,
}: {
  card: Locator;
  step:
    | "approve_internally"
    | "request_internal_changes"
    | "send_to_client"
    | "deliver_after_client_approval";
  reason?: string;
}) => {
  const form = card.locator(
    `form:has(input[name="workflowStep"][value="${step}"])`,
  );
  await expect(form).toBeVisible();
  if (reason) {
    await form.locator('textarea[name="reason"]').fill(reason);
  }
  await form.locator('button[type="submit"]').click();
};

const expectBoardSaved = async (page: Page) => {
  await expect(page).toHaveURL(/saved=status-updated/u);
};

const latestVersion = async (deliverableId: string) => {
  const { data, error } = await seeded.client
    .from("deliverable_versions")
    .select("id, tenant_id, client_id, deliverable_id, version_number, status, submitted_by")
    .eq("deliverable_id", deliverableId)
    .order("version_number", { ascending: false })
    .limit(1)
    .single();

  expect(error).toBeNull();
  expect(data).toBeTruthy();
  return data as {
    id: string;
    tenant_id: string;
    client_id: string;
    deliverable_id: string;
    version_number: number;
    status: string;
    submitted_by: string;
  };
};

const assertDeliverable = async (
  deliverableId: string,
  expected: Partial<{
    status: string;
    progress_percentage: number;
    current_version_id: string | null;
  }>,
) => {
  const { data, error } = await seeded.client
    .from("deliverables")
    .select("status, progress_percentage, current_version_id")
    .eq("id", deliverableId)
    .single();

  expect(error).toBeNull();
  expect(data).toMatchObject(expected);
};

test("real local Supabase browser journey covers persistent S015 approval lifecycle", async ({
  browser,
  page,
  baseURL,
}) => {
  const { seed } = seeded;

  await signInViaUi(page, seed.actors.accountManager);
  await page.goto(boardPath(seed), { waitUntil: "domcontentloaded" });
  await expect(cardFor(page, "S015 Persistent Account Assigned")).toBeVisible();
  await expect(page.getByText("S015 Persistent Client B Hidden")).toHaveCount(0);

  await signInViaUi(page, seed.actors.assignedDesigner);
  await page.goto(boardPath(seed), { waitUntil: "domcontentloaded" });
  const designerCard = cardFor(page, "S015 Persistent Designer Assigned");
  await expect(designerCard).toBeVisible();
  await expect(cardFor(page, "S015 Persistent Browser Journey")).toHaveCount(0);
  await submitVersion({
    card: designerCard,
    versionNumber: 1,
    note: "designer browser draft",
  });
  await expectBoardSaved(page);
  const designerVersion = await latestVersion(seed.designerDeliverableId);
  expect(designerVersion).toMatchObject({
    tenant_id: seed.tenantA,
    client_id: seed.clientA,
    deliverable_id: seed.designerDeliverableId,
    version_number: 1,
    submitted_by: seed.actors.assignedDesigner.id,
  });

  for (const actor of [
    seed.actors.unassignedWriter,
    seed.actors.unassignedDesigner,
  ]) {
    await signInViaUi(page, actor);
    await page.goto(boardPath(seed), { waitUntil: "domcontentloaded" });
    await expect(cardFor(page, "S015 Persistent Browser Journey")).toHaveCount(0);
    await expect(page.locator('input[name="versionNumber"]')).toHaveCount(0);
  }

  await signInViaUi(page, seed.actors.sameTenantOtherClient);
  await page.goto(boardPath(seed), { waitUntil: "domcontentloaded" });
  await expect(cardFor(page, "S015 Persistent Browser Journey")).toHaveCount(0);
  await expect(page.getByTestId("kanban-board-scroll")).toHaveCount(0);

  await signInViaUi(page, seed.actors.otherTenantAdmin);
  await page.goto(boardPath(seed), { waitUntil: "domcontentloaded" });
  await expect(cardFor(page, "S015 Persistent Browser Journey")).toHaveCount(0);
  await expect(page.getByTestId("kanban-board-scroll")).toHaveCount(0);

  await signInViaUi(page, seed.actors.assignedWriter);
  await page.goto(boardPath(seed), { waitUntil: "domcontentloaded" });
  const writerCard = cardFor(page, "S015 Persistent Browser Journey");
  await expect(writerCard).toBeVisible();
  await expect(cardFor(page, "S015 Persistent Designer Assigned")).toHaveCount(0);
  await expect(cardFor(page, "S015 Persistent Account Assigned")).toHaveCount(0);
  await expect(cardFor(page, "S015 Persistent Client B Hidden")).toHaveCount(0);
  await submitVersion({
    card: writerCard,
    versionNumber: 1,
    note: "first draft",
  });
  await expectBoardSaved(page);
  const version1 = await latestVersion(seed.mainDeliverableId);
  expect(version1).toMatchObject({
    tenant_id: seed.tenantA,
    client_id: seed.clientA,
    deliverable_id: seed.mainDeliverableId,
    version_number: 1,
    submitted_by: seed.actors.assignedWriter.id,
  });
  await assertDeliverable(seed.mainDeliverableId, {
    status: "ready_for_internal_review",
    current_version_id: version1.id,
  });

  await signInViaUi(page, seed.actors.tenantAdmin);
  await page.goto(boardPath(seed), { waitUntil: "domcontentloaded" });
  let managementCard = cardFor(page, "S015 Persistent Browser Journey");
  await runManagementStep({
    card: managementCard,
    step: "request_internal_changes",
    reason: "revise internally",
  });
  await expectBoardSaved(page);
  await assertDeliverable(seed.mainDeliverableId, {
    status: "internal_changes_requested",
  });

  await signInViaUi(page, seed.actors.assignedWriter);
  await page.goto(boardPath(seed), { waitUntil: "domcontentloaded" });
  await submitVersion({
    card: cardFor(page, "S015 Persistent Browser Journey"),
    versionNumber: 2,
    note: "replacement draft",
  });
  await expectBoardSaved(page);
  const version2 = await latestVersion(seed.mainDeliverableId);
  await assertDeliverable(seed.mainDeliverableId, {
    status: "ready_for_internal_review",
    current_version_id: version2.id,
  });

  await signInViaUi(page, seed.actors.tenantAdmin);
  await page.goto(boardPath(seed), { waitUntil: "domcontentloaded" });
  managementCard = cardFor(page, "S015 Persistent Browser Journey");
  await expect(
    managementCard.locator(
      'form:has(input[name="workflowStep"][value="send_to_client"])',
    ),
  ).toHaveCount(0);

  await runManagementStep({ card: managementCard, step: "approve_internally" });
  await expectBoardSaved(page);
  await assertDeliverable(seed.mainDeliverableId, {
    status: "internally_approved",
    current_version_id: version2.id,
  });

  await page.goto(boardPath(seed), { waitUntil: "domcontentloaded" });
  managementCard = cardFor(page, "S015 Persistent Browser Journey");
  await runManagementStep({ card: managementCard, step: "send_to_client" });
  await expectBoardSaved(page);
  await assertDeliverable(seed.mainDeliverableId, {
    status: "waiting_client_approval",
    current_version_id: version2.id,
  });
  const afterSend = await seeded.client
    .from("sla_timeline_segments")
    .select("kind")
    .eq("deliverable_id", seed.mainDeliverableId)
    .is("ended_at", null)
    .single();
  expect(afterSend.data?.kind).toBe("paused_waiting_client");

  await signInViaUi(page, seed.actors.clientViewer);
  await page.goto("/client", { waitUntil: "domcontentloaded" });
  const viewerDetail = page.getByTestId("client-approval-detail");
  await expect(viewerDetail).toBeVisible();
  await expect(
    viewerDetail
      .getByTestId("client-approval-actions")
      .locator('form button[type="submit"]'),
  ).toHaveCount(0);
  await expect(page.getByText("first draft")).toHaveCount(0);
  await expect(page.getByText("replacement draft")).toHaveCount(0);
  await expect(page.getByText("S015 Persistent Client B Hidden")).toHaveCount(0);

  const staleContext = await browser.newContext({ baseURL: baseURL ?? undefined });
  const stalePage = await staleContext.newPage();
  await signInViaUi(stalePage, seed.actors.clientApprover);
  await stalePage.goto("/client", { waitUntil: "domcontentloaded" });
  await expect(stalePage.getByTestId("client-approval-detail")).toBeVisible();
  const staleVersionId = await stalePage
    .locator('input[name="versionId"]')
    .first()
    .inputValue();
  expect(staleVersionId).toBe(version2.id);

  await signInViaUi(page, seed.actors.clientApprover);
  await page.goto("/client", { waitUntil: "domcontentloaded" });
  await page.locator('textarea[name="reason"]').fill("client requested polish");
  await page
    .locator('form:has(input[name="clientApprovalAction"][value="request_changes"]) button[type="submit"]')
    .click();
  await expect(page.getByTestId("client-approval-detail")).toHaveCount(0);
  await assertDeliverable(seed.mainDeliverableId, {
    status: "client_changes_requested",
    current_version_id: version2.id,
  });
  const clientChange = await seeded.client
    .from("approval_decisions")
    .select("decision, version_id")
    .eq("deliverable_id", seed.mainDeliverableId)
    .eq("approval_kind", "client")
    .single();
  expect(clientChange.data).toMatchObject({
    decision: "changes_requested",
    version_id: version2.id,
  });
  const afterChange = await seeded.client
    .from("sla_timeline_segments")
    .select("kind")
    .eq("deliverable_id", seed.mainDeliverableId)
    .is("ended_at", null)
    .single();
  expect(afterChange.data?.kind).toBe("resumed");

  await signInViaUi(page, seed.actors.assignedWriter);
  await page.goto(boardPath(seed), { waitUntil: "domcontentloaded" });
  await submitVersion({
    card: cardFor(page, "S015 Persistent Browser Journey"),
    versionNumber: 3,
    note: "final replacement",
  });
  await expectBoardSaved(page);
  const version3 = await latestVersion(seed.mainDeliverableId);

  await signInViaUi(page, seed.actors.tenantAdmin);
  await page.goto(boardPath(seed), { waitUntil: "domcontentloaded" });
  managementCard = cardFor(page, "S015 Persistent Browser Journey");
  await runManagementStep({ card: managementCard, step: "approve_internally" });
  await expectBoardSaved(page);
  await page.goto(boardPath(seed), { waitUntil: "domcontentloaded" });
  await runManagementStep({
    card: cardFor(page, "S015 Persistent Browser Journey"),
    step: "send_to_client",
  });
  await expectBoardSaved(page);
  await assertDeliverable(seed.mainDeliverableId, {
    status: "waiting_client_approval",
    current_version_id: version3.id,
  });

  await stalePage
    .locator('form:has(input[name="clientApprovalAction"][value="approve"]) button[type="submit"]')
    .click();
  await expect(stalePage.getByTestId("client-approval-detail")).toBeVisible();
  const staleDecisionCount = await seeded.client
    .from("approval_decisions")
    .select("id", { count: "exact", head: true })
    .eq("version_id", version2.id)
    .eq("approval_kind", "client")
    .eq("decision", "approved");
  expect(staleDecisionCount.count).toBe(0);
  await staleContext.close();

  await signInViaUi(page, seed.actors.clientApprover);
  await page.goto("/client", { waitUntil: "domcontentloaded" });
  await page
    .locator('form:has(input[name="clientApprovalAction"][value="approve"]) button[type="submit"]')
    .click();
  const approvedDetail = page.getByTestId("client-approval-detail");
  await expect(approvedDetail).toBeVisible();
  await expect(
    approvedDetail
      .getByTestId("client-approval-actions")
      .locator('form button[type="submit"]'),
  ).toHaveCount(0);
  await assertDeliverable(seed.mainDeliverableId, {
    status: "client_approved",
    current_version_id: version3.id,
  });

  await seedPersistentVersionFiles({
    client: seeded.client,
    seed,
    versionId: version3.id,
  });

  await signInViaUi(page, seed.actors.tenantAdmin);
  await page.goto(boardPath(seed), { waitUntil: "domcontentloaded" });
  const deliveryButton = cardFor(page, "S015 Persistent Browser Journey")
    .locator(
      'form:has(input[name="workflowStep"][value="deliver_after_client_approval"]) button[type="submit"]',
    );
  await expect(deliveryButton).toBeVisible();
  await deliveryButton.evaluate((button: HTMLButtonElement) => {
    button.click();
    button.click();
  });
  await expectBoardSaved(page);
  await assertDeliverable(seed.mainDeliverableId, {
    status: "delivered",
    current_version_id: version3.id,
  });

  await page.goto(boardPath(seed), { waitUntil: "domcontentloaded" });
  const deliveredCard = cardFor(page, "S015 Persistent Browser Journey");
  await expect(deliveredCard).toBeVisible();
  const reopenOption = deliveredCard.locator('option[value="in_progress"]');
  if ((await reopenOption.count()) > 0) {
    await expect(reopenOption.first()).toHaveAttribute("disabled", "");
  }

  const deliveryAssertions = await Promise.all([
    seeded.client
      .from("audit_events")
      .select("id", { count: "exact", head: true })
      .eq("target_id", version3.id)
      .eq("action", "DeliverableFinalDelivered"),
    seeded.client
      .from("package_ledger_entries")
      .select("id", { count: "exact", head: true })
      .eq("deliverable_id", seed.mainDeliverableId)
      .eq("entry_type", "quantity_consumed"),
    seeded.client
      .from("mvp_command_requests")
      .select("id", { count: "exact", head: true })
      .eq("deliverable_id", seed.mainDeliverableId)
      .eq("command_name", "deliver"),
    seeded.client
      .from("deliverable_allocations")
      .select("status")
      .eq("id", seed.allocationId)
      .single(),
    seeded.client
      .from("sla_timeline_segments")
      .select("kind")
      .eq("deliverable_id", seed.mainDeliverableId)
      .eq("kind", "completed")
      .single(),
  ]);
  expect(deliveryAssertions[0].count).toBe(1);
  expect(deliveryAssertions[1].count).toBe(1);
  expect(deliveryAssertions[2].count).toBe(1);
  expect(deliveryAssertions[3].data?.status).toBe("consumed_later");
  expect(deliveryAssertions[4].data?.kind).toBe("completed");

  await signInViaUi(page, seed.actors.clientViewer);
  await page.goto("/client", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("client-approval-detail")).toBeVisible();
  await expect(page.locator('[data-file-visibility="final_delivery"]')).toHaveCount(1);
  await expect(page.locator('[data-file-visibility="internal_only"]')).toHaveCount(0);
  await expect(page.getByText("final replacement")).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});

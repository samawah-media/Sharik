import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  expectNoHorizontalOverflow,
  persistentDeliverableNames,
  seedPersistentLifecycle,
  seedPersistentClientReviewImage,
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

const expectReactHydrated = async (locator: Locator) => {
  await expect
    .poll(
      async () =>
        locator
          .evaluate((element) =>
            Object.keys(element).some((key) => key.startsWith("__reactProps$")),
          )
          .catch(() => false),
      { timeout: 60_000 },
    )
    .toBe(true);
};

const openDrawer = async (card: Locator) => {
  const page = card.page();
  const drawer = page.getByTestId("deliverable-drawer");
  if (!(await drawer.isVisible())) {
    const trigger = card.getByRole("button", { name: "فتح مساحة المخرج" });
    await expectReactHydrated(trigger);
    await expect(trigger).toBeEnabled();
    await trigger.click();
  }
  await expect(drawer).toBeVisible();
  return drawer;
};

const openDrawerTab = async (drawer: Locator, name: string | RegExp) => {
  const tab = drawer.getByRole("tab", { name }).first();
  await expect(tab).toBeVisible();
  await tab.click();
};

const submitVersion = async ({
  card,
  note,
  versionNumber,
}: {
  card: Locator;
  note: string;
  versionNumber: number;
}) => {
  const drawer = await openDrawer(card);
  await openDrawerTab(drawer, "المحتوى والنسخ");
  await drawer.locator('input[name="versionNumber"]').fill(String(versionNumber));
  await drawer.locator('textarea[name="contentBody"]').fill(note);
  await drawer.getByRole("button", { name: "حفظ وإرسال للمراجعة" }).click();
  await expect(
    drawer.getByText("تم إرسال النسخة للمراجعة الداخلية."),
  ).toBeVisible();
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
    | "prepare_for_delivery"
    | "deliver_after_client_approval";
  reason?: string;
}) => {
  const drawer = await openDrawer(card);
  await openDrawerTab(drawer, "المحتوى والنسخ");
  if (
    step === "send_to_client" ||
    step === "deliver_after_client_approval"
  ) {
    await drawer
      .getByRole("button", {
        name:
          step === "send_to_client"
            ? "راجعت النسخة والملفات"
            : "راجعت بيانات التسليم",
      })
      .click();
  }
  const form = drawer.locator(
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
    .select(
      "id, tenant_id, client_id, deliverable_id, version_number, status, submitted_by",
    )
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
  await expect(cardFor(page, persistentDeliverableNames.account)).toBeVisible();
  await expect(page.getByText(persistentDeliverableNames.clientB)).toHaveCount(
    0,
  );

  await signInViaUi(page, seed.actors.assignedDesigner);
  await page.goto(boardPath(seed), { waitUntil: "domcontentloaded" });
  const designerCard = cardFor(page, persistentDeliverableNames.designer);
  await expect(designerCard).toBeVisible();
  await expect(cardFor(page, persistentDeliverableNames.main)).toHaveCount(0);
  await submitVersion({
    card: designerCard,
    versionNumber: 1,
    note: "designer browser draft",
  });
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
    await expect(cardFor(page, persistentDeliverableNames.main)).toHaveCount(
      0,
    );
    await expect(page.locator('input[name="versionNumber"]')).toHaveCount(0);
  }

  await signInViaUi(page, seed.actors.sameTenantOtherClient);
  await page.goto(boardPath(seed), { waitUntil: "domcontentloaded" });
  await expect(cardFor(page, persistentDeliverableNames.main)).toHaveCount(0);
  await expect(page.getByTestId("kanban-board-scroll")).toHaveCount(0);

  await signInViaUi(page, seed.actors.otherTenantAdmin);
  await page.goto(boardPath(seed), { waitUntil: "domcontentloaded" });
  await expect(cardFor(page, persistentDeliverableNames.main)).toHaveCount(0);
  await expect(page.getByTestId("kanban-board-scroll")).toHaveCount(0);

  await signInViaUi(page, seed.actors.assignedWriter);
  await page.goto(boardPath(seed), { waitUntil: "domcontentloaded" });
  const writerCard = cardFor(page, persistentDeliverableNames.main);
  await expect(writerCard).toBeVisible();
  await expect(cardFor(page, persistentDeliverableNames.designer)).toHaveCount(
    0,
  );
  await expect(cardFor(page, persistentDeliverableNames.account)).toHaveCount(
    0,
  );
  await expect(cardFor(page, persistentDeliverableNames.clientB)).toHaveCount(0);
  await submitVersion({
    card: writerCard,
    versionNumber: 1,
    note: "first draft",
  });
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
  let managementCard = cardFor(page, persistentDeliverableNames.main);
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
    card: cardFor(page, persistentDeliverableNames.main),
    versionNumber: 2,
    note: "replacement draft",
  });
  const version2 = await latestVersion(seed.mainDeliverableId);
  const reviewFileId = await seedPersistentClientReviewImage({
    client: seeded.client,
    seed,
    versionId: version2.id,
  });
  await assertDeliverable(seed.mainDeliverableId, {
    status: "ready_for_internal_review",
    current_version_id: version2.id,
  });

  await signInViaUi(page, seed.actors.tenantAdmin);
  await page.goto(boardPath(seed), { waitUntil: "domcontentloaded" });
  managementCard = cardFor(page, persistentDeliverableNames.main);
  const managementDrawer = await openDrawer(managementCard);
  await expect(
    managementDrawer.locator(
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
  managementCard = cardFor(page, persistentDeliverableNames.main);
  const reviewDrawer = await openDrawer(managementCard);
  await openDrawerTab(reviewDrawer, "الملفات");
  await expect(
    reviewDrawer.locator("li").filter({ hasText: "review.png" }).first(),
  ).toBeVisible();
  await reviewDrawer
    .getByRole("button", { name: "تجهيز للعميل" })
    .click();
  await expect(
    reviewDrawer.getByText("جاهز للإرسال للعميل"),
  ).toBeVisible();
  const stagedReviewFile = await seeded.client
    .from("file_assets")
    .select("visibility")
    .eq("id", reviewFileId)
    .single();
  expect(stagedReviewFile.error).toBeNull();
  expect(stagedReviewFile.data?.visibility).toBe("client_visible");
  const failedVideoName = `failed-${seed.mainDeliverableId.slice(-8)}.mp4`;
  await page.route("**/storage/v1/upload/resumable*", async (route) => {
    await route.abort("failed");
  });
  const failedVideoInput = reviewDrawer
    .locator('input[type="file"]:not([webkitdirectory])')
    .last();
  await failedVideoInput.setInputFiles({
    name: failedVideoName,
    mimeType: "video/mp4",
    buffer: Buffer.from("synthetic failed video"),
  });
  await reviewDrawer
    .locator("button.uppy-StatusBar-actionBtn--upload")
    .click();
  await expect(
    reviewDrawer.getByText(`فشل رفع ${failedVideoName}. لم يُربط الملف بالمخرج؛ أعد المحاولة أو ألغِه بوضوح.`),
  ).toBeVisible({ timeout: 30_000 });
  await openDrawerTab(reviewDrawer, "المحتوى والنسخ");
  await expect(
    reviewDrawer.getByRole("button", { name: "راجعت النسخة والملفات" }),
  ).toBeDisabled();
  const failedVideoRows = await seeded.client
    .from("file_assets")
    .select("id")
    .eq("deliverable_id", seed.mainDeliverableId)
    .eq("file_name", failedVideoName);
  expect(failedVideoRows.error).toBeNull();
  expect(failedVideoRows.data).toHaveLength(0);
  const failedAttempts = await seeded.client
    .from("file_upload_attempts")
    .select("id, status, version_id, storage_path")
    .eq("deliverable_id", seed.mainDeliverableId)
    .eq("file_name", failedVideoName)
    .eq("status", "failed");
  expect(failedAttempts.error).toBeNull();
  expect(failedAttempts.data).toHaveLength(1);
  expect(failedAttempts.data?.[0]?.version_id).toBe(version2.id);
  const failedAttemptId = failedAttempts.data?.[0]?.id;
  expect(failedAttemptId).toBeTruthy();
  await page.unroute("**/storage/v1/upload/resumable*");
  await page.reload({ waitUntil: "domcontentloaded" });
  managementCard = cardFor(page, persistentDeliverableNames.main);
  const restoredDrawer = await openDrawer(managementCard);
  await openDrawerTab(restoredDrawer, "الملفات");
  await expect(
    restoredDrawer.getByText(failedVideoName),
  ).toBeVisible();
  await openDrawerTab(restoredDrawer, "المحتوى والنسخ");
  await expect(
    restoredDrawer.getByRole("button", { name: "راجعت النسخة والملفات" }),
  ).toBeDisabled();
  await openDrawerTab(restoredDrawer, "الملفات");
  await restoredDrawer
    .getByRole("button", { name: "إلغاء المحاولة وتسجيل القرار" })
    .click();
  await expect(
    restoredDrawer.getByText(
      `أُلغيت محاولة رفع ${failedVideoName} وسُجل القرار في سجل التدقيق.`,
    ),
  ).toBeVisible();
  const cancelledAttempt = await seeded.client
    .from("file_upload_attempts")
    .select("status")
    .eq("id", failedAttemptId!)
    .single();
  expect(cancelledAttempt.error).toBeNull();
  expect(cancelledAttempt.data?.status).toBe("cancelled");
  const cancellationAudit = await seeded.client
    .from("audit_events")
    .select("id", { count: "exact", head: true })
    .eq("action", "FileUploadAttemptCancelled")
    .eq("target_id", failedAttemptId!);
  expect(cancellationAudit.count).toBe(1);
  await expect(
    restoredDrawer.locator("li:visible").filter({ hasText: "review.png" }),
  ).toBeVisible();
  await expect(
    restoredDrawer.locator("li:visible").filter({ hasText: failedVideoName }),
  ).toHaveCount(0);
  await restoredDrawer.getByRole("button", { name: "إغلاق" }).click();
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
  await page.goto("/client/pending", { waitUntil: "domcontentloaded" });
  const viewerDetail = page.getByTestId("client-approval-detail");
  await expect(viewerDetail).toBeVisible();
  await expect(
    viewerDetail
      .getByTestId("client-approval-actions")
      .locator('form button[type="submit"]'),
  ).toHaveCount(0);
  await expect(page.getByText("first draft")).toHaveCount(0);
  await expect(page.getByText("replacement draft")).toBeVisible();
  await expect(page.getByText(persistentDeliverableNames.clientB)).toHaveCount(
    0,
  );

  const staleContext = await browser.newContext({
    baseURL: baseURL ?? undefined,
  });
  const stalePage = await staleContext.newPage();
  await signInViaUi(stalePage, seed.actors.clientApprover);
  await stalePage.goto("/client/pending", { waitUntil: "domcontentloaded" });
  await expect(stalePage.getByTestId("client-approval-detail")).toBeVisible();
  const staleVersionId = await stalePage
    .locator('input[name="versionId"]')
    .first()
    .inputValue();
  expect(staleVersionId).toBe(version2.id);

  await signInViaUi(page, seed.actors.clientApprover);
  await page.goto("/client/pending", { waitUntil: "domcontentloaded" });
  await page.locator('textarea[name="reason"]').fill("client requested polish");
  await page
    .locator(
      'form:has(input[name="clientApprovalAction"][value="request_changes"]) button[type="submit"]',
    )
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
    card: cardFor(page, persistentDeliverableNames.main),
    versionNumber: 3,
    note: "final replacement",
  });
  const version3 = await latestVersion(seed.mainDeliverableId);

  await signInViaUi(page, seed.actors.tenantAdmin);
  await page.goto(boardPath(seed), { waitUntil: "domcontentloaded" });
  managementCard = cardFor(page, persistentDeliverableNames.main);
  await runManagementStep({ card: managementCard, step: "approve_internally" });
  await expectBoardSaved(page);
  await page.goto(boardPath(seed), { waitUntil: "domcontentloaded" });
  await runManagementStep({
    card: cardFor(page, persistentDeliverableNames.main),
    step: "send_to_client",
  });
  await expectBoardSaved(page);
  await assertDeliverable(seed.mainDeliverableId, {
    status: "waiting_client_approval",
    current_version_id: version3.id,
  });

  await stalePage.reload({ waitUntil: "domcontentloaded" });
  await expect(stalePage.getByTestId("client-approval-detail")).toBeVisible();
  await expect(stalePage.locator('input[name="versionId"]').first()).toHaveValue(
    version3.id,
  );
  const staleDecisionCount = await seeded.client
    .from("approval_decisions")
    .select("id", { count: "exact", head: true })
    .eq("version_id", version2.id)
    .eq("approval_kind", "client")
    .eq("decision", "approved");
  expect(staleDecisionCount.count).toBe(0);
  await staleContext.close();

  await signInViaUi(page, seed.actors.clientApprover);
  await page.goto("/client/pending", { waitUntil: "domcontentloaded" });
  await page
    .locator(
      'form:has(input[name="clientApprovalAction"][value="approve"]) button[type="submit"]',
    )
    .click();
  await expect(page.getByTestId("client-approval-detail")).toHaveCount(0);
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
  await runManagementStep({
    card: cardFor(page, persistentDeliverableNames.main),
    step: "prepare_for_delivery",
  });
  await expectBoardSaved(page);
  await assertDeliverable(seed.mainDeliverableId, {
    status: "ready_for_delivery",
    current_version_id: version3.id,
  });

  await page.goto(boardPath(seed), { waitUntil: "domcontentloaded" });
  const deliveryDrawer = await openDrawer(
    cardFor(page, persistentDeliverableNames.main),
  );
  await openDrawerTab(deliveryDrawer, "المحتوى والنسخ");
  await deliveryDrawer
    .getByRole("button", { name: "راجعت بيانات التسليم" })
    .click();
  const deliveryButton = deliveryDrawer.locator(
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
  const deliveredCard = cardFor(page, persistentDeliverableNames.main);
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
      .eq("command_name", "deliver_ready_version"),
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
  await page.goto("/client/files", { waitUntil: "domcontentloaded" });
  // The delivered final file is the only client-visible card; the internal
  // replacement content never leaks. (The board no longer exposes a raw
  // visibility enum in the DOM — X010-B-5 — so assert by the neutral card
  // testid and by the absence of internal text.)
  await expect(
    page.locator('[data-testid="client-file-card"]'),
  ).toHaveCount(1);
  await expect(page.getByText("final replacement")).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});

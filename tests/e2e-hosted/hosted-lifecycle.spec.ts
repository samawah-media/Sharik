import { expect, test, type Browser, type Locator, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import {
  createHostedActorClient,
  seedHostedLifecycle,
} from "./support/hosted-lifecycle-harness";
import {
  signInHostedPersona,
  type HostedPersona,
} from "./support/uat-personas";

test.describe.configure({ mode: "serial", timeout: 900_000 });

const vercelStorageStatePath = path.resolve(
  process.cwd(),
  "test-results/s015-vercel-share-state.json",
);

const cardFor = (page: Page, name: string) =>
  page.locator("article").filter({ hasText: name }).first();

const openPersonaSession = async ({
  actor,
  baseURL,
  browser,
}: {
  actor: HostedPersona;
  baseURL: string;
  browser: Browser;
}) => {
  const context = await browser.newContext({
    baseURL,
    ...(fs.existsSync(vercelStorageStatePath)
      ? { storageState: vercelStorageStatePath }
      : {}),
  });
  const page = await context.newPage();
  await signInHostedPersona(page, actor);
  return { context, page };
};

const withPersona = async <T>({
  actor,
  baseURL,
  browser,
  run,
}: {
  actor: HostedPersona;
  baseURL: string;
  browser: Browser;
  run: (page: Page) => Promise<T>;
}) => {
  const session = await openPersonaSession({ actor, baseURL, browser });
  try {
    return await run(session.page);
  } finally {
    await session.context.close();
  }
};

const expectReactHydrated = async (trigger: Locator) => {
  await expect
    .poll(
      async () =>
        trigger
          .evaluate((element) =>
            Object.keys(element).some((key) => key.startsWith("__reactProps$")),
          )
          .catch(() => false),
      { timeout: 60_000 },
    )
    .toBe(true);
};

const openDeliverableWorkspace = async (page: Page, name: string) => {
  const card = cardFor(page, name);
  await expect(card).toBeVisible();
  const trigger = card.getByRole("button", { name: "فتح مساحة المخرج" });
  await expectReactHydrated(trigger);
  await trigger.click();
  const drawer = page.getByTestId("deliverable-drawer");
  await expect(drawer).toBeVisible();
  await expect(
    drawer.getByRole("heading", { name: "المحتوى والنسخة" }),
  ).toBeVisible({ timeout: 60_000 });
  return drawer;
};

const latestVersion = async (
  client: Awaited<ReturnType<typeof seedHostedLifecycle>>["client"],
  deliverableId: string,
) => {
  const response = await client
    .from("deliverable_versions")
    .select(
      "id, tenant_id, client_id, deliverable_id, version_number, status, submitted_by",
    )
    .eq("deliverable_id", deliverableId)
    .order("version_number", { ascending: false })
    .limit(1)
    .single();
  expect(response.error).toBeNull();
  expect(response.data).toBeTruthy();
  return response.data!;
};

const expectDeliverable = async ({
  client,
  deliverableId,
  expected,
}: {
  client: Awaited<ReturnType<typeof seedHostedLifecycle>>["client"];
  deliverableId: string;
  expected: Partial<{
    current_version_id: string | null;
    progress_percentage: number;
    status: string;
  }>;
}) => {
  await expect
    .poll(
      async () => {
        const response = await client
          .from("deliverables")
          .select("status, progress_percentage, current_version_id")
          .eq("id", deliverableId)
          .single();
        if (response.error) return undefined;
        return response.data;
      },
      { timeout: 60_000 },
    )
    .toMatchObject(expected);
};

const submitVersion = async ({
  drawer,
  token,
  versionNumber,
}: {
  drawer: Locator;
  token: string;
  versionNumber: number;
}) => {
  const form = drawer.locator('form:has(input[name="versionNumber"])');
  await form.locator('[name="versionNumber"]').fill(String(versionNumber));
  await form.locator('[name="channel"]').fill("Instagram");
  await form.locator('[name="format"]').fill("Post");
  await form.locator('[name="objective"]').fill(`UAT objective ${token}`);
  await form.locator('[name="kpi"]').fill("Hosted acceptance");
  await form.locator('[name="brief"]').fill(`Synthetic brief ${token}`);
  await form
    .locator('[name="contentBody"]')
    .fill(`Synthetic version ${versionNumber} content ${token}`);
  await form
    .locator('[name="caption"]')
    .fill(`Synthetic caption v${versionNumber} ${token}`);
  await form
    .getByRole("button", { name: "حفظ وإرسال للمراجعة" })
    .click();
};

const addInternalComment = async ({
  body,
  drawer,
}: {
  body: string;
  drawer: Locator;
}) => {
  const form = drawer.locator(
    'form:has([contenteditable="true"][aria-label="نص التعليق"])',
  );
  await form
    .locator('[contenteditable="true"][aria-label="نص التعليق"]')
    .fill(body);
  await form.getByRole("button", { name: "إضافة التعليق" }).click();
};

const addQualityCheck = async ({
  drawer,
  label,
  status,
}: {
  drawer: Locator;
  label: string;
  status: "changes_required" | "passed";
}) => {
  const form = drawer.locator('form:has(input[name="label"])');
  await form.locator('[name="label"]').fill(label);
  await form.locator('[name="status"]').selectOption(status);
  await form
    .locator('[name="note"]')
    .fill(status === "passed" ? "UAT passed" : "UAT correction required");
  await form.getByRole("button", { name: "إضافة عنصر جودة" }).click();
};

const runManagementWorkflow = async ({
  drawer,
  reason,
  step,
}: {
  drawer: Locator;
  reason?: string;
  step:
    | "approve_internally"
    | "request_internal_changes"
    | "send_to_client"
    | "deliver_after_client_approval";
}) => {
  const form = drawer.locator(
    `form:has(input[name="workflowStep"][value="${step}"])`,
  );
  await expect(form).toBeVisible();
  if (reason) await form.locator('textarea[name="reason"]').fill(reason);
  await form.locator('button[type="submit"]').click();
};

const uploadWorkspaceFile = async ({
  drawer,
  fileName,
  visibility,
}: {
  drawer: Locator;
  fileName: string;
  visibility?: "internal_only" | "final_delivery";
}) => {
  if (visibility) {
    const selector = drawer.getByLabel("رؤية الملف");
    await expect(selector).toBeVisible({ timeout: 60_000 });
    await selector.selectOption(visibility);
  }
  const input = drawer
    .locator('input[type="file"]:not([webkitdirectory])')
    .last();
  await expect(input).toBeAttached({ timeout: 60_000 });
  await input.setInputFiles({
    name: fileName,
    mimeType: "text/plain",
    buffer: Buffer.from(`Synthetic hosted UAT file: ${fileName}`, "utf8"),
  });
  const upload = drawer.locator("button.uppy-StatusBar-actionBtn--upload");
  await expect(upload).toBeVisible({ timeout: 60_000 });
  await upload.click();
  await expect(drawer.getByText("تم حفظ 1 ملف بنجاح.")).toBeVisible({
    timeout: 120_000,
  });
};

const choosePendingDeliverable = async (page: Page, name: string) => {
  const choice = page.locator("nav button").filter({ hasText: name });
  await expect(choice).toBeVisible({ timeout: 60_000 });
  await choice.click();
  const detail = page.getByTestId("client-approval-detail");
  await expect(
    detail.getByRole("heading", { name, exact: true }),
  ).toBeVisible();
  return detail;
};

const expectNoHorizontalOverflow = async (page: Page) => {
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflows).toBe(false);
};

test("hosted UAT completes the exact persistent team-to-client lifecycle", async (
  { baseURL, browser },
  testInfo,
) => {
  test.skip(
    testInfo.project.name !== "hosted-desktop-chromium",
    "The full mutation lifecycle runs once; hosted smoke owns mobile and RTL coverage.",
  );
  if (!baseURL) throw new Error("Hosted lifecycle requires a configured base URL.");

  const { client, seed } = await seedHostedLifecycle();
  const token = seed.runId.slice(-10);
  const internalComment = `تعليق داخلي اصطناعي ${token}`;
  const internalFileName = `internal-uat-${token}.txt`;
  const finalFileName = `final-uat-${token}.txt`;

  await withPersona({
    actor: seed.actors.ACCOUNT_MANAGER,
    baseURL,
    browser,
    run: async (page) => {
      await page.goto("/work", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: "مهامي" })).toBeVisible();
      const drawer = await openDeliverableWorkspace(page, seed.deliverableName);
      await expect(drawer.locator('input[name="workflowStep"]')).toHaveCount(0);
    },
  });

  await withPersona({
    actor: seed.actors.UNASSIGNED,
    baseURL,
    browser,
    run: async (page) => {
      await page.goto("/work", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("main")).toBeVisible();
      await expect(page.getByText(seed.deliverableName)).toHaveCount(0);
    },
  });

  await withPersona({
    actor: seed.actors.ADMIN,
    baseURL,
    browser,
    run: async (page) => {
      await page.goto("/work", { waitUntil: "domcontentloaded" });
      const drawer = await openDeliverableWorkspace(page, seed.deliverableName);
      const taskForm = drawer.locator('form:has(input[name="title"])').last();
      await taskForm.locator('[name="title"]').fill(seed.taskTitle);
      await taskForm.locator('[name="description"]').fill("Synthetic hosted UAT task");
      await taskForm.locator('[name="priority"]').selectOption("high");
      await taskForm
        .locator('[name="assigneeUserId"]')
        .selectOption(seed.actors.DESIGNER.id);
      await taskForm.getByRole("button", { name: "إضافة مهمة" }).click();
      await expect(drawer.getByText(seed.taskTitle)).toBeVisible({ timeout: 60_000 });
    },
  });

  const taskResponse = await client
    .from("deliverable_tasks")
    .select("id, status, priority, assignee_user_id")
    .eq("deliverable_id", seed.deliverableId)
    .eq("title", seed.taskTitle)
    .single();
  expect(taskResponse.error).toBeNull();
  expect(taskResponse.data).toMatchObject({
    status: "todo",
    priority: "high",
    assignee_user_id: seed.actors.DESIGNER.id,
  });

  await withPersona({
    actor: seed.actors.DESIGNER,
    baseURL,
    browser,
    run: async (page) => {
      await page.goto("/work", { waitUntil: "domcontentloaded" });
      const drawer = await openDeliverableWorkspace(page, seed.deliverableName);
      await drawer
        .getByRole("combobox", { name: `حالة المهمة: ${seed.taskTitle}` })
        .selectOption("done");
    },
  });
  await expect
    .poll(async () => {
      const response = await client
        .from("deliverable_tasks")
        .select("status")
        .eq("id", taskResponse.data!.id)
        .single();
      return response.data?.status;
    })
    .toBe("done");

  await withPersona({
    actor: seed.actors.CONTENT_WRITER,
    baseURL,
    browser,
    run: async (page) => {
      await page.goto("/work", { waitUntil: "domcontentloaded" });
      let drawer = await openDeliverableWorkspace(page, seed.deliverableName);
      await submitVersion({ drawer, token, versionNumber: 1 });
      await expectDeliverable({
        client,
        deliverableId: seed.deliverableId,
        expected: { status: "ready_for_internal_review" },
      });
      await page.goto("/work", { waitUntil: "domcontentloaded" });
      drawer = await openDeliverableWorkspace(page, seed.deliverableName);
      await addInternalComment({ body: internalComment, drawer });
      await expect(drawer.getByText(internalComment)).toBeVisible({ timeout: 60_000 });
      await uploadWorkspaceFile({
        drawer,
        fileName: internalFileName,
      });
    },
  });

  const version1 = await latestVersion(client, seed.deliverableId);
  expect(version1).toMatchObject({
    tenant_id: seed.tenantId,
    client_id: seed.clientId,
    deliverable_id: seed.deliverableId,
    version_number: 1,
    submitted_by: seed.actors.CONTENT_WRITER.id,
  });

  const accountManagerClient = await createHostedActorClient({
    actor: seed.actors.ACCOUNT_MANAGER,
    seed,
  });
  const accountManagerApproval = await accountManagerClient.rpc(
    "s015_execute_internal_workflow",
    {
      target_client_id: seed.clientId,
      target_deliverable_id: seed.deliverableId,
      target_version_id: version1.id,
      target_command: "approve_internal",
      target_version_number: null,
      command_comment: "account manager denial probe",
      request_id: crypto.randomUUID(),
      audit_event_id: crypto.randomUUID(),
      request_idempotency_key: `${seed.runId}-account-manager-denied`,
    },
  );
  expect(accountManagerApproval.error).not.toBeNull();
  await accountManagerClient.auth.signOut();

  await withPersona({
    actor: seed.actors.ADMIN,
    baseURL,
    browser,
    run: async (page) => {
      await page.goto("/work", { waitUntil: "domcontentloaded" });
      let drawer = await openDeliverableWorkspace(page, seed.deliverableName);
      await addQualityCheck({
        drawer,
        label: `${seed.qualityLabel} v1`,
        status: "changes_required",
      });
      await expect(drawer.getByText(`${seed.qualityLabel} v1`)).toBeVisible({
        timeout: 60_000,
      });
      await runManagementWorkflow({ drawer, step: "approve_internally" });
      await expectDeliverable({
        client,
        deliverableId: seed.deliverableId,
        expected: { status: "ready_for_internal_review" },
      });
      await page.goto("/work", { waitUntil: "domcontentloaded" });
      drawer = await openDeliverableWorkspace(page, seed.deliverableName);
      await runManagementWorkflow({
        drawer,
        step: "request_internal_changes",
        reason: "Synthetic internal correction requested",
      });
    },
  });
  await expectDeliverable({
    client,
    deliverableId: seed.deliverableId,
    expected: { status: "internal_changes_requested" },
  });

  await withPersona({
    actor: seed.actors.CONTENT_WRITER,
    baseURL,
    browser,
    run: async (page) => {
      await page.goto("/work", { waitUntil: "domcontentloaded" });
      await submitVersion({
        drawer: await openDeliverableWorkspace(page, seed.deliverableName),
        token,
        versionNumber: 2,
      });
    },
  });
  await expectDeliverable({
    client,
    deliverableId: seed.deliverableId,
    expected: { status: "ready_for_internal_review" },
  });
  const version2 = await latestVersion(client, seed.deliverableId);
  expect(version2.version_number).toBe(2);

  await withPersona({
    actor: seed.actors.ADMIN,
    baseURL,
    browser,
    run: async (page) => {
      await page.goto("/work", { waitUntil: "domcontentloaded" });
      let drawer = await openDeliverableWorkspace(page, seed.deliverableName);
      await addQualityCheck({
        drawer,
        label: `${seed.qualityLabel} v2`,
        status: "passed",
      });
      await expect(drawer.getByText(`${seed.qualityLabel} v2`)).toBeVisible({
        timeout: 60_000,
      });
      await runManagementWorkflow({ drawer, step: "approve_internally" });
      await expectDeliverable({
        client,
        deliverableId: seed.deliverableId,
        expected: { status: "internally_approved" },
      });
      await page.goto("/work", { waitUntil: "domcontentloaded" });
      drawer = await openDeliverableWorkspace(page, seed.deliverableName);
      await runManagementWorkflow({ drawer, step: "send_to_client" });
    },
  });
  await expectDeliverable({
    client,
    deliverableId: seed.deliverableId,
    expected: { status: "waiting_client_approval", current_version_id: version2.id },
  });

  const pausedSla = await client
    .from("sla_timeline_segments")
    .select("kind")
    .eq("deliverable_id", seed.deliverableId)
    .is("ended_at", null)
    .single();
  expect(pausedSla.error).toBeNull();
  expect(pausedSla.data?.kind).toBe("paused_waiting_client");

  await withPersona({
    actor: seed.actors.CLIENT_VIEWER,
    baseURL,
    browser,
    run: async (page) => {
      await page.goto("/client/pending", { waitUntil: "domcontentloaded" });
      const detail = await choosePendingDeliverable(page, seed.deliverableName);
      await expect(
        detail.locator('form:has(input[name="clientApprovalAction"])'),
      ).toHaveCount(0);
      await expect(page.getByText(internalComment)).toHaveCount(0);
      await expect(page.getByText(seed.taskTitle)).toHaveCount(0);
      await expect(page.getByText(seed.qualityLabel)).toHaveCount(0);
      await expect(page.getByText(internalFileName)).toHaveCount(0);
      await expectNoHorizontalOverflow(page);
    },
  });

  const staleSession = await openPersonaSession({
    actor: seed.actors.CLIENT_APPROVER,
    baseURL,
    browser,
  });
  await staleSession.page.goto("/client/pending", {
    waitUntil: "domcontentloaded",
  });
  const staleDetail = await choosePendingDeliverable(
    staleSession.page,
    seed.deliverableName,
  );
  const staleVersionId = await staleDetail
    .locator('input[name="versionId"]')
    .first()
    .inputValue();
  expect(staleVersionId).toBe(version2.id);

  await withPersona({
    actor: seed.actors.CLIENT_APPROVER,
    baseURL,
    browser,
    run: async (page) => {
      await page.goto("/client/pending", { waitUntil: "domcontentloaded" });
      const detail = await choosePendingDeliverable(page, seed.deliverableName);
      const changesForm = detail.locator(
        'form:has(input[name="clientApprovalAction"][value="request_changes"])',
      );
      await changesForm
        .locator('textarea[name="reason"]')
        .fill(`طلب تعديل عميل اصطناعي ${token}`);
      await changesForm.locator('button[type="submit"]').click();
    },
  });
  await expectDeliverable({
    client,
    deliverableId: seed.deliverableId,
    expected: { status: "client_changes_requested", current_version_id: version2.id },
  });

  const resumedSla = await client
    .from("sla_timeline_segments")
    .select("kind")
    .eq("deliverable_id", seed.deliverableId)
    .is("ended_at", null)
    .single();
  expect(resumedSla.error).toBeNull();
  expect(resumedSla.data?.kind).toBe("resumed");

  await withPersona({
    actor: seed.actors.CONTENT_WRITER,
    baseURL,
    browser,
    run: async (page) => {
      await page.goto("/work", { waitUntil: "domcontentloaded" });
      await submitVersion({
        drawer: await openDeliverableWorkspace(page, seed.deliverableName),
        token,
        versionNumber: 3,
      });
    },
  });
  await expectDeliverable({
    client,
    deliverableId: seed.deliverableId,
    expected: { status: "ready_for_internal_review" },
  });
  const version3 = await latestVersion(client, seed.deliverableId);
  expect(version3.version_number).toBe(3);

  await withPersona({
    actor: seed.actors.ADMIN,
    baseURL,
    browser,
    run: async (page) => {
      await page.goto("/work", { waitUntil: "domcontentloaded" });
      let drawer = await openDeliverableWorkspace(page, seed.deliverableName);
      await addQualityCheck({
        drawer,
        label: `${seed.qualityLabel} v3`,
        status: "passed",
      });
      await runManagementWorkflow({ drawer, step: "approve_internally" });
      await expectDeliverable({
        client,
        deliverableId: seed.deliverableId,
        expected: { status: "internally_approved" },
      });
      await page.goto("/work", { waitUntil: "domcontentloaded" });
      drawer = await openDeliverableWorkspace(page, seed.deliverableName);
      await runManagementWorkflow({ drawer, step: "send_to_client" });
    },
  });
  await expectDeliverable({
    client,
    deliverableId: seed.deliverableId,
    expected: { status: "waiting_client_approval", current_version_id: version3.id },
  });

  const staleApproveForm = staleDetail.locator(
    'form:has(input[name="clientApprovalAction"][value="approve"])',
  );
  await staleApproveForm.locator('button[type="submit"]').click();
  await expectDeliverable({
    client,
    deliverableId: seed.deliverableId,
    expected: { status: "waiting_client_approval", current_version_id: version3.id },
  });
  const staleApproval = await client
    .from("approval_decisions")
    .select("id", { count: "exact", head: true })
    .eq("deliverable_id", seed.deliverableId)
    .eq("version_id", version2.id)
    .eq("approval_kind", "client")
    .eq("decision", "approved");
  expect(staleApproval.error).toBeNull();
  expect(staleApproval.count).toBe(0);
  await staleSession.context.close();

  await withPersona({
    actor: seed.actors.CLIENT_APPROVER,
    baseURL,
    browser,
    run: async (page) => {
      await page.goto("/client/pending", { waitUntil: "domcontentloaded" });
      const detail = await choosePendingDeliverable(page, seed.deliverableName);
      await detail
        .locator(
          'form:has(input[name="clientApprovalAction"][value="approve"]) button[type="submit"]',
        )
        .click();
    },
  });
  await expectDeliverable({
    client,
    deliverableId: seed.deliverableId,
    expected: { status: "client_approved", current_version_id: version3.id },
  });

  await withPersona({
    actor: seed.actors.ADMIN,
    baseURL,
    browser,
    run: async (page) => {
      await page.goto("/work", { waitUntil: "domcontentloaded" });
      let drawer = await openDeliverableWorkspace(page, seed.deliverableName);
      await uploadWorkspaceFile({
        drawer,
        fileName: finalFileName,
        visibility: "final_delivery",
      });
      await page.goto("/work", { waitUntil: "domcontentloaded" });
      drawer = await openDeliverableWorkspace(page, seed.deliverableName);
      const deliveryButton = drawer.locator(
        'form:has(input[name="workflowStep"][value="deliver_after_client_approval"]) button[type="submit"]',
      );
      await expect(deliveryButton).toBeVisible();
      await deliveryButton.evaluate((button: HTMLButtonElement) => {
        button.click();
        button.click();
      });
    },
  });
  await expectDeliverable({
    client,
    deliverableId: seed.deliverableId,
    expected: {
      status: "delivered",
      progress_percentage: 100,
      current_version_id: version3.id,
    },
  });

  const [
    deliveryAudit,
    deliveryLedger,
    deliveryRequests,
    allocation,
    completedSla,
    taskAudit,
    qualityAudit,
    decisions,
    files,
    comments,
  ] = await Promise.all([
    client
      .from("audit_events")
      .select("id", { count: "exact", head: true })
      .eq("target_id", version3.id)
      .eq("action", "DeliverableFinalDelivered"),
    client
      .from("package_ledger_entries")
      .select("id", { count: "exact", head: true })
      .eq("deliverable_id", seed.deliverableId)
      .eq("entry_type", "quantity_consumed"),
    client
      .from("mvp_command_requests")
      .select("id", { count: "exact", head: true })
      .eq("deliverable_id", seed.deliverableId)
      .eq("command_name", "deliver"),
    client
      .from("deliverable_allocations")
      .select("status")
      .eq("id", seed.allocationId)
      .single(),
    client
      .from("sla_timeline_segments")
      .select("kind")
      .eq("deliverable_id", seed.deliverableId)
      .eq("kind", "completed")
      .single(),
    client
      .from("audit_events")
      .select("action")
      .eq("target_id", seed.deliverableId)
      .eq("reason", "upsert_deliverable_task"),
    client
      .from("audit_events")
      .select("action")
      .in("target_id", [version1.id, version2.id, version3.id])
      .eq("reason", "upsert_quality_check"),
    client
      .from("approval_decisions")
      .select("version_id, approval_kind, decision, actor_user_id")
      .eq("deliverable_id", seed.deliverableId),
    client
      .from("file_assets")
      .select("id, file_name, visibility, version_id, is_final, upload_state")
      .eq("deliverable_id", seed.deliverableId),
    client
      .from("comments")
      .select("body, visibility, version_id")
      .eq("deliverable_id", seed.deliverableId),
  ]);

  for (const response of [
    deliveryAudit,
    deliveryLedger,
    deliveryRequests,
    allocation,
    completedSla,
    taskAudit,
    qualityAudit,
    decisions,
    files,
    comments,
  ]) {
    expect(response.error).toBeNull();
  }
  expect(deliveryAudit.count).toBe(1);
  expect(deliveryLedger.count).toBe(1);
  expect(deliveryRequests.count).toBe(1);
  expect(allocation.data?.status).toBe("consumed_later");
  expect(completedSla.data?.kind).toBe("completed");
  expect((taskAudit.data ?? []).map((event) => event.action)).toEqual(
    expect.arrayContaining(["DeliverableTaskCreated", "DeliverableTaskUpdated"]),
  );
  expect((qualityAudit.data ?? []).map((event) => event.action)).toEqual(
    expect.arrayContaining(["QualityCheckCreated"]),
  );
  const currentFileIds = (files.data ?? []).map((file) => file.id);
  expect(currentFileIds).toHaveLength(2);
  const fileAudit = await client
    .from("audit_events")
    .select("id", { count: "exact", head: true })
    .eq("action", "FileAssetRegistered")
    .in("target_id", currentFileIds);
  expect(fileAudit.error).toBeNull();
  expect(fileAudit.count).toBe(2);
  expect(decisions.data).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        version_id: version1.id,
        approval_kind: "internal",
        decision: "changes_requested",
        actor_user_id: seed.actors.ADMIN.id,
      }),
      expect.objectContaining({
        version_id: version2.id,
        approval_kind: "internal",
        decision: "approved",
        actor_user_id: seed.actors.ADMIN.id,
      }),
      expect.objectContaining({
        version_id: version2.id,
        approval_kind: "client",
        decision: "changes_requested",
        actor_user_id: seed.actors.CLIENT_APPROVER.id,
      }),
      expect.objectContaining({
        version_id: version3.id,
        approval_kind: "internal",
        decision: "approved",
        actor_user_id: seed.actors.ADMIN.id,
      }),
      expect.objectContaining({
        version_id: version3.id,
        approval_kind: "client",
        decision: "approved",
        actor_user_id: seed.actors.CLIENT_APPROVER.id,
      }),
    ]),
  );
  expect(files.data).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        file_name: internalFileName,
        visibility: "internal_only",
        version_id: version1.id,
        is_final: false,
        upload_state: "ready",
      }),
      expect.objectContaining({
        file_name: finalFileName,
        visibility: "final_delivery",
        version_id: version3.id,
        is_final: true,
        upload_state: "ready",
      }),
    ]),
  );
  expect(comments.data).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        body: internalComment,
        visibility: "internal_only",
        version_id: version1.id,
      }),
    ]),
  );

  const viewerClient = await createHostedActorClient({
    actor: seed.actors.CLIENT_VIEWER,
    seed,
  });
  const [viewerTasks, viewerQuality, viewerComments, viewerFiles] =
    await Promise.all([
      viewerClient
        .from("deliverable_tasks")
        .select("id")
        .eq("deliverable_id", seed.deliverableId),
      viewerClient
        .from("deliverable_quality_checks")
        .select("id")
        .eq("deliverable_id", seed.deliverableId),
      viewerClient
        .from("comments")
        .select("body, visibility")
        .eq("deliverable_id", seed.deliverableId),
      viewerClient
        .from("file_assets")
        .select("file_name, visibility")
        .eq("deliverable_id", seed.deliverableId),
    ]);
  for (const response of [viewerTasks, viewerQuality, viewerComments, viewerFiles]) {
    expect(response.error).toBeNull();
  }
  expect(viewerTasks.data).toEqual([]);
  expect(viewerQuality.data).toEqual([]);
  expect(viewerComments.data?.some((comment) => comment.body === internalComment)).toBe(
    false,
  );
  expect(viewerFiles.data).toEqual([
    { file_name: finalFileName, visibility: "final_delivery" },
  ]);
  await viewerClient.auth.signOut();

  const unassignedClient = await createHostedActorClient({
    actor: seed.actors.UNASSIGNED,
    seed,
  });
  const unassignedRead = await unassignedClient
    .from("deliverables")
    .select("id")
    .eq("id", seed.deliverableId);
  expect(unassignedRead.error).toBeNull();
  expect(unassignedRead.data).toEqual([]);
  await unassignedClient.auth.signOut();

  const adminClient = await createHostedActorClient({
    actor: seed.actors.ADMIN,
    seed,
  });
  const terminalReplay = await adminClient.rpc("s015_execute_internal_workflow", {
    target_client_id: seed.clientId,
    target_deliverable_id: seed.deliverableId,
    target_version_id: version3.id,
    target_command: "request_internal_changes",
    target_version_number: null,
    command_comment: "terminal state denial probe",
    request_id: crypto.randomUUID(),
    audit_event_id: crypto.randomUUID(),
    request_idempotency_key: `${seed.runId}-terminal-denied`,
  });
  expect(terminalReplay.error).not.toBeNull();
  await adminClient.auth.signOut();

  await withPersona({
    actor: seed.actors.CLIENT_VIEWER,
    baseURL,
    browser,
    run: async (page) => {
      await page.goto("/client/files", { waitUntil: "domcontentloaded" });
      const finalFile = page.locator("li").filter({ hasText: finalFileName });
      await expect(finalFile).toBeVisible({ timeout: 60_000 });
      await expect(page.getByText(internalFileName)).toHaveCount(0);
      await finalFile.getByRole("button", { name: "معاينة" }).click();
      await expect(
        finalFile.getByText(
          "لا توجد معاينة مرئية لهذا النوع. استخدم التنزيل الآمن.",
        ),
      ).toBeVisible({ timeout: 60_000 });
      await expectNoHorizontalOverflow(page);
    },
  });

  await withPersona({
    actor: seed.actors.ADMIN,
    baseURL,
    browser,
    run: async (page) => {
      await page.goto("/work", { waitUntil: "domcontentloaded" });
      const drawer = await openDeliverableWorkspace(page, seed.deliverableName);
      await expect(drawer.locator('input[name="versionNumber"]')).toHaveCount(0);
      await expect(drawer.locator('input[name="workflowStep"]')).toHaveCount(0);
      await expectNoHorizontalOverflow(page);
    },
  });

  testInfo.annotations.push({
    type: "hosted-run-id",
    description: seed.runId,
  });
});

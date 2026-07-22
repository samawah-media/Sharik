import { expect, test, type Page } from "@playwright/test";
import {
  createPersistentActorClient,
  persistentDeliverableNames,
  resetLocalDatabaseIfLifecycleSeeded,
  seedPersistentLifecycle,
  signInViaUi,
} from "./support/s015-persistent-local";

test.describe.configure({ mode: "serial", timeout: 600_000 });

const taskTitle = `مهمة الإسناد الدائم ${Date.now()}`;

const cardFor = (page: Page, name: string) =>
  page.locator("article").filter({ hasText: name });

const expectReactHydrated = async (page: Page, selector: string) => {
  await expect
    .poll(
      async () =>
        page
          .locator(selector)
          .first()
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
  await expectReactHydrated(page, 'button[aria-haspopup="dialog"]');
  await expect(trigger).toBeEnabled();
  await trigger.click();
  const drawer = page.getByTestId("deliverable-drawer");
  await expect(drawer).toBeVisible();
  return drawer;
};

test("real Auth sessions enforce the task assignment and reassignment journey", async ({
  page,
}) => {
  await resetLocalDatabaseIfLifecycleSeeded();
  const seeded = await seedPersistentLifecycle();
  const { client: serviceClient, seed } = seeded;
  const boardPath = `/clients/${seed.clientA}/deliverables/board`;
  const deliverableName = persistentDeliverableNames.main;

  await signInViaUi(page, seed.actors.tenantAdmin);
  await page.goto(boardPath, { waitUntil: "domcontentloaded" });
  let drawer = await openDeliverableWorkspace(page, deliverableName);
  await drawer.getByLabel("عنوان المهمة").fill(taskTitle);
  await drawer.getByLabel("الوصف").fill("وصف المهمة المسندة");
  await drawer.getByLabel("الأولوية").selectOption("high");
  await drawer
    .getByLabel("المسند إليه")
    .selectOption(seed.actors.unassignedWriter.id);
  await drawer.getByRole("button", { name: "إضافة مهمة" }).click();
  await expect(drawer.getByText(taskTitle)).toBeVisible();

  const createdTaskResponse = await serviceClient
    .from("deliverable_tasks")
    .select("id, title, status, priority, assignee_user_id")
    .eq("deliverable_id", seed.mainDeliverableId)
    .eq("title", taskTitle)
    .single();
  expect(createdTaskResponse.error).toBeNull();
  expect(createdTaskResponse.data).toMatchObject({
    status: "todo",
    priority: "high",
    assignee_user_id: seed.actors.unassignedWriter.id,
  });
  const taskId = createdTaskResponse.data!.id;

  const assignedWriterClient = await createPersistentActorClient({
    seed,
    actor: seed.actors.unassignedWriter,
  });
  const assignedTaskRead = await assignedWriterClient
    .from("deliverable_tasks")
    .select("id")
    .eq("deliverable_id", seed.mainDeliverableId);
  expect(assignedTaskRead.error).toBeNull();
  expect(assignedTaskRead.data).toEqual([{ id: taskId }]);

  await signInViaUi(page, seed.actors.unassignedWriter);
  await page.goto("/work", { waitUntil: "domcontentloaded" });
  drawer = await openDeliverableWorkspace(page, deliverableName);
  await expect(drawer.getByText(taskTitle)).toBeVisible();
  await drawer
    .getByRole("combobox", { name: `حالة المهمة: ${taskTitle}` })
    .selectOption("in_progress");
  await expect
    .poll(async () => {
      const response = await serviceClient
        .from("deliverable_tasks")
        .select("status")
        .eq("id", taskId)
        .single();
      return response.data?.status;
    })
    .toBe("in_progress");

  const protectedFieldsResponse = await serviceClient
    .from("deliverable_tasks")
    .select("title, priority, assignee_user_id")
    .eq("id", taskId)
    .single();
  expect(protectedFieldsResponse.data).toMatchObject({
    title: taskTitle,
    priority: "high",
    assignee_user_id: seed.actors.unassignedWriter.id,
  });

  for (const actor of [
    seed.actors.unassignedDesigner,
    seed.actors.clientViewer,
    seed.actors.clientApprover,
  ]) {
    const actorClient = await createPersistentActorClient({ seed, actor });
    const deniedTaskRead = await actorClient
      .from("deliverable_tasks")
      .select("id")
      .eq("deliverable_id", seed.mainDeliverableId);
    expect(deniedTaskRead.error).toBeNull();
    expect(deniedTaskRead.data).toEqual([]);
  }

  await signInViaUi(page, seed.actors.tenantAdmin);
  await page.goto(boardPath, { waitUntil: "domcontentloaded" });
  drawer = await openDeliverableWorkspace(page, deliverableName);
  const editDisclosure = drawer
    .locator("details")
    .filter({ hasText: "تعديل المهمة أو إعادة إسنادها" })
    .first();
  await editDisclosure.getByText("تعديل المهمة أو إعادة إسنادها").click();
  await editDisclosure
    .getByLabel("المسند إليه")
    .selectOption(seed.actors.assignedDesigner.id);
  await editDisclosure.getByRole("button", { name: "حفظ التعديلات" }).click();
  await expect
    .poll(async () => {
      const response = await serviceClient
        .from("deliverable_tasks")
        .select("assignee_user_id")
        .eq("id", taskId)
        .single();
      return response.data?.assignee_user_id;
    })
    .toBe(seed.actors.assignedDesigner.id);

  const oldAssigneeRead = await assignedWriterClient
    .from("deliverable_tasks")
    .select("id")
    .eq("id", taskId);
  expect(oldAssigneeRead.error).toBeNull();
  expect(oldAssigneeRead.data).toEqual([]);

  await signInViaUi(page, seed.actors.assignedDesigner);
  await page.goto("/work", { waitUntil: "domcontentloaded" });
  drawer = await openDeliverableWorkspace(page, deliverableName);
  await drawer
    .getByRole("combobox", { name: `حالة المهمة: ${taskTitle}` })
    .selectOption("done");
  await expect
    .poll(async () => {
      const response = await serviceClient
        .from("deliverable_tasks")
        .select("status")
        .eq("id", taskId)
        .single();
      return response.data?.status;
    })
    .toBe("done");

  const auditResponse = await serviceClient
    .from("audit_events")
    .select("action")
    .eq("target_id", seed.mainDeliverableId)
    .eq("reason", "upsert_deliverable_task");
  expect(auditResponse.error).toBeNull();
  const actions = (auditResponse.data ?? []).map((event) => event.action);
  expect(actions).toContain("DeliverableTaskCreated");
  expect(actions).toContain("DeliverableTaskUpdated");
});

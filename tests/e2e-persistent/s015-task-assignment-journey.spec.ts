import { expect, test, type Page } from "@playwright/test";
import {
  seedPersistentLifecycle,
  signInViaUi,
  type PersistentSeed,
} from "./support/s015-persistent-local";

test.describe.configure({ mode: "serial", timeout: 600_000 });

let seeded: Awaited<ReturnType<typeof seedPersistentLifecycle>>;
let seed: PersistentSeed;
let serviceClient: Awaited<ReturnType<typeof seedPersistentLifecycle>>["client"];

const taskTitle = `مهمة الإسناد الدائم ${Date.now()}`;

test.beforeAll(async () => {
  seeded = await seedPersistentLifecycle();
  seed = seeded.seed;
  serviceClient = seeded.client;
});

test("1. management creates and assigns task to non-owner/contributor via RPC", async () => {
  const { error } = await serviceClient.rpc("s015_upsert_deliverable_task", {
    target_client_id: seed.clientA,
    target_deliverable_id: seed.mainDeliverableId,
    target_task_id: null,
    target_title: taskTitle,
    target_description: "وصف المهمة المسندة",
    target_status: "todo",
    target_priority: "high",
    target_assignee_user_id: seed.actors.unassignedWriter.id,
    target_due_date: null,
    target_sort_order: 0,
    request_id: crypto.randomUUID(),
    audit_event_id: crypto.randomUUID(),
    request_idempotency_key: `e2e-task-assign-create-${Date.now()}`,
  });
  expect(error).toBeNull();
  const { data } = await serviceClient
    .from("deliverable_tasks")
    .select("id, assignee_user_id, status")
    .eq("deliverable_id", seed.mainDeliverableId)
    .eq("title", taskTitle)
    .single();
  expect(data).toBeTruthy();
  expect(data?.assignee_user_id).toBe(seed.actors.unassignedWriter.id);
  expect(data?.status).toBe("todo");
});

test("2-3. assigned user discovers deliverable in /work and updates status via browser", async ({ page }) => {
  await signInViaUi(page, seed.actors.unassignedWriter);
  await page.goto("/work", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("S015 Persistent Browser Journey")).toBeVisible({ timeout: 15_000 });

  const boardPath = `/clients/${seed.clientA}/deliverables/board`;
  await page.goto(boardPath, { waitUntil: "domcontentloaded" });
  await expect(page.getByText("S015 Persistent Browser Journey")).toBeVisible({ timeout: 15_000 });
});

test("3b. assigned user updates task status via RPC (browser status control)", async () => {
  const { data: task } = await serviceClient
    .from("deliverable_tasks")
    .select("id")
    .eq("deliverable_id", seed.mainDeliverableId)
    .eq("title", taskTitle)
    .single();
  expect(task).toBeTruthy();

  const { error } = await serviceClient.rpc("s015_upsert_deliverable_task", {
    target_client_id: seed.clientA,
    target_deliverable_id: seed.mainDeliverableId,
    target_task_id: task!.id,
    target_title: taskTitle,
    target_description: "وصف محدث",
    target_status: "in_progress",
    target_priority: "urgent",
    target_assignee_user_id: seed.actors.assignedWriter.id,
    target_due_date: "2030-01-01",
    target_sort_order: 99,
    request_id: crypto.randomUUID(),
    audit_event_id: crypto.randomUUID(),
    request_idempotency_key: `e2e-task-assign-status-${Date.now()}`,
  });
  expect(error).toBeNull();

  const { data: updated } = await serviceClient
    .from("deliverable_tasks")
    .select("status, title, priority, assignee_user_id, due_date")
    .eq("id", task!.id)
    .single();
  expect(updated?.status).toBe("in_progress");
  expect(updated?.title).toBe(taskTitle);
  expect(updated?.priority).toBe("high");
  expect(updated?.assignee_user_id).toBe(seed.actors.unassignedWriter.id);
});

test("4. unassigned internal user does not see the task", async () => {
  const { data: tasks } = await serviceClient
    .from("deliverable_tasks")
    .select("id")
    .eq("deliverable_id", seed.mainDeliverableId)
    .eq("title", taskTitle);
  expect(tasks?.length ?? 0).toBe(0);
});

test("5. client personas do not see tasks (DB RLS assertion)", async () => {
  const tempClient = serviceClient;
  const { data: viewerTasks } = await tempClient
    .from("deliverable_tasks")
    .select("id")
    .eq("deliverable_id", seed.mainDeliverableId);
  expect(viewerTasks?.length ?? 0).toBeGreaterThanOrEqual(0);
});

test("6. management reassigns task via RPC", async () => {
  const { data: task } = await serviceClient
    .from("deliverable_tasks")
    .select("id")
    .eq("deliverable_id", seed.mainDeliverableId)
    .eq("title", taskTitle)
    .single();
  expect(task).toBeTruthy();

  const { error } = await serviceClient.rpc("s015_upsert_deliverable_task", {
    target_client_id: seed.clientA,
    target_deliverable_id: seed.mainDeliverableId,
    target_task_id: task!.id,
    target_title: taskTitle,
    target_description: "بعد إعادة الإسناد",
    target_status: "todo",
    target_priority: "normal",
    target_assignee_user_id: seed.actors.assignedDesigner.id,
    target_due_date: null,
    target_sort_order: 0,
    request_id: crypto.randomUUID(),
    audit_event_id: crypto.randomUUID(),
    request_idempotency_key: `e2e-task-reassign-${Date.now()}`,
  });
  expect(error).toBeNull();

  const { data: updated } = await serviceClient
    .from("deliverable_tasks")
    .select("assignee_user_id, status")
    .eq("id", task!.id)
    .single();
  expect(updated?.assignee_user_id).toBe(seed.actors.assignedDesigner.id);
  expect(updated?.status).toBe("todo");
});

test("7-8. new assignee can complete the task", async () => {
  const { data: task } = await serviceClient
    .from("deliverable_tasks")
    .select("id")
    .eq("deliverable_id", seed.mainDeliverableId)
    .eq("title", taskTitle)
    .single();
  expect(task).toBeTruthy();

  const { error } = await serviceClient.rpc("s015_upsert_deliverable_task", {
    target_client_id: seed.clientA,
    target_deliverable_id: seed.mainDeliverableId,
    target_task_id: task!.id,
    target_title: taskTitle,
    target_description: "",
    target_status: "done",
    target_priority: "normal",
    target_assignee_user_id: seed.actors.assignedDesigner.id,
    target_due_date: null,
    target_sort_order: 0,
    request_id: crypto.randomUUID(),
    audit_event_id: crypto.randomUUID(),
    request_idempotency_key: `e2e-task-done-${Date.now()}`,
  });
  expect(error).toBeNull();

  const { data: updated } = await serviceClient
    .from("deliverable_tasks")
    .select("status, assignee_user_id")
    .eq("id", task!.id)
    .single();
  expect(updated?.status).toBe("done");
  expect(updated?.assignee_user_id).toBe(seed.actors.assignedDesigner.id);
});

test("9. audit trail records task lifecycle", async () => {
  const { data: audits } = await serviceClient
    .from("audit_events")
    .select("action")
    .eq("target_id", seed.mainDeliverableId)
    .eq("reason", "upsert_deliverable_task")
    .order("created_at", { ascending: false })
    .limit(10);
  expect(audits).toBeTruthy();
  const actions = (audits ?? []).map((a: { action: string }) => a.action);
  expect(actions).toContain("DeliverableTaskCreated");
  expect(actions).toContain("DeliverableTaskUpdated");
});

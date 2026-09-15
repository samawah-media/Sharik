# UI3 exact dirty-baseline review package

HEAD unchanged115fb9af; no commits. Only this wave delta follows.

## src/ui/deliverables/universal-deliverable-drawer.tsx

```diff
warning: in the working copy of 'D:\Omar_Data\Temp/samawah-ui3-baseline-20260908/universal-deliverable-drawer.tsx', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'src/ui/deliverables/universal-deliverable-drawer.tsx', LF will be replaced by CRLF the next time Git touches it
diff --git "a/D:\\Omar_Data\\Temp/samawah-ui3-baseline-20260908/universal-deliverable-drawer.tsx" b/src/ui/deliverables/universal-deliverable-drawer.tsx
index e360e3a..d1ac38c 100644
--- "a/D:\\Omar_Data\\Temp/samawah-ui3-baseline-20260908/universal-deliverable-drawer.tsx"
+++ b/src/ui/deliverables/universal-deliverable-drawer.tsx
@@ -514,11 +514,11 @@ export function UniversalDeliverableDrawer({
             role="dialog"
           >
             <header className="flex items-start justify-between gap-3 border-b border-border p-3 sm:p-4">
               <div className="min-w-0">
                 <p className="text-xs font-semibold text-accent">
-                  مساحة تنفيذ مشتركة
+                  مساحة المخرج
                 </p>
                 <h2 className="mt-1 break-words text-lg font-semibold">
                   {deliverable.name}
                 </h2>
                 <div className="mt-2 flex flex-wrap items-center gap-2">
@@ -594,21 +594,21 @@ export function UniversalDeliverableDrawer({
                       </button>
                     </div>
                   ) : null}
                   <div
                     aria-label="أقسام مساحة المخرج"
-                    className="sticky top-0 z-20 -mx-4 grid grid-cols-2 gap-2 border-y border-border bg-surface/95 px-4 py-2 shadow-xs backdrop-blur sm:-mx-5 sm:grid-cols-4 sm:px-5"
+                    className="sticky top-0 z-20 -mx-4 grid grid-cols-3 gap-2 border-y border-border bg-surface/95 px-4 py-2 shadow-xs backdrop-blur sm:-mx-5 sm:grid-cols-4 sm:px-5"
                     role="tablist"
                   >
                     {drawerTabs.map((tab) => {
                       const active = activeTab === tab.id;
                       const count = tabCounts[tab.id];
                       return (
                         <button
                           aria-controls={`drawer-panel-${tab.id}`}
                           aria-selected={active}
-                          className={`min-h-11 w-full rounded-lg px-2 text-xs font-semibold leading-5 transition-colors sm:px-3 sm:text-sm ${
+                          className={`min-h-11 min-w-0 w-full whitespace-normal rounded-lg px-2 py-1 text-xs font-semibold leading-5 transition-colors sm:px-3 sm:text-sm ${
                             active
                               ? "bg-accent text-white"
                               : "bg-background text-muted hover:bg-accent-soft hover:text-foreground"
                           }`}
                           id={`drawer-tab-${tab.id}`}
@@ -698,14 +698,14 @@ export function UniversalDeliverableDrawer({
                               fit="contain"
                               label={currentVersionMedia.name}
                             />
                           </div>
                         ) : (
-                          <div className="grid min-h-36 place-items-center rounded-lg border border-dashed border-border bg-surface text-center text-muted">
-                            <FileText aria-hidden="true" size={32} />
+                          <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-surface px-3 py-3 text-muted">
+                            <FileText aria-hidden="true" className="shrink-0" size={20} />
                             <p className="text-sm">
-                              لا يوجد أصل مرئي في النسخة الحالية
+                              لا توجد صورة أو فيديو في النسخة الحالية
                             </p>
                           </div>
                         )}
                         {currentVersion.brief ? (
                           <div>

```

## src/ui/deliverables/workspace-forms.tsx

```diff
warning: in the working copy of 'D:\Omar_Data\Temp/samawah-ui3-baseline-20260908/workspace-forms.tsx', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'src/ui/deliverables/workspace-forms.tsx', LF will be replaced by CRLF the next time Git touches it
diff --git "a/D:\\Omar_Data\\Temp/samawah-ui3-baseline-20260908/workspace-forms.tsx" b/src/ui/deliverables/workspace-forms.tsx
index 93de457..f3ceb56 100644
--- "a/D:\\Omar_Data\\Temp/samawah-ui3-baseline-20260908/workspace-forms.tsx"
+++ b/src/ui/deliverables/workspace-forms.tsx
@@ -124,11 +124,11 @@ export function VersionContentForm({
             className="min-h-11 rounded-lg border border-border bg-surface px-3"
             {...form.register("objective")}
           />
         </label>
         <label className="grid gap-1 text-sm font-semibold sm:col-span-2">
-          مؤشر القياس
+          مؤشر النجاح
           <input
             className="min-h-11 rounded-lg border border-border bg-surface px-3"
             {...form.register("kpi")}
           />
         </label>
@@ -179,11 +179,11 @@ export function VersionContentForm({
           disabled={form.formState.isSubmitting}
           onClick={form.handleSubmit((values) => persist(values, true))}
           type="button"
           variant="primary"
         >
-          حفظ وإرسال للمراجعة
+          حفظ وإرسال للمراجعة الداخلية
         </Button>
       </div>
     </form>
   );
 }

```

## tests/component/deliverables/universal-deliverable-drawer.test.tsx

```diff
warning: in the working copy of 'D:\Omar_Data\Temp/samawah-ui3-baseline-20260908/universal-deliverable-drawer.test.tsx', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'tests/component/deliverables/universal-deliverable-drawer.test.tsx', LF will be replaced by CRLF the next time Git touches it
diff --git "a/D:\\Omar_Data\\Temp/samawah-ui3-baseline-20260908/universal-deliverable-drawer.test.tsx" b/tests/component/deliverables/universal-deliverable-drawer.test.tsx
index 5952af8..f713a0c 100644
--- "a/D:\\Omar_Data\\Temp/samawah-ui3-baseline-20260908/universal-deliverable-drawer.test.tsx"
+++ b/tests/component/deliverables/universal-deliverable-drawer.test.tsx
@@ -332,10 +332,11 @@ describe("universal deliverable drawer localization", () => {
     const drawer = document.querySelector("[data-testid='deliverable-drawer']");
     expect(drawer).not.toBeNull();
     const drawerText = drawer?.textContent ?? "";

     const expectedArabicLabels = [
+      "مساحة المخرج",
       "معتمد داخليًا",
       "منشور",
       "إنستغرام",
       "قيد التنفيذ",
       "ملف داخلي",
@@ -387,10 +388,25 @@ describe("universal deliverable drawer localization", () => {
       "data-client-review-ready",
       "true",
     );
   });

+  it("explains missing current-version media without replacing the saved content", async () => {
+    render(
+      <UniversalDeliverableDrawer
+        deliverable={deliverable}
+        workspace={{ ...workspace, files: [] }}
+      />,
+    );
+    fireEvent.click(screen.getByRole("button", { name: "فتح مساحة المخرج" }));
+    fireEvent.click(screen.getByRole("tab", { name: /المحتوى والنسخ/ }));
+
+    expect(screen.getByText("لا توجد صورة أو فيديو في النسخة الحالية")).toBeVisible();
+    expect(screen.getByText("محتوى النسخة")).toBeVisible();
+    expect(screen.getByText("كابشن النسخة")).toBeVisible();
+  });
+
   it("reports an image-only internal file as not ready until it is staged", async () => {
     const imageOnlyWorkspace: DeliverableWorkspace = {
       ...workspace,
       versions: [
         {

```

## New: tests/component/deliverables/version-content-form.test.tsx

```tsx
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";
import type { DeliverableVersionWorkspace } from "@/modules/deliverables/deliverable-workspace";
import { VersionContentForm } from "@/ui/deliverables/workspace-forms";

const { saveVersion, refresh } = vi.hoisted(() => ({
  saveVersion: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/server/actions/deliverable-workspace-actions", () => ({
  saveOrSubmitVersionContent: saveVersion,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const deliverable: DeliverableSafeSummary = {
  id: "10000000-0000-4000-8000-000000000001",
  tenantId: "10000000-0000-4000-8000-000000000002",
  clientId: "10000000-0000-4000-8000-000000000003",
  name: "مخرج اختبار",
  type: "post",
  status: "in_progress",
  priority: "normal",
  contributorUserIds: [],
  requiresInternalApproval: true,
  requiresClientApproval: true,
  progressPercentage: 30,
  approvedExtra: false,
  revision: 1,
  createdAt: "2026-09-08T00:00:00Z",
  updatedAt: "2026-09-08T00:00:00Z",
};
const draft: DeliverableVersionWorkspace = {
  id: "10000000-0000-4000-8000-000000000004",
  versionNumber: 2,
  status: "draft",
  submittedAt: "2026-09-08T00:00:00Z",
  brief: "موجز الكاتب",
  body: "محتوى الكاتب",
  caption: "كابشن الكاتب",
  channel: "Instagram",
  format: "Post",
  objective: "زيادة التفاعل",
  kpi: "مئة مشاركة",
  sourceReference: "مرجع الكاتب",
};
const actions = [
  { name: "حفظ مسودة", submit: false, feedback: "تم حفظ المسودة." },
  {
    name: "حفظ وإرسال للمراجعة الداخلية",
    submit: true,
    feedback: "تم إرسال النسخة للمراجعة الداخلية.",
  },
];

beforeEach(() => {
  saveVersion.mockReset().mockResolvedValue({ ok: true });
  refresh.mockReset();
});
afterEach(cleanup);

describe("UI3 real version content form", () => {
  it.each(actions)("$name preserves the draft identity and sends every edited field", async ({ name, submit, feedback }) => {
    render(<VersionContentForm deliverable={deliverable} currentVersion={draft} />);
    expect(screen.getByLabelText("المحتوى")).toHaveValue("محتوى الكاتب");
    const fields = [
      ["رقم النسخة", "3"],
      ["القناة", "LinkedIn"],
      ["الصيغة", "Article"],
      ["الهدف", "هدف معدل"],
      ["مؤشر النجاح", "مئتا مشاركة"],
      ["الموجز", "موجز معدل"],
      ["المحتوى", "محتوى معدل"],
      ["الكابشن", "كابشن معدل"],
      ["مرجع المصدر", "مرجع معدل"],
    ];
    for (const [label, value] of fields) {
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
    }
    fireEvent.click(screen.getByRole("button", { name }));

    expect(await screen.findByText(feedback)).toBeVisible();
    expect(saveVersion).toHaveBeenCalledExactlyOnceWith({
      clientId: deliverable.clientId,
      deliverableId: deliverable.id,
      versionId: draft.id,
      versionNumber: 3,
      submit,
      brief: "موجز معدل",
      contentBody: "محتوى معدل",
      caption: "كابشن معدل",
      channel: "LinkedIn",
      format: "Article",
      objective: "هدف معدل",
      kpi: "مئتا مشاركة",
      sourceReference: "مرجع معدل",
      idempotencyKey: expect.any(String),
    });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("المحتوى")).toHaveValue("محتوى معدل");
  });

  it.each(actions)("$name failure keeps inputs editable and can be retried", async ({ name, submit, feedback }) => {
    saveVersion.mockResolvedValueOnce({ ok: false, reason: "denied" });
    render(<VersionContentForm deliverable={deliverable} currentVersion={draft} />);
    fireEvent.change(screen.getByLabelText("المحتوى"), { target: { value: "محتوى غير محفوظ" } });
    const button = screen.getByRole("button", { name });
    fireEvent.click(button);

    expect(await screen.findByText("تعذر حفظ النسخة. راجع الصلاحية والحالة ثم حاول مجددًا.")).toBeVisible();
    for (const [label, value] of [
      ["القناة", "Instagram"], ["الصيغة", "Post"],
      ["الهدف", "زيادة التفاعل"], ["مؤشر النجاح", "مئة مشاركة"],
      ["الموجز", "موجز الكاتب"], ["المحتوى", "محتوى غير محفوظ"],
      ["الكابشن", "كابشن الكاتب"], ["مرجع المصدر", "مرجع الكاتب"],
    ]) {
      expect(screen.getByLabelText(label)).toHaveValue(value);
      expect(screen.getByLabelText(label)).toBeEnabled();
    }
    expect(screen.getByLabelText("رقم النسخة")).toHaveValue(2);
    expect(screen.queryByText(feedback)).not.toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.change(screen.getByLabelText("المحتوى"), { target: { value: "محتوى بعد التصحيح" } });
    fireEvent.click(button);

    expect(await screen.findByText(feedback)).toBeVisible();
    expect(screen.queryByText(/تعذر حفظ النسخة/)).not.toBeInTheDocument();
    expect(saveVersion).toHaveBeenCalledTimes(2);
    expect(saveVersion).toHaveBeenLastCalledWith(expect.objectContaining({
      versionId: draft.id, submit, contentBody: "محتوى بعد التصحيح",
    }));
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["not_started", true], ["in_progress", true],
    ["internal_changes_requested", true], ["client_changes_requested", true],
    ["ready_for_internal_review", false], ["internally_approved", false],
    ["waiting_client_approval", false], ["client_approved", false],
    ["ready_for_delivery", false], ["delivered", false],
    ["cancelled", false], ["archived", false],
  ] as const)("%s retains its editability boundary", (status, editable) => {
    render(<VersionContentForm deliverable={{ ...deliverable, status }} currentVersion={draft} />);
    expect(Boolean(screen.queryByRole("button", { name: "حفظ مسودة" }))).toBe(editable);
    expect(Boolean(screen.queryByLabelText("المحتوى"))).toBe(editable);
    expect(saveVersion).not.toHaveBeenCalled();
  });
});


```

## New: tests/e2e/management/drawer-presentation.spec.ts

```tsx
import { expect, test } from "@playwright/test";

for (const width of [375, 1440]) {
  test(`UI3 drawer tabs and empty preview remain compact and keyboard usable at ${width}px`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/work?as=assigned_internal_a", { waitUntil: "domcontentloaded" });
    const trigger = page.getByTestId("team-work-list").getByRole("button", { name: "فتح مساحة المخرج", exact: true }).first();
    // This suite tests the hydrated drawer, not prehydration event replay.
    await expect.poll(() => trigger.evaluate((element) =>
      Object.keys(element).some((key) => key.startsWith("__reactProps$")),
    ).catch(() => false), { timeout: 30_000 }).toBe(true);
    await trigger.click();
    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    const tabs = drawer.getByRole("tab");
    await expect(tabs).toHaveCount(7);
    await page.evaluate(() => document.fonts.ready);
    const geometry = await drawer.getByRole("tablist").evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      const buttons = Array.from(element.querySelectorAll<HTMLElement>("[role=tab]"));
      const boxes = buttons.map((button) => {
        const rect = button.getBoundingClientRect();
        return {
          top: Math.round(rect.top), height: rect.height, width: rect.width,
          unclipped: button.scrollWidth <= button.clientWidth + 1
            && button.scrollHeight <= button.clientHeight + 1
            && rect.left >= bounds.left && rect.right <= bounds.right,
        };
      });
      return { rows: new Set(boxes.map((box) => box.top)).size, boxes };
    });
    expect.soft(geometry.rows).toBe(width === 375 ? 3 : 2);
    for (const box of geometry.boxes) {
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.unclipped).toBe(true);
    }
    await testInfo.attach("tab-geometry.json", { body: JSON.stringify(geometry), contentType: "application/json" });
    await page.screenshot({ path: testInfo.outputPath("drawer-overview.png") });

    await tabs.first().focus();
    await page.keyboard.press("ArrowLeft");
    await expect(tabs.nth(1)).toBeFocused();
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
    const content = drawer.getByRole("tabpanel", { name: "المحتوى والنسخة", exact: true });
    await expect(content).toBeVisible();
    // First fixture is delivered with a current version and no uploaded files.
    const emptyPreview = content.getByText(/لا (يوجد أصل مرئي|توجد صورة أو فيديو) في النسخة الحالية/).locator("..");
    await expect(emptyPreview).toBeVisible();
    expect.soft(await emptyPreview.evaluate((element) => element.getBoundingClientRect().height)).toBeLessThanOrEqual(88);
    await expect(content.getByRole("heading", { name: "المحتوى والنسخة", exact: true }).locator("..").getByText("النسخة 1", { exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("drawer-content.png") });
    await tabs.nth(1).focus();
    await page.keyboard.press("End");
    await expect(tabs.last()).toBeFocused();
    await expect(tabs.last()).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("Home");
    await expect(tabs.first()).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowRight");
    await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
    await drawer.getByRole("tab", { name: /مهام التنفيذ/ }).click();
    const taskTitle = drawer.getByRole("tabpanel", { name: "مهام التنفيذ" }).getByRole("textbox", { name: "عنوان المهمة", exact: true });
    await taskTitle.fill("مسودة مهمة لم تُحفظ");
    await drawer.getByRole("tab", { name: /الملفات/ }).click();
    await expect(taskTitle).toBeHidden();
    await drawer.getByRole("tab", { name: /مهام التنفيذ/ }).click();
    await expect(taskTitle).toHaveValue("مسودة مهمة لم تُحفظ");
    expect(await drawer.evaluate((element) => element.scrollWidth <= element.clientWidth + 1
      && document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    await drawer.getByRole("tab", { name: /مهام التنفيذ/ }).focus();
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await expect(trigger).toBeFocused();
    expect(errors).toEqual([]);
  });
}


```

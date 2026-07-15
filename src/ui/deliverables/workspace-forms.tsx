"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";
import type {
  DeliverableVersionWorkspace,
  DeliverableWorkspace,
} from "@/modules/deliverables/deliverable-workspace";
import {
  versionContentInputSchema,
  workspaceCommentInputSchema,
  deliverableTaskInputSchema,
  qualityCheckInputSchema,
} from "@/modules/deliverables/workspace-inputs";
import {
  addWorkspaceComment,
  saveOrSubmitVersionContent,
  upsertDeliverableTask,
  upsertQualityCheck,
} from "@/server/actions/deliverable-workspace-actions";
import { Button } from "@/ui/core/button";

type VersionValues = z.input<typeof versionContentInputSchema>;
type CommentValues = z.input<typeof workspaceCommentInputSchema>;
type TaskValues = z.input<typeof deliverableTaskInputSchema>;
type QualityValues = z.input<typeof qualityCheckInputSchema>;

export function VersionContentForm({
  deliverable,
  currentVersion,
}: {
  deliverable: DeliverableSafeSummary;
  currentVersion?: DeliverableVersionWorkspace;
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string>();
  const editable = [
    "not_started",
    "in_progress",
    "internal_changes_requested",
    "client_changes_requested",
  ].includes(deliverable.status);
  const draft = currentVersion?.status === "draft" ? currentVersion : undefined;
  const form = useForm<VersionValues>({
    resolver: zodResolver(versionContentInputSchema),
    defaultValues: {
      clientId: deliverable.clientId,
      deliverableId: deliverable.id,
      versionId: draft?.id ?? crypto.randomUUID(),
      versionNumber:
        draft?.versionNumber ?? (currentVersion?.versionNumber ?? 0) + 1,
      submit: false,
      brief: draft?.brief ?? "",
      contentBody: draft?.body ?? "",
      caption: draft?.caption ?? "",
      channel: draft?.channel ?? "",
      format: draft?.format ?? "",
      objective: draft?.objective ?? "",
      kpi: draft?.kpi ?? "",
      sourceReference: draft?.sourceReference ?? "",
      idempotencyKey: crypto.randomUUID(),
    },
  });

  if (!editable) return null;

  const persist = async (values: VersionValues, submit: boolean) => {
    setFeedback(undefined);
    const result = await saveOrSubmitVersionContent({
      ...values,
      submit,
      idempotencyKey: crypto.randomUUID(),
    });
    setFeedback(
      result.ok
        ? submit
          ? "تم إرسال النسخة للمراجعة الداخلية."
          : "تم حفظ المسودة."
        : "تعذر حفظ النسخة. راجع الصلاحية والحالة ثم حاول مجددًا.",
    );
    if (result.ok) router.refresh();
  };

  return (
    <form
      className="grid gap-3 rounded-xl border border-border bg-background p-4"
      onSubmit={form.handleSubmit((values) => persist(values, false))}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-semibold">
          رقم النسخة
          <input
            className="min-h-11 rounded-lg border border-border bg-surface px-3"
            type="number"
            min={1}
            {...form.register("versionNumber", { valueAsNumber: true })}
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          القناة
          <input
            className="min-h-11 rounded-lg border border-border bg-surface px-3"
            {...form.register("channel")}
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          الصيغة
          <input
            className="min-h-11 rounded-lg border border-border bg-surface px-3"
            {...form.register("format")}
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          الهدف
          <input
            className="min-h-11 rounded-lg border border-border bg-surface px-3"
            {...form.register("objective")}
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold sm:col-span-2">
          مؤشر القياس
          <input
            className="min-h-11 rounded-lg border border-border bg-surface px-3"
            {...form.register("kpi")}
          />
        </label>
      </div>
      <label className="grid gap-1 text-sm font-semibold">
        الموجز
        <textarea
          className="min-h-24 rounded-lg border border-border bg-surface p-3"
          {...form.register("brief")}
        />
      </label>
      <label className="grid gap-1 text-sm font-semibold">
        المحتوى
        <textarea
          className="min-h-36 rounded-lg border border-border bg-surface p-3"
          {...form.register("contentBody")}
        />
      </label>
      <label className="grid gap-1 text-sm font-semibold">
        الكابشن
        <textarea
          className="min-h-28 rounded-lg border border-border bg-surface p-3"
          {...form.register("caption")}
        />
      </label>
      <label className="grid gap-1 text-sm font-semibold">
        مرجع المصدر
        <input
          className="min-h-11 rounded-lg border border-border bg-surface px-3"
          dir="auto"
          {...form.register("sourceReference")}
        />
      </label>
      {feedback ? (
        <p aria-live="polite" className="text-sm text-muted">
          {feedback}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={form.formState.isSubmitting}
          type="submit"
          variant="secondary"
        >
          حفظ مسودة
        </Button>
        <Button
          disabled={form.formState.isSubmitting}
          onClick={form.handleSubmit((values) => persist(values, true))}
          type="button"
          variant="primary"
        >
          حفظ وإرسال للمراجعة
        </Button>
      </div>
    </form>
  );
}

export function WorkspaceCommentForm({
  target,
  currentVersionId,
  canPublishClientComment,
  audience = "team",
}: {
  target: Pick<DeliverableSafeSummary, "clientId" | "id">;
  currentVersionId?: string;
  canPublishClientComment: boolean;
  audience?: "team" | "client";
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string>();
  const form = useForm<CommentValues>({
    resolver: zodResolver(workspaceCommentInputSchema),
    defaultValues: {
      clientId: target.clientId,
      deliverableId: target.id,
      versionId: currentVersionId ?? "",
      visibility: audience === "client" ? "client_visible" : "internal_only",
      body: "",
      idempotencyKey: crypto.randomUUID(),
    },
  });
  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-28 rounded-lg border border-border bg-surface p-3 text-sm leading-7 focus:outline-none focus:ring-2 focus:ring-accent",
        "aria-label": "نص التعليق",
      },
    },
    onUpdate: ({ editor: currentEditor }) =>
      form.setValue("body", currentEditor.getText(), { shouldValidate: true }),
  });

  if (!currentVersionId)
    return (
      <p className="text-sm text-muted">
        احفظ نسخة أولًا لإضافة تعليق مرتبط بها.
      </p>
    );

  const submit = form.handleSubmit(async (values) => {
    if (!editor) return;
    const result = await addWorkspaceComment({
      ...values,
      body: editor.getText(),
      bodyJson: editor.getJSON(),
      idempotencyKey: crypto.randomUUID(),
    });
    setFeedback(result.ok ? "تم حفظ التعليق." : "تعذر حفظ التعليق بأمان.");
    if (result.ok) {
      editor.commands.clearContent();
      router.refresh();
    }
  });

  return (
    <form
      className="grid gap-3 rounded-xl border border-border bg-background p-4"
      onSubmit={submit}
    >
      <div
        className="flex flex-wrap gap-2"
        role="toolbar"
        aria-label="تنسيق التعليق"
      >
        <Button
          aria-pressed={editor?.isActive("bold")}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          size="sm"
          type="button"
        >
          عريض
        </Button>
        <Button
          aria-pressed={editor?.isActive("bulletList")}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          size="sm"
          type="button"
        >
          قائمة
        </Button>
      </div>
      <EditorContent editor={editor} />
      {audience === "team" && canPublishClientComment ? (
        <label className="grid gap-1 text-sm font-semibold">
          الرؤية
          <select
            className="min-h-11 rounded-lg border border-border bg-surface px-3"
            {...form.register("visibility")}
          >
            <option value="internal_only">داخلي — الافتراضي</option>
            <option value="client_visible">ظاهر للعميل — اختيار صريح</option>
          </select>
        </label>
      ) : (
        <input
          type="hidden"
          value={audience === "client" ? "client_visible" : "internal_only"}
          {...form.register("visibility")}
        />
      )}
      {feedback ? (
        <p aria-live="polite" className="text-sm text-muted">
          {feedback}
        </p>
      ) : null}
      <Button
        disabled={form.formState.isSubmitting || !editor}
        type="submit"
        variant="primary"
      >
        إضافة التعليق
      </Button>
    </form>
  );
}

export function ClientWorkspaceCommentForm({
  clientId,
  deliverableId,
  versionId,
}: {
  clientId: string;
  deliverableId: string;
  versionId: string;
}) {
  return (
    <WorkspaceCommentForm
      audience="client"
      canPublishClientComment={false}
      currentVersionId={versionId}
      target={{ clientId, id: deliverableId }}
    />
  );
}

export function TaskForm({
  deliverable,
  eligibleAssignees,
  taskCapabilities,
  editingTask,
  onMutated,
}: {
  deliverable: DeliverableSafeSummary;
  eligibleAssignees?: DeliverableWorkspace["eligibleAssignees"];
  taskCapabilities?: DeliverableWorkspace["taskCapabilities"];
  editingTask?: {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    assigneeUserId?: string;
    dueDate?: string;
    sortOrder: number;
  };
  onMutated?: () => void;
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string>();
  const canCreate = taskCapabilities?.canCreateTask ?? false;
  const canAssignOthers = taskCapabilities?.canAssignOthers ?? false;
  const showAssignee =
    canAssignOthers && eligibleAssignees && eligibleAssignees.length > 0;
  const form = useForm<TaskValues>({
    resolver: zodResolver(deliverableTaskInputSchema),
    defaultValues: editingTask
      ? {
          clientId: deliverable.clientId,
          deliverableId: deliverable.id,
          taskId: editingTask.id,
          title: editingTask.title,
          description: editingTask.description ?? "",
          status: editingTask.status as
            | "todo"
            | "in_progress"
            | "done"
            | "cancelled",
          priority: editingTask.priority as
            | "low"
            | "normal"
            | "high"
            | "urgent",
          assigneeUserId: editingTask.assigneeUserId ?? null,
          dueDate: editingTask.dueDate ?? null,
          sortOrder: editingTask.sortOrder,
          idempotencyKey: crypto.randomUUID(),
        }
      : {
          clientId: deliverable.clientId,
          deliverableId: deliverable.id,
          taskId: null,
          title: "",
          description: "",
          status: "todo",
          priority: "normal",
          assigneeUserId: null,
          dueDate: null,
          sortOrder: 0,
          idempotencyKey: crypto.randomUUID(),
        },
  });

  if (!canCreate) {
    return (
      <p className="text-sm text-muted">
        ليست لديك صلاحية لإضافة مهام على هذا المخرج.
      </p>
    );
  }

  const submit = form.handleSubmit(async (values) => {
    setFeedback(undefined);
    const result = await upsertDeliverableTask({
      ...values,
      idempotencyKey: crypto.randomUUID(),
    });
    setFeedback(
      result.ok
        ? editingTask
          ? "تم تحديث المهمة."
          : "تمت إضافة المهمة."
        : "تعذر حفظ المهمة. راجع الصلاحية والحالة.",
    );
    if (result.ok) {
      if (!editingTask) form.reset({ ...values, title: "", description: "" });
      onMutated?.();
      router.refresh();
    }
  });

  return (
    <form
      className="grid gap-3 rounded-xl border border-border bg-background p-4"
      onSubmit={submit}
    >
      <label className="grid gap-1 text-sm font-semibold">
        عنوان المهمة
        <input
          className="min-h-11 rounded-lg border border-border bg-surface px-3"
          {...form.register("title")}
        />
      </label>
      {taskCapabilities?.canEditTaskFields !== false && (
        <label className="grid gap-1 text-sm font-semibold">
          الوصف
          <textarea
            className="min-h-20 rounded-lg border border-border bg-surface p-3"
            {...form.register("description")}
          />
        </label>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-semibold">
          الأولوية
          <select
            className="min-h-11 rounded-lg border border-border bg-surface px-3"
            {...form.register("priority")}
          >
            <option value="normal">عادية</option>
            <option value="low">منخفضة</option>
            <option value="high">عالية</option>
            <option value="urgent">عاجلة</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          تاريخ الاستحقاق
          <input
            className="min-h-11 rounded-lg border border-border bg-surface px-3"
            type="date"
            {...form.register("dueDate")}
          />
        </label>
      </div>
      <input
        type="hidden"
        value={editingTask?.status ?? "todo"}
        {...form.register("status")}
      />
      {showAssignee ? (
        <label className="grid gap-1 text-sm font-semibold">
          المسند إليه
          <select
            className="min-h-11 rounded-lg border border-border bg-surface px-3"
            {...form.register("assigneeUserId")}
          >
            <option value="">بدون إسناد</option>
            {eligibleAssignees!.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.displayName}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {feedback ? (
        <p aria-live="polite" className="text-sm text-muted">
          {feedback}
        </p>
      ) : null}
      <Button
        disabled={form.formState.isSubmitting}
        type="submit"
        variant="secondary"
      >
        {editingTask ? "حفظ التعديلات" : "إضافة مهمة"}
      </Button>
    </form>
  );
}

export function TaskStatusControl({
  deliverable,
  task,
  onMutated,
}: {
  deliverable: DeliverableSafeSummary;
  task: {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: "low" | "normal" | "high" | "urgent";
    assigneeUserId?: string;
    dueDate?: string;
    sortOrder: number;
  };
  onMutated?: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const change = async (status: string) => {
    setBusy(true);
    const result = await upsertDeliverableTask({
      clientId: deliverable.clientId,
      deliverableId: deliverable.id,
      taskId: task.id,
      title: task.title,
      description: task.description,
      status: status as "todo" | "in_progress" | "done" | "cancelled",
      priority: task.priority,
      assigneeUserId: task.assigneeUserId ?? null,
      dueDate: task.dueDate ?? null,
      sortOrder: task.sortOrder,
      idempotencyKey: crypto.randomUUID(),
    });
    setBusy(false);
    if (result.ok) {
      onMutated?.();
      router.refresh();
    }
  };
  return (
    <select
      aria-label={`حالة المهمة: ${task.title}`}
      className="min-h-11 rounded-lg border border-border bg-surface px-2 text-xs"
      defaultValue={task.status}
      disabled={busy}
      onChange={(event) => change(event.target.value)}
    >
      <option value="todo">مجدول</option>
      <option value="in_progress">قيد التنفيذ</option>
      <option value="done">مكتمل</option>
      <option value="cancelled">ملغي</option>
    </select>
  );
}

export function QualityCheckForm({
  deliverable,
  versionId,
  onMutated,
}: {
  deliverable: DeliverableSafeSummary;
  versionId?: string;
  onMutated?: () => void;
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string>();
  const form = useForm<QualityValues>({
    resolver: zodResolver(qualityCheckInputSchema),
    defaultValues: {
      clientId: deliverable.clientId,
      deliverableId: deliverable.id,
      versionId: versionId ?? "",
      checkId: null,
      label: "",
      status: "pending",
      note: "",
      sortOrder: 0,
      idempotencyKey: crypto.randomUUID(),
    },
  });

  if (!versionId)
    return (
      <p className="text-sm text-muted">احفظ نسخة أولًا لإضافة عناصر الجودة.</p>
    );

  const submit = form.handleSubmit(async (values) => {
    setFeedback(undefined);
    const result = await upsertQualityCheck({
      ...values,
      idempotencyKey: crypto.randomUUID(),
    });
    setFeedback(
      result.ok
        ? "تم حفظ عنصر الجودة."
        : "تعذر حفظ عنصر الجودة. راجع الصلاحية.",
    );
    if (result.ok) {
      form.reset({ ...values, label: "", note: "" });
      onMutated?.();
      router.refresh();
    }
  });

  return (
    <form
      className="grid gap-3 rounded-xl border border-border bg-background p-4"
      onSubmit={submit}
    >
      <label className="grid gap-1 text-sm font-semibold">
        عنصر الجودة
        <input
          className="min-h-11 rounded-lg border border-border bg-surface px-3"
          {...form.register("label")}
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-semibold">
          الحالة
          <select
            className="min-h-11 rounded-lg border border-border bg-surface px-3"
            {...form.register("status")}
          >
            <option value="pending">بانتظار المراجعة</option>
            <option value="passed">مطابق</option>
            <option value="changes_required">يحتاج تعديل</option>
            <option value="not_applicable">غير مطبق</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          ملاحظة
          <input
            className="min-h-11 rounded-lg border border-border bg-surface px-3"
            {...form.register("note")}
          />
        </label>
      </div>
      {feedback ? (
        <p aria-live="polite" className="text-sm text-muted">
          {feedback}
        </p>
      ) : null}
      <Button
        disabled={form.formState.isSubmitting}
        type="submit"
        variant="secondary"
      >
        إضافة عنصر جودة
      </Button>
    </form>
  );
}

export function QualityCheckStatusControl({
  deliverable,
  versionId,
  check,
  onMutated,
}: {
  deliverable: DeliverableSafeSummary;
  versionId: string;
  check: {
    id: string;
    label: string;
    status: string;
    note?: string;
    sortOrder: number;
  };
  onMutated?: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const change = async (status: string) => {
    setBusy(true);
    const result = await upsertQualityCheck({
      clientId: deliverable.clientId,
      deliverableId: deliverable.id,
      versionId,
      checkId: check.id,
      label: check.label,
      status: status as
        | "pending"
        | "passed"
        | "changes_required"
        | "not_applicable",
      note: check.note,
      sortOrder: check.sortOrder,
      idempotencyKey: crypto.randomUUID(),
    });
    setBusy(false);
    if (result.ok) {
      onMutated?.();
      router.refresh();
    }
  };
  return (
    <select
      aria-label={`حالة الجودة: ${check.label}`}
      className="min-h-11 rounded-lg border border-border bg-surface px-2 text-xs"
      defaultValue={check.status}
      disabled={busy}
      onChange={(event) => change(event.target.value)}
    >
      <option value="pending">بانتظار</option>
      <option value="passed">مطابق</option>
      <option value="changes_required">تعديل</option>
      <option value="not_applicable">غير مطبق</option>
    </select>
  );
}

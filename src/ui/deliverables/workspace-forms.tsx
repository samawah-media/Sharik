"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";
import type { DeliverableVersionWorkspace } from "@/modules/deliverables/deliverable-workspace";
import {
  addWorkspaceComment,
  saveOrSubmitVersionContent,
  versionContentInputSchema,
  workspaceCommentInputSchema,
} from "@/server/actions/deliverable-workspace-actions";
import { Button } from "@/ui/core/button";

type VersionValues = z.input<typeof versionContentInputSchema>;
type CommentValues = z.input<typeof workspaceCommentInputSchema>;

export function VersionContentForm({
  deliverable,
  currentVersion,
}: {
  deliverable: DeliverableSafeSummary;
  currentVersion?: DeliverableVersionWorkspace;
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string>();
  const editable = ["not_started", "in_progress", "internal_changes_requested", "client_changes_requested"].includes(deliverable.status);
  const draft = currentVersion?.status === "draft" ? currentVersion : undefined;
  const form = useForm<VersionValues>({
    resolver: zodResolver(versionContentInputSchema),
    defaultValues: {
      clientId: deliverable.clientId,
      deliverableId: deliverable.id,
      versionId: draft?.id ?? crypto.randomUUID(),
      versionNumber: draft?.versionNumber ?? ((currentVersion?.versionNumber ?? 0) + 1),
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
    setFeedback(result.ok ? (submit ? "تم إرسال النسخة للمراجعة الداخلية." : "تم حفظ المسودة.") : "تعذر حفظ النسخة. راجع الصلاحية والحالة ثم حاول مجددًا.");
    if (result.ok) router.refresh();
  };

  return (
    <form className="grid gap-3 rounded-xl border border-border bg-background p-4" onSubmit={form.handleSubmit((values) => persist(values, false))}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-semibold">رقم النسخة<input className="min-h-11 rounded-lg border border-border bg-surface px-3" type="number" min={1} {...form.register("versionNumber", { valueAsNumber: true })} /></label>
        <label className="grid gap-1 text-sm font-semibold">القناة<input className="min-h-11 rounded-lg border border-border bg-surface px-3" {...form.register("channel")} /></label>
        <label className="grid gap-1 text-sm font-semibold">الصيغة<input className="min-h-11 rounded-lg border border-border bg-surface px-3" {...form.register("format")} /></label>
        <label className="grid gap-1 text-sm font-semibold">الهدف<input className="min-h-11 rounded-lg border border-border bg-surface px-3" {...form.register("objective")} /></label>
        <label className="grid gap-1 text-sm font-semibold sm:col-span-2">مؤشر القياس<input className="min-h-11 rounded-lg border border-border bg-surface px-3" {...form.register("kpi")} /></label>
      </div>
      <label className="grid gap-1 text-sm font-semibold">الموجز<textarea className="min-h-24 rounded-lg border border-border bg-surface p-3" {...form.register("brief")} /></label>
      <label className="grid gap-1 text-sm font-semibold">المحتوى<textarea className="min-h-36 rounded-lg border border-border bg-surface p-3" {...form.register("contentBody")} /></label>
      <label className="grid gap-1 text-sm font-semibold">الكابشن<textarea className="min-h-28 rounded-lg border border-border bg-surface p-3" {...form.register("caption")} /></label>
      <label className="grid gap-1 text-sm font-semibold">مرجع المصدر<input className="min-h-11 rounded-lg border border-border bg-surface px-3" dir="auto" {...form.register("sourceReference")} /></label>
      {feedback ? <p aria-live="polite" className="text-sm text-muted">{feedback}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button disabled={form.formState.isSubmitting} type="submit" variant="secondary">حفظ مسودة</Button>
        <Button disabled={form.formState.isSubmitting} onClick={form.handleSubmit((values) => persist(values, true))} type="button" variant="primary">حفظ وإرسال للمراجعة</Button>
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
        class: "min-h-28 rounded-lg border border-border bg-surface p-3 text-sm leading-7 focus:outline-none focus:ring-2 focus:ring-accent",
        "aria-label": "نص التعليق",
      },
    },
    onUpdate: ({ editor: currentEditor }) =>
      form.setValue("body", currentEditor.getText(), { shouldValidate: true }),
  });

  if (!currentVersionId) return <p className="text-sm text-muted">احفظ نسخة أولًا لإضافة تعليق مرتبط بها.</p>;

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
    <form className="grid gap-3 rounded-xl border border-border bg-background p-4" onSubmit={submit}>
      <div className="flex flex-wrap gap-2" role="toolbar" aria-label="تنسيق التعليق">
        <Button aria-pressed={editor?.isActive("bold")} onClick={() => editor?.chain().focus().toggleBold().run()} size="sm" type="button">عريض</Button>
        <Button aria-pressed={editor?.isActive("bulletList")} onClick={() => editor?.chain().focus().toggleBulletList().run()} size="sm" type="button">قائمة</Button>
      </div>
      <EditorContent editor={editor} />
      {audience === "team" && canPublishClientComment ? (
        <label className="grid gap-1 text-sm font-semibold">الرؤية<select className="min-h-11 rounded-lg border border-border bg-surface px-3" {...form.register("visibility")}><option value="internal_only">داخلي — الافتراضي</option><option value="client_visible">ظاهر للعميل — اختيار صريح</option></select></label>
      ) : <input type="hidden" value={audience === "client" ? "client_visible" : "internal_only"} {...form.register("visibility")} />}
      {feedback ? <p aria-live="polite" className="text-sm text-muted">{feedback}</p> : null}
      <Button disabled={form.formState.isSubmitting || !editor} type="submit" variant="primary">إضافة التعليق</Button>
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

"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import {
  importNextHussamAttachmentBatchAction,
  type HussamAttachmentImportState,
} from "@/server/actions/trello-hussam-attachments";
import { Button } from "@/ui/core/button";

const initialState: HussamAttachmentImportState = { status: "idle" };

function AttachmentSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} type="submit">
      {pending ? "جارٍ نقل دفعة المرفقات…" : "بدء نقل المرفقات تلقائيًا"}
    </Button>
  );
}

export function TrelloHussamAttachmentForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(
    importNextHussamAttachmentBatchAction,
    initialState,
  );

  useEffect(() => {
    if (state.status !== "progress" || !state.remainingCount) return;
    const timer = window.setTimeout(() => {
      const form = formRef.current;
      const confirmation = form?.elements.namedItem("confirmed");
      if (confirmation instanceof HTMLInputElement) confirmation.checked = true;
      form?.requestSubmit();
    }, 500);
    return () => window.clearTimeout(timer);
  }, [state.remainingCount, state.status]);

  return (
    <form action={formAction} className="grid gap-4" ref={formRef}>
      <label className="flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
        <input
          className="mt-1"
          name="confirmed"
          required
          type="checkbox"
          value="yes"
        />
        <span>
          أؤكد نقل المرفقات المؤهلة كملفات داخلية. سيعمل النقل تلقائيًا على
          دفعات صغيرة، مع استبعاد PSD وSharePoint ومنع تكرار أي ملف.
        </span>
      </label>
      {state.message ? (
        <p
          className={
            state.status === "error"
              ? "rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger"
              : "rounded-lg border border-success/40 bg-success/10 p-3 text-sm"
          }
          role="status"
        >
          {state.message} متبقٍ: {state.remainingCount ?? 0}.
        </p>
      ) : null}
      <AttachmentSubmitButton />
    </form>
  );
}

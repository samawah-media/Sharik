"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { createQuickPostAction } from "@/server/actions/quick-post";

export type QuickPostOptions = {
  action: (formData: FormData) => ReturnType<typeof createQuickPostAction>;
  lines: { id: string; label: string; available: number }[];
  members: { userId: string; displayName: string }[];
  unavailableMessage?: string;
};

const fieldStyle =
  "w-full rounded-lg border border-border bg-surface px-2 py-2 text-sm focus-visible:outline-accent";

export function QuickPostForm({
  options,
  onSaved,
}: {
  options: QuickPostOptions;
  onSaved: (deliverableId: string) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string>();
  const [pending, startTransition] = useTransition();
  const requestId = useRef<string>(null);
  const addButton = useRef<HTMLButtonElement>(null);
  const saving = useRef(false);

  const close = () => {
    setOpen(false);
    setMessage(undefined);
    requestId.current = null;
    requestAnimationFrame(() => addButton.current?.focus());
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving.current) return;
    saving.current = true;
    const data = new FormData(event.currentTarget);
    requestId.current ??= crypto.randomUUID();
    data.set("requestId", requestId.current);
    setMessage(undefined);

    startTransition(async () => {
      try {
        const result = await options.action(data);
        if (result.ok) {
          close();
          onSaved(result.deliverableId);
        } else {
          setMessage(result.message);
        }
        router.refresh();
      } catch {
        setMessage("تعذّر الاتصال. حاول حفظ المنشور مرة أخرى.");
      } finally {
        saving.current = false;
      }
    });
  };

  if (!open) {
    return (
      <button
        className="rounded-lg border border-dashed border-accent/50 bg-surface px-3 py-2 text-start text-sm font-semibold text-accent hover:bg-accent/5"
        onClick={() => setOpen(true)}
        ref={addButton}
        type="button"
      >
        + منشور جديد
      </button>
    );
  }

  return (
    <form
      aria-label="إضافة منشور"
      className="grid gap-2 rounded-lg border border-border bg-surface p-2"
      onKeyDown={(event) => {
        if (event.key === "Escape" && !pending) {
          event.stopPropagation();
          close();
        }
      }}
      onSubmit={submit}
    >
      <fieldset
        className="grid gap-2"
        disabled={pending || options.lines.length === 0}
      >
        <label className="grid gap-1 text-sm font-medium">
          عنوان المنشور
          <input
            autoFocus
            className={fieldStyle}
            maxLength={160}
            minLength={2}
            name="name"
            required
          />
        </label>
        {options.lines.length === 1 ? (
          <input
            name="packageLineId"
            type="hidden"
            value={options.lines[0].id}
          />
        ) : options.lines.length > 1 ? (
          <label className="grid gap-1 text-sm font-medium">
            بند المنشورات
            <select
              className={fieldStyle}
              defaultValue=""
              name="packageLineId"
              required
            >
              <option disabled value="">
                اختر البند
              </option>
              {options.lines.map((line) => (
                <option key={line.id} value={line.id}>
                  {line.label} · متاح {line.available}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <details className="text-xs text-muted">
          <summary className="cursor-pointer py-1">إضافة مسؤول أو موعد</summary>
          <div className="mt-1 grid gap-2">
            {options.members.length > 0 ? (
              <label className="grid gap-1">
                المسؤول
                <select
                  className={fieldStyle}
                  defaultValue=""
                  name="ownerUserId"
                >
                  <option value="">أنا (افتراضيًا)</option>
                  {options.members.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.displayName}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="grid gap-1">
              الموعد النهائي
              <input className={fieldStyle} name="finalDueDate" type="date" />
            </label>
          </div>
        </details>
      </fieldset>
      {message || options.unavailableMessage ? (
        <p className="text-xs leading-5 text-muted" role="alert">
          {message ?? options.unavailableMessage}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
          disabled={pending || options.lines.length === 0}
          type="submit"
        >
          {pending ? "جارٍ الإضافة…" : "إضافة"}
        </button>
        {options.lines.length === 0 ? (
          <button
            className="px-2 text-xs text-accent"
            onClick={() => router.refresh()}
            type="button"
          >
            تحديث الرصيد
          </button>
        ) : null}
        <button
          className="px-2 text-sm text-muted"
          disabled={pending}
          onClick={close}
          type="button"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}

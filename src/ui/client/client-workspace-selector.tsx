"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useId, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const selectionSchema = z.object({
  clientId: z.string().min(1, "اختر المساحة المتاحة."),
});
const failureMessage = "تعذر فتح المساحة. حاول مرة أخرى.";

type ClientWorkspaceSelectorProps = {
  clients: Array<{ id: string; name: string }>;
  selectedClientId?: string;
  onSelect: (
    clientId: string,
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
};

export function ClientWorkspaceSelector({
  clients,
  selectedClientId,
  onSelect,
}: ClientWorkspaceSelectorProps) {
  const selectId = useId();
  const previousSelectedId = useRef(selectedClientId);
  const [error, setError] = useState<string>();
  const [navigating, setNavigating] = useState(false);
  const preferredId = clients.some((client) => client.id === selectedClientId)
    ? selectedClientId!
    : (clients[0]?.id ?? "");
  const { control, getValues, reset, handleSubmit, formState } = useForm<
    z.infer<typeof selectionSchema>
  >({
    resolver: zodResolver(selectionSchema),
    defaultValues: { clientId: preferredId },
  });

  useEffect(() => {
    const selectionChanged = previousSelectedId.current !== selectedClientId;
    const choiceStillAvailable = clients.some(
      (client) => client.id === getValues("clientId"),
    );
    previousSelectedId.current = selectedClientId;
    if (selectionChanged || !choiceStillAvailable) {
      reset({ clientId: preferredId });
      setError(undefined);
    }
  }, [clients, selectedClientId, preferredId, getValues, reset]);

  async function openWorkspace({ clientId }: z.infer<typeof selectionSchema>) {
    setError(undefined);
    // Option validation is a UX guard, never an authorization decision.
    if (!clients.some((client) => client.id === clientId)) {
      setError("اختر المساحة المتاحة.");
      return;
    }
    try {
      const selection = await onSelect(clientId);
      if (!selection.ok) {
        setError(selection.message || failureMessage);
        return;
      }
      setNavigating(true);
      // A full navigation discards forms and caches belonging to the old workspace.
      window.location.assign("/client");
    } catch {
      setNavigating(false);
      setError(failureMessage);
    }
  }

  if (clients.length === 0) return null;
  if (clients.length === 1) {
    return (
      <p className="min-w-0 break-words text-sm font-medium" dir="rtl">
        {clients[0].name}
      </p>
    );
  }

  const pending = formState.isSubmitting || navigating;
  const feedback = error ?? formState.errors.clientId?.message;

  return (
    <form
      className="grid min-w-0 gap-2"
      dir="rtl"
      onSubmit={handleSubmit(openWorkspace)}
    >
      <label className="text-sm font-medium" htmlFor={selectId}>
        اختر المساحة
      </label>
      <Controller
        control={control}
        name="clientId"
        render={({ field }) => (
          <select
            {...field}
            aria-describedby={feedback ? `${selectId}-error` : undefined}
            aria-invalid={Boolean(feedback)}
            className="min-h-11 w-full min-w-0 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 disabled:opacity-60"
            disabled={pending}
            id={selectId}
          >
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        )}
      />
      <button
        className="min-h-11 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        فتح المساحة
      </button>
      {pending ? (
        <p className="text-sm text-muted" role="status">
          جار فتح المساحة...
        </p>
      ) : null}
      {feedback ? (
        <p
          className="text-sm text-danger"
          id={`${selectId}-error`}
          role="alert"
        >
          {feedback}
        </p>
      ) : null}
    </form>
  );
}

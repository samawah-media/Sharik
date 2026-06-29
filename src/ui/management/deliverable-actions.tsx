import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";

type CancellationAction = (formData: FormData) => void | Promise<void>;

export function DeliverableCancellationControl({
  deliverable,
  idempotencyKey,
  action,
  expectedRevision,
}: {
  deliverable: DeliverableSafeSummary;
  idempotencyKey: string;
  action?: CancellationAction;
  expectedRevision?: number;
}) {
  if (deliverable.status !== "not_started" || !deliverable.reservation) {
    return null;
  }

  return (
    <form
      action={action}
      aria-label="إلغاء المخرج"
      className="mt-4 grid gap-3 rounded-md border border-warning/30 bg-warning/10 p-3"
      dir="rtl"
    >
      <input name="clientId" type="hidden" value={deliverable.clientId} />
      <input name="deliverableId" type="hidden" value={deliverable.id} />
      <input name="expectedStatus" type="hidden" value="not_started" />
      {expectedRevision ? (
        <input name="expectedRevision" type="hidden" value={expectedRevision} />
      ) : null}
      <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
      <div className="grid gap-1">
        <p className="text-sm font-semibold">إلغاء المخرج</p>
        <p className="text-xs leading-5 text-muted">
          متاح فقط قبل بدء التنفيذ، وسيتم إرجاع السعة المحجوزة للباقة.
        </p>
      </div>
      <label className="grid gap-2 text-sm font-medium">
        سبب الإلغاء
        <textarea
          className="min-h-20 rounded-md border border-border bg-background px-3 py-2"
          name="reason"
          required
        />
      </label>
      <button
        className="w-fit rounded-md border border-warning/40 px-3 py-2 text-sm font-semibold"
        type="submit"
      >
        إلغاء وإرجاع السعة
      </button>
    </form>
  );
}

export function DeliverableCancellationDeniedState() {
  return (
    <section
      aria-label="تعذر إلغاء المخرج"
      className="rounded-lg border border-border p-5"
      dir="rtl"
    >
      <h2 className="text-lg font-semibold">
        لا يمكن إلغاء هذا المخرج من هذه المرحلة.
      </h2>
      <p className="mt-2 text-sm text-muted">
        استخدم مسار تغيير لاحق عند بدء التنفيذ.
      </p>
    </section>
  );
}

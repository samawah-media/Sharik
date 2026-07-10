import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";
import {
  r007WorkflowStepTargets,
  type R007WorkflowStep,
} from "@/modules/deliverables/r007-deliverable-lifecycle";
import { Button } from "@/ui/core/button";
import { ErrorState } from "@/ui/core/states";

type ManagementDeliverableAction = (formData: FormData) => void | Promise<void>;
type ManagementWorkflowStep = Extract<
  R007WorkflowStep,
  | "approve_internally"
  | "request_internal_changes"
  | "send_to_client"
  | "deliver_after_client_approval"
>;

type ApprovalWorkflowConfig = {
  step: ManagementWorkflowStep;
  label: string;
  reasonLabel?: string;
  reasonRequired?: boolean;
  defaultReason: string;
  variant?: "primary" | "secondary";
};

const getApprovalWorkflowActions = (
  deliverable: DeliverableSafeSummary,
): ApprovalWorkflowConfig[] => {
  if (deliverable.status === "ready_for_internal_review") {
    return [
      {
        step: "approve_internally",
        label: "اعتماد داخلي",
        defaultReason: "internal_approval",
        variant: "primary",
      },
      {
        step: "request_internal_changes",
        label: "طلب تعديل داخلي",
        reasonLabel: "سبب التعديل الداخلي",
        reasonRequired: true,
        defaultReason: "internal_changes_requested",
        variant: "secondary",
      },
    ];
  }

  if (
    deliverable.status === "internally_approved" &&
    deliverable.requiresClientApproval
  ) {
    return [
      {
        step: "send_to_client",
        label: "إرسال للعميل",
        defaultReason: "send_to_client_after_internal_approval",
        variant: "primary",
      },
    ];
  }

  if (
    deliverable.status === "client_approved" ||
    (deliverable.status === "internally_approved" &&
      !deliverable.requiresClientApproval)
  ) {
    return [
      {
        step: "deliver_after_client_approval",
        label: "تسليم المخرج",
        defaultReason: "delivery_after_required_approval",
        variant: "primary",
      },
    ];
  }

  return [];
};

export function DeliverableCancellationControl({
  deliverable,
  idempotencyKey,
  action,
  expectedRevision,
}: {
  deliverable: DeliverableSafeSummary;
  idempotencyKey: string;
  action?: ManagementDeliverableAction;
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
      <Button type="submit" variant="secondary">
        إلغاء وإرجاع السعة
      </Button>
    </form>
  );
}

export function DeliverableApprovalWorkflowControl({
  deliverable,
  action,
}: {
  deliverable: DeliverableSafeSummary;
  action?: ManagementDeliverableAction;
}) {
  if (!action) {
    return null;
  }

  const workflows = getApprovalWorkflowActions(deliverable);

  if (workflows.length === 0) {
    return null;
  }

  return (
    <div
      aria-label="مسار الاعتماد"
      className="mt-4 grid gap-3 rounded-md border border-border bg-background/70 p-3"
      dir="rtl"
    >
      <p className="text-sm font-semibold">مسار الاعتماد</p>
      <div className="grid gap-2">
        {workflows.map((workflow) => (
          <form
            action={action}
            aria-label={`${workflow.label} ${deliverable.name}`}
            className="grid gap-2"
            key={workflow.step}
          >
            <input name="clientId" type="hidden" value={deliverable.clientId} />
            <input
              name="deliverableId"
              type="hidden"
              value={deliverable.id}
            />
            <input name="workflowStep" type="hidden" value={workflow.step} />
            <input
              name="toStatus"
              type="hidden"
              value={r007WorkflowStepTargets[workflow.step]}
            />
            <input
              name="expectedRevision"
              type="hidden"
              value={deliverable.revision}
            />
            <input
              name="idempotencyKey"
              type="hidden"
              value={`r007-${workflow.step}-${deliverable.id}-${deliverable.revision}`}
            />
            {workflow.reasonRequired ? (
              <label className="grid gap-1 text-xs font-semibold">
                {workflow.reasonLabel}
                <textarea
                  className="min-h-16 rounded-md border border-border bg-surface px-2 py-1 text-sm"
                  maxLength={500}
                  name="reason"
                  required
                />
              </label>
            ) : (
              <input
                name="reason"
                type="hidden"
                value={workflow.defaultReason}
              />
            )}
            <Button size="sm" type="submit" variant={workflow.variant}>
              {workflow.label}
            </Button>
          </form>
        ))}
      </div>
    </div>
  );
}

export function DeliverableCancellationDeniedState() {
  return (
    <ErrorState
      description="استخدم مسار تغيير لاحق عند بدء التنفيذ."
      title="لا يمكن إلغاء هذا المخرج من هذه المرحلة."
    />
  );
}

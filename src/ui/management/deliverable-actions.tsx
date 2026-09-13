"use client";

import { useState } from "react";
import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";
import type { DeliverableFileWorkspace, DeliverableVersionWorkspace } from "@/modules/deliverables/deliverable-workspace";
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
  | "return_internal_rework"
  | "send_to_client"
  | "prepare_for_delivery"
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
        step: "return_internal_rework",
        label: "إعادة للتعديل الداخلي",
        reasonLabel: "سبب إعادة العمل للتعديل الداخلي",
        reasonRequired: true,
        defaultReason: "return_internal_rework_before_client_send",
        variant: "secondary",
      },
      {
        step: "send_to_client",
        label: "إرسال للعميل",
        defaultReason: "send_to_client_after_internal_approval",
        variant: "primary",
      },
    ];
  }

  if (
    deliverable.status === "internally_approved" &&
    !deliverable.requiresClientApproval
  ) {
    return [
      {
        step: "return_internal_rework",
        label: "إعادة للتعديل الداخلي",
        reasonLabel: "سبب إعادة العمل للتعديل الداخلي",
        reasonRequired: true,
        defaultReason: "return_internal_rework_after_approval",
        variant: "secondary",
      },
      {
        step: "prepare_for_delivery",
        label: "تجهيز للتسليم",
        defaultReason: "prepare_exact_approved_version_for_delivery",
        variant: "primary",
      },
    ];
  }

  if (deliverable.status === "client_approved") {
    return [
      {
        step: "prepare_for_delivery",
        label: "تجهيز للتسليم",
        defaultReason: "prepare_exact_approved_version_for_delivery",
        variant: "primary",
      },
    ];
  }

  if (deliverable.status === "ready_for_delivery") {
    return [
      ...(deliverable.requiresClientApproval
        ? []
        : [
            {
              step: "return_internal_rework",
              label: "إعادة للتعديل الداخلي",
              reasonLabel: "سبب إعادة العمل للتعديل الداخلي",
              reasonRequired: true,
              defaultReason: "return_internal_rework_before_delivery",
              variant: "secondary",
            } satisfies ApprovalWorkflowConfig,
          ]),
      {
        step: "deliver_after_client_approval",
        label: "تأكيد التسليم النهائي",
        defaultReason: "delivery_after_exact_version_confirmation",
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
  clientReviewReady = true,
  clientName,
  currentVersion,
  files = [],
  uploadBlocked = false,
}: {
  deliverable: DeliverableSafeSummary;
  action?: ManagementDeliverableAction;
  clientReviewReady?: boolean;
  clientName?: string;
  currentVersion?: DeliverableVersionWorkspace;
  files?: DeliverableFileWorkspace[];
  uploadBlocked?: boolean;
}) {
  const [confirmedStep, setConfirmedStep] = useState<ManagementWorkflowStep>();
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
        {workflows.map((workflow) => {
          const reviewPayloadMissing =
            workflow.step === "send_to_client" && !clientReviewReady;
          const isConfirmationStep =
            workflow.step === "send_to_client" ||
            workflow.step === "deliver_after_client_approval";
          const exactFiles = files.filter(
            (file) =>
              file.versionId === deliverable.currentVersionId &&
              file.fileSize > 0 &&
              (workflow.step === "send_to_client"
                ? file.visibility === "client_visible"
                : ["client_visible", "final_delivery"].includes(
                    file.visibility,
                  )),
          );
          const uploadBlocksWorkflow =
            uploadBlocked && workflow.step !== "return_internal_rework";
          const blocked = reviewPayloadMissing || uploadBlocksWorkflow;
          return (
            <div className="grid gap-2" key={workflow.step}>
              {isConfirmationStep ? (
                <section
                  aria-label={
                    workflow.step === "send_to_client"
                      ? "ملخص ما سيراه العميل"
                      : "تأكيد بيانات التسليم النهائي"
                  }
                  className="grid gap-2 rounded-lg border border-border bg-surface p-3 text-sm"
                >
                  <p className="font-semibold">
                    {workflow.step === "send_to_client"
                      ? "راجع ما سيراه العميل"
                      : "راجع التسليم قبل إغلاق المخرج"}
                  </p>
                  <dl className="grid gap-2 sm:grid-cols-2">
                    <div><dt className="font-semibold">المخرج</dt><dd>{deliverable.name}</dd></div>
                    {clientName ? <div><dt className="font-semibold">العميل</dt><dd>{clientName}</dd></div> : null}
                    <div><dt className="font-semibold">النسخة</dt><dd>{currentVersion ? `النسخة ${currentVersion.versionNumber}` : "غير متاحة"}</dd></div>
                    <div><dt className="font-semibold">عدد الملفات</dt><dd>{exactFiles.length}</dd></div>
                  </dl>
                  {currentVersion?.caption ? <div><p className="font-semibold">الكابشن</p><p className="whitespace-pre-wrap">{currentVersion.caption}</p></div> : null}
                  {currentVersion?.body ? <div><p className="font-semibold">المحتوى</p><p className="whitespace-pre-wrap">{currentVersion.body}</p></div> : null}
                  {exactFiles.length ? (
                    <ul aria-label="ملفات النسخة الدقيقة" className="list-inside list-disc">
                      {exactFiles.map((file) => <li key={file.id}>{file.name}</li>)}
                    </ul>
                  ) : null}
                  {workflow.step === "deliver_after_client_approval" ? (
                    <p className="font-semibold text-warning">
                      سيغلق التسليم هذا المخرج ويستهلك الكمية المحجوزة من الباقة.
                    </p>
                  ) : null}
                </section>
              ) : null}
              {workflow.step === "return_internal_rework" ? (
                <p className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs leading-5 text-warning">
                  إجراء محمي يعيد النسخة الحالية إلى فريق سماوة للتعديل الداخلي
                  ويخفيها عن العميل حتى اعتماد نسخة جديدة وإرسالها بوضوح.
                </p>
              ) : null}
              {reviewPayloadMissing ? (
                <p className="text-xs leading-5 text-warning">
                  أضف نصًا فعليًا أو جهّز ملف النسخة الحالية للعميل قبل
                  الإرسال.
                </p>
              ) : null}
              {uploadBlocksWorkflow ? (
                <p className="text-xs leading-5 text-danger">
                  لا يمكن المتابعة قبل اكتمال الرفع أو إلغاء الملف المتعثر.
                </p>
              ) : null}
              {isConfirmationStep && confirmedStep !== workflow.step ? (
                <Button
                  disabled={blocked}
                  onClick={() => setConfirmedStep(workflow.step)}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  {workflow.step === "send_to_client"
                    ? "راجعت النسخة والملفات"
                    : "راجعت بيانات التسليم"}
                </Button>
              ) : (
                <form
                  action={action}
                  aria-label={`${workflow.label} ${deliverable.name}`}
                  className="grid gap-2"
                >
              <input
                name="clientId"
                type="hidden"
                value={deliverable.clientId}
              />
              <input
                name="deliverableId"
                type="hidden"
                value={deliverable.id}
              />
              <input name="workflowStep" type="hidden" value={workflow.step} />
              {deliverable.currentVersionId ? (
                <input
                  name="versionId"
                  type="hidden"
                  value={deliverable.currentVersionId}
                />
              ) : null}
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
              <Button
                disabled={blocked}
                size="sm"
                type="submit"
                variant={workflow.variant}
              >
                {workflow.label}
              </Button>
                </form>
              )}
            </div>
          );
        })}
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

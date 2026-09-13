import type { DeliverableLifecycleStatus } from "@/modules/deliverables/deliverable-rules";

const reworkStatuses = new Set([
  "in_progress",
  "ready_for_internal_review",
  "internal_changes_requested",
  "internally_approved",
  "client_changes_requested",
]);

const publicProgress: Partial<Record<DeliverableLifecycleStatus, number>> = {
  waiting_client_approval: 80,
  client_changes_requested: 65,
  client_approved: 90,
  ready_for_delivery: 95,
  delivered: 100,
};

// readableVersionId must come from authenticated publication-bound RLS, not a draft pointer.
export function deriveClientReadableVersion({
  status,
  currentVersionId,
  readableVersionId,
  hasReviewPayload,
}: {
  status: string;
  currentVersionId?: string | null;
  readableVersionId?: string | null;
  hasReviewPayload: boolean;
}) {
  const publicStatus = status as DeliverableLifecycleStatus;
  if (!readableVersionId || (!reworkStatuses.has(status) && publicProgress[publicStatus] === undefined)) {
    return undefined;
  }
  const isCurrent = currentVersionId === readableVersionId;
  const clientStatus: DeliverableLifecycleStatus = !isCurrent || reworkStatuses.has(status)
    ? "client_changes_requested"
    : publicStatus;
  const waitingForDecision = isCurrent && status === "waiting_client_approval";
  return {
    status: clientStatus,
    progressPercentage: publicProgress[clientStatus]!,
    isActionable: waitingForDecision && hasReviewPayload,
    canComment: isCurrent && publicProgress[publicStatus] !== undefined,
    actionabilityReason: waitingForDecision && !hasReviewPayload
      ? "missing_review_payload" as const
      : undefined,
  };
}

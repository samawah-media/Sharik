import type { R008PersonaCategory } from "@/modules/authorization/r008-persona-scope";

export type R008ClientDenialReason =
  | "no_assigned_client"
  | "scope_mismatch"
  | "permission_not_granted"
  | "membership_inactive"
  | "internal_content_hidden";

export type R008ClientDenialEvidence = {
  persona: R008PersonaCategory;
  status: "denied";
  reason: R008ClientDenialReason;
  safeState: "safe_empty_denied" | "safe_access_denied";
  customerDataExposed: false;
  evidenceCategory: string;
};

export const mapR008ClientDenialEvidence = ({
  persona,
  reason,
}: {
  persona: R008PersonaCategory;
  reason: R008ClientDenialReason;
}): R008ClientDenialEvidence => ({
  persona,
  status: "denied",
  reason,
  safeState: reason === "no_assigned_client"
    ? "safe_empty_denied"
    : "safe_access_denied",
  customerDataExposed: false,
  evidenceCategory:
    reason === "no_assigned_client"
      ? "unassigned_client_empty_denied"
      : "client_scope_access_denied",
});

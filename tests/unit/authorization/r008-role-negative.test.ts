import { describe, expect, it } from "vitest";
import {
  canR008ActorApproveClientItem,
  classifyR008PersonaScope,
} from "@/modules/authorization/r008-persona-scope";
import { mapR008ClientDenialEvidence } from "@/modules/release/r008-client-denial-evidence";
import {
  r008Actors,
  r008SyntheticClientA,
  r008SyntheticClientB,
  r008SyntheticTenant,
} from "../../fixtures/r008-fixtures";

describe("R-008 role negative checks", () => {
  it("denies client viewers from approval while preserving read visibility", () => {
    expect(
      canR008ActorApproveClientItem({
        actor: r008Actors.clientViewerA,
        tenantId: r008SyntheticTenant.id,
        clientId: r008SyntheticClientA.id,
      }),
    ).toEqual({ allowed: false, reason: "permission_not_granted" });
  });

  it("allows client approvers only for assigned visible client items", () => {
    expect(
      canR008ActorApproveClientItem({
        actor: r008Actors.clientApproverA,
        tenantId: r008SyntheticTenant.id,
        clientId: r008SyntheticClientA.id,
      }),
    ).toEqual({ allowed: true });

    expect(
      canR008ActorApproveClientItem({
        actor: r008Actors.clientApproverA,
        tenantId: r008SyntheticTenant.id,
        clientId: r008SyntheticClientB.id,
      }),
    ).toEqual({ allowed: false, reason: "permission_not_granted" });
  });

  it("keeps assigned internal users out of client approval powers", () => {
    expect(
      canR008ActorApproveClientItem({
        actor: r008Actors.assignedInternalA,
        tenantId: r008SyntheticTenant.id,
        clientId: r008SyntheticClientA.id,
      }),
    ).toEqual({ allowed: false, reason: "permission_not_granted" });
  });

  it("maps unassigned denial to a safe evidence state without customer data", () => {
    const scope = classifyR008PersonaScope({
      actor: r008Actors.unassignedClientUser,
      tenantId: r008SyntheticTenant.id,
      clientIds: [r008SyntheticClientA.id, r008SyntheticClientB.id],
    });

    expect(scope.visibleClientIds).toEqual([]);
    expect(
      mapR008ClientDenialEvidence({
        persona: "unassigned_client_user",
        reason: "no_assigned_client",
      }),
    ).toMatchObject({
      status: "denied",
      safeState: "safe_empty_denied",
      customerDataExposed: false,
    });
  });
});

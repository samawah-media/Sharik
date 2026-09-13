import { describe, expect, it } from "vitest";
import {
  buildR008IsolationProofMatrix,
  filterR008ApprovalItemsForActor,
  filterR008ScopedRecordsForActor,
} from "@/modules/release/r008-isolation-proof";
import {
  r008Actors,
  r008ClientIds,
  r008ScopedApprovalItems,
  r008ScopedDeliverables,
  r008SyntheticClientA,
  r008SyntheticClientB,
  r008SyntheticTenant,
} from "../../fixtures/r008-fixtures";

describe("R-008 tenant/client isolation proof", () => {
  it("proves client A cannot see client B deliverables or approval items", () => {
    expect(
      filterR008ScopedRecordsForActor({
        actor: r008Actors.clientViewerA,
        records: r008ScopedDeliverables,
      }).map((record) => record.clientId),
    ).toEqual([r008SyntheticClientA.id]);

    expect(
      filterR008ApprovalItemsForActor({
        actor: r008Actors.clientViewerA,
        items: r008ScopedApprovalItems,
        action: "view",
      }).map((item) => item.clientId),
    ).toEqual([r008SyntheticClientA.id]);
  });

  it("proves an unassigned client user receives a safe empty denied state", () => {
    const proof = buildR008IsolationProofMatrix({
      actors: r008Actors,
      approvalItems: r008ScopedApprovalItems,
      clientIds: r008ClientIds,
      deliverables: r008ScopedDeliverables,
      tenantId: r008SyntheticTenant.id,
    });
    const unassigned = proof.scenarios.find(
      (scenario) => scenario.persona === "unassigned_client_user",
    );

    expect(unassigned).toMatchObject({
      result: "denied",
      safeState: "safe_empty_denied",
      customerDataExposed: false,
      visibleClientIds: [],
    });
  });

  it("proves assigned internal users see only assigned client scope unless management allows more", () => {
    const proof = buildR008IsolationProofMatrix({
      actors: r008Actors,
      approvalItems: r008ScopedApprovalItems,
      clientIds: r008ClientIds,
      deliverables: r008ScopedDeliverables,
      tenantId: r008SyntheticTenant.id,
    });

    expect(
      proof.scenarios.find(
        (scenario) => scenario.persona === "assigned_internal_user",
      ),
    ).toMatchObject({
      result: "allowed",
      visibleClientIds: [r008SyntheticClientA.id],
      deniedClientIds: [r008SyntheticClientB.id],
    });

    expect(
      proof.scenarios.find(
        (scenario) => scenario.persona === "management_project_admin",
      ),
    ).toMatchObject({
      result: "allowed",
      visibleClientIds: [r008SyntheticClientA.id, r008SyntheticClientB.id],
      deniedClientIds: [],
    });
  });
});

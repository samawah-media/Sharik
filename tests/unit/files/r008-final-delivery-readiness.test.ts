import { describe, expect, it } from "vitest";
import {
  evaluateR008FinalDeliveryReadiness,
  summarizeR008FinalDeliveryReadiness,
} from "@/modules/files/r008-final-delivery-readiness";
import {
  r008Actors,
  r008FileAssets,
  r008SyntheticClientA,
} from "../../fixtures/r008-fixtures";

describe("R-008 final delivery readiness", () => {
  it("keeps internal files hidden and authorizes final files for scoped client readers", () => {
    const readiness = evaluateR008FinalDeliveryReadiness({
      actor: r008Actors.clientViewerA,
      clientId: r008SyntheticClientA.id,
      files: r008FileAssets,
    });

    expect(readiness.ready).toBe(true);
    expect(readiness.visibleFileIds).toEqual([
      "r008_client_a_visible_file",
      "r008_client_a_final_file",
    ]);
    expect(readiness.hiddenInternalFileIds).toEqual([
      "r008_client_a_internal_file",
    ]);
    expect(readiness.authorizedFinalFileIds).toEqual([
      "r008_client_a_final_file",
    ]);
    expect(readiness.customerDataExposed).toBe(false);
  });

  it("blocks final delivery readiness for unfinished final files", () => {
    const readiness = evaluateR008FinalDeliveryReadiness({
      actor: r008Actors.clientViewerA,
      clientId: r008SyntheticClientA.id,
      files: [
        ...r008FileAssets,
        {
          ...r008FileAssets[1],
          id: "r008_unfinished_final",
          isFinal: false,
        },
      ],
    });

    expect(readiness.ready).toBe(false);
    expect(readiness.blockers).toEqual([
      "final_delivery_file_not_authorized",
    ]);
    expect(readiness.deniedFinalFileIds).toEqual(["r008_unfinished_final"]);
  });

  it("summarizes final delivery readiness for reviewer evidence", () => {
    const summary = summarizeR008FinalDeliveryReadiness(
      evaluateR008FinalDeliveryReadiness({
        actor: r008Actors.clientViewerA,
        clientId: r008SyntheticClientA.id,
        files: r008FileAssets,
      }),
    );

    expect(summary).toEqual({
      ready: true,
      visibleFileCount: 2,
      hiddenInternalFileCount: 1,
      authorizedFinalFileCount: 1,
      deniedFinalFileCount: 0,
      blockers: [],
      customerDataExposed: false,
    });
  });
});

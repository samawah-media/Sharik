import type { AuthorizationActor } from "@/modules/authorization/evaluator";
import {
  canClientViewFileAsset,
  type FileAssetRecord,
} from "./file-visibility-rules";

export type R008FinalDeliveryReadiness = {
  ready: boolean;
  visibleFileIds: string[];
  hiddenInternalFileIds: string[];
  authorizedFinalFileIds: string[];
  deniedFinalFileIds: string[];
  blockers: string[];
  customerDataExposed: false;
};

export type R008FinalDeliveryReadinessSummary = {
  ready: boolean;
  visibleFileCount: number;
  hiddenInternalFileCount: number;
  authorizedFinalFileCount: number;
  deniedFinalFileCount: number;
  blockers: string[];
  customerDataExposed: false;
};

const unique = (values: string[]) => [...new Set(values)];

export const evaluateR008FinalDeliveryReadiness = ({
  actor,
  clientId,
  files,
}: {
  actor: AuthorizationActor;
  clientId: string;
  files: readonly FileAssetRecord[];
}): R008FinalDeliveryReadiness => {
  const visibleFileIds: string[] = [];
  const hiddenInternalFileIds: string[] = [];
  const authorizedFinalFileIds: string[] = [];
  const deniedFinalFileIds: string[] = [];
  const blockers: string[] = [];

  for (const file of files) {
    const decision = canClientViewFileAsset({ actor, clientId, file });

    if (decision.allowed) {
      visibleFileIds.push(file.id);

      if (file.visibility === "final_delivery") {
        authorizedFinalFileIds.push(file.id);
      }

      continue;
    }

    if (
      file.clientId === clientId &&
      file.visibility === "internal_only" &&
      decision.reason === "internal_file_hidden"
    ) {
      hiddenInternalFileIds.push(file.id);
    }

    if (file.clientId === clientId && file.visibility === "final_delivery") {
      deniedFinalFileIds.push(file.id);
      blockers.push("final_delivery_file_not_authorized");
    }
  }

  return {
    ready: blockers.length === 0,
    visibleFileIds,
    hiddenInternalFileIds,
    authorizedFinalFileIds,
    deniedFinalFileIds,
    blockers: unique(blockers),
    customerDataExposed: false,
  };
};

export const summarizeR008FinalDeliveryReadiness = (
  readiness: R008FinalDeliveryReadiness,
): R008FinalDeliveryReadinessSummary => ({
  ready: readiness.ready,
  visibleFileCount: readiness.visibleFileIds.length,
  hiddenInternalFileCount: readiness.hiddenInternalFileIds.length,
  authorizedFinalFileCount: readiness.authorizedFinalFileIds.length,
  deniedFinalFileCount: readiness.deniedFinalFileIds.length,
  blockers: readiness.blockers,
  customerDataExposed: false,
});

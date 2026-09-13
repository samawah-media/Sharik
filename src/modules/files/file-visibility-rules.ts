import {
  evaluatePermission,
  type AuthorizationActor,
} from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";

export const fileAssetVisibilities = [
  "internal_only",
  "client_visible",
  "client_uploaded",
  "final_delivery",
  "contract_file",
  "report_file",
  "brand_asset",
] as const;

export type FileAssetVisibility = (typeof fileAssetVisibilities)[number];

export type FileAssetRecord = {
  id: string;
  tenantId: string;
  clientId: string;
  ownerUserId: string;
  relatedDeliverableId?: string;
  relatedContractId?: string;
  visibility: FileAssetVisibility;
  fileType: string;
  fileSize: number;
  storagePath: string;
  versionNumber: number;
  isFinal: boolean;
  createdAt: string;
};

export type ClientVisibleFileAssetSummary = Omit<
  FileAssetRecord,
  "storagePath" | "ownerUserId"
>;

type FileVisibilityDeniedReason =
  | "scope_mismatch"
  | "permission_denied"
  | "internal_file_hidden"
  | "final_delivery_not_final";

export type FileVisibilityDecision =
  | { allowed: true }
  | { allowed: false; reason: FileVisibilityDeniedReason };

const clientVisibleVisibilities = new Set<FileAssetVisibility>([
  "client_visible",
  "client_uploaded",
  "contract_file",
  "report_file",
  "brand_asset",
]);

export const toClientVisibleFileAssetSummary = (
  file: FileAssetRecord,
): ClientVisibleFileAssetSummary => ({
  id: file.id,
  tenantId: file.tenantId,
  clientId: file.clientId,
  relatedDeliverableId: file.relatedDeliverableId,
  relatedContractId: file.relatedContractId,
  visibility: file.visibility,
  fileType: file.fileType,
  fileSize: file.fileSize,
  versionNumber: file.versionNumber,
  isFinal: file.isFinal,
  createdAt: file.createdAt,
});

export const canClientViewFileAsset = ({
  actor,
  clientId,
  file,
}: {
  actor: AuthorizationActor;
  clientId: string;
  file: FileAssetRecord;
}): FileVisibilityDecision => {
  if (
    actor.tenantId !== file.tenantId ||
    file.clientId !== clientId ||
    actor.tenantId !== file.tenantId
  ) {
    return { allowed: false, reason: "scope_mismatch" };
  }

  const canReadClient = evaluatePermission({
    actor,
    permission: PERMISSIONS.CLIENT_VIEW,
    resource: { tenantId: file.tenantId, clientId },
  }).allowed;

  if (!canReadClient) {
    return { allowed: false, reason: "permission_denied" };
  }

  if (file.visibility === "internal_only") {
    return { allowed: false, reason: "internal_file_hidden" };
  }

  if (file.visibility === "final_delivery") {
    return file.isFinal
      ? { allowed: true }
      : { allowed: false, reason: "final_delivery_not_final" };
  }

  return clientVisibleVisibilities.has(file.visibility)
    ? { allowed: true }
    : { allowed: false, reason: "internal_file_hidden" };
};

export const filterClientVisibleFileAssets = ({
  actor,
  clientId,
  files,
}: {
  actor: AuthorizationActor;
  clientId: string;
  files: FileAssetRecord[];
}) =>
  files.filter(
    (file) => canClientViewFileAsset({ actor, clientId, file }).allowed,
  );

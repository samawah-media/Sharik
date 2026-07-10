import { describe, expect, it } from "vitest";
import { InMemoryAuditSink } from "@/modules/audit/audit-service";
import {
  canClientViewFileAsset,
  filterClientVisibleFileAssets,
  type FileAssetRecord,
} from "@/modules/files/file-visibility-rules";
import {
  authorizeFileAccessCommand,
  InMemoryFileAssetRepository,
} from "@/server/commands/files/authorize-file-access";
import { clientA, clientB, clientViewerA } from "../../fixtures/f001-fixtures";

const baseFile = (
  overrides: Partial<FileAssetRecord> = {},
): FileAssetRecord => ({
  id: "file_client_visible",
  tenantId: clientA.tenantId,
  clientId: clientA.id,
  ownerUserId: "assigned_internal_a",
  relatedDeliverableId: "deliverable_visible",
  visibility: "client_visible",
  fileType: "application/pdf",
  fileSize: 1200,
  storagePath: "tenant_a/client_a/safe-visible.pdf",
  versionNumber: 1,
  isFinal: false,
  createdAt: "2026-07-08T00:00:00.000Z",
  ...overrides,
});

describe("R-007 file visibility rules", () => {
  it("shows only client-safe file visibilities in the assigned client scope", () => {
    const files = [
      baseFile({ id: "client_visible", visibility: "client_visible" }),
      baseFile({
        id: "final_delivery",
        visibility: "final_delivery",
        isFinal: true,
      }),
      baseFile({ id: "client_uploaded", visibility: "client_uploaded" }),
      baseFile({ id: "contract_file", visibility: "contract_file" }),
      baseFile({ id: "report_file", visibility: "report_file" }),
      baseFile({ id: "brand_asset", visibility: "brand_asset" }),
      baseFile({ id: "internal_only", visibility: "internal_only" }),
      baseFile({
        id: "other_client",
        tenantId: clientB.tenantId,
        clientId: clientB.id,
      }),
      baseFile({
        id: "unfinished_final",
        visibility: "final_delivery",
        isFinal: false,
      }),
    ];

    expect(
      filterClientVisibleFileAssets({
        actor: clientViewerA.authorizationActor,
        clientId: clientA.id,
        files,
      }).map((file) => file.id),
    ).toEqual([
      "client_visible",
      "final_delivery",
      "client_uploaded",
      "contract_file",
      "report_file",
      "brand_asset",
    ]);
  });

  it("denies internal files and cross-client files with safe reasons", () => {
    expect(
      canClientViewFileAsset({
        actor: clientViewerA.authorizationActor,
        clientId: clientA.id,
        file: baseFile({ visibility: "internal_only" }),
      }),
    ).toMatchObject({ allowed: false, reason: "internal_file_hidden" });

    expect(
      canClientViewFileAsset({
        actor: clientViewerA.authorizationActor,
        clientId: clientA.id,
        file: baseFile({ tenantId: clientB.tenantId, clientId: clientB.id }),
      }),
    ).toMatchObject({ allowed: false, reason: "scope_mismatch" });
  });

  it("guards file access through a server command and audits denials", async () => {
    const audit = new InMemoryAuditSink();
    const files = new InMemoryFileAssetRepository({
      files: [
        baseFile({ id: "allowed_file" }),
        baseFile({ id: "internal_file", visibility: "internal_only" }),
      ],
    });

    await expect(
      authorizeFileAccessCommand({
        actor: clientViewerA.authorizationActor,
        audit,
        files,
        input: { clientId: clientA.id, fileId: "allowed_file" },
      }),
    ).resolves.toMatchObject({
      ok: true,
      value: { fileId: "allowed_file", storagePath: "tenant_a/client_a/safe-visible.pdf" },
    });

    await expect(
      authorizeFileAccessCommand({
        actor: clientViewerA.authorizationActor,
        audit,
        files,
        input: { clientId: clientA.id, fileId: "internal_file" },
      }),
    ).resolves.toMatchObject({ ok: false, error: { code: "ACCESS_DENIED" } });
    expect(audit.events).toContainEqual(
      expect.objectContaining({
        action: "FileAccessDenied",
        decision: "denied",
        reason: "internal_file_hidden",
      }),
    );
  });
});

import { z } from "zod";
import type { AuditSink } from "@/modules/audit/audit-service";
import type { AuthorizationActor } from "@/modules/authorization/evaluator";
import { safeDeniedError } from "@/modules/errors/safe-errors";
import {
  canClientViewFileAsset,
  type FileAssetRecord,
} from "@/modules/files/file-visibility-rules";

const authorizeFileAccessSchema = z.object({
  clientId: z.string().trim().min(1),
  fileId: z.string().trim().min(1),
});

type FileAccessInput = z.infer<typeof authorizeFileAccessSchema>;

export type FileAssetRepository = {
  findByTenantClientAndId: (
    tenantId: string,
    clientId: string,
    fileId: string,
  ) => Promise<FileAssetRecord | undefined>;
};

export class InMemoryFileAssetRepository implements FileAssetRepository {
  private readonly files = new Map<string, FileAssetRecord>();

  constructor({ files = [] }: { files?: FileAssetRecord[] } = {}) {
    for (const file of files) {
      this.files.set(file.id, file);
    }
  }

  async findByTenantClientAndId(
    tenantId: string,
    clientId: string,
    fileId: string,
  ) {
    const file = this.files.get(fileId);

    return file?.tenantId === tenantId && file.clientId === clientId
      ? file
      : undefined;
  }
}

const appendDeniedAudit = async ({
  actor,
  audit,
  input,
  reason,
}: {
  actor: AuthorizationActor;
  audit: AuditSink;
  input: FileAccessInput;
  reason: string;
}) => {
  await audit.append({
    tenantId: actor.tenantId,
    clientId: input.clientId,
    actorUserId: actor.userId,
    action: "FileAccessDenied",
    decision: "denied",
    targetType: "file_asset",
    targetId: input.fileId,
    reason,
  });

  return { ok: false as const, error: safeDeniedError("ACCESS_DENIED") };
};

export const authorizeFileAccessCommand = async ({
  actor,
  audit,
  files,
  input,
}: {
  actor: AuthorizationActor;
  audit: AuditSink;
  files: FileAssetRepository;
  input: unknown;
}) => {
  const parsed = authorizeFileAccessSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false as const, error: "VALIDATION_FAILED" as const };
  }

  const scopedFile = await files.findByTenantClientAndId(
    actor.tenantId,
    parsed.data.clientId,
    parsed.data.fileId,
  );

  if (!scopedFile) {
    return appendDeniedAudit({
      actor,
      audit,
      input: parsed.data,
      reason: "file_not_found",
    });
  }

  const decision = canClientViewFileAsset({
    actor,
    clientId: parsed.data.clientId,
    file: scopedFile,
  });

  if (!decision.allowed) {
    return appendDeniedAudit({
      actor,
      audit,
      input: parsed.data,
      reason: decision.reason,
    });
  }

  await audit.append({
    tenantId: scopedFile.tenantId,
    clientId: scopedFile.clientId,
    actorUserId: actor.userId,
    action: "FileAccessAuthorized",
    decision: "allowed",
    targetType: "file_asset",
    targetId: scopedFile.id,
    reason: scopedFile.visibility,
    metadata: {
      versionNumber: scopedFile.versionNumber,
      isFinal: scopedFile.isFinal,
    },
  });

  return {
    ok: true as const,
    value: {
      fileId: scopedFile.id,
      storagePath: scopedFile.storagePath,
      visibility: scopedFile.visibility,
      versionNumber: scopedFile.versionNumber,
    },
  };
};

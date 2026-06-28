import {
  createRequiredAuditAtomicUnitOfWork,
  runAuditAtomicMutation,
  type AuditSink,
} from "@/modules/audit/audit-service";
import type { AuthorizationActor } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import { safeDeniedError } from "@/modules/errors/safe-errors";
import {
  projectPackageBalance,
  type PackageLedgerEntry,
} from "@/modules/packages/package-ledger";
import type { PackageRepository } from "@/modules/packages/package-repository";
import { runAuthorizedSensitiveOperation } from "@/server/authorization/server-authorization";
import { adjustPackageSchema } from "./package-schemas";

export const adjustPackageCommand = async ({
  actor,
  packages,
  audit,
  input,
  ledgerIdFactory = crypto.randomUUID,
}: {
  actor: AuthorizationActor;
  packages: PackageRepository;
  audit: AuditSink;
  input: unknown;
  ledgerIdFactory?: () => string;
}) => {
  const parsed = adjustPackageSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false as const, error: "VALIDATION_FAILED" as const };
  }

  const packageLine = await packages.findPackageLineByTenantAndId(
    actor.tenantId,
    parsed.data.packageLineId,
  );

  if (!packageLine) {
    await audit.append({
      tenantId: actor.tenantId,
      actorUserId: actor.userId,
      action: "PackageAdjustmentScopeDenied",
      decision: "denied",
      targetType: "package_line",
      targetId: parsed.data.packageLineId,
      reason: "package_line_scope_not_available",
    });

    return { ok: false as const, error: safeDeniedError("ACCESS_DENIED") };
  }

  return runAuthorizedSensitiveOperation({
    actor,
    permission: PERMISSIONS.PACKAGE_ADJUST,
    resource: { tenantId: packageLine.tenantId, clientId: packageLine.clientId },
    audit,
    operation: async () => {
      const existing = await packages.findLedgerByTenantAndIdempotencyKey(
        actor.tenantId,
        parsed.data.idempotencyKey,
      );

      if (existing) {
        const balance = (await packages.toLineBalanceSummary(packageLine)).balance;

        return {
          ok: true as const,
          value: {
            packageLineId: packageLine.id,
            ...balance,
          },
        };
      }

      const currentEntries = await packages.listLedgerByPackageLine(
        packageLine.tenantId,
        packageLine.clientId,
        packageLine.id,
      );
      const projected = projectPackageBalance([
        ...currentEntries,
        {
          id: "projected-adjustment",
          tenantId: packageLine.tenantId,
          clientId: packageLine.clientId,
          packageLineId: packageLine.id,
          entryType: "administrative_adjustment",
          quantity: parsed.data.adjustmentQuantity,
          reason: parsed.data.reason,
          occurredAt: new Date().toISOString(),
        } satisfies PackageLedgerEntry,
      ]);

      if (projected.available < 0) {
        await audit.append({
          tenantId: packageLine.tenantId,
          clientId: packageLine.clientId,
          actorUserId: actor.userId,
          action: "PackageAdjustmentDenied",
          decision: "denied",
          targetType: "package_line",
          targetId: packageLine.id,
          reason: "adjustment_would_overdraw_capacity",
        });

        return { ok: false as const, error: safeDeniedError("ACCESS_DENIED") };
      }

      const parentPackage = await packages.findPackageByTenantClientAndId(
        packageLine.tenantId,
        packageLine.clientId,
        packageLine.packageId,
      );

      if (!parentPackage) {
        await audit.append({
          tenantId: packageLine.tenantId,
          clientId: packageLine.clientId,
          actorUserId: actor.userId,
          action: "PackageAdjustmentScopeDenied",
          decision: "denied",
          targetType: "package_line",
          targetId: packageLine.id,
          reason: "package_scope_not_available",
        });

        return { ok: false as const, error: safeDeniedError("ACCESS_DENIED") };
      }

      const transaction = createRequiredAuditAtomicUnitOfWork([
        packages,
        audit,
      ]);

      return runAuditAtomicMutation({
        transaction,
        operation: async () => {
          await packages.appendLedgerEntry({
            id: ledgerIdFactory(),
            tenantId: packageLine.tenantId,
            clientId: packageLine.clientId,
            contractId: parentPackage.contractId,
            packageId: parentPackage.id,
            packageLineId: packageLine.id,
            entryType: "administrative_adjustment",
            quantity: parsed.data.adjustmentQuantity,
            reason: parsed.data.reason,
            actorUserId: actor.userId,
            idempotencyKey: parsed.data.idempotencyKey,
          });

          await audit.append({
            tenantId: packageLine.tenantId,
            clientId: packageLine.clientId,
            actorUserId: actor.userId,
            action: "PackageCommitmentAdjusted",
            decision: "allowed",
            targetType: "package_line",
            targetId: packageLine.id,
            reason: "adjustment_recorded",
          });

          const balance = (await packages.toLineBalanceSummary(packageLine)).balance;

          return {
            ok: true as const,
            value: {
              packageLineId: packageLine.id,
              ...balance,
            },
          };
        },
      });
    },
  });
};

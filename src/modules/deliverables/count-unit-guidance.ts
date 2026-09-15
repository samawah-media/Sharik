import type { DeliverableSafeSummary } from "./deliverable-repository";
import { isCountUnitLabel } from "@/modules/packages/package-quantity";
import type { PackageLineSafeSummary } from "@/modules/packages/package-repository";

export function resolveCountUnitPreselection({
  clientId,
  packageId,
  packageLines,
  requestedPackageLineId,
}: {
  clientId: string;
  packageId?: string;
  packageLines: PackageLineSafeSummary[];
  requestedPackageLineId?: string;
}) {
  if (!requestedPackageLineId || !packageId) return undefined;

  const line = packageLines.find(
    (candidate) =>
      candidate.id === requestedPackageLineId &&
      candidate.clientId === clientId &&
      candidate.packageId === packageId &&
      candidate.status === "active" &&
      candidate.balance.available > 0 &&
      isCountUnitLabel(candidate.unitLabel),
  );
  if (!line) return undefined;

  const nextOrdinal = Math.max(
    1,
    Math.floor(line.committedQuantity - line.balance.available) + 1,
  );
  return {
    packageLineId: line.id,
    suggestedName: `${line.unitLabel} ${nextOrdinal} من ${line.committedQuantity}`,
  };
}

export function findExactCreatedDeliverable({
  clientId,
  saved,
  deliverableId,
  deliverables,
}: {
  clientId: string;
  saved?: string;
  deliverableId?: string;
  deliverables: DeliverableSafeSummary[];
}) {
  if (saved !== "created" || !deliverableId) return undefined;
  return deliverables.find(
    (candidate) =>
      candidate.id === deliverableId && candidate.clientId === clientId,
  );
}

export function findCreatedCountUnitLine({
  clientId,
  saved,
  deliverableId,
  deliverables,
  packages,
}: {
  clientId: string;
  saved?: string;
  deliverableId?: string;
  deliverables: DeliverableSafeSummary[];
  packages: Array<{
    id: string;
    clientId: string;
    status: string;
    lines?: PackageLineSafeSummary[];
  }>;
}) {
  const deliverable = findExactCreatedDeliverable({
    clientId,
    saved,
    deliverableId,
    deliverables,
  });
  if (!deliverable?.packageId || !deliverable.packageLineId) return undefined;

  return packages
    .filter(
      (packageSummary) =>
        packageSummary.id === deliverable.packageId &&
        packageSummary.clientId === clientId &&
        packageSummary.status === "active",
    )
    .flatMap((packageSummary) => packageSummary.lines ?? [])
    .find(
      (line) =>
        line.id === deliverable.packageLineId &&
        line.clientId === clientId &&
        line.packageId === deliverable.packageId &&
        line.status === "active" &&
        isCountUnitLabel(line.unitLabel),
    );
}

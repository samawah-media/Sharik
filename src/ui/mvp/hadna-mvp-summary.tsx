import type { ReactNode } from "react";
import type {
  ClientCommercialSummary,
  ManagementCommercialSummary,
} from "@/modules/commercial/commercial-summary";
import type { DeliverableLifecycleStatus } from "@/modules/deliverables/deliverable-rules";
import { Badge } from "@/ui/core/badge";
import { Card } from "@/ui/core/card";

export type MvpSnapshotStats = {
  deliverablesCount: number;
  packageLineCount: number;
  waitingWorkCount: number;
  waitingClientCount: number;
  completedCount: number;
};

export const formatMvpClientName = (name = "هدنة") =>
  name.trim().toLowerCase() === "hadna" ? "هدنة" : name;

const waitingClientStatuses = new Set<DeliverableLifecycleStatus>([
  "waiting_client_approval",
]);

const completedStatuses = new Set<DeliverableLifecycleStatus>([
  "client_approved",
  "ready_for_delivery",
  "delivered",
]);

const workStatuses = new Set<DeliverableLifecycleStatus>([
  "not_started",
  "in_progress",
  "ready_for_internal_review",
  "internal_changes_requested",
  "internally_approved",
  "client_changes_requested",
]);

const sumPackageLines = (
  packages: ManagementCommercialSummary["packages"] | ClientCommercialSummary["packages"],
) =>
  packages.reduce(
    (total, packageSummary) => total + (packageSummary.lines?.length ?? 0),
    0,
  );

const summarizeStatuses = (
  deliverables: ReadonlyArray<{ status: DeliverableLifecycleStatus }>,
) =>
  deliverables.reduce(
    (stats, deliverable) => {
      if (waitingClientStatuses.has(deliverable.status)) {
        stats.waitingClientCount += 1;
      }

      if (completedStatuses.has(deliverable.status)) {
        stats.completedCount += 1;
      }

      if (workStatuses.has(deliverable.status)) {
        stats.waitingWorkCount += 1;
      }

      return stats;
    },
    {
      waitingWorkCount: 0,
      waitingClientCount: 0,
      completedCount: 0,
    },
  );

export function buildMvpStatsFromDeliverables(
  deliverables: ReadonlyArray<{ status: DeliverableLifecycleStatus }>,
  packageLineCount = 0,
): MvpSnapshotStats {
  return {
    deliverablesCount: deliverables.length,
    packageLineCount,
    ...summarizeStatuses(deliverables),
  };
}

export function buildManagementMvpStats(
  summary: ManagementCommercialSummary,
): MvpSnapshotStats {
  return {
    deliverablesCount: summary.deliverables.length,
    packageLineCount: sumPackageLines(summary.packages),
    ...summarizeStatuses(summary.deliverables),
  };
}

export function buildClientMvpStats(
  summary: ClientCommercialSummary,
): MvpSnapshotStats {
  return {
    deliverablesCount: summary.deliverables.length,
    packageLineCount: sumPackageLines(summary.packages),
    ...summarizeStatuses(summary.deliverables),
  };
}

export function buildEmptyMvpStats(): MvpSnapshotStats {
  return {
    deliverablesCount: 0,
    packageLineCount: 0,
    waitingWorkCount: 0,
    waitingClientCount: 0,
    completedCount: 0,
  };
}

const statCards = (stats: MvpSnapshotStats) => [
  {
    label: "عدد المخرجات",
    value: stats.deliverablesCount,
    help: "المخرجات المتفق عليها في تجربة هدنة",
  },
  {
    label: "الباقة",
    value: `${stats.packageLineCount} بنود`,
    help: "بنود الباقة المفعلة للتجربة",
  },
  {
    label: "ما ينتظر العمل",
    value: stats.waitingWorkCount,
    help: "داخل فريق سماوة أو قيد التجهيز",
  },
  {
    label: "ما ينتظر العميل",
    value: stats.waitingClientCount,
    help: "مخرجات مرسلة للعميل وتنتظر قرارًا",
  },
];

export function MvpSnapshotCards({ stats }: { stats: MvpSnapshotStats }) {
  return (
    <section
      aria-label="ملخص تجربة هدنة"
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      dir="rtl"
    >
      {statCards(stats).map((item) => (
        <Card className="min-h-32" key={item.label}>
          <p className="text-sm text-muted">{item.label}</p>
          <p className="mt-2 text-3xl font-semibold">{item.value}</p>
          <p className="mt-2 text-xs leading-5 text-muted">{item.help}</p>
        </Card>
      ))}
    </section>
  );
}

export function HadnaMvpHero({
  clientName,
  roleLabel,
  children,
  stats,
}: {
  clientName: string;
  roleLabel: string;
  children?: ReactNode;
  stats: MvpSnapshotStats;
}) {
  const displayClientName = formatMvpClientName(clientName);

  return (
    <section
      aria-label="مدخل تجربة هدنة"
      className="grid gap-5 rounded-lg border border-accent/20 bg-accent-soft/40 p-5"
      dir="rtl"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">{roleLabel}</Badge>
            <Badge tone="warning">تجربة داخلية</Badge>
          </div>
          <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">
            تجربة هدنة
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            هذه هدنة، هذه الباقة، وهذه المخرجات التي نتابعها في UAT الداخلي.
            كل دور يرى ما يخصه فقط بدون معرفات تقنية أو بيانات عملاء آخرين.
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">
            العميل: {displayClientName}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">{children}</div>
      </div>
      <MvpSnapshotCards stats={stats} />
    </section>
  );
}

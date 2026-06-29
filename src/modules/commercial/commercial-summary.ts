import {
  evaluatePermission,
  type AuthorizationActor,
} from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import {
  toContractSafeSummary,
  type ContractRepository,
  type ContractSafeSummary,
} from "@/modules/contracts/contract-repository";
import {
  toClientDeliverableSummary,
  toManagementDeliverableSummary,
  type DeliverableClientSafeSummary,
} from "@/modules/deliverables/deliverable-summary";
import type {
  DeliverableRepository,
  DeliverableSafeSummary,
} from "@/modules/deliverables/deliverable-repository";
import { safeDeniedError } from "@/modules/errors/safe-errors";
import type {
  PackageBalanceSafeSummary,
  PackageLineSafeSummary,
  PackageRepository,
  PackageSafeSummary,
} from "@/modules/packages/package-repository";

export type ClientContractSummary = {
  name: string;
  reference?: string;
  summary?: string;
  periodStart?: string;
  periodEnd?: string;
  status: ContractSafeSummary["status"];
};

export type ClientPackageLineSummary = {
  serviceLabel: string;
  unitLabel: string;
  balance: PackageLineSafeSummary["balance"];
};

export type ClientPackageSummary = {
  name: string;
  periodStart?: string;
  periodEnd?: string;
  status: PackageSafeSummary["status"];
  lines: ClientPackageLineSummary[];
};

export type ManagementCommercialSummary = {
  audience: "management";
  clientId: string;
  contracts: ContractSafeSummary[];
  packages: PackageSafeSummary[];
  deliverables: DeliverableSafeSummary[];
};

export type ClientCommercialSummary = {
  audience: "client";
  contracts: ClientContractSummary[];
  packages: ClientPackageSummary[];
  deliverables: DeliverableClientSafeSummary[];
};

export type CommercialSummary = ManagementCommercialSummary | ClientCommercialSummary;

const isClientAudience = (actor: AuthorizationActor) =>
  actor.roleAssignments.some((assignment) =>
    assignment.roleKey.startsWith("client_"),
  ) &&
  actor.roleAssignments.every((assignment) =>
    assignment.roleKey.startsWith("client_"),
  );

const canReadCommercialSummary = ({
  actor,
  clientId,
}: {
  actor: AuthorizationActor;
  clientId: string;
}) =>
  evaluatePermission({
    actor,
    permission: PERMISSIONS.CONTRACT_VIEW,
    resource: { tenantId: actor.tenantId, clientId },
  }).allowed &&
  evaluatePermission({
    actor,
    permission: PERMISSIONS.LEDGER_VIEW_SUMMARY,
    resource: { tenantId: actor.tenantId, clientId },
  }).allowed;

const toClientContractSummary = (
  contract: ContractSafeSummary,
): ClientContractSummary => ({
  name: contract.name,
  reference: contract.reference,
  summary: contract.summary,
  periodStart: contract.periodStart,
  periodEnd: contract.periodEnd,
  status: contract.status,
});

const toClientPackageSummary = (
  packageSummary: PackageSafeSummary,
): ClientPackageSummary => ({
  name: packageSummary.name,
  periodStart: packageSummary.periodStart,
  periodEnd: packageSummary.periodEnd,
  status: packageSummary.status,
  lines: packageSummary.lines.map((line) => ({
    serviceLabel: line.serviceLabel,
    unitLabel: line.unitLabel,
    balance: line.balance,
  })),
});

export const buildCommercialSummary = async ({
  actor,
  clientId,
  contracts,
  packages,
  deliverables,
}: {
  actor: AuthorizationActor;
  clientId: string;
  contracts: ContractRepository;
  packages: PackageRepository;
  deliverables: DeliverableRepository;
}): Promise<
  | { ok: true; value: CommercialSummary }
  | { ok: false; error: ReturnType<typeof safeDeniedError> }
> => {
  if (!canReadCommercialSummary({ actor, clientId })) {
    return { ok: false, error: safeDeniedError("ACCESS_DENIED") };
  }

  const contractSummaries = (
    await contracts.listByTenantAndClient(actor.tenantId, clientId)
  ).map(toContractSafeSummary);
  const packageSummaries = (
    await Promise.all(
      contractSummaries.map((contract) =>
        packages.listByTenantClientAndContract(
          actor.tenantId,
          clientId,
          contract.id,
        ),
      ),
    )
  ).flat();
  const deliverableSummaries = await deliverables.listByTenantClient(
    actor.tenantId,
    clientId,
  );

  if (isClientAudience(actor)) {
    return {
      ok: true,
      value: {
        audience: "client",
        contracts: contractSummaries.map(toClientContractSummary),
        packages: packageSummaries.map(toClientPackageSummary),
        deliverables: deliverableSummaries.map(toClientDeliverableSummary),
      },
    };
  }

  return {
    ok: true,
    value: {
      audience: "management",
      clientId,
      contracts: contractSummaries,
      packages: packageSummaries.map((packageSummary) => ({
        ...packageSummary,
        balances: packageSummary.balances.map(
          (balance): PackageBalanceSafeSummary => ({ ...balance }),
        ),
      })),
      deliverables: deliverableSummaries.map(toManagementDeliverableSummary),
    },
  };
};

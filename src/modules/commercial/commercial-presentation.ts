import type { PackageBalanceProjection } from "@/modules/packages/package-ledger";
import { isCountUnitLabel } from "@/modules/packages/package-quantity";

export type CommercialQuantityIssue = "fractional_count" | "invalid_quantity";
export type PackageBalanceIssue =
  | CommercialQuantityIssue
  | "negative_available";

const quantityFormatter = new Intl.NumberFormat("ar-SA-u-nu-arab", {
  maximumFractionDigits: 2,
});

export const formatCommercialQuantity = (
  value: number,
  unitLabel: string,
): { text: string; issue?: CommercialQuantityIssue } => {
  if (!Number.isFinite(value)) {
    return { text: "يحتاج تصحيحًا", issue: "invalid_quantity" };
  }

  if (isCountUnitLabel(unitLabel) && !Number.isInteger(value)) {
    return { text: "يحتاج تصحيحًا", issue: "fractional_count" };
  }

  return { text: quantityFormatter.format(value) };
};

export const getPackageBalanceIssues = (
  balance: PackageBalanceProjection,
  unitLabel: string,
): PackageBalanceIssue[] => {
  const issues = new Set<PackageBalanceIssue>();
  const quantities = [
    balance.committed,
    balance.reserved,
    balance.consumed,
    balance.released,
    balance.adjustments,
  ];

  for (const quantity of quantities) {
    const issue = formatCommercialQuantity(quantity, unitLabel).issue;
    if (issue) issues.add(issue);
  }

  if (!Number.isFinite(balance.available)) {
    issues.add("invalid_quantity");
  } else if (balance.available < 0) {
    issues.add("negative_available");
  } else {
    const issue = formatCommercialQuantity(balance.available, unitLabel).issue;
    if (issue) issues.add(issue);
  }

  return Array.from(issues);
};

export const paginateCommercialItems = <CommercialListEntry>({
  items,
  query,
  status,
  page,
  pageSize,
  getSearchText,
  getStatus,
}: {
  items: readonly CommercialListEntry[];
  query: string;
  status: string;
  page: number;
  pageSize: number;
  getSearchText: (entry: CommercialListEntry) => string;
  getStatus: (entry: CommercialListEntry) => string;
}) => {
  const normalizedQuery = query.trim().toLocaleLowerCase("ar");
  const filteredItems = items.filter((item) => {
    const matchesQuery =
      normalizedQuery.length === 0 ||
      getSearchText(item).toLocaleLowerCase("ar").includes(normalizedQuery);
    const matchesStatus = status === "all" || getStatus(item) === status;
    return matchesQuery && matchesStatus;
  });
  const safePageSize = Math.max(1, Math.trunc(pageSize));
  const totalPages = Math.max(
    1,
    Math.ceil(filteredItems.length / safePageSize),
  );
  const boundedPage = Math.min(Math.max(1, Math.trunc(page)), totalPages);
  const start = (boundedPage - 1) * safePageSize;

  return {
    items: filteredItems.slice(start, start + safePageSize),
    page: boundedPage,
    totalItems: filteredItems.length,
    totalPages,
  };
};

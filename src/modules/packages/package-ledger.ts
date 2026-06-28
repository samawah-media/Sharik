export type PackageLedgerEntryType =
  | "commitment_added"
  | "quantity_reserved"
  | "reservation_released"
  | "administrative_adjustment"
  | "contract_amendment"
  | "quantity_consumed";

export type PackageLedgerEntry = {
  id: string;
  tenantId: string;
  clientId: string;
  packageLineId: string;
  entryType: PackageLedgerEntryType;
  quantity: number;
  deliverableId?: string;
  reason?: string;
  occurredAt: string;
};

export type PackageBalanceProjection = {
  committed: number;
  reserved: number;
  consumed: number;
  released: number;
  adjustments: number;
  available: number;
};

export type ReservationDecision =
  | { allowed: true }
  | { allowed: false; reason: "invalid_quantity" | "insufficient_capacity" };

export const projectPackageBalance = (
  entries: readonly PackageLedgerEntry[],
): PackageBalanceProjection => {
  const totals = entries.reduce(
    (balance, entry) => {
      switch (entry.entryType) {
        case "commitment_added":
        case "contract_amendment":
          balance.committed += entry.quantity;
          break;
        case "quantity_reserved":
          balance.reserved += entry.quantity;
          break;
        case "reservation_released":
          balance.released += entry.quantity;
          break;
        case "administrative_adjustment":
          balance.adjustments += entry.quantity;
          break;
        case "quantity_consumed":
          balance.consumed += entry.quantity;
          break;
      }

      return balance;
    },
    {
      committed: 0,
      reserved: 0,
      consumed: 0,
      released: 0,
      adjustments: 0,
    },
  );

  const activeReserved = Math.max(0, totals.reserved - totals.released);

  return {
    ...totals,
    reserved: activeReserved,
    available:
      totals.committed + totals.adjustments - activeReserved - totals.consumed,
  };
};

export const assertCanReserveQuantity = (
  balance: PackageBalanceProjection,
  quantity: number,
): ReservationDecision => {
  if (quantity < 0) {
    return { allowed: false, reason: "invalid_quantity" };
  }

  if (quantity > balance.available) {
    return { allowed: false, reason: "insufficient_capacity" };
  }

  return { allowed: true };
};


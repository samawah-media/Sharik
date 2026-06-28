import { describe, expect, it } from "vitest";
import {
  assertCanReserveQuantity,
  projectPackageBalance,
  type PackageLedgerEntry,
} from "@/modules/packages/package-ledger";
import {
  deliverableA,
  packageLinePostsA,
} from "../../fixtures/f002-fixtures";

const baseEntry = {
  tenantId: packageLinePostsA.tenantId,
  clientId: packageLinePostsA.clientId,
  packageLineId: packageLinePostsA.id,
  occurredAt: "2026-06-28T00:00:00.000Z",
} satisfies Omit<PackageLedgerEntry, "id" | "entryType" | "quantity">;

describe("package ledger projection", () => {
  it("derives available quantity from append-only commitment, reservation, release, and adjustment entries", () => {
    const balance = projectPackageBalance([
      {
        ...baseEntry,
        id: "ledger_commitment",
        entryType: "commitment_added",
        quantity: 4,
      },
      {
        ...baseEntry,
        id: "ledger_reservation",
        entryType: "quantity_reserved",
        quantity: 2,
        deliverableId: deliverableA.id,
      },
      {
        ...baseEntry,
        id: "ledger_release",
        entryType: "reservation_released",
        quantity: 1,
        deliverableId: deliverableA.id,
      },
      {
        ...baseEntry,
        id: "ledger_adjustment",
        entryType: "administrative_adjustment",
        quantity: -1,
        reason: "scope reduced during planning",
      },
    ]);

    expect(balance).toEqual({
      committed: 4,
      reserved: 1,
      consumed: 0,
      released: 1,
      adjustments: -1,
      available: 2,
    });
  });

  it("treats contract amendments as commitment changes without mutating historical entries", () => {
    const balance = projectPackageBalance([
      {
        ...baseEntry,
        id: "ledger_commitment",
        entryType: "commitment_added",
        quantity: 2,
      },
      {
        ...baseEntry,
        id: "ledger_amendment",
        entryType: "contract_amendment",
        quantity: 3,
        reason: "approved package increase",
      },
    ]);

    expect(balance.committed).toBe(5);
    expect(balance.available).toBe(5);
  });

  it("denies reservations that would make available quantity negative", () => {
    const balance = projectPackageBalance([
      {
        ...baseEntry,
        id: "ledger_commitment",
        entryType: "commitment_added",
        quantity: 1,
      },
      {
        ...baseEntry,
        id: "ledger_reservation",
        entryType: "quantity_reserved",
        quantity: 1,
      },
    ]);

    expect(assertCanReserveQuantity(balance, 1)).toEqual({
      allowed: false,
      reason: "insufficient_capacity",
    });
  });

  it("allows zero-reservation checks only when callers are previewing no package impact", () => {
    const balance = projectPackageBalance([]);

    expect(assertCanReserveQuantity(balance, 0)).toEqual({ allowed: true });
  });
});


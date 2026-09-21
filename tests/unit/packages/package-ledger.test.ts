import { describe, expect, it } from "vitest";
import {
  assertCanReserveQuantity,
  projectPackageBalance,
  type PackageLedgerEntry,
} from "@/modules/packages/package-ledger";
import { deliverableA, packageLinePostsA } from "../../fixtures/f002-fixtures";

const baseEntry = {
  tenantId: packageLinePostsA.tenantId,
  clientId: packageLinePostsA.clientId,
  packageLineId: packageLinePostsA.id,
  occurredAt: "2026-06-28T00:00:00.000Z",
} satisfies Omit<PackageLedgerEntry, "id" | "entryType" | "quantity">;

const ledgerEntry = (
  id: string,
  entryType: PackageLedgerEntry["entryType"],
  quantity: number,
  deliverableId?: string,
): PackageLedgerEntry => ({
  ...baseEntry,
  id,
  entryType,
  quantity,
  deliverableId,
});

const deliveredPostEntries = [
  ledgerEntry("sil54-commit", "commitment_added", 2),
  ledgerEntry("sil54-reserve", "quantity_reserved", 1, "delivered-post"),
  ledgerEntry("sil54-consume", "quantity_consumed", 1, "delivered-post"),
];

describe("package ledger projection", () => {
  it("SIL54 transfers a delivered post out of reservations without inventing a release", () => {
    const entries = deliveredPostEntries.map((entry) =>
      Object.freeze({ ...entry }),
    );
    const original = structuredClone(entries);

    expect(projectPackageBalance(Object.freeze(entries))).toEqual({
      committed: 2,
      reserved: 0,
      consumed: 1,
      released: 0,
      adjustments: 0,
      available: 1,
    });
    expect(entries).toEqual(original);
  });

  it("SIL54 preserves other active work while removing cancelled and delivered reservations", () => {
    const balance = projectPackageBalance([
      ledgerEntry("commit", "commitment_added", 6),
      ledgerEntry("active", "quantity_reserved", 2, "active-work"),
      ledgerEntry("cancelled", "quantity_reserved", 1, "cancelled-work"),
      ledgerEntry("released", "reservation_released", 1, "cancelled-work"),
      ledgerEntry("delivered", "quantity_reserved", 1, "delivered-work"),
      ledgerEntry("consumed", "quantity_consumed", 1, "delivered-work"),
    ]);

    expect(balance).toEqual({
      committed: 6,
      reserved: 2,
      consumed: 1,
      released: 1,
      adjustments: 0,
      available: 3,
    });
  });

  it("SIL54 retains fractional service quantities when part of the reserved work is delivered", () => {
    const balance = projectPackageBalance([
      ledgerEntry("hours", "commitment_added", 2.5),
      ledgerEntry(
        "active-hours",
        "quantity_reserved",
        0.5,
        "active-consultation",
      ),
      ledgerEntry(
        "finished-hours",
        "quantity_reserved",
        0.75,
        "finished-consultation",
      ),
      ledgerEntry(
        "consumed-hours",
        "quantity_consumed",
        0.75,
        "finished-consultation",
      ),
    ]);

    expect(balance).toEqual({
      committed: 2.5,
      reserved: 0.5,
      consumed: 0.75,
      released: 0,
      adjustments: 0,
      available: 1.25,
    });
  });

  it("SIL54 permits the exact two-decimal remaining capacity after fractional consumption", () => {
    const balance = projectPackageBalance([
      ledgerEntry("decimal-commit", "commitment_added", 0.3),
      ledgerEntry("decimal-reserve", "quantity_reserved", 0.1, "decimal-work"),
      ledgerEntry("decimal-consume", "quantity_consumed", 0.1, "decimal-work"),
    ]);

    expect(assertCanReserveQuantity(balance, 0.2)).toEqual({ allowed: true });
    expect(balance).toEqual({
      committed: 0.3,
      reserved: 0,
      consumed: 0.1,
      released: 0,
      adjustments: 0,
      available: 0.2,
    });
    expect(assertCanReserveQuantity(balance, 0.21)).toEqual({
      allowed: false,
      reason: "insufficient_capacity",
    });
  });

  it.each([
    { adjustment: 1, available: 4 },
    { adjustment: -1, available: 2 },
  ])(
    "SIL54 applies amendment and adjustment $adjustment after consumption",
    ({ adjustment, available }) => {
      expect(
        projectPackageBalance([
          ...deliveredPostEntries,
          ledgerEntry("amendment", "contract_amendment", 2),
          ledgerEntry("adjustment", "administrative_adjustment", adjustment),
        ]),
      ).toEqual({
        committed: 4,
        reserved: 0,
        consumed: 1,
        released: 0,
        adjustments: adjustment,
        available,
      });
    },
  );

  it("SIL54 permits the remaining post once and rejects capacity beyond it", () => {
    const beforeReservation = projectPackageBalance(deliveredPostEntries);
    expect(assertCanReserveQuantity(beforeReservation, 1)).toEqual({
      allowed: true,
    });
    expect(assertCanReserveQuantity(beforeReservation, 2)).toEqual({
      allowed: false,
      reason: "insufficient_capacity",
    });

    const afterReservation = projectPackageBalance([
      ...deliveredPostEntries,
      ledgerEntry("second-post", "quantity_reserved", 1, "active-post"),
    ]);
    expect(afterReservation).toEqual({
      committed: 2,
      reserved: 1,
      consumed: 1,
      released: 0,
      adjustments: 0,
      available: 0,
    });
    expect(assertCanReserveQuantity(afterReservation, 1)).toEqual({
      allowed: false,
      reason: "insufficient_capacity",
    });
  });

  it("SIL54 does not hide negative availability caused by an excessive historical adjustment", () => {
    const balance = projectPackageBalance([
      ...deliveredPostEntries,
      ledgerEntry("bad-adjustment", "administrative_adjustment", -2),
    ]);
    expect(balance.available).toBe(-1);
    expect(assertCanReserveQuantity(balance, 1)).toEqual({
      allowed: false,
      reason: "insufficient_capacity",
    });
  });

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

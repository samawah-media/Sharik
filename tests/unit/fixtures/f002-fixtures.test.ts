import { describe, expect, it } from "vitest";
import { clientA, clientB, tenantA } from "../../fixtures/f001-fixtures";
import {
  contractA,
  deliverableA,
  packageA,
  packageLinePostsA,
} from "../../fixtures/f002-fixtures";

describe("F-002 synthetic fixtures", () => {
  it("keeps contract, package, package line, and deliverable under Client A scope", () => {
    expect(contractA.tenantId).toBe(tenantA.id);
    expect(contractA.clientId).toBe(clientA.id);
    expect(packageA.contractId).toBe(contractA.id);
    expect(packageLinePostsA.packageId).toBe(packageA.id);
    expect(deliverableA.packageLineId).toBe(packageLinePostsA.id);
  });

  it("keeps Client A and Client B fixture scopes distinct", () => {
    expect(clientA.id).not.toBe(clientB.id);
    expect(clientA.tenantId).not.toBe(clientB.tenantId);
  });
});


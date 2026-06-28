import { describe, expect, it } from "vitest";
import {
  FailingAuditSink,
  InMemoryAuditSink,
} from "@/modules/audit/audit-service";
import { InMemoryClientRepository } from "@/modules/clients/client-repository";
import { InMemoryContractRepository } from "@/modules/contracts/contract-repository";
import { createContractCommand } from "@/server/commands/contracts/create-contract";
import {
  assignedInternalA,
  clientA,
  clientB,
  tenantAdminA,
} from "../../fixtures/f001-fixtures";

const clientRecord = (client: {
  id: string;
  tenantId: string;
  name: string;
}) => ({
  id: client.id,
  tenantId: client.tenantId,
  name: client.name,
  slug: client.name.toLowerCase().replace(/\s+/g, "-"),
  status: "active" as const,
  createdBy: "tenant_admin_a",
  createdAt: "2026-06-28T00:00:00.000Z",
  updatedAt: "2026-06-28T00:00:00.000Z",
  revision: 1,
});

const createInput = {
  clientId: clientA.id,
  name: "عقد إدارة محتوى",
  reference: "CTR-A-2026",
  summary: "ملخص آمن يظهر ضمن سياق العميل فقط.",
  periodStart: "2026-07-01",
  periodEnd: "2026-12-31",
  status: "draft",
  idempotencyKey: "f002a-contract-client-a",
};

describe("F-002A contract context command", () => {
  it("creates a scoped contract and records ContractCreated audit", async () => {
    const audit = new InMemoryAuditSink();
    const clients = new InMemoryClientRepository([clientRecord(clientA)]);
    const contracts = new InMemoryContractRepository();

    const result = await createContractCommand({
      actor: tenantAdminA.authorizationActor,
      clients,
      contracts,
      audit,
      input: createInput,
      idFactory: () => "contract-generated-a",
    });

    expect(result).toMatchObject({
      ok: true,
      value: {
        ok: true,
        value: {
          id: "contract-generated-a",
          tenantId: clientA.tenantId,
          clientId: clientA.id,
          name: "عقد إدارة محتوى",
        },
      },
    });
    await expect(
      contracts.listByTenantAndClient(clientA.tenantId, clientA.id),
    ).resolves.toHaveLength(1);
    expect(audit.events).toContainEqual(
      expect.objectContaining({
        action: "ContractCreated",
        decision: "allowed",
        tenantId: clientA.tenantId,
        clientId: clientA.id,
        targetId: "contract-generated-a",
      }),
    );
  });

  it("returns the existing contract for a repeated idempotency key without duplicate audit", async () => {
    const audit = new InMemoryAuditSink();
    const clients = new InMemoryClientRepository([clientRecord(clientA)]);
    const contracts = new InMemoryContractRepository();

    const first = await createContractCommand({
      actor: tenantAdminA.authorizationActor,
      clients,
      contracts,
      audit,
      input: createInput,
      idFactory: () => "contract-generated-a",
    });
    const second = await createContractCommand({
      actor: tenantAdminA.authorizationActor,
      clients,
      contracts,
      audit,
      input: { ...createInput, name: "اسم مختلف لا يغير العقد" },
      idFactory: () => "contract-generated-b",
    });

    expect(first).toMatchObject({ ok: true });
    expect(second).toMatchObject({
      ok: true,
      value: { ok: true, value: { id: "contract-generated-a" } },
    });
    await expect(
      contracts.listByTenantAndClient(clientA.tenantId, clientA.id),
    ).resolves.toHaveLength(1);
    expect(
      audit.events.filter((event) => event.action === "ContractCreated"),
    ).toHaveLength(1);
  });

  it("denies client-scoped actors from creating contracts and writes no contract", async () => {
    const audit = new InMemoryAuditSink();
    const clients = new InMemoryClientRepository([clientRecord(clientA)]);
    const contracts = new InMemoryContractRepository();

    const result = await createContractCommand({
      actor: assignedInternalA.authorizationActor,
      clients,
      contracts,
      audit,
      input: createInput,
      idFactory: () => "contract-denied",
    });

    expect(result).toMatchObject({ ok: false });
    await expect(
      contracts.listByTenantAndClient(clientA.tenantId, clientA.id),
    ).resolves.toEqual([]);
    expect(audit.events).toContainEqual(
      expect.objectContaining({
        action: "AuthorizationDenied",
        decision: "denied",
      }),
    );
  });

  it("denies out-of-tenant client scope without leaking or writing the requested client", async () => {
    const audit = new InMemoryAuditSink();
    const clients = new InMemoryClientRepository([clientRecord(clientA)]);
    const contracts = new InMemoryContractRepository();

    const result = await createContractCommand({
      actor: tenantAdminA.authorizationActor,
      clients,
      contracts,
      audit,
      input: { ...createInput, clientId: clientB.id },
      idFactory: () => "contract-cross-tenant",
    });

    expect(result).toMatchObject({
      ok: true,
      value: {
        ok: false,
        error: { code: "ACCESS_DENIED", exposeResource: false },
      },
    });
    await expect(
      contracts.listByTenantAndClient(clientB.tenantId, clientB.id),
    ).resolves.toEqual([]);
    expect(audit.events).toContainEqual(
      expect.objectContaining({
        action: "ContractScopeDenied",
        decision: "denied",
        targetType: "contract",
      }),
    );
  });

  it("rejects invalid periods before creating a contract", async () => {
    const audit = new InMemoryAuditSink();
    const clients = new InMemoryClientRepository([clientRecord(clientA)]);
    const contracts = new InMemoryContractRepository();

    const result = await createContractCommand({
      actor: tenantAdminA.authorizationActor,
      clients,
      contracts,
      audit,
      input: {
        ...createInput,
        periodStart: "2026-12-31",
        periodEnd: "2026-07-01",
      },
      idFactory: () => "contract-invalid",
    });

    expect(result).toEqual({ ok: false, error: "VALIDATION_FAILED" });
    await expect(
      contracts.listByTenantAndClient(clientA.tenantId, clientA.id),
    ).resolves.toEqual([]);
  });

  it("rolls back the contract when required audit append fails", async () => {
    const clients = new InMemoryClientRepository([clientRecord(clientA)]);
    const contracts = new InMemoryContractRepository();

    await expect(
      createContractCommand({
        actor: tenantAdminA.authorizationActor,
        clients,
        contracts,
        audit: new FailingAuditSink(),
        input: createInput,
        idFactory: () => "contract-audit-fails",
      }),
    ).rejects.toThrow("AUDIT_APPEND_FAILED");
    await expect(
      contracts.listByTenantAndClient(clientA.tenantId, clientA.id),
    ).resolves.toEqual([]);
  });
});

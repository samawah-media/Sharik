import { describe, expect, it } from "vitest";
import { InMemoryAuditSink } from "@/modules/audit/audit-service";
import { InMemoryClientRepository } from "@/modules/clients/client-repository";
import { createClientCommand } from "@/server/commands/clients/create-client";
import { updateClientCommand } from "@/server/commands/clients/update-client";
import { tenantAdminA, tenantViewerA } from "../../fixtures/f001-fixtures";

describe("client management commands", () => {
  it("creates a tenant-scoped client and records ClientCreated audit", async () => {
    const audit = new InMemoryAuditSink();
    const repository = new InMemoryClientRepository();

    const result = await createClientCommand({
      actor: tenantAdminA.authorizationActor,
      repository,
      audit,
      input: { name: "عميل ألف", primaryContactEmail: "client-a@example.test" },
      idFactory: () => "client-generated-a",
    });

    expect(result).toMatchObject({
      ok: true,
      value: {
        ok: true,
        value: { id: "client-generated-a", tenantId: "tenant_a" },
      },
    });
    expect(audit.events).toContainEqual(
      expect.objectContaining({
        action: "ClientCreated",
        decision: "allowed",
        clientId: "client-generated-a",
      }),
    );
  });

  it("denies unauthorized client creation and creates no client", async () => {
    const audit = new InMemoryAuditSink();
    const repository = new InMemoryClientRepository();

    const result = await createClientCommand({
      actor: tenantViewerA.authorizationActor,
      repository,
      audit,
      input: { name: "عميل مرفوض" },
      idFactory: () => "client-denied",
    });

    expect(result).toMatchObject({ ok: false });
    expect(await repository.listByTenant("tenant_a")).toEqual([]);
    expect(audit.events).toContainEqual(
      expect.objectContaining({
        action: "AuthorizationDenied",
        decision: "denied",
      }),
    );
  });

  it("checks authorization before duplicate-name conflicts", async () => {
    const audit = new InMemoryAuditSink();
    const repository = new InMemoryClientRepository();
    await repository.create({
      id: "client-existing-a",
      tenantId: "tenant_a",
      name: "عميل موجود",
      slug: "عميل-موجود",
      createdBy: tenantAdminA.session.userId,
    });

    const result = await createClientCommand({
      actor: tenantViewerA.authorizationActor,
      repository,
      audit,
      input: { name: "عميل موجود" },
      idFactory: () => "client-denied-duplicate",
    });

    expect(result).toMatchObject({ ok: false });
    expect(audit.events).toContainEqual(
      expect.objectContaining({
        action: "AuthorizationDenied",
        decision: "denied",
      }),
    );
  });

  it("updates only an in-tenant client and records ClientUpdated audit", async () => {
    const audit = new InMemoryAuditSink();
    const repository = new InMemoryClientRepository();
    await repository.create({
      id: "client-existing-a",
      tenantId: "tenant_a",
      name: "عميل قديم",
      slug: "old",
      createdBy: tenantAdminA.session.userId,
    });

    const result = await updateClientCommand({
      actor: tenantAdminA.authorizationActor,
      repository,
      audit,
      input: {
        clientId: "client-existing-a",
        name: "عميل محدث",
        expectedRevision: 1,
      },
    });

    expect(result).toMatchObject({
      ok: true,
      value: { ok: true, value: { name: "عميل محدث", revision: 2 } },
    });
    expect(audit.events).toContainEqual(
      expect.objectContaining({
        action: "ClientUpdated",
        decision: "allowed",
        targetId: "client-existing-a",
      }),
    );
  });
});

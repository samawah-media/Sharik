import { describe, expect, it } from "vitest";
import {
  FailingAuditSink,
  InMemoryAuditSink,
} from "@/modules/audit/audit-service";
import { InMemoryR011AGapSetupRepository } from "@/modules/release/r011a-gap-setup-repository";
import { runR011AGapSetupCommand } from "@/server/commands/release/r011a-gap-setup";
import { clientA, tenantAdminA } from "../../fixtures/f001-fixtures";

const approvedScope = {
  tenantId: clientA.tenantId,
  clientId: clientA.id,
  customerKey: "hadna",
  approvedForR011A: true,
} as const;

const ownerApproval = {
  approved: true,
  hadnaOnly: true,
  maxCounts: {
    client_approver_category: 1,
    waiting_approval_item: 1,
    final_delivery_file_list: 1,
  },
  evidenceValueFree: true,
  rollbackPlanApproved: true,
  hostedMutationAllowedInThisPass: false,
  productionAcceptanceAllowed: false,
} as const;

const allCategoryInput = {
  clientId: clientA.id,
  mode: "apply_local",
  categories: [
    {
      category: "client_approver_category",
      operation: "fix_or_create_client_approver_category",
      requestedCount: 1,
      idempotencyKey: "r011a-command-client-approver",
    },
    {
      category: "waiting_approval_item",
      operation: "create_or_expose_waiting_approval_item",
      requestedCount: 1,
      idempotencyKey: "r011a-command-waiting",
    },
    {
      category: "final_delivery_file_list",
      operation: "create_or_expose_final_delivery_file_list_marker",
      requestedCount: 1,
      idempotencyKey: "r011a-command-final",
    },
  ],
} as const;

describe("R-011A gap setup command", () => {
  it("previews dry-run setup without creating local records and audits the preview", async () => {
    const audit = new InMemoryAuditSink();
    const setupRepository = new InMemoryR011AGapSetupRepository();

    const result = await runR011AGapSetupCommand({
      actor: tenantAdminA.authorizationActor,
      audit,
      setupRepository,
      approvedScope,
      ownerApproval,
      input: { ...allCategoryInput, mode: "dry_run" },
      idFactory: () => "unused-in-dry-run",
      nowFactory: () => "2026-07-09T12:00:00.000Z",
    });

    expect(result).toMatchObject({
      ok: true,
      value: {
        mode: "dry_run",
        createdCount: 0,
        noOpCount: 0,
        wouldCreateCount: 3,
        rollbackRequired: false,
      },
    });
    await expect(
      setupRepository.listByTenantClient(clientA.tenantId, clientA.id),
    ).resolves.toEqual([]);
    expect(audit.events).toContainEqual(
      expect.objectContaining({
        action: "R011AGapSetupDryRunPreviewed",
        decision: "allowed",
        tenantId: clientA.tenantId,
        clientId: clientA.id,
      }),
    );
  });

  it("applies local setup records once and treats retries as audited no-ops", async () => {
    const audit = new InMemoryAuditSink();
    const setupRepository = new InMemoryR011AGapSetupRepository();
    let nextId = 0;
    const idFactory = () => {
      nextId += 1;
      return `r011a-record-${nextId}`;
    };

    const first = await runR011AGapSetupCommand({
      actor: tenantAdminA.authorizationActor,
      audit,
      setupRepository,
      approvedScope,
      ownerApproval,
      input: allCategoryInput,
      idFactory,
      nowFactory: () => "2026-07-09T12:00:00.000Z",
    });
    const retry = await runR011AGapSetupCommand({
      actor: tenantAdminA.authorizationActor,
      audit,
      setupRepository,
      approvedScope,
      ownerApproval,
      input: allCategoryInput,
      idFactory,
      nowFactory: () => "2026-07-09T12:01:00.000Z",
    });

    expect(first).toMatchObject({
      ok: true,
      value: { mode: "apply_local", createdCount: 3, noOpCount: 0 },
    });
    expect(retry).toMatchObject({
      ok: true,
      value: { mode: "apply_local", createdCount: 0, noOpCount: 3 },
    });
    await expect(
      setupRepository.listByTenantClient(clientA.tenantId, clientA.id),
    ).resolves.toHaveLength(3);
    expect(
      audit.events.filter((event) => event.action === "R011AGapSetupApplied"),
    ).toHaveLength(2);
  });

  it("returns a rollback/no-op summary without deleting setup records", async () => {
    const audit = new InMemoryAuditSink();
    const setupRepository = new InMemoryR011AGapSetupRepository();
    let nextId = 0;

    await runR011AGapSetupCommand({
      actor: tenantAdminA.authorizationActor,
      audit,
      setupRepository,
      approvedScope,
      ownerApproval,
      input: allCategoryInput,
      idFactory: () => {
        nextId += 1;
        return `r011a-existing-record-${nextId}`;
      },
    });

    const rollback = await runR011AGapSetupCommand({
      actor: tenantAdminA.authorizationActor,
      audit,
      setupRepository,
      approvedScope,
      ownerApproval,
      input: { ...allCategoryInput, mode: "rollback_summary" },
    });

    expect(rollback).toMatchObject({
      ok: true,
      value: {
        mode: "rollback_summary",
        createdCount: 0,
        rollbackRequired: false,
        categories: expect.arrayContaining([
          expect.objectContaining({
            category: "waiting_approval_item",
            status: "rollback_no_op_available",
          }),
        ]),
      },
    });
    await expect(
      setupRepository.listByTenantClient(clientA.tenantId, clientA.id),
    ).resolves.toHaveLength(3);
    expect(audit.events).toContainEqual(
      expect.objectContaining({
        action: "R011AGapSetupRollbackSummarized",
        decision: "allowed",
      }),
    );
  });

  it("denies unsafe hosted/file operations and records a denial audit", async () => {
    const audit = new InMemoryAuditSink();
    const setupRepository = new InMemoryR011AGapSetupRepository();

    const result = await runR011AGapSetupCommand({
      actor: tenantAdminA.authorizationActor,
      audit,
      setupRepository,
      approvedScope,
      ownerApproval,
      input: {
        clientId: clientA.id,
        mode: "apply_local",
        hostedMutationRequested: true,
        fileContentOperationRequested: true,
        categories: [
          {
            category: "final_delivery_file_list",
            operation: "download_hosted_file",
            requestedCount: 1,
            idempotencyKey: "r011a-unsafe-command",
          },
        ],
      },
    });

    expect(result).toMatchObject({
      ok: false,
      reason: "hosted_mutation_denied",
    });
    await expect(
      setupRepository.listByTenantClient(clientA.tenantId, clientA.id),
    ).resolves.toEqual([]);
    expect(audit.events).toContainEqual(
      expect.objectContaining({
        action: "R011AGapSetupDenied",
        decision: "denied",
        reason: "hosted_mutation_denied",
      }),
    );
  });

  it("rolls back local setup records when required audit append fails", async () => {
    const setupRepository = new InMemoryR011AGapSetupRepository();

    await expect(
      runR011AGapSetupCommand({
        actor: tenantAdminA.authorizationActor,
        audit: new FailingAuditSink(),
        setupRepository,
        approvedScope,
        ownerApproval,
        input: allCategoryInput,
        idFactory: () => "r011a-audit-fail-record",
      }),
    ).rejects.toThrow("AUDIT_APPEND_FAILED");
    await expect(
      setupRepository.listByTenantClient(clientA.tenantId, clientA.id),
    ).resolves.toEqual([]);
  });
});

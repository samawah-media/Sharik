import { describe, expect, it } from "vitest";
import { InMemoryAuditSink } from "@/modules/audit/audit-service";
import { InMemoryR011AGapSetupRepository } from "@/modules/release/r011a-gap-setup-repository";
import {
  runR011AHostedGapSetupReadinessCommand,
  type R011AHostedDryRunApproval,
} from "@/server/commands/release/r011a-hosted-gap-setup-readiness";
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

const hostedDryRunApproval = {
  approved: true,
  approvalCategory: "r011a_hosted_dry_run_noop_rehearsal",
  hadnaOnly: true,
  readOnlyNoOp: true,
  evidenceValueFree: true,
} satisfies R011AHostedDryRunApproval;

const allCategoryInput = {
  clientId: clientA.id,
  executionMode: "hosted_dry_run",
  categories: [
    {
      category: "client_approver_category",
      operation: "fix_or_create_client_approver_category",
      requestedCount: 1,
      idempotencyKey: "r011a-hosted-client-approver",
    },
    {
      category: "waiting_approval_item",
      operation: "create_or_expose_waiting_approval_item",
      requestedCount: 1,
      idempotencyKey: "r011a-hosted-waiting",
    },
    {
      category: "final_delivery_file_list",
      operation: "create_or_expose_final_delivery_file_list_marker",
      requestedCount: 1,
      idempotencyKey: "r011a-hosted-final",
    },
  ],
} as const;

describe("R-011A hosted gap setup readiness command", () => {
  it("allows hosted dry-run rehearsal with the no-op approval category", async () => {
    const audit = new InMemoryAuditSink();
    const setupRepository = new InMemoryR011AGapSetupRepository();

    const result = await runR011AHostedGapSetupReadinessCommand({
      actor: tenantAdminA.authorizationActor,
      audit,
      setupRepository,
      approvedScope,
      ownerApproval,
      hostedDryRunApproval,
      input: allCategoryInput,
    });

    expect(result).toMatchObject({
      ok: true,
      value: {
        executionMode: "hosted_dry_run",
        hostedMutationCount: 0,
        hostedFileOperationCount: 0,
        productionAcceptanceCount: 0,
        evidenceSummary: {
          executionMode: "hosted_dry_run",
          allowed: true,
          categoryCount: 3,
          requestedItemCount: 3,
          deniedReasonCount: 0,
          statusCounts: {
            would_create: 3,
          },
          categories: [
            {
              category: "client_approver_category",
              status: "would_create",
            },
            {
              category: "waiting_approval_item",
              status: "would_create",
            },
            {
              category: "final_delivery_file_list",
              status: "would_create",
            },
          ],
        },
      },
    });
    await expect(
      setupRepository.listByTenantClient(clientA.tenantId, clientA.id),
    ).resolves.toEqual([]);
    expect(audit.events).toContainEqual(
      expect.objectContaining({
        action: "R011AHostedGapSetupDryRunRehearsed",
        decision: "allowed",
      }),
    );
  });

  it("denies hosted apply when explicit apply approval is missing", async () => {
    const result = await runR011AHostedGapSetupReadinessCommand({
      actor: tenantAdminA.authorizationActor,
      audit: new InMemoryAuditSink(),
      setupRepository: new InMemoryR011AGapSetupRepository(),
      approvedScope,
      ownerApproval,
      hostedDryRunApproval,
      input: {
        ...allCategoryInput,
        executionMode: "apply_hosted",
      },
    });

    expect(result).toMatchObject({
      ok: false,
      reason: "hosted_apply_approval_missing",
    });
  });

  it("denies non-Hadna hosted dry-run rehearsals", async () => {
    const result = await runR011AHostedGapSetupReadinessCommand({
      actor: tenantAdminA.authorizationActor,
      audit: new InMemoryAuditSink(),
      setupRepository: new InMemoryR011AGapSetupRepository(),
      approvedScope: {
        ...approvedScope,
        customerKey: "other_customer",
      },
      ownerApproval,
      hostedDryRunApproval,
      input: allCategoryInput,
    });

    expect(result).toMatchObject({
      ok: false,
      reason: "non_hadna_scope_denied",
    });
  });

  it("denies over-count hosted dry-run rehearsals", async () => {
    const result = await runR011AHostedGapSetupReadinessCommand({
      actor: tenantAdminA.authorizationActor,
      audit: new InMemoryAuditSink(),
      setupRepository: new InMemoryR011AGapSetupRepository(),
      approvedScope,
      ownerApproval,
      hostedDryRunApproval,
      input: {
        clientId: clientA.id,
        executionMode: "hosted_dry_run",
        categories: [
          {
            category: "waiting_approval_item",
            operation: "create_or_expose_waiting_approval_item",
            requestedCount: 2,
            idempotencyKey: "r011a-hosted-over-count",
          },
        ],
      },
    });

    expect(result).toMatchObject({
      ok: false,
      reason: "approved_count_exceeded",
    });
  });

  it("denies unsafe hosted file operations before dry-run evidence", async () => {
    const result = await runR011AHostedGapSetupReadinessCommand({
      actor: tenantAdminA.authorizationActor,
      audit: new InMemoryAuditSink(),
      setupRepository: new InMemoryR011AGapSetupRepository(),
      approvedScope,
      ownerApproval,
      hostedDryRunApproval,
      input: {
        clientId: clientA.id,
        executionMode: "hosted_dry_run",
        fileContentOperationRequested: true,
        categories: [
          {
            category: "final_delivery_file_list",
            operation: "download_hosted_file",
            requestedCount: 1,
            idempotencyKey: "r011a-hosted-unsafe-file",
          },
        ],
      },
    });

    expect(result).toMatchObject({
      ok: false,
      reason: "file_content_operation_denied",
    });
  });

  it("builds value-free evidence summaries without tenant, client, or account values", async () => {
    const result = await runR011AHostedGapSetupReadinessCommand({
      actor: tenantAdminA.authorizationActor,
      audit: new InMemoryAuditSink(),
      setupRepository: new InMemoryR011AGapSetupRepository(),
      approvedScope,
      ownerApproval,
      hostedDryRunApproval,
      input: allCategoryInput,
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    const serializedSummary = JSON.stringify(result.value.evidenceSummary);
    expect(serializedSummary).not.toContain(`"${clientA.id}"`);
    expect(serializedSummary).not.toContain(`"${clientA.tenantId}"`);
    expect(serializedSummary).not.toContain(`"${tenantAdminA.session.userId}"`);
    expect(serializedSummary).not.toContain("@");
    expect(serializedSummary).not.toContain("http");
    expect(serializedSummary).not.toContain("token");
  });

  it("keeps rollback summary no-op before any apply path", async () => {
    const result = await runR011AGapSetupCommand({
      actor: tenantAdminA.authorizationActor,
      audit: new InMemoryAuditSink(),
      setupRepository: new InMemoryR011AGapSetupRepository(),
      approvedScope,
      ownerApproval,
      input: {
        clientId: clientA.id,
        mode: "rollback_summary",
        categories: [
          {
            category: "waiting_approval_item",
            operation: "create_or_expose_waiting_approval_item",
            requestedCount: 1,
            idempotencyKey: "r011a-rollback-before-apply",
          },
        ],
      },
    });

    expect(result).toMatchObject({
      ok: true,
      value: {
        mode: "rollback_summary",
        createdCount: 0,
        noOpCount: 0,
        wouldCreateCount: 0,
        rollbackRequired: false,
        categories: [
          {
            category: "waiting_approval_item",
            status: "no_setup_record",
          },
        ],
      },
    });
  });
});

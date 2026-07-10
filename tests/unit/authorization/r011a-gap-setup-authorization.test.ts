import { describe, expect, it } from "vitest";
import { InMemoryAuditSink } from "@/modules/audit/audit-service";
import { InMemoryR011AGapSetupRepository } from "@/modules/release/r011a-gap-setup-repository";
import { runR011AGapSetupCommand } from "@/server/commands/release/r011a-gap-setup";
import {
  assignedInternalA,
  clientA,
  clientC,
  clientViewerA,
  tenantAdminA,
} from "../../fixtures/f001-fixtures";

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

const input = {
  clientId: clientA.id,
  mode: "dry_run",
  categories: [
    {
      category: "waiting_approval_item",
      operation: "create_or_expose_waiting_approval_item",
      requestedCount: 1,
      idempotencyKey: "r011a-auth-waiting",
    },
  ],
} as const;

describe("R-011A gap setup authorization", () => {
  it("allows tenant administrators to preview setup inside the approved Hadna scope", async () => {
    const result = await runR011AGapSetupCommand({
      actor: tenantAdminA.authorizationActor,
      audit: new InMemoryAuditSink(),
      setupRepository: new InMemoryR011AGapSetupRepository(),
      approvedScope,
      ownerApproval,
      input,
    });

    expect(result).toMatchObject({
      ok: true,
      value: { mode: "dry_run", wouldCreateCount: 1 },
    });
  });

  it("denies client-scoped internal users even when they can manage normal deliverables", async () => {
    const audit = new InMemoryAuditSink();

    const result = await runR011AGapSetupCommand({
      actor: assignedInternalA.authorizationActor,
      audit,
      setupRepository: new InMemoryR011AGapSetupRepository(),
      approvedScope,
      ownerApproval,
      input,
    });

    expect(result).toMatchObject({
      ok: false,
      reason: "management_authority_required",
    });
    expect(audit.events).toContainEqual(
      expect.objectContaining({
        action: "R011AGapSetupDenied",
        decision: "denied",
        reason: "management_authority_required",
      }),
    );
  });

  it("denies client users from all setup modes", async () => {
    const result = await runR011AGapSetupCommand({
      actor: clientViewerA.authorizationActor,
      audit: new InMemoryAuditSink(),
      setupRepository: new InMemoryR011AGapSetupRepository(),
      approvedScope,
      ownerApproval,
      input: { ...input, mode: "rollback_summary" },
    });

    expect(result).toMatchObject({
      ok: false,
      reason: "management_authority_required",
    });
  });

  it("denies unrelated client setup even for management actors", async () => {
    const audit = new InMemoryAuditSink();

    const result = await runR011AGapSetupCommand({
      actor: tenantAdminA.authorizationActor,
      audit,
      setupRepository: new InMemoryR011AGapSetupRepository(),
      approvedScope,
      ownerApproval,
      input: {
        ...input,
        clientId: clientC.id,
      },
    });

    expect(result).toMatchObject({
      ok: false,
      reason: "client_scope_mismatch",
    });
    expect(audit.events).toContainEqual(
      expect.objectContaining({
        action: "R011AGapSetupDenied",
        decision: "denied",
        clientId: clientC.id,
        reason: "client_scope_mismatch",
      }),
    );
  });

  it("denies setup when owner approval is not present", async () => {
    const result = await runR011AGapSetupCommand({
      actor: tenantAdminA.authorizationActor,
      audit: new InMemoryAuditSink(),
      setupRepository: new InMemoryR011AGapSetupRepository(),
      approvedScope,
      input,
    });

    expect(result).toMatchObject({
      ok: false,
      reason: "owner_approval_missing",
    });
  });
});

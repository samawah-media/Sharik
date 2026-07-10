import { describe, expect, it } from "vitest";
import {
  buildR011AGapSetupPlan,
  summarizeR011AGapSetupPlan,
  type R011AGapSetupOperation,
  type R011AGapSetupRequest,
} from "@/modules/release/r011a-gap-setup-plan";

const approvedScope = {
  tenantId: "tenant_hadna",
  clientId: "client_hadna",
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

const baseRequest = {
  tenantId: approvedScope.tenantId,
  clientId: approvedScope.clientId,
  mode: "dry_run",
  categories: [
    {
      category: "client_approver_category",
      operation: "fix_or_create_client_approver_category",
      requestedCount: 1,
      idempotencyKey: "r011a-client-approver",
    },
    {
      category: "waiting_approval_item",
      operation: "create_or_expose_waiting_approval_item",
      requestedCount: 1,
      idempotencyKey: "r011a-waiting-approval",
    },
    {
      category: "final_delivery_file_list",
      operation: "create_or_expose_final_delivery_file_list_marker",
      requestedCount: 1,
      idempotencyKey: "r011a-final-delivery",
    },
  ],
} satisfies R011AGapSetupRequest;

describe("R-011A gap setup plan", () => {
  it("builds a safe local setup plan for the three approved categories", () => {
    const plan = buildR011AGapSetupPlan({
      approvedScope,
      ownerApproval,
      request: baseRequest,
    });

    expect(plan).toMatchObject({
      allowed: true,
      status: "ready_for_local_setup_preview",
      productionAcceptanceGranted: false,
      hostedMutationPermitted: false,
      directFileOperationPermitted: false,
      operations: [
        {
          category: "client_approver_category",
          auditAction: "R011AClientApproverCategoryPrepared",
        },
        {
          category: "waiting_approval_item",
          auditAction: "R011AWaitingApprovalItemPrepared",
        },
        {
          category: "final_delivery_file_list",
          auditAction: "R011AFinalDeliveryFileListPrepared",
        },
      ],
    });
    expect(summarizeR011AGapSetupPlan(plan)).toEqual({
      allowed: true,
      status: "ready_for_local_setup_preview",
      requestedCategoryCount: 3,
      requestedItemCount: 3,
      deniedReasonCount: 0,
      hostedMutationPermitted: false,
      productionAcceptanceGranted: false,
      directFileOperationPermitted: false,
    });
  });

  it("denies non-Hadna or unapproved scope even when category counts fit", () => {
    const plan = buildR011AGapSetupPlan({
      approvedScope: {
        ...approvedScope,
        customerKey: "other_customer",
      },
      ownerApproval,
      request: baseRequest,
    });

    expect(plan).toMatchObject({
      allowed: false,
      deniedReasons: ["non_hadna_scope_denied"],
    });
  });

  it("denies unrelated client setup requests", () => {
    const plan = buildR011AGapSetupPlan({
      approvedScope,
      ownerApproval,
      request: {
        ...baseRequest,
        clientId: "client_unrelated",
      },
    });

    expect(plan).toMatchObject({
      allowed: false,
      deniedReasons: ["client_scope_mismatch"],
    });
  });

  it("denies over-count requests beyond the owner-approved maximum", () => {
    const plan = buildR011AGapSetupPlan({
      approvedScope,
      ownerApproval,
      request: {
        ...baseRequest,
        categories: [
          {
            category: "waiting_approval_item",
            operation: "create_or_expose_waiting_approval_item",
            requestedCount: 2,
            idempotencyKey: "r011a-over-count",
          },
        ],
      },
    });

    expect(plan).toMatchObject({
      allowed: false,
      deniedReasons: ["approved_count_exceeded"],
    });
  });

  it("denies missing approval before planning any setup path", () => {
    const plan = buildR011AGapSetupPlan({
      approvedScope,
      request: baseRequest,
    });

    expect(plan).toMatchObject({
      allowed: false,
      deniedReasons: ["owner_approval_missing"],
    });
  });

  it("denies unsafe file operations and hosted mutation requests", () => {
    const unsafeOperation =
      "open_hosted_file" as R011AGapSetupOperation;
    const plan = buildR011AGapSetupPlan({
      approvedScope,
      ownerApproval,
      request: {
        ...baseRequest,
        hostedMutationRequested: true,
        fileContentOperationRequested: true,
        categories: [
          {
            category: "final_delivery_file_list",
            operation: unsafeOperation,
            requestedCount: 1,
            idempotencyKey: "r011a-unsafe-file",
          },
        ],
      },
    });

    expect(plan.allowed).toBe(false);
    expect(plan.deniedReasons).toEqual([
      "hosted_mutation_denied",
      "file_content_operation_denied",
      "unsafe_file_operation_denied",
    ]);
  });
});

import { describe, expect, it } from "vitest";
import {
  buildR008ApprovalJourneyProbe,
  summarizeR008ApprovalJourneyProbe,
} from "@/modules/approvals/r008-approval-journey";
import {
  buildR008AuditCompletenessMatrix,
  buildR008CompleteAuditFixtureEvents,
  summarizeR008AuditCompleteness,
} from "@/modules/audit/r008-audit-completeness";
import {
  evaluateR008FinalDeliveryReadiness,
  summarizeR008FinalDeliveryReadiness,
} from "@/modules/files/r008-final-delivery-readiness";
import {
  buildR008IsolationProofMatrix,
  type R008IsolationProofMatrix,
} from "@/modules/release/r008-isolation-proof";
import {
  buildR011AStage2CTrialResult,
  R011A_STAGE_2C_LIFECYCLE_STEPS,
  R011A_STAGE_2C_ROLE_CATEGORIES,
  R011A_STAGE_2C_SLA_STATES,
  type R011AStage2CInput,
} from "@/modules/release/r011a-stage-2c-trial";
import {
  buildR008SlaReportingReadiness,
  summarizeR008SlaReportingReadiness,
} from "@/modules/sla/r008-sla-reporting";
import {
  r008Actors,
  r008ClientIds,
  r008FileAssets,
  r008ScopedApprovalItems,
  r008SyntheticClientA,
  r008SyntheticClientB,
  r008SyntheticTenant,
} from "../../fixtures/r008-fixtures";

const isolation = (): R008IsolationProofMatrix =>
  buildR008IsolationProofMatrix({
    actors: r008Actors,
    tenantId: r008SyntheticTenant.id,
    clientIds: r008ClientIds,
    approvalItems: r008ScopedApprovalItems,
  });

const completeInput = (
  overrides: Partial<R011AStage2CInput> = {},
): R011AStage2CInput => ({
  roleFindings: R011A_STAGE_2C_ROLE_CATEGORIES.map((category) => ({
    category,
    status: "passed",
  })),
  lifecycleSteps: R011A_STAGE_2C_LIFECYCLE_STEPS,
  slaStates: R011A_STAGE_2C_SLA_STATES,
  approval: summarizeR008ApprovalJourneyProbe(
    buildR008ApprovalJourneyProbe({
      actors: r008Actors,
      approvalItems: r008ScopedApprovalItems,
      currentClientId: r008SyntheticClientA.id,
      comparisonClientId: r008SyntheticClientB.id,
    }),
  ),
  audit: summarizeR008AuditCompleteness(
    buildR008AuditCompletenessMatrix(buildR008CompleteAuditFixtureEvents()),
  ),
  finalDelivery: summarizeR008FinalDeliveryReadiness(
    evaluateR008FinalDeliveryReadiness({
      actor: r008Actors.clientApproverA,
      clientId: r008SyntheticClientA.id,
      files: r008FileAssets,
    }),
  ),
  isolation: isolation(),
  sla: summarizeR008SlaReportingReadiness(buildR008SlaReportingReadiness()),
  defects: [],
  evidenceRedactionPassed: true,
  localVerificationPassed: true,
  localVerificationBlocked: [],
  hostedActions: {
    mutations: 0,
    fileContentOperations: 0,
    deployments: 0,
    accessConfigurationChanges: 0,
  },
  hostedCompletionApproved: false,
  productionAcceptanceApproved: false,
  ...overrides,
});

describe("R-011A Stage 2C trial gate", () => {
  it("allows local internal trial readiness while keeping hosted and Production gates not authorized", () => {
    const result = buildR011AStage2CTrialResult(completeInput());

    expect(result.localInternalTrialReady).toBe(true);
    expect(result.productionCandidateReady).toBe(false);
    expect(result.productionAcceptanceGranted).toBe(false);
    expect(result.hostedMutationCount).toBe(0);
    expect(result.customerDataExposed).toBe(false);
    expect(result.gates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ gate: "roles", status: "green" }),
        expect.objectContaining({ gate: "workflow", status: "green" }),
        expect.objectContaining({ gate: "sla", status: "green" }),
        expect.objectContaining({ gate: "files_comments", status: "green" }),
        expect.objectContaining({ gate: "audit", status: "green" }),
        expect.objectContaining({ gate: "evidence", status: "green" }),
        expect.objectContaining({ gate: "verification", status: "green" }),
        expect.objectContaining({ gate: "hosted", status: "not_authorized" }),
        expect.objectContaining({
          gate: "production",
          status: "not_authorized",
        }),
      ]),
    );
    expect(
      result.gates.filter((gate) => gate.status === "green"),
    ).toSatisfy((greenGates: typeof result.gates) =>
      greenGates.every((gate) => gate.blockers.length === 0),
    );
  });

  it("blocks trial readiness when a P0 or P1 defect remains open", () => {
    const result = buildR011AStage2CTrialResult(
      completeInput({
        defects: [
          {
            id: "stage2c_p1_approval_bypass",
            severity: "P1",
            status: "open",
            productionImpact: "blocks_production",
          },
        ],
      }),
    );

    expect(result.localInternalTrialReady).toBe(false);
    expect(result.openP0P1Count).toBe(1);
    expect(result.defectCounts.P1).toBe(1);
    expect(result.productionCandidateReady).toBe(false);
  });

  it("treats any hosted mutation, file content operation, deployment, or access change as outside Stage 2C", () => {
    const result = buildR011AStage2CTrialResult(
      completeInput({
        hostedActions: {
          mutations: 1,
          fileContentOperations: 0,
          deployments: 0,
          accessConfigurationChanges: 0,
        },
      }),
    );

    expect(result.localInternalTrialReady).toBe(false);
    expect(result.hostedMutationCount).toBe(1);
    expect(result.gates).toContainEqual(
      expect.objectContaining({
        gate: "hosted",
        status: "not_authorized",
      }),
    );
  });

  it("keeps missing role, lifecycle, SLA, and redaction evidence visible as blockers", () => {
    const result = buildR011AStage2CTrialResult(
      completeInput({
        roleFindings: R011A_STAGE_2C_ROLE_CATEGORIES.filter(
          (category) => category !== "unauthorized_client",
        ).map((category) => ({ category, status: "passed" })),
        lifecycleSteps: R011A_STAGE_2C_LIFECYCLE_STEPS.filter(
          (step) => step !== "closure",
        ),
        slaStates: R011A_STAGE_2C_SLA_STATES.filter(
          (state) => state !== "resume",
        ),
        evidenceRedactionPassed: false,
      }),
    );

    expect(result.localInternalTrialReady).toBe(false);
    expect(result.gates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          gate: "roles",
          status: "blocked",
          blockers: ["role_category_evidence_missing"],
        }),
        expect.objectContaining({
          gate: "workflow",
          status: "blocked",
          blockers: ["lifecycle_evidence_missing"],
        }),
        expect.objectContaining({
          gate: "sla",
          status: "blocked",
          blockers: ["sla_state_missing"],
        }),
        expect.objectContaining({
          gate: "evidence",
          status: "blocked",
          blockers: ["evidence_redaction_gap"],
        }),
      ]),
    );
  });

  it("reports exposure when isolation evidence is missing or contradictory", () => {
    const result = buildR011AStage2CTrialResult(
      completeInput({
        isolation: { scenarios: [], clientDataLeakagePrevented: true },
      }),
    );

    expect(result.customerDataExposed).toBe(true);
    expect(result.gates).toContainEqual(
      expect.objectContaining({
        gate: "roles",
        status: "blocked",
        blockers: ["client_data_leakage_not_prevented"],
      }),
    );
  });
});

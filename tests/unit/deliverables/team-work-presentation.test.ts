import { describe, expect, it } from "vitest";
import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";
import {
  hasManagementWorkflowAuthority,
  projectTeamWork,
  type TeamWorkCapabilities,
} from "@/modules/deliverables/team-work-presentation";

const noCapabilities: TeamWorkCapabilities = {
  canApproveInternally: false,
  canManageDelivery: false,
  canSendToClient: false,
  canSubmitVersion: false,
  canUpdateStatus: false,
};

const deliverable = (
  overrides: Partial<DeliverableSafeSummary> = {},
): DeliverableSafeSummary => ({
  id: "deliverable-base",
  tenantId: "tenant-a",
  clientId: "client-a",
  name: "مخرج تجريبي",
  type: "post",
  status: "in_progress",
  priority: "normal",
  ownerUserId: "owner-a",
  contributorUserIds: [],
  internalDueDate: "2026-09-20",
  requiresInternalApproval: true,
  requiresClientApproval: true,
  progressPercentage: 30,
  approvedExtra: false,
  revision: 1,
  createdAt: "2026-09-01T08:00:00.000Z",
  updatedAt: "2026-09-10T08:00:00.000Z",
  ...overrides,
});

describe("actor-aware team work presentation", () => {
  it.each([
    ["account_manager", "client-a", false],
    ["tenant_administrator", "tenant-a", true],
    ["tenant_administrator", "other-tenant", false],
  ] as const)(
    "matches management workflow authority for %s at %s",
    (roleKey, scopeId, expected) => {
      const actor = {
        userId: "actor-a",
        tenantId: "tenant-a",
        tenantMembership: {
          id: "membership-a",
          tenantId: "tenant-a",
          userId: "actor-a",
          status: "active" as const,
        },
        roleAssignments: [
          {
            id: "assignment-a",
            tenantId: "tenant-a",
            membershipId: "membership-a",
            roleKey,
            scopeType:
              scopeId === "tenant-a" || scopeId === "other-tenant"
                ? ("tenant" as const)
                : ("client" as const),
            scopeId,
            status: "active" as const,
          },
        ],
      };

      expect(
        hasManagementWorkflowAuthority({
          actor,
          resource: { tenantId: "tenant-a", clientId: "client-a" },
        }),
      ).toBe(expected);
    },
  );

  it.each([
    {
      name: "owner who can submit",
      input: deliverable(),
      actorUserId: "owner-a",
      capabilities: { ...noCapabilities, canSubmitVersion: true },
      hasOpenAssignedTask: false,
      expected: {
        relationship: "owner",
        relationshipLabel: "أنت المسؤول",
        needsActorAction: true,
        nextAction: "أكمل العمل وارفع النسخة للمراجعة الداخلية.",
      },
    },
    {
      name: "contributor waiting for management review",
      input: deliverable({
        ownerUserId: "owner-b",
        contributorUserIds: ["actor-a"],
        status: "ready_for_internal_review",
      }),
      actorUserId: "actor-a",
      capabilities: { ...noCapabilities, canSubmitVersion: true },
      hasOpenAssignedTask: false,
      expected: {
        relationship: "contributor",
        relationshipLabel: "أنت مشارك في المخرج",
        needsActorAction: false,
        nextAction: "بانتظار مراجعة الإدارة — ما عليك إجراء الآن",
      },
    },
    {
      name: "actor with an open assigned task",
      input: deliverable({
        ownerUserId: "owner-b",
        status: "waiting_client_approval",
      }),
      actorUserId: "actor-a",
      capabilities: noCapabilities,
      hasOpenAssignedTask: true,
      expected: {
        relationship: "open_assigned_task",
        relationshipLabel: "عندك مهمة داخل المخرج",
        needsActorAction: true,
        nextAction: "أكمل المهمة المفتوحة المسندة لك داخل المخرج.",
      },
    },
    {
      name: "manager who can approve the current resource",
      input: deliverable({
        ownerUserId: "owner-b",
        status: "ready_for_internal_review",
      }),
      actorUserId: "manager-a",
      capabilities: { ...noCapabilities, canApproveInternally: true },
      hasOpenAssignedTask: false,
      expected: {
        relationship: "role_context",
        relationshipLabel: "ظاهر لك بحكم دورك",
        needsActorAction: true,
        nextAction: "راجع النسخة واتخذ قرار الاعتماد الداخلي.",
      },
    },
    {
      name: "manager who can start unassigned work without implying version submission",
      input: deliverable({
        ownerUserId: "owner-b",
        status: "not_started",
      }),
      actorUserId: "manager-a",
      capabilities: { ...noCapabilities, canUpdateStatus: true },
      hasOpenAssignedTask: false,
      expected: {
        relationship: "role_context",
        relationshipLabel: "ظاهر لك بحكم دورك",
        needsActorAction: true,
        nextAction: "ابدأ التنفيذ بتحديث حالة المخرج.",
      },
    },
    {
      name: "unassigned writer cannot infer authoring authority from a client role",
      input: deliverable({ ownerUserId: "owner-b" }),
      actorUserId: "writer-a",
      capabilities: { ...noCapabilities, canSubmitVersion: true },
      hasOpenAssignedTask: false,
      expected: {
        relationship: "role_context",
        relationshipLabel: "ظاهر لك بحكم دورك",
        needsActorAction: false,
        nextAction: "بانتظار تنفيذ المسؤول — ما عليك إجراء الآن",
      },
    },
    {
      name: "manager who can send an internally approved version",
      input: deliverable({
        ownerUserId: "owner-b",
        status: "internally_approved",
      }),
      actorUserId: "manager-a",
      capabilities: { ...noCapabilities, canSendToClient: true },
      hasOpenAssignedTask: false,
      expected: {
        relationship: "role_context",
        relationshipLabel: "ظاهر لك بحكم دورك",
        needsActorAction: true,
        nextAction: "أرسل النسخة المعتمدة للعميل.",
      },
    },
    {
      name: "terminal work never suggests an action",
      input: deliverable({ status: "delivered" }),
      actorUserId: "owner-a",
      capabilities: {
        canApproveInternally: true,
        canManageDelivery: true,
        canSendToClient: true,
        canSubmitVersion: true,
        canUpdateStatus: true,
      },
      hasOpenAssignedTask: false,
      expected: {
        relationship: "owner",
        relationshipLabel: "أنت المسؤول",
        needsActorAction: false,
        nextAction: "المخرج مكتمل — ما عليك إجراء الآن",
      },
    },
    {
      name: "account manager cannot prepare internally approved work without client approval",
      input: deliverable({
        ownerUserId: "account-manager-a",
        status: "internally_approved",
        requiresClientApproval: false,
      }),
      actorUserId: "account-manager-a",
      capabilities: {
        ...noCapabilities,
        canManageDelivery: false,
        canUpdateStatus: true,
      },
      hasOpenAssignedTask: false,
      expected: {
        needsActorAction: false,
        nextAction: "بانتظار تجهيز الإدارة للتسليم — ما عليك إجراء الآن",
      },
    },
    {
      name: "account manager cannot prepare client-approved work",
      input: deliverable({
        ownerUserId: "account-manager-a",
        status: "client_approved",
      }),
      actorUserId: "account-manager-a",
      capabilities: {
        ...noCapabilities,
        canManageDelivery: false,
        canUpdateStatus: true,
      },
      hasOpenAssignedTask: false,
      expected: {
        needsActorAction: false,
        nextAction: "بانتظار تجهيز الإدارة للتسليم — ما عليك إجراء الآن",
      },
    },
    {
      name: "account manager cannot confirm final delivery",
      input: deliverable({
        ownerUserId: "account-manager-a",
        status: "ready_for_delivery",
      }),
      actorUserId: "account-manager-a",
      capabilities: {
        ...noCapabilities,
        canManageDelivery: false,
        canUpdateStatus: true,
      },
      hasOpenAssignedTask: false,
      expected: {
        needsActorAction: false,
        nextAction: "بانتظار تأكيد الإدارة للتسليم — ما عليك إجراء الآن",
      },
    },
    {
      name: "management authority can confirm final delivery",
      input: deliverable({
        ownerUserId: "owner-b",
        status: "ready_for_delivery",
      }),
      actorUserId: "manager-a",
      capabilities: {
        ...noCapabilities,
        canManageDelivery: true,
        canUpdateStatus: true,
      },
      hasOpenAssignedTask: false,
      expected: {
        needsActorAction: true,
        nextAction: "راجع الملفات وأكّد التسليم النهائي.",
      },
    },
  ])("derives $name without granting capabilities", (scenario) => {
    const [result] = projectTeamWork({
      actorUserId: scenario.actorUserId,
      capabilitiesByDeliverable: {
        [scenario.input.id]: scenario.capabilities,
      },
      deliverables: [scenario.input],
      now: "2026-09-14T08:00:00.000Z",
      workspaces: {
        [scenario.input.id]: {
          deliverableId: scenario.input.id,
          hasOpenAssignedTask: scenario.hasOpenAssignedTask,
          counts: { versions: 0, tasks: 0, files: 0, comments: 0 },
        },
      },
    });

    expect(result).toMatchObject(scenario.expected);
  });

  it("sorts by action, SLA, effective due date, priority, updated time, then id", () => {
    const fixtures = [
      deliverable({
        id: "no-action-overdue",
        ownerUserId: "someone-else",
        internalDueDate: "2026-09-01",
        priority: "urgent",
      }),
      deliverable({
        id: "action-at-risk-later",
        internalDueDate: "2026-09-15T07:00:00.000Z",
        priority: "urgent",
      }),
      deliverable({
        id: "action-overdue",
        internalDueDate: "2026-09-13",
        priority: "low",
      }),
      deliverable({
        id: "action-at-risk-nearer",
        internalDueDate: "2026-09-14T12:00:00.000Z",
        priority: "low",
      }),
      deliverable({
        id: "z-stable",
        internalDueDate: "2026-09-20",
        priority: "high",
        updatedAt: "2026-09-12T08:00:00.000Z",
      }),
      deliverable({
        id: "a-stable",
        internalDueDate: "2026-09-20",
        priority: "high",
        updatedAt: "2026-09-12T08:00:00.000Z",
      }),
    ];
    const result = projectTeamWork({
      actorUserId: "owner-a",
      capabilitiesByDeliverable: Object.fromEntries(
        fixtures.map((item) => [
          item.id,
          { ...noCapabilities, canSubmitVersion: true },
        ]),
      ),
      deliverables: fixtures,
      now: "2026-09-14T08:00:00.000Z",
      workspaces: {},
    });

    expect(result.map((item) => item.deliverable.id)).toEqual([
      "action-overdue",
      "action-at-risk-nearer",
      "action-at-risk-later",
      "a-stable",
      "z-stable",
      "no-action-overdue",
    ]);
  });

  it("uses priority when both effective due dates are missing", () => {
    const low = deliverable({
      id: "low-no-due",
      priority: "low",
      internalDueDate: undefined,
      clientDueDate: undefined,
      finalDueDate: undefined,
    });
    const urgent = deliverable({
      id: "urgent-no-due",
      priority: "urgent",
      internalDueDate: undefined,
      clientDueDate: undefined,
      finalDueDate: undefined,
    });

    expect(
      projectTeamWork({
        actorUserId: "owner-a",
        capabilitiesByDeliverable: {
          [low.id]: { ...noCapabilities, canSubmitVersion: true },
          [urgent.id]: { ...noCapabilities, canSubmitVersion: true },
        },
        deliverables: [low, urgent],
        now: "2026-09-14T08:00:00.000Z",
        workspaces: {},
      }).map(({ deliverable: projected }) => projected.id),
    ).toEqual(["urgent-no-due", "low-no-due"]);
  });

  it("uses newest updatedAt after missing due dates and tied priority", () => {
    const older = deliverable({
      id: "older-update",
      priority: "high",
      internalDueDate: undefined,
      updatedAt: "2026-09-10T08:00:00.000Z",
    });
    const newer = deliverable({
      id: "newer-update",
      priority: "high",
      internalDueDate: undefined,
      updatedAt: "2026-09-12T08:00:00.000Z",
    });

    expect(
      projectTeamWork({
        actorUserId: "owner-a",
        capabilitiesByDeliverable: {
          [older.id]: { ...noCapabilities, canSubmitVersion: true },
          [newer.id]: { ...noCapabilities, canSubmitVersion: true },
        },
        deliverables: [older, newer],
        now: "2026-09-14T08:00:00.000Z",
        workspaces: {},
      }).map(({ deliverable: projected }) => projected.id),
    ).toEqual(["newer-update", "older-update"]);
  });

  it("falls through invalid updatedAt values to stable id ordering", () => {
    const zInvalid = deliverable({
      id: "z-invalid-update",
      internalDueDate: undefined,
      updatedAt: "not-a-date",
    });
    const aMissing = deliverable({
      id: "a-missing-update",
      internalDueDate: undefined,
      updatedAt: "",
    });

    expect(
      projectTeamWork({
        actorUserId: "owner-a",
        capabilitiesByDeliverable: {
          [zInvalid.id]: { ...noCapabilities, canSubmitVersion: true },
          [aMissing.id]: { ...noCapabilities, canSubmitVersion: true },
        },
        deliverables: [zInvalid, aMissing],
        now: "2026-09-14T08:00:00.000Z",
        workspaces: {},
      }).map(({ deliverable: projected }) => projected.id),
    ).toEqual(["a-missing-update", "z-invalid-update"]);
  });
});

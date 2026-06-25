import { describe, expect, it } from "vitest";
import { createAuditGuard, InMemoryAuditSink } from "@/modules/audit/audit-service";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import { runAuthorizedSensitiveOperation } from "@/server/authorization/server-authorization";
import { tenantA, tenantAdminA, tenantViewerA } from "../../fixtures/f001-fixtures";

describe("audit baseline", () => {
  it("fails closed when a sensitive operation omits an audit event", async () => {
    const audit = new InMemoryAuditSink();
    const guard = createAuditGuard(audit);

    await expect(
      guard.runSensitive({
        operation: async () => "mutated",
      }),
    ).rejects.toThrow("AUDIT_EVENT_REQUIRED");

    expect(audit.events).toEqual([]);
  });

  it("appends an audit event for an allowed sensitive operation", async () => {
    const audit = new InMemoryAuditSink();
    const guard = createAuditGuard(audit);

    const result = await guard.runSensitive({
      auditEvent: {
        tenantId: tenantA.id,
        actorUserId: tenantAdminA.session.userId,
        action: "SensitiveBaselineAction",
        decision: "allowed",
        targetType: "security_probe",
        targetId: "probe-1",
      },
      operation: async () => "mutated",
    });

    expect(result).toBe("mutated");
    expect(audit.events).toHaveLength(1);
    expect(audit.events[0]).toMatchObject({
      tenantId: tenantA.id,
      action: "SensitiveBaselineAction",
      decision: "allowed",
    });
  });

  it("server-side authorization denies a forbidden operation even when UI claims it is enabled", async () => {
    const audit = new InMemoryAuditSink();

    const result = await runAuthorizedSensitiveOperation({
      actor: tenantViewerA.authorizationActor,
      permission: PERMISSIONS.CLIENT_CREATE,
      resource: { tenantId: tenantA.id },
      uiHint: { actionVisible: true },
      audit,
      operation: async () => "created",
    });

    expect(result).toMatchObject({
      ok: false,
      error: { code: "ACCESS_DENIED", exposeResource: false },
    });
    expect(audit.events).toHaveLength(1);
    expect(audit.events[0]).toMatchObject({
      action: "AuthorizationDenied",
      decision: "denied",
      tenantId: tenantA.id,
    });
  });
});

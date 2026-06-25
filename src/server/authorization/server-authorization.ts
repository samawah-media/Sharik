import type { AuditSink } from "@/modules/audit/audit-service";
import {
  evaluatePermission,
  type AuthorizationActor,
  type ResourceScope,
} from "@/modules/authorization/evaluator";
import type { PermissionId } from "@/modules/authorization/permission-catalog";
import { safeDeniedError } from "@/modules/errors/safe-errors";

export const runAuthorizedSensitiveOperation = async <T>({
  actor,
  permission,
  resource,
  audit,
  operation,
}: {
  actor: AuthorizationActor;
  permission: PermissionId;
  resource: ResourceScope;
  uiHint?: { actionVisible: boolean };
  audit: AuditSink;
  operation: () => Promise<T>;
}) => {
  const decision = evaluatePermission({ actor, permission, resource });

  if (!decision.allowed) {
    await audit.append({
      tenantId: actor.tenantId,
      clientId: resource.clientId,
      actorUserId: actor.userId,
      action: "AuthorizationDenied",
      decision: "denied",
      targetType: "authorization",
      targetId: permission,
      reason: decision.reason,
    });

    return { ok: false as const, error: safeDeniedError("ACCESS_DENIED") };
  }

  return { ok: true as const, value: await operation() };
};

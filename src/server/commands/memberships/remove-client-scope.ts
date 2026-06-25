import { z } from "zod";
import {
  createRequiredAuditAtomicUnitOfWork,
  runAuditAtomicMutation,
  type AuditSink,
} from "@/modules/audit/audit-service";
import type { AuthorizationActor } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import type { MembershipRepository } from "@/modules/memberships/membership-repository";
import { runAuthorizedSensitiveOperation } from "@/server/authorization/server-authorization";

const removeClientScopeSchema = z.object({
  membershipId: z.string().trim().min(1),
  clientId: z.string().trim().min(1),
  reason: z.string().trim().min(3).max(500),
});

export const removeClientScopeCommand = async ({
  actor,
  memberships,
  audit,
  input,
}: {
  actor: AuthorizationActor;
  memberships: MembershipRepository;
  audit: AuditSink;
  input: unknown;
}) => {
  const parsed = removeClientScopeSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false as const, error: "VALIDATION_FAILED" as const };
  }

  return runAuthorizedSensitiveOperation({
    actor,
    permission: PERMISSIONS.USER_ROLE_UPDATE,
    resource: { tenantId: actor.tenantId, clientId: parsed.data.clientId },
    audit,
    operation: async () => {
      return runAuditAtomicMutation({
        transaction: createRequiredAuditAtomicUnitOfWork([audit, memberships]),
        operation: async () => {
          await audit.append({
            tenantId: actor.tenantId,
            clientId: parsed.data.clientId,
            actorUserId: actor.userId,
            action: "ClientScopeRemoved",
            decision: "allowed",
            targetType: "membership",
            targetId: parsed.data.membershipId,
            reason: parsed.data.reason,
          });

          const result = await memberships.removeClientScope({
            tenantId: actor.tenantId,
            membershipId: parsed.data.membershipId,
            clientId: parsed.data.clientId,
          });

          if (
            !result.clientMembership &&
            result.revokedRoleAssignments.length === 0
          ) {
            throw new Error("CLIENT_SCOPE_MUTATION_FAILED");
          }

          return { ok: true as const, value: result };
        },
      });
    },
  });
};

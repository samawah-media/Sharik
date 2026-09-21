import {
  evaluatePermission,
  type AuthorizationActor,
} from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";

export const commentTypes = [
  "internal_comment",
  "client_comment",
  "system_comment",
  "approval_comment",
] as const;

export const commentVisibilities = ["internal_only", "client_visible"] as const;

export type CommentType = (typeof commentTypes)[number];
export type CommentVisibility = (typeof commentVisibilities)[number];

export type CommentRecord = {
  id: string;
  tenantId: string;
  clientId: string;
  relatedEntityType: "deliverable" | "file" | "approval" | "system";
  relatedEntityId: string;
  commentType: CommentType;
  visibility: CommentVisibility;
  body: string;
  authorUserId: string;
  createdAt: string;
};

const isClientOnlyActor = (actor: AuthorizationActor) =>
  actor.roleAssignments.length > 0 &&
  actor.roleAssignments.every((assignment) =>
    assignment.roleKey === "client_admin" ||
    assignment.roleKey === "client_approver" ||
    assignment.roleKey === "client_viewer",
  );

const canReadClientScope = ({
  actor,
  clientId,
}: {
  actor: AuthorizationActor;
  clientId: string;
}) =>
  evaluatePermission({
    actor,
    permission: PERMISSIONS.CLIENT_VIEW,
    resource: { tenantId: actor.tenantId, clientId },
  }).allowed;

const isScopedToClient = ({
  actor,
  clientId,
  comment,
}: {
  actor: AuthorizationActor;
  clientId: string;
  comment: CommentRecord;
}) => comment.tenantId === actor.tenantId && comment.clientId === clientId;

const isVisibleInClientPortal = (comment: CommentRecord) =>
  comment.visibility === "client_visible" &&
  comment.commentType !== "internal_comment";

export const filterClientVisibleComments = ({
  actor,
  clientId,
  comments,
  audience = "client",
}: {
  actor: AuthorizationActor;
  clientId: string;
  comments: CommentRecord[];
  audience?: "client" | "internal";
}) => {
  if (!canReadClientScope({ actor, clientId })) {
    return [];
  }

  const scopedComments = comments.filter((comment) =>
    isScopedToClient({ actor, clientId, comment }),
  );

  if (audience === "internal" && !isClientOnlyActor(actor)) {
    return scopedComments;
  }

  return scopedComments.filter(isVisibleInClientPortal);
};

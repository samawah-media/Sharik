import { describe, expect, it } from "vitest";
import {
  filterClientVisibleComments,
  type CommentRecord,
} from "@/modules/comments/comment-visibility-rules";
import {
  assignedInternalA,
  clientA,
  clientB,
  clientViewerA,
} from "../../fixtures/f001-fixtures";

const comment = (overrides: Partial<CommentRecord> = {}): CommentRecord => ({
  id: "comment_client_visible",
  tenantId: clientA.tenantId,
  clientId: clientA.id,
  relatedEntityType: "deliverable",
  relatedEntityId: "deliverable_visible",
  commentType: "client_comment",
  visibility: "client_visible",
  body: "تعليق ظاهر للعميل",
  authorUserId: "client_viewer_a",
  createdAt: "2026-07-08T00:00:00.000Z",
  ...overrides,
});

describe("R-007 comment visibility rules", () => {
  it("hides internal comments from client portal readers", () => {
    const comments = [
      comment({ id: "client_comment", body: "تعليق ظاهر للعميل" }),
      comment({
        id: "approval_comment",
        commentType: "approval_comment",
        visibility: "client_visible",
        body: "قرار اعتماد ظاهر",
      }),
      comment({
        id: "internal_comment",
        commentType: "internal_comment",
        visibility: "internal_only",
        body: "INTERNAL_QA_NOTE_SHOULD_NOT_RENDER",
      }),
      comment({
        id: "other_client_comment",
        tenantId: clientB.tenantId,
        clientId: clientB.id,
        body: "OTHER_CLIENT_SHOULD_NOT_RENDER",
      }),
    ];

    const visible = filterClientVisibleComments({
      actor: clientViewerA.authorizationActor,
      clientId: clientA.id,
      comments,
    });

    expect(visible.map((item) => item.id)).toEqual([
      "client_comment",
      "approval_comment",
    ]);
    expect(visible.map((item) => item.body).join(" ")).not.toContain(
      "INTERNAL_QA_NOTE_SHOULD_NOT_RENDER",
    );
    expect(visible.map((item) => item.body).join(" ")).not.toContain(
      "OTHER_CLIENT_SHOULD_NOT_RENDER",
    );
  });

  it("lets authorized Samawah team members see internal comments for their client", () => {
    const comments = [
      comment({ id: "client_comment" }),
      comment({
        id: "internal_comment",
        commentType: "internal_comment",
        visibility: "internal_only",
        body: "ملاحظة داخلية للفريق",
      }),
    ];

    expect(
      filterClientVisibleComments({
        actor: assignedInternalA.authorizationActor,
        clientId: clientA.id,
        comments,
        audience: "internal",
      }).map((item) => item.id),
    ).toEqual(["client_comment", "internal_comment"]);
  });
});

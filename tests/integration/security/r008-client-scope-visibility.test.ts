import { describe, expect, it } from "vitest";
import { filterClientVisibleComments } from "@/modules/comments/comment-visibility-rules";
import { filterClientVisibleFileAssets } from "@/modules/files/file-visibility-rules";
import { filterR008ApprovalItemsForActor } from "@/modules/release/r008-isolation-proof";
import {
  r008Actors,
  r008Comments,
  r008FileAssets,
  r008ScopedApprovalItems,
  r008SyntheticClientA,
} from "../../fixtures/r008-fixtures";

describe("R-008 client scope visibility", () => {
  it("shows client users only scoped client-visible and final files", () => {
    expect(
      filterClientVisibleFileAssets({
        actor: r008Actors.clientViewerA,
        clientId: r008SyntheticClientA.id,
        files: r008FileAssets,
      }).map((file) => file.id),
    ).toEqual(["r008_client_a_visible_file", "r008_client_a_final_file"]);
  });

  it("hides internal and cross-client comments from client portal readers", () => {
    expect(
      filterClientVisibleComments({
        actor: r008Actors.clientViewerA,
        clientId: r008SyntheticClientA.id,
        comments: r008Comments,
      }).map((comment) => comment.id),
    ).toEqual(["r008_client_a_client_comment"]);
  });

  it("allows assigned internal users to see only their assigned client's internal comments", () => {
    expect(
      filterClientVisibleComments({
        actor: r008Actors.assignedInternalA,
        clientId: r008SyntheticClientA.id,
        comments: r008Comments,
        audience: "internal",
      }).map((comment) => comment.id),
    ).toEqual([
      "r008_client_a_client_comment",
      "r008_client_a_internal_comment",
    ]);
  });

  it("allows client approvers to approve only assigned visible approval items", () => {
    expect(
      filterR008ApprovalItemsForActor({
        actor: r008Actors.clientApproverA,
        items: r008ScopedApprovalItems,
        action: "approve",
      }).map((item) => item.id),
    ).toEqual(["r008_client_a_current_approval"]);
  });
});

import { describe, expect, it } from "vitest";
import { deriveClientReadableVersion } from "@/modules/approvals/client-readable-version";

// Publication is supplied by the authenticated RLS read, never inferred here.
const published = {
  status: "waiting_client_approval",
  currentVersionId: "v2",
  readableVersionId: "v2",
  hasReviewPayload: true,
};

describe("SIL-52 client-readable version presentation", () => {
  it.each([
    "in_progress", "ready_for_internal_review", "internal_changes_requested",
    "internally_approved", "client_changes_requested",
  ])("keeps sent v2 read-only while current v3 is %s", (status) => {
    expect(deriveClientReadableVersion({ ...published, status, currentVersionId: "v3" }))
      .toMatchObject({
        status: "client_changes_requested", progressPercentage: 65,
        isActionable: false, canComment: false,
      });
  });

  it("does not let a waiting status grant decisions on a noncurrent snapshot", () => {
    expect(deriveClientReadableVersion({ ...published, currentVersionId: "v3" }))
      .toMatchObject({ isActionable: false, canComment: false });
  });

  it("restores decisions only after the sent version is also current", () => {
    expect(deriveClientReadableVersion({ ...published, currentVersionId: "v3", readableVersionId: "v3" }))
      .toMatchObject({ status: "waiting_client_approval", progressPercentage: 80, isActionable: true, canComment: true });
  });

  it("does not make an empty current review actionable", () => {
    expect(deriveClientReadableVersion({ ...published, hasReviewPayload: false }))
      .toMatchObject({ isActionable: false });
  });

  it.each(["in_progress", "waiting_client_approval", "delivered"])(
    "never infers publication from %s without a readable version", (status) => {
      expect(deriveClientReadableVersion({ ...published, status, readableVersionId: undefined })).toBeUndefined();
    },
  );

  it.each(["cancelled", "archived"])("hides %s even with prior publication", (status) => {
    expect(deriveClientReadableVersion({ ...published, status })).toBeUndefined();
  });

  it.each([
    ["client_approved", 90], ["ready_for_delivery", 95], ["delivered", 100],
  ] as const)("preserves current published %s progress without reopening approval", (status, progressPercentage) => {
    expect(deriveClientReadableVersion({ ...published, status }))
      .toMatchObject({ status, progressPercentage, isActionable: false });
  });
});

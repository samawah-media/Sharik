import { describe, expect, it } from "vitest";
import { canUseRouteActorFixtures } from "@/server/navigation/route-guards";

describe("hosted route actor fixtures", () => {
  it("disables query actor fixtures in preview and staging runtimes", () => {
    expect(
      canUseRouteActorFixtures({ appEnv: "preview", nodeEnv: "development" }),
    ).toBe(false);
    expect(
      canUseRouteActorFixtures({ appEnv: "staging", nodeEnv: "development" }),
    ).toBe(false);
  });

  it("keeps fixtures available only for local and test development flows", () => {
    expect(canUseRouteActorFixtures({ appEnv: "local", nodeEnv: "development" })).toBe(
      true,
    );
    expect(canUseRouteActorFixtures({ appEnv: "test", nodeEnv: "test" })).toBe(true);
    expect(canUseRouteActorFixtures({ appEnv: "local", nodeEnv: "production" })).toBe(
      false,
    );
  });
});

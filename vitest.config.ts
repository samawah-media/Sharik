import { defineConfig, defineProject } from "vitest/config";
import { fileURLToPath } from "node:url";

const aliases = {
  "@": fileURLToPath(new URL("./src", import.meta.url)),
  "server-only": fileURLToPath(new URL("./tests/setup/server-only.ts", import.meta.url)),
};

export default defineConfig({
  test: {
    maxWorkers: 4,
    projects: [
      defineProject({
        test: {
          name: "unit",
          environment: "node",
          include: ["tests/unit/**/*.test.ts"],
          setupFiles: ["tests/setup/vitest.ts"],
        },
        resolve: { alias: aliases },
      }),
      defineProject({
        test: {
          name: "integration",
          environment: "node",
          include: ["tests/integration/**/*.test.ts"],
          setupFiles: ["tests/setup/vitest.ts"],
        },
        resolve: { alias: aliases },
      }),
      defineProject({
        test: {
          name: "rls-simulator",
          environment: "node",
          include: ["tests/rls/**/*.test.ts"],
          setupFiles: ["tests/setup/vitest.ts"],
        },
        resolve: { alias: aliases },
      }),
      defineProject({
        test: {
          name: "component",
          environment: "jsdom",
          include: ["tests/component/**/*.test.tsx"],
          setupFiles: ["tests/setup/vitest.ts"],
        },
        resolve: { alias: aliases },
      }),
    ],
  },
});

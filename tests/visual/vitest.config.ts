import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL("../../", import.meta.url));

export default defineConfig({
  root,
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("../../src", import.meta.url)),
      "server-only": fileURLToPath(new URL("../setup/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["tests/setup/vitest.ts"],
    include: [
      "tests/visual/shell-light-theme.test.tsx",
      "tests/visual/content-preview-review.test.tsx",
    ],
    maxWorkers: 1,
  },
});

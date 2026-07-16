import fs from "node:fs";
import path from "node:path";

const storageStatePath = path.resolve(
  process.cwd(),
  "test-results/s015-vercel-share-state.json",
);

export default function vercelShareGlobalTeardown() {
  fs.rmSync(storageStatePath, { force: true });
}

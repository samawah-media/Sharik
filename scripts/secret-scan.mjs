import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const ignored = new Set([
  ".git",
  ".next",
  "node_modules",
  "node_modules.partial",
  "demo",
  "coverage",
  "playwright-report",
  "test-results",
]);

const patterns = [
  /sk-[A-Za-z0-9]{20,}/,
  /sb_secret_[A-Za-z0-9_-]+/,
  /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (ignored.has(entry)) continue;

    const path = join(dir, entry);
    const stat = statSync(path);

    if (stat.isDirectory()) {
      walk(path);
      continue;
    }

    if (!/\.(ts|tsx|js|mjs|json|md|yml|yaml|env|example|css|sql)$/u.test(entry)) {
      continue;
    }

    const text = readFileSync(path, "utf8");
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        throw new Error(`Potential secret found in ${path}`);
      }
    }
  }
}

walk(root);
console.log("No high-confidence secrets found.");

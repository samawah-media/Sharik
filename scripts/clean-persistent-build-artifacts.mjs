import { rmSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";

const workspaceRoot = resolve(process.cwd());
const persistentBuildDirectory = resolve(workspaceRoot, ".next-persistent");

if (
  dirname(persistentBuildDirectory) !== workspaceRoot ||
  basename(persistentBuildDirectory) !== ".next-persistent"
) {
  throw new Error("Refusing to clean an unexpected persistent build directory.");
}

rmSync(persistentBuildDirectory, { force: true, recursive: true });

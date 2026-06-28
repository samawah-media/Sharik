import { spawn } from "node:child_process";
import process from "node:process";

const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
const args = [
  "supabase@2.107.0",
  "test",
  "db",
  "--local",
  "supabase/tests/database",
];

const sanitizedEnv = Object.fromEntries(
  Object.entries(process.env).filter(
    ([key, value]) => key && !key.startsWith("=") && value !== undefined,
  ),
);

const childOptions = {
  stdio: "inherit",
  env: {
    ...sanitizedEnv,
    DO_NOT_TRACK: "1",
    SUPABASE_TELEMETRY_DISABLED: "1",
  },
};

const child =
  process.platform === "win32"
    ? spawn(
        process.env.ComSpec ?? "cmd.exe",
        ["/d", "/s", "/c", [npxCommand, ...args].join(" ")],
        childOptions,
      )
    : spawn(npxCommand, args, childOptions);

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});

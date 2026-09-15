import http from "node:http";
import net from "node:net";
import { spawn, spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const parseDotEnv = (path) => {
  if (!existsSync(path)) {
    return {};
  }

  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        const key = line.slice(0, index).trim();
        const rawValue = line.slice(index + 1).trim();
        return [key, rawValue.replace(/^["']|["']$/gu, "")];
      }),
  );
};

const localEnv = parseDotEnv(resolve(".env.local"));

const readSupabaseStatusEnv = () => {
  const command = process.platform === "win32" ? "npx.cmd" : "npx";
  const args = ["supabase@2.107.0", "status", "-o", "env"];
  const options = {
    encoding: "utf8",
    env: {
      ...process.env,
      DO_NOT_TRACK: "1",
      SUPABASE_TELEMETRY_DISABLED: "1",
    },
    windowsHide: true,
  };
  const result =
    process.platform === "win32"
      ? spawnSync(
          process.env.ComSpec ?? "cmd.exe",
          ["/d", "/s", "/c", [command, ...args].join(" ")],
          options,
        )
      : spawnSync(command, args, options);

  if (result.status !== 0) {
    return {};
  }

  return Object.fromEntries(
    result.stdout
      .split(/\r?\n/u)
      .filter((line) => line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        const rawValue = line.slice(index + 1).trim();
        return [line.slice(0, index), rawValue.replace(/^["']|["']$/gu, "")];
      }),
  );
};

const isLocalSupabaseUrl = (value) => {
  if (!value) {
    return false;
  }

  const url = new URL(value);
  return (
    url.protocol === "http:" &&
    ["localhost", "127.0.0.1", "host.docker.internal"].includes(url.hostname)
  );
};

const statusEnv = readSupabaseStatusEnv();
const envUrlCandidates = [
  statusEnv.API_URL,
  localEnv.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_URL,
];
const supabaseUrl = envUrlCandidates.find(isLocalSupabaseUrl);
const supabasePublishableKey =
  supabaseUrl === statusEnv.API_URL
    ? (statusEnv.PUBLISHABLE_KEY ?? statusEnv.ANON_KEY)
    : supabaseUrl === localEnv.NEXT_PUBLIC_SUPABASE_URL
      ? localEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
      : process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const assertPersistentBoundary = async () => {
  if (process.env.APP_ENV && process.env.APP_ENV !== "test-persistent") {
    throw new Error("Persistent Playwright requires APP_ENV=test-persistent.");
  }

  if (!isLocalSupabaseUrl(supabaseUrl)) {
    throw new Error("Persistent Playwright refused a non-local Supabase URL.");
  }

  if (!supabasePublishableKey) {
    throw new Error("Persistent Playwright requires a local publishable key.");
  }

  const healthUrl = new URL("/auth/v1/health", supabaseUrl);
  const response = await fetch(healthUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Persistent Playwright could not reach local Supabase.");
  }
};

const parsePort = (name, fallback) => {
  const rawValue = process.env[name];
  const value = rawValue === undefined ? fallback : Number(rawValue);

  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error(`${name} must be a valid TCP port.`);
  }

  return value;
};

const appHost = process.env.PLAYWRIGHT_PERSISTENT_APP_HOST ?? "127.0.0.1";
const appPort = parsePort("PLAYWRIGHT_PERSISTENT_APP_PORT", 3410);
const readyPort = parsePort("PLAYWRIGHT_PERSISTENT_READY_PORT", 3411);
const baseUrl =
  process.env.PLAYWRIGHT_PERSISTENT_BASE_URL ??
  `http://${appHost}:${appPort}`;

const routesToWarm = ["/", "/sign-in"];

const assertPortAvailable = (host, port, label) =>
  new Promise((resolveAvailable, reject) => {
    const socket = net.createConnection({ host, port });

    socket.once("connect", () => {
      socket.end();
      reject(
        new Error(
          `Refusing to start persistent Playwright ${label} server: ${host}:${port} already has a listener.`,
        ),
      );
    });

    socket.once("error", (error) => {
      if (error?.code === "ECONNREFUSED") {
        resolveAvailable();
        return;
      }

      reject(error);
    });
  });

const sanitizedEnv = Object.fromEntries(
  Object.entries(process.env).filter(
    ([key, value]) =>
      key &&
      !key.startsWith("=") &&
      value !== undefined &&
      !key.startsWith("VERCEL") &&
      key !== "SUPABASE_SERVICE_ROLE_KEY",
  ),
);

await assertPersistentBoundary();
await assertPortAvailable(appHost, appPort, "app");
await assertPortAvailable(appHost, readyPort, "readiness");

const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "dev",
    "--webpack",
    "-H",
    appHost,
    "-p",
    String(appPort),
  ],
  {
    env: {
      ...sanitizedEnv,
      APP_ENV: "test-persistent",
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: supabasePublishableKey,
    },
    stdio: "inherit",
    windowsHide: true,
  },
);

let shuttingDown = false;

const waitForTcp = (host, port, timeoutMs) =>
  new Promise((resolveReady, reject) => {
    const socket = net.createConnection({ host, port });
    const timeout = setTimeout(() => {
      socket.destroy();
      reject(new Error(`Timed out waiting for ${host}:${port}`));
    }, timeoutMs);

    socket.once("connect", () => {
      clearTimeout(timeout);
      socket.end();
      resolveReady();
    });

    socket.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });

const fetchWithTimeout = async (url, timeoutMs = 240_000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`${url} returned HTTP ${response.status}`);
    }

    await response.arrayBuffer();
  } finally {
    clearTimeout(timeout);
  }
};

const waitForApp = async () => {
  const deadline = Date.now() + 90_000;
  let lastError;

  while (Date.now() < deadline) {
    try {
      await waitForTcp(appHost, appPort, 5_000);
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolveWait) => setTimeout(resolveWait, 500));
    }
  }

  throw lastError ?? new Error("Next.js persistent dev server did not become ready.");
};

const warmRoutes = async () => {
  for (const route of routesToWarm) {
    await fetchWithTimeout(`${baseUrl}${route}`);
  }
};

const createReadinessServer = () =>
  http.createServer((_request, response) => {
    response.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    response.end("ready");
  });

const shutdown = (server) => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  server?.close();

  if (!child.killed) {
    child.kill();
  }
};

try {
  await waitForApp();
  await warmRoutes();

  const server = createReadinessServer();
  server.listen(readyPort, appHost, () => {
    console.log("Persistent Playwright web server ready.");
  });

  process.on("SIGINT", () => shutdown(server));
  process.on("SIGTERM", () => shutdown(server));

  child.on("exit", (code, signal) => {
    server.close();

    if (!shuttingDown) {
      process.exitCode = code ?? (signal ? 1 : 0);
    }
  });
} catch (error) {
  console.error(error);
  shutdown();
  process.exitCode = 1;
}

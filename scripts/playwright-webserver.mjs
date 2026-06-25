import http from "node:http";
import net from "node:net";
import { spawn } from "node:child_process";

const appHost = "127.0.0.1";
const appPort = 3000;
const readyPort = 3210;
const baseUrl = `http://${appHost}:${appPort}`;
const warmRouteTimeoutMs = 150_000;

const routesToWarm = [
  "/",
  "/portfolio?as=assigned_internal_a",
  "/portfolio?as=tenant_viewer_a",
  "/client?as=client_viewer_a",
  "/clients/client_b?as=assigned_internal_a",
  "/clients/client_b?as=client_viewer_a",
  "/clients/client_c?as=assigned_internal_a",
  "/clients",
  "/clients/new",
  "/invitations/internal",
  "/members",
  "/members?as=client_viewer_a",
  "/invite/expired",
];

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
      ...process.env,
      APP_ENV: process.env.APP_ENV ?? "test",
      NEXT_PUBLIC_SUPABASE_URL:
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        "local-e2e-publishable-key",
    },
    stdio: "inherit",
    windowsHide: true,
  },
);

let shuttingDown = false;

const fetchWithTimeout = async (url, timeoutMs = 90_000) => {
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
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  throw lastError ?? new Error("Next.js dev server did not become ready.");
};

const waitForTcp = (host, port, timeoutMs) =>
  new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port });
    const timeout = setTimeout(() => {
      socket.destroy();
      reject(new Error(`Timed out waiting for ${host}:${port}`));
    }, timeoutMs);

    socket.once("connect", () => {
      clearTimeout(timeout);
      socket.end();
      resolve();
    });

    socket.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });

const formatError = (error) =>
  error instanceof Error ? `${error.name}: ${error.message}` : String(error);

const warmRoutes = async () => {
  for (const route of routesToWarm) {
    const startedAt = Date.now();

    try {
      await fetchWithTimeout(`${baseUrl}${route}`, warmRouteTimeoutMs);
      console.log(
        `Playwright warm-up route ${route} ready in ${Date.now() - startedAt}ms.`,
      );
    } catch (error) {
      throw new Error(
        `Playwright warm-up failed for ${route}: ${formatError(error)}`,
        { cause: error },
      );
    }
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
    console.log(
      `Playwright web server ready after warming ${routesToWarm.length} routes.`,
    );
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

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROXY_ENTRY = path.join(ROOT, "server", "memory-proxy.mjs");

async function reserveIpv4Port() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  return { server, port: server.address().port };
}

function spawnProxy(port) {
  return spawn(process.execPath, [PROXY_ENTRY], {
    cwd: ROOT,
    env: {
      ...process.env,
      MEMORY_PROXY_HOST: "127.0.0.1",
      MEMORY_PROXY_PORT: String(port),
      VOLC_MEM0_BASE_URL: "",
      VOLC_MEM0_API_KEY: ""
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
}

async function waitForOutput(child, pattern, timeoutMs = 3000) {
  let output = "";
  const onData = (chunk) => { output += chunk.toString(); };
  child.stdout.on("data", onData);
  child.stderr.on("data", onData);
  const deadline = Date.now() + timeoutMs;
  while (!pattern.test(output)) {
    if (child.exitCode !== null) break;
    if (Date.now() >= deadline) throw new Error(`Timed out waiting for proxy output: ${output}`);
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  return output;
}

async function stopChild(child) {
  if (child.exitCode !== null) return;
  child.kill("SIGTERM");
  await new Promise((resolve) => child.once("exit", resolve));
}

async function waitForExit(child) {
  if (child.exitCode !== null) return child.exitCode;
  return new Promise((resolve) => child.once("exit", resolve));
}

test("legacy 8787 browser settings migrate away from the conflicting service", async () => {
  const source = await fs.readFile(path.join(ROOT, "public", "memory-hub.js"), "utf8");
  const store = new Map([["mirror-life-memory-proxy", "http://127.0.0.1:8787/api/memory"]]);
  const context = vm.createContext({
    localStorage: {
      getItem: (key) => store.get(key) || null,
      setItem: (key, value) => store.set(key, value),
      removeItem: (key) => store.delete(key)
    },
    setTimeout,
    clearTimeout,
    console
  });
  vm.runInContext(source, context);

  assert.equal(vm.runInContext("getMemoryProxyUrl()", context), "http://127.0.0.1:8797/api/memory");
  assert.equal(store.get("mirror-life-memory-proxy"), "http://127.0.0.1:8797/api/memory");
});

test("proxy binds IPv4 explicitly and refuses to hide an occupied port behind IPv6", async () => {
  const reservation = await reserveIpv4Port();
  const child = spawnProxy(reservation.port);
  try {
    const output = await waitForOutput(child, /已被其他程序占用|EADDRINUSE/);
    await waitForExit(child);
    assert.notEqual(child.exitCode, 0);
    assert.match(output, /已被其他程序占用|EADDRINUSE/);
  } finally {
    await stopChild(child);
    await new Promise((resolve) => reservation.server.close(resolve));
  }
});

test("proxy is reachable through the advertised IPv4 address", async () => {
  const reservation = await reserveIpv4Port();
  const port = reservation.port;
  await new Promise((resolve) => reservation.server.close(resolve));
  const child = spawnProxy(port);
  try {
    await waitForOutput(child, new RegExp(`listening on http://127\\.0\\.0\\.1:${port}/api/memory`));
    const response = await fetch(`http://127.0.0.1:${port}/api/memory`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "search", userId: "test", query: "记忆", limit: 1 })
    });
    assert.equal(response.status, 503);
    assert.match(await response.text(), /VOLC_MEM0_BASE_URL/);
  } finally {
    await stopChild(child);
  }
});

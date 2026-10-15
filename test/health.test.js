import test from "node:test";
import assert from "node:assert/strict";
import { getHealth, getReadiness } from "../src/health.js";

test("health response exposes service metadata and uptime", () => {
  const result = getHealth({ startedAt: Date.now() - 5000, version: "2.4.1", environment: "test" });
  assert.equal(result.status, "ok");
  assert.equal(result.service, "releasewatch");
  assert.equal(result.version, "2.4.1");
  assert.equal(result.environment, "test");
  assert.ok(result.uptimeSeconds >= 5);
  assert.doesNotThrow(() => new Date(result.timestamp).toISOString());
});

test("readiness passes when environment is configured", () => {
  const result = getReadiness({ environment: "production" });
  assert.equal(result.ready, true);
  assert.equal(result.checks.length, 3);
  assert.ok(result.checks.every((check) => check.status === "pass"));
});

test("readiness warns when environment is missing", () => {
  const result = getReadiness({ environment: "" });
  assert.equal(result.ready, false);
  assert.equal(result.checks.find((check) => check.name === "Configuration").status, "warn");
});

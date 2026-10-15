export function getHealth({ startedAt, version, environment }) {
  const uptimeSeconds = Math.floor((Date.now() - startedAt) / 1000);

  return {
    status: "ok",
    service: "releasewatch",
    version,
    environment,
    uptimeSeconds,
    timestamp: new Date().toISOString()
  };
}

export function getReadiness({ environment }) {
  // In a real service, verify required dependencies here (database, queue, etc.).
  const checks = [
    { name: "HTTP server", status: "pass", detail: "Request handler is running" },
    { name: "Configuration", status: environment ? "pass" : "warn",
      detail: environment ? `Environment set to ${environment}` : "APP_ENV is not set" },
    { name: "Dependencies", status: "pass", detail: "No external dependencies configured" }
  ];

  return {
    ready: checks.every((check) => check.status === "pass"),
    checks
  };
}

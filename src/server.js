import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { getHealth, getReadiness } from "./health.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(here, "../public");
const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const environment = process.env.APP_ENV ?? "development";
const version = process.env.APP_VERSION ?? "1.0.0";
const startedAt = Date.now();

const sendJson = (res, status, data) => {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff"
  });
  res.end(JSON.stringify(data, null, 2));
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("allow", "GET, HEAD");
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  if (url.pathname === "/health") {
    return sendJson(res, 200, getHealth({ startedAt, version, environment }));
  }

  if (url.pathname === "/ready") {
    const readiness = getReadiness({ environment });
    return sendJson(res, readiness.ready ? 200 : 503, readiness);
  }

  if (url.pathname === "/version") {
    return sendJson(res, 200, { service: "releasewatch", version, environment });
  }

  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const normalized = path.normalize(requestedPath).replace(/^(\.\.(\/|\\|$))+/, "");
  const target = path.resolve(publicDir, `.${normalized}`);

  if (!target.startsWith(publicDir + path.sep) && target !== path.join(publicDir, "index.html")) {
    return sendJson(res, 403, { error: "Forbidden" });
  }

  try {
    const body = await readFile(target);
    const ext = path.extname(target);
    const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml" };
    res.writeHead(200, {
      "content-type": types[ext] ?? "application/octet-stream",
      "x-content-type-options": "nosniff"
    });
    return res.end(req.method === "HEAD" ? undefined : body);
  } catch {
    return sendJson(res, 404, { error: "Not found" });
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`ReleaseWatch listening on port ${port} (${environment}, v${version})`);
});

function shutdown() {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

const $ = (id) => document.getElementById(id);
const formatUptime = (seconds) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours || days) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return parts.join(" ");
};

async function refreshDashboard() {
  $("refresh").disabled = true;
  $("refresh").style.opacity = ".6";
  try {
    const [healthResponse, readyResponse] = await Promise.all([fetch("/health"), fetch("/ready")]);
    if (!healthResponse.ok) throw new Error("Health endpoint returned an error");
    const health = await healthResponse.json();
    const readiness = await readyResponse.json();
    const passed = readiness.checks.filter((check) => check.status === "pass").length;

    $("service-status").textContent = health.status === "ok" ? "Operational" : "Degraded";
    $("status-foot").textContent = health.status === "ok" ? "All core endpoints responding" : "Investigate service health";
    $("version").textContent = `v${health.version}`;
    $("release-version").textContent = `v${health.version}`;
    $("service-meta").textContent = `${health.environment} · HTTP service`;
    $("environment").textContent = health.environment;
    $("uptime").textContent = formatUptime(health.uptimeSeconds);
    $("checks-passed").textContent = passed;
    $("checks-foot").textContent = readiness.ready ? "All readiness checks passed" : "One or more checks need attention";
    $("overall-pill").textContent = readiness.ready ? "HEALTHY" : "DEGRADED";
    $("overall-pill").style.background = readiness.ready ? "#e8f8f1" : "#fff5df";
    $("overall-pill").style.color = readiness.ready ? "#16865e" : "#a86b13";
    $("check-list").innerHTML = readiness.checks.map((check) => {
      const warning = check.status !== "pass";
      const symbol = warning ? "!" : "✓";
      const safeName = escapeHtml(check.name);
      const safeDetail = escapeHtml(check.detail);
      return `<div class="check-row">
        <div class="check-symbol ${warning ? "warn" : ""}">${symbol}</div>
        <div class="check-copy"><strong>${safeName}</strong><small>${safeDetail}</small></div>
        <span class="check-badge ${warning ? "warn" : ""}">${warning ? "WARNING" : "PASS"}</span>
      </div>`;
    }).join("");
    $("last-checked").textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch (error) {
    $("service-status").textContent = "Unavailable";
    $("status-foot").textContent = "Could not reach the service";
    $("overall-pill").textContent = "OFFLINE";
    $("overall-pill").style.background = "#fff0f0";
    $("overall-pill").style.color = "#c33f49";
    $("check-list").innerHTML = `<div class="loading-row">Health checks failed: ${escapeHtml(error.message)}</div>`;
  } finally {
    $("refresh").disabled = false;
    $("refresh").style.opacity = "1";
  }
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}
$("refresh").addEventListener("click", refreshDashboard);
refreshDashboard();
setInterval(refreshDashboard, 15000);

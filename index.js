// 🫧🦋 ʀuɴAk — URL Pinger
// A tiny always-on web service that periodically pings a list of URLs
// to keep them "warm" (useful for free-tier hosts that sleep on inactivity).
//
// Configure URLs with numbered environment variables: 1, 2, 3, ...
// Example:
//   1 = https://example1.com
//   2 = https://example2.com
//
// Deploy target: Render.com "Web Service"
// (Render needs an HTTP server bound to $PORT to consider the service healthy,
// so unlike the original Cloudflare Worker version, this runs a persistent
// Node process with an internal timer instead of a cron trigger.)

const PORT = process.env.PORT || 3000;
const PING_INTERVAL_MS = Number(process.env.PING_INTERVAL_MS) || 60 * 1000; // default: every 1 minute

let lastRunResults = [];
let lastRunTime = null;

function getConfiguredUrls() {
  return Object.keys(process.env)
    .filter((key) => /^\d+$/.test(key))
    .sort((a, b) => Number(a) - Number(b))
    .map((key) => process.env[key])
    .filter(Boolean);
}

async function pingAll() {
  const urls = getConfiguredUrls();
  lastRunTime = new Date().toISOString();

  if (urls.length === 0) {
    console.log(`[${lastRunTime}] No URLs configured to ping`);
    lastRunResults = [];
    return;
  }

  const results = await Promise.all(
    urls.map(async (url) => {
      try {
        const response = await fetch(url, { method: "GET" });
        console.log(`[${lastRunTime}] Pinged ${url}: ${response.status}`);
        return { url, status: response.status, ok: response.ok };
      } catch (error) {
        console.error(`[${lastRunTime}] Failed to ping ${url}: ${error.message}`);
        return { url, status: null, ok: false, error: error.message };
      }
    })
  );

  lastRunResults = results;
}

// Run once at startup, then on a fixed interval.
pingAll();
setInterval(pingAll, PING_INTERVAL_MS);

const server = require("http").createServer((req, res) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);

  if (pathname === "/") {
    const urls = getConfiguredUrls();
    const body = {
      name: "🫧🦋 ʀuɴAk — URL Pinger",
      status: "running",
      configuredUrls: urls,
      pingIntervalMs: PING_INTERVAL_MS,
      lastRunTime,
      lastRunResults,
    };
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body, null, 2));
    return;
  }

  if (pathname === "/health") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
});

server.listen(PORT, () => {
  console.log(`🫧🦋 ʀuɴAk URL Pinger listening on port ${PORT}`);
  console.log(`Configured URLs: ${JSON.stringify(getConfiguredUrls())}`);
});

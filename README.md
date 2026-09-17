# 🫧🦋 ʀuɴAk — URL Pinger

A small always-on web service that pings a list of URLs on a timer (default:
every 1 minute) to keep them from going idle/sleeping. Ported from a
Cloudflare Worker version to run as a Render **Web Service**.

## Why it's different from the Cloudflare version

Cloudflare Workers use a `scheduled()` cron trigger — there's no long-running
process. Render's free/standard web services don't have a built-in cron
trigger the same way, but they do stay running and accept HTTP traffic, so
this version runs a normal Node.js server that:

- Starts a `setInterval` loop that pings all configured URLs every
  `PING_INTERVAL_MS` (default `60000` = 1 minute)
- Exposes `/` so you can see the last run's results as JSON
- Exposes `/health` for Render's health check

## Configuration

Set your URLs using **numbered environment variables**, same as before:

| Key | Value |
|-----|-------|
| `1` | First URL to ping |
| `2` | Second URL to ping |
| `3` | Third URL to ping |
| ... | Add as many numbered keys as you want |

Optional:

| Key | Default | Description |
|-----|---------|-------------|
| `PING_INTERVAL_MS` | `60000` | How often to ping, in milliseconds |

## Deploy to Render

### Option A — Blueprint (`render.yaml`), recommended
1. Push this folder to a GitHub/GitLab repo.
2. In the Render dashboard, click **New > Blueprint**, and point it at your repo.
3. Render will read `render.yaml` and set up the web service automatically.
4. Edit the `1`, `2`, ... environment variables (and add more) in the Render
   dashboard under your service's **Environment** tab, then redeploy.

### Option B — Manual Web Service
1. Push this folder to a GitHub/GitLab repo.
2. In the Render dashboard, click **New > Web Service** and connect the repo.
3. Set:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Under **Environment**, add numbered variables (`1`, `2`, `3`, ...) with the
   URLs you want pinged.
5. Deploy.

## Monitoring

- Visit your service's root URL (`/`) to see the currently configured URLs
  and the results of the last ping run, as JSON.
- Check the **Logs** tab in the Render dashboard for a line-by-line ping
  history.

## Notes

- Render's free-tier web services themselves can spin down after inactivity
  from *inbound* traffic, but the internal timer keeps running while the
  instance is up — for a fully "always on" free-tier setup you may still
  want an external uptime checker (e.g. UptimeRobot, cron-job.org) hitting
  this service's own `/health` endpoint every few minutes.

---
credit: Kustbots — original Cloudflare Worker concept
Elevenyts ❤️

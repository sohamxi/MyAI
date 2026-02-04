---
summary: "Access the Control UI dashboard from any system via SSH tunnel"
read_when:
  - The gateway runs on a remote server or VPS
  - You want to use the dashboard from your laptop or another machine
  - You want to avoid exposing the dashboard to the public internet
---
# Dashboard access from any system

When the OpenClaw gateway runs on a **remote server** (e.g. VPS, cloud VM, or another machine on your network), you can access the Control UI dashboard from **any other system** using an SSH tunnel. This keeps the dashboard off the public internet.

## Prerequisites

- Gateway running on the remote host (e.g. via [Docker](/install/docker) or a direct install).
- SSH access to that host from your local machine (`ssh user@host` works).
- Port **18789** (or your configured `gateway.port`) free on your local machine for the tunnel.

## Step 1: Expose the gateway on localhost only (recommended)

So the dashboard is **not** reachable from the internet, bind the gateway port to `127.0.0.1` on the server.

**Docker Compose:** In your compose file, map ports to localhost:

```yaml
ports:
  - "127.0.0.1:18789:18789"
  - "127.0.0.1:18790:18790"
```

Then only SSH tunnel (or local) access can reach the gateway.

**Non-Docker:** Run the gateway with `--bind loopback` so it listens on `127.0.0.1` only.

## Step 2: Create an SSH tunnel from your machine

On the **machine where you want to use the browser** (your laptop, desktop, etc.), run:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@REMOTE_HOST
```

- Replace `user` with your SSH username (e.g. `root`, `ubuntu`).
- Replace `REMOTE_HOST` with the server hostname or IP (e.g. `myserver.example.com`, `72.61.250.194`).
- Use a different local port if 18789 is in use: `-L 9080:127.0.0.1:18789` then open `http://localhost:9080/`.

Leave this terminal open while you use the dashboard. To stop the tunnel, press `Ctrl+C`.

## Step 3: Open the dashboard in your browser

With the tunnel running, open:

```
http://localhost:18789/
```

If you use a token, you can embed it so you do not have to paste it every time:

```
http://localhost:18789/?token=YOUR_GATEWAY_TOKEN
```

The first time you use the token-in-URL, the UI can store it; afterwards `http://localhost:18789/` is enough.

## Step 4: Authenticate (if required)

- If the gateway uses **token** auth: paste the token in **Settings** (gear icon), or use the URL above with `?token=...`.
- If the gateway uses **password** auth: enter the password in the dashboard when prompted.

Token is usually set in `gateway.auth.token` in `~/.openclaw/openclaw.json` on the server, or via `OPENCLAW_GATEWAY_TOKEN` in the environment.

## Summary

| Step | Action |
|------|--------|
| 1 | On server: gateway listening on loopback or Docker ports bound to `127.0.0.1` only |
| 2 | On your machine: `ssh -N -L 18789:127.0.0.1:18789 user@REMOTE_HOST` |
| 3 | In browser: `http://localhost:18789/` or `http://localhost:18789/?token=YOUR_TOKEN` |
| 4 | If prompted: enter token (or password) in dashboard Settings |

## Optional: Docker Compose with Homebrew

For a Docker-based setup that includes Homebrew inside the container and binds the gateway to localhost only, use:

- `Dockerfile.withbrew` – build image with Homebrew.
- `docker-compose.withbrew.yml` – Compose file that uses that image and maps ports to `127.0.0.1`.

From the repo root:

```bash
docker build -f Dockerfile.withbrew -t openclaw:withbrew .
# Set OPENCLAW_IMAGE=openclaw:withbrew and ensure .env has OPENCLAW_CONFIG_DIR, OPENCLAW_WORKSPACE_DIR, etc.
docker compose -f docker-compose.withbrew.yml up -d openclaw-gateway
```

Then from any other system, use the SSH tunnel and browser steps above.

## Retrying skill installs (container stays up)

If some skill installations failed during onboarding (e.g. network timeouts, brew/npm in Docker), you can retry **without restarting the gateway or container**:

1. **From the dashboard**
   - Open the Control UI (via tunnel: `http://localhost:18789/`).
   - Go to **Skills**.
   - For each skill that shows as missing requirements, click **Install** (or the installer label, e.g. "Install via brew").
   - Installs run inside the gateway process; the container stays up.

2. **From the CLI (same config as gateway)**
   - On the server, run the configure wizard for the skills section only (uses the same mounted config, no gateway restart):
     ```bash
     docker compose -f docker-compose.withbrew.yml run --rm --no-TTY openclaw-cli configure --section skills
     ```
   - When prompted, select the skills whose dependencies you want to install.

3. **See which skills are missing**
   - List status and missing requirements:
     ```bash
     docker compose -f docker-compose.withbrew.yml run --rm --no-TTY openclaw-cli skills check
     ```
   - Or run `openclaw doctor` for a broader health check.

If installs keep failing (e.g. timeout), check gateway logs for the exact error. You can set `skills.install.nodeManager` in `~/.openclaw/openclaw.json` to `pnpm` or `bun` if that package manager is available in the container and works better than npm. See [Skills](/tools/skills) and [Skills config](/tools/skills-config).

**Docker with Homebrew:** When using `docker-compose.withbrew.yml`, the Compose file sets `NPM_CONFIG_PREFIX=/home/node/.local` and adds `/home/node/.local/bin` to `PATH` so npm global installs (e.g. clawhub, mcporter) succeed as the node user. It also sets `HOMEBREW_NO_AUTO_UPDATE=1` so brew installs do not hang on updates. The dashboard uses a 5‑minute timeout per skill install; heavy formulas (e.g. ffmpeg) may need that full time. After changing the Compose env, run `docker compose -f docker-compose.withbrew.yml up -d --force-recreate openclaw-gateway` so the gateway picks up the new environment.

## See also

- [Control UI (browser)](/web/control-ui) – features and auth options.
- [Remote access](/gateway/remote) – SSH tunnels and tailnets.
- [Docker](/install/docker) – containerized gateway setup.

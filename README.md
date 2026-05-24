# T.R.A.C.K.E.R.

**S.T.A.L.K.E.R. G.A.M.M.A. real-time stat tracker**

Live dashboard showing kills, deaths, economy, artifacts, companions, location, and run history — updated every 5 seconds while you play.

## Architecture

```
Lua mod → gamma_stats.json → Node.js WS server → React frontend
```

- **Lua mod** — writes JSON every 5s and on kills/deaths/tasks
- **Node.js server** — watches JSON via chokidar, broadcasts over WebSocket
- **React frontend** — connects via WebSocket, hot-updates on every change

## Stack

- Frontend: Vite + React + TypeScript + Recharts
- Server: Bun + ws + chokidar
- Fonts: Chakra Petch + IBM Plex Sans

## Local setup

```bash
# Install deps
bun install

# Run server + client together
bun run dev
```

Copy `stats_tracker.script` into your GAMMA mod folder:
```
C:\GAMMA\mods\Stats Tracker\gamedata\scripts\stats_tracker.script
```

## Remote / Vercel deployment

The frontend can be deployed to Vercel. The Node.js server must run locally on your game PC, exposed via Cloudflare Tunnel.

**Vercel settings:**
- Root directory: `client`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_WS_URL=wss://your-tunnel.trycloudflare.com`

**Cloudflare Tunnel (run on game PC):**
```powershell
winget install Cloudflare.cloudflared
cloudflared tunnel --url http://localhost:3001
```

Set the printed URL (change `https://` → `wss://`) as `VITE_WS_URL` in Vercel.

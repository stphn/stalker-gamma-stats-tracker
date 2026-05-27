# T.R.A.C.K.E.R.

A real-time companion dashboard for **STALKER GAMMA** — displays your current run stats, kill breakdown, economy, and death log as you play.

## How it works

A game-side mod writes stats to a Supabase table on every update. The web app subscribes to real-time Postgres changes and renders them instantly — no polling, no refresh.

```
Game mod → Supabase (postgres) → realtime subscription → browser
```

## Stack

- **React 19 + TypeScript** — UI
- **Vite** — build tooling
- **Supabase** — real-time data transport
- **CSS Modules + custom properties** — fluid, token-based styling (no UI library)
- No charting library — kill donut is hand-rolled SVG

## Features

- Player card: name, faction, rank, reputation, rubles
- Squad companions with HP bars
- Location + in-game clock
- Kill breakdown by faction with SVG donut chart
- Economy panel (earned, spent, artifacts)
- Exploration panel (tasks, stashes, level changes)
- Death log: last 3 runs with stats grid
- Responsive: stats overlay the stage image on desktop, stack below on mobile

## Setup

```bash
cd client
bun install
```

Create `client/.env.local`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-anon-key
```

```bash
bun run dev
```

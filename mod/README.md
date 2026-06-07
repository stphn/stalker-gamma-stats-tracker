# Stats Tracker — game-side mod

The STALKER GAMMA mod that produces the data this dashboard renders. It writes:

- `gamma_stats.json` — the live website feed (session + native PDA + cross-save `alltime`)
- `gamma_persistent.lua` — cross-save persistent state (`alltime`, achievements, run history)

both to `$app_data_root$` → `C:/anomaly/appdata/`.

The Bun ingest server (`../server/`) watches `gamma_stats.json` and pushes it to Supabase;
the client subscribes to realtime changes.

## Layout

```
mod/
  Stats Tracker/
    gamedata/scripts/stats_tracker.script   ← the whole mod (single Lua script)
```

This mirrors a Mod Organizer 2 mod folder, so it's deploy-ready.

## Deploy

Copy the `Stats Tracker/` folder into your MO2 mods directory and enable it:

```
C:\GAMMA\mods\Stats Tracker\gamedata\scripts\stats_tracker.script
```

(or your install's equivalent `…\mods\` path), then enable it in Mod Organizer.

## Source of truth

**This repo copy is canonical.** The file at `C:\GAMMA\mods\…` is a deployed copy — keep
the two in sync when editing (edit here, copy out; or edit there, copy back before
committing). The mod runs inside Anomaly's restricted Lua sandbox: `io.*` is available but
**`os.remove` is not** (only `os.time`/`os.clock`), so file ops must use `io`.

Keep the copies in sync with the helper (`scripts/sync-mod.mjs`):

```
npm run sync:mod          # deploy: repo → GAMMA install (restart the game to reload)
npm run sync:mod:pull     # pull:   GAMMA install → repo (then review + commit)
npm run sync:mod:check    # compare the two, non-zero exit on drift
```

The install path defaults to `C:/GAMMA/mods`; override with the `GAMMA_MODS` env var.

## Reset

Career totals never reset on death/new game (they're cross-save, per install). To wipe
them to a true zero, drop an (empty) `gamma_reset.flag` in `C:/anomaly/appdata/` and load a
save — the next `load_state` zeroes `alltime` without reseeding from native stats, then
stamps the flag `done` (one-shot). Re-empty/recreate the flag to reset again.

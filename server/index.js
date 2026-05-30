const { createClient } = require('@supabase/supabase-js')
const chokidar = require('chokidar')
const fs = require('fs')

const STATS_FILE   = process.env.STATS_FILE   || 'C:/anomaly/appdata/gamma_stats.json'
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_KEY — copy server/.env.example to server/.env and fill in your values.')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

function readStats() {
    try { return JSON.parse(fs.readFileSync(STATS_FILE, 'utf8')) }
    catch { return null }
}

async function push() {
    const data = readStats()
    if (!data) return

    const { error } = await supabase
        .from('stats')
        .upsert({ id: 'live', data, updated_at: new Date().toISOString() })
    if (error) console.error('Supabase upsert error:', error.message)
    else console.log('[push]', new Date().toLocaleTimeString())

    // Upsert last_run entries into the dedicated runs table.
    // Only map columns that exist in the schema; extras (deaths, items, etc.) stay in the blob.
    const last_run = Array.isArray(data.last_run) ? data.last_run : []
    if (last_run.length === 0) return

    const rows = last_run.map((r) => ({
        start:               r.start,
        playtime:            r.playtime          ?? null,
        kills:               r.kills             ?? null,
        rubles_earned:       r.rubles_earned      ?? null,
        artifacts:           r.artifacts         ?? null,
        tasks:               r.tasks             ?? null,
        stashes:             r.stashes           ?? null,
        death_location:      r.death_location     ?? null,
        death_location_name: r.death_location_name ?? null,
    }))

    const { error: runsError } = await supabase
        .from('runs')
        .upsert(rows, { onConflict: 'start' })
    if (runsError) console.error('Runs upsert error:', runsError.message)
}

chokidar
    .watch(STATS_FILE, { persistent: true, awaitWriteFinish: { stabilityThreshold: 80, pollInterval: 40 } })
    .on('add',    () => { console.log('Watching:', STATS_FILE); push() })
    .on('change', push)

console.log('Stralker → Supabase Realtime')
console.log('Project:', SUPABASE_URL)

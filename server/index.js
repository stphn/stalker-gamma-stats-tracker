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

// The game writes Windows-125x bytes for "smart" punctuation — e.g. the curly
// apostrophe (U+2019) is a single byte 0x92, which is invalid UTF-8 and becomes
// U+FFFD (the lost character) if read as 'utf8'. We read byte-preserving
// (latin1) and remap the CP1252 C1 range (0x80-0x9F: Western smart quotes,
// dashes, the ellipsis) to proper Unicode. ASCII and 0xA0-0xFF already match
// latin1, so only this range needs fixing. Indexed by (byte - 0x80); the five
// code points CP1252 leaves undefined are � here and pass through unchanged.
const CP1252_C1 =
    '€�‚ƒ„…†‡' +
    'ˆ‰Š‹Œ�Ž�' +
    '�‘’“”•–—' +
    '˜™š›œ�žŸ'

function fixEncoding(s) {
    return s.replace(/[\u0080-\u009f]/g, (c) => {
        const r = CP1252_C1[c.charCodeAt(0) - 0x80]
        return r === '�' ? c : r
    })
}

function readStats() {
    try { return JSON.parse(fixEncoding(fs.readFileSync(STATS_FILE, 'latin1'))) }
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
        playtime:            r.playtime           ?? null,
        kills:               r.kills              ?? null,
        rubles_earned:       r.rubles_earned       ?? null,
        artifacts:           r.artifacts          ?? null,
        tasks:               r.tasks              ?? null,
        stashes:             r.stashes            ?? null,
        items:               r.items              ?? null,
        death_location:      r.death_location      ?? null,
        death_location_name: r.death_location_name ?? null,
        death_pos_x:         r.death_pos_x         ?? null,
        death_pos_z:         r.death_pos_z         ?? null,
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

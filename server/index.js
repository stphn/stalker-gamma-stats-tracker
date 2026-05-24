const express = require('express')
const cors    = require('cors')
const { WebSocketServer } = require('ws')
const chokidar = require('chokidar')
const fs   = require('fs')
const http = require('http')

const STATS_FILE = process.env.STATS_FILE || 'C:/anomaly/appdata/gamma_stats.json'
const PORT       = process.env.PORT || 3001

const app    = express()
const server = http.createServer(app)
const wss    = new WebSocketServer({ server })

app.use(cors())

function readStats() {
    try {
        return JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'))
    } catch {
        return null
    }
}

function broadcast(data) {
    const msg = JSON.stringify(data)
    wss.clients.forEach(ws => {
        if (ws.readyState === 1) ws.send(msg)
    })
}

// REST: initial load fallback
app.get('/stats', (req, res) => {
    const stats = readStats()
    if (!stats) return res.status(404).json({ error: 'Stats file not found — is STALKER running?' })
    res.json(stats)
})

// WebSocket: push current stats on connect, then on every file change
wss.on('connection', ws => {
    const stats = readStats()
    if (stats) ws.send(JSON.stringify(stats))
})

chokidar
    .watch(STATS_FILE, { persistent: true, awaitWriteFinish: { stabilityThreshold: 150 } })
    .on('add',    () => console.log('Stats file found:', STATS_FILE))
    .on('change', () => { const s = readStats(); if (s) broadcast(s) })

server.listen(PORT, () => {
    console.log(`Stralker server → http://localhost:${PORT}`)
    console.log(`Watching         → ${STATS_FILE}`)
})

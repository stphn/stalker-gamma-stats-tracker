const express = require('express')
const cors    = require('cors')
const { WebSocketServer } = require('ws')
const chokidar = require('chokidar')
const fs   = require('fs')
const http = require('http')
const https = require('https')

const STATS_FILE = process.env.STATS_FILE || 'C:/anomaly/appdata/gamma_stats.json'
const PORT       = process.env.PORT || 3001
const CERT_CRT   = process.env.TLS_CERT || 'C:/Users/sgoeu/greybox3090.tail77f472.ts.net.crt'
const CERT_KEY   = process.env.TLS_KEY  || 'C:/Users/sgoeu/greybox3090.tail77f472.ts.net.key'

const app    = express()
const tlsAvailable = fs.existsSync(CERT_CRT) && fs.existsSync(CERT_KEY)
const server = tlsAvailable
    ? https.createServer({ cert: fs.readFileSync(CERT_CRT), key: fs.readFileSync(CERT_KEY) }, app)
    : http.createServer(app)
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
    const proto = tlsAvailable ? 'https' : 'http'
    console.log(`Stralker server → ${proto}://localhost:${PORT}`)
    console.log(`TLS              → ${tlsAvailable ? 'yes (WSS)' : 'no (WS)'}`)
    console.log(`Watching         → ${STATS_FILE}`)
})

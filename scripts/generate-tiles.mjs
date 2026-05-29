/**
 * Generate XYZ map tiles for the TRACKER minimap.
 *
 * Coordinate system:
 *   World: 1024 × 2634 units (from map-levels.json rawRect space)
 *   Tile (Z, X, Y) covers world [X*WU, (X+1)*WU] × [Y*WU, (Y+1)*WU]
 *   where WU = 1024 / 2^Z  (same unit for both axes → square tiles)
 *
 * Output:
 *   client/public/tiles/{z}/{x}/{y}.jpg   — global background (Z=2,3,4)
 *   client/public/tiles/{z}/{x}/{y}.png   — level detail overlay (Z=4,5), transparent
 *   client/public/tiles/meta.json
 *
 * Usage: node scripts/generate-tiles.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const ROOT    = join(dirname(fileURLToPath(import.meta.url)), '..');
const MAPS    = join(ROOT, 'client', 'public', 'maps');
const OUT     = join(ROOT, 'client', 'public', 'tiles');
const LEVELS  = JSON.parse(readFileSync(join(ROOT, 'client', 'src', 'data', 'map-levels.json'), 'utf8'));

const WORLD_W   = 1024;
const WORLD_H   = 2634;
const TILE_SIZE = 256;
const CONCURRENCY = 12;

// World units per tile at zoom Z (X axis; same for Y since 1 WU = same CSS pixels in both axes)
const tileWU   = z => WORLD_W / Math.pow(2, z);
// Grid dimensions
const tileCols = z => Math.pow(2, z);
const tileRows = z => Math.ceil(WORLD_H / tileWU(z));

const GLOBAL_ZOOMS = [2, 3, 4];     // JPG background tiles
const LEVEL_ZOOMS  = [4, 5, 6];    // PNG transparent detail tiles

async function runPool(tasks) {
  let i = 0;
  async function worker() {
    while (i < tasks.length) await tasks[i++]();
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
}

async function writeTile(pipeline, z, x, y, fmt) {
  const dir = join(OUT, String(z), String(x));
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const pipe = fmt === 'jpg'
    ? pipeline.jpeg({ quality: 82, mozjpeg: true })
    : pipeline.png({ compressionLevel: 7 });
  await pipe.toFile(join(dir, `${y}.${fmt}`));
}

// ── Pass 1: Global background tiles ──────────────────────────────────────────
console.log('=== Pass 1: Global tiles ===');

const globalPath = join(MAPS, 'global.png');
const { width: gw, height: gh } = await sharp(globalPath).metadata();
console.log(`  global.png: ${gw}×${gh}`);

for (const Z of GLOBAL_ZOOMS) {
  const WU   = tileWU(Z);
  const cols = tileCols(Z);
  const rows = tileRows(Z);
  const tasks = [];

  for (let X = 0; X < cols; X++) {
    for (let Y = 0; Y < rows; Y++) {
      tasks.push(async () => {
        const srcLeft = Math.round(X * WU / WORLD_W * gw);
        const srcTop  = Math.round(Y * WU / WORLD_H * gh);
        const srcW    = Math.min(Math.round(WU / WORLD_W * gw), gw - srcLeft);
        const srcH    = Math.min(Math.round(WU / WORLD_H * gh), gh - srcTop);
        if (srcLeft >= gw || srcTop >= gh || srcW < 1 || srcH < 1) return;
        const pipeline = sharp(globalPath)
          .extract({ left: srcLeft, top: srcTop, width: srcW, height: srcH })
          .resize(TILE_SIZE, TILE_SIZE, { fit: 'fill' });
        await writeTile(pipeline, Z, X, Y, 'jpg');
      });
    }
  }

  await runPool(tasks);
  const written = tasks.length;
  console.log(`  Z=${Z}: ${cols}×${rows} = ${written} tiles`);
}

// ── Pass 2: Level detail overlay tiles ───────────────────────────────────────
console.log('\n=== Pass 2: Level detail tiles ===');

const surface = LEVELS.levels.filter(l => !l.underground && l.rawRect);

for (const Z of LEVEL_ZOOMS) {
  const WU    = tileWU(Z);
  const tasks = [];
  let   count = 0;

  for (const level of surface) {
    const src = join(MAPS, `${level.id}.png`);
    if (!existsSync(src)) { console.log(`  SKIP ${level.id}`); continue; }

    const { width: lw, height: lh } = await sharp(src).metadata();
    const rr = level.rawRect;

    const txMin = Math.max(0, Math.floor(rr.x1 / WU));
    const txMax = Math.min(tileCols(Z) - 1, Math.floor((rr.x2 - 1e-9) / WU));
    const tyMin = Math.max(0, Math.floor(rr.y1 / WU));
    const tyMax = Math.min(tileRows(Z) - 1, Math.floor((rr.y2 - 1e-9) / WU));

    for (let X = txMin; X <= txMax; X++) {
      for (let Y = tyMin; Y <= tyMax; Y++) {
        const tileX1 = X * WU, tileX2 = (X + 1) * WU;
        const tileY1 = Y * WU, tileY2 = (Y + 1) * WU;

        // Tile↔rawRect intersection in world units
        const ox1 = Math.max(tileX1, rr.x1), ox2 = Math.min(tileX2, rr.x2);
        const oy1 = Math.max(tileY1, rr.y1), oy2 = Math.min(tileY2, rr.y2);
        if (ox2 <= ox1 || oy2 <= oy1) continue;

        // Destination within the 256×256 tile (pixels)
        const destX = Math.round((ox1 - tileX1) / WU * TILE_SIZE);
        const destY = Math.round((oy1 - tileY1) / WU * TILE_SIZE);
        const destW = Math.max(1, Math.round((ox2 - ox1) / WU * TILE_SIZE));
        const destH = Math.max(1, Math.round((oy2 - oy1) / WU * TILE_SIZE));

        // Source pixels in the level image
        const srcX = Math.round((ox1 - rr.x1) / (rr.x2 - rr.x1) * lw);
        const srcY = Math.round((oy1 - rr.y1) / (rr.y2 - rr.y1) * lh);
        const srcW = Math.max(1, Math.round((ox2 - ox1) / (rr.x2 - rr.x1) * lw));
        const srcH = Math.max(1, Math.round((oy2 - oy1) / (rr.y2 - rr.y1) * lh));

        count++;
        tasks.push(async () => {
          const overlay = await sharp(src)
            .extract({ left: Math.min(srcX, lw-1), top: Math.min(srcY, lh-1),
                       width: Math.min(srcW, lw-srcX), height: Math.min(srcH, lh-srcY) })
            .resize(destW, destH, { fit: 'fill' })
            .png()
            .toBuffer();

          const pipeline = sharp({
            create: { width: TILE_SIZE, height: TILE_SIZE, channels: 4,
                      background: { r: 0, g: 0, b: 0, alpha: 0 } },
          }).composite([{ input: overlay, left: destX, top: destY }]);

          await writeTile(pipeline, Z, X, Y, 'png');
        });
      }
    }
  }

  await runPool(tasks);
  console.log(`  Z=${Z}: ${count} level tiles written`);
}

// ── Metadata ─────────────────────────────────────────────────────────────────
writeFileSync(join(OUT, 'meta.json'), JSON.stringify({
  tileSize:    TILE_SIZE,
  worldW:      WORLD_W,
  worldH:      WORLD_H,
  globalZooms: GLOBAL_ZOOMS,
  levelZooms:  LEVEL_ZOOMS,
}, null, 2));

console.log('\nDone! Tiles written to client/public/tiles/');

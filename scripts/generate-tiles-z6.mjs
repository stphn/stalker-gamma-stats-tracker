/**
 * One-shot: generate Z=6 level detail tiles only.
 * Run this after generate-tiles.mjs has already produced Z=2-5.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const ROOT   = join(dirname(fileURLToPath(import.meta.url)), '..');
const MAPS   = join(ROOT, 'client', 'public', 'maps');
const OUT    = join(ROOT, 'client', 'public', 'tiles');
const LEVELS = JSON.parse(readFileSync(join(ROOT, 'client', 'src', 'data', 'map-levels.json'), 'utf8'));

const WORLD_W   = 1024;
const WORLD_H   = 2634;
const TILE_SIZE = 256;
const CONCURRENCY = 12;

const Z    = 6;
const WU   = WORLD_W / Math.pow(2, Z);       // = 16 world units per tile
const COLS = Math.pow(2, Z);                   // = 64
const ROWS = Math.ceil(WORLD_H / WU);          // = 165

async function runPool(tasks) {
  let i = 0;
  async function worker() { while (i < tasks.length) await tasks[i++](); }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
}

const surface = LEVELS.levels.filter(l => !l.underground && l.rawRect);
const tasks = [];
let count = 0;

for (const level of surface) {
  const src = join(MAPS, `${level.id}.png`);
  if (!existsSync(src)) { console.log(`SKIP ${level.id}`); continue; }

  const { width: lw, height: lh } = await sharp(src).metadata();
  const rr = level.rawRect;

  const txMin = Math.max(0,       Math.floor(rr.x1 / WU));
  const txMax = Math.min(COLS-1,  Math.floor((rr.x2 - 1e-9) / WU));
  const tyMin = Math.max(0,       Math.floor(rr.y1 / WU));
  const tyMax = Math.min(ROWS-1,  Math.floor((rr.y2 - 1e-9) / WU));

  for (let X = txMin; X <= txMax; X++) {
    for (let Y = tyMin; Y <= tyMax; Y++) {
      const tileX1 = X * WU, tileX2 = (X + 1) * WU;
      const tileY1 = Y * WU, tileY2 = (Y + 1) * WU;

      const ox1 = Math.max(tileX1, rr.x1), ox2 = Math.min(tileX2, rr.x2);
      const oy1 = Math.max(tileY1, rr.y1), oy2 = Math.min(tileY2, rr.y2);
      if (ox2 <= ox1 || oy2 <= oy1) continue;

      const destX = Math.round((ox1 - tileX1) / WU * TILE_SIZE);
      const destY = Math.round((oy1 - tileY1) / WU * TILE_SIZE);
      const destW = Math.max(1, Math.round((ox2 - ox1) / WU * TILE_SIZE));
      const destH = Math.max(1, Math.round((oy2 - oy1) / WU * TILE_SIZE));

      const srcX = Math.round((ox1 - rr.x1) / (rr.x2 - rr.x1) * lw);
      const srcY = Math.round((oy1 - rr.y1) / (rr.y2 - rr.y1) * lh);
      const srcW = Math.max(1, Math.min(Math.round((ox2 - ox1) / (rr.x2 - rr.x1) * lw), lw - srcX));
      const srcH = Math.max(1, Math.min(Math.round((oy2 - oy1) / (rr.y2 - rr.y1) * lh), lh - srcY));

      count++;
      tasks.push(async () => {
        const overlay = await sharp(src)
          .extract({ left: Math.min(srcX, lw-1), top: Math.min(srcY, lh-1), width: srcW, height: srcH })
          .resize(destW, destH, { fit: 'fill' })
          .png()
          .toBuffer();

        const dir = join(OUT, String(Z), String(X));
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

        await sharp({
          create: { width: TILE_SIZE, height: TILE_SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
        })
          .composite([{ input: overlay, left: destX, top: destY }])
          .png({ compressionLevel: 7 })
          .toFile(join(dir, `${Y}.png`));
      });
    }
  }
}

console.log(`Generating ${count} Z=6 tiles with concurrency ${CONCURRENCY}...`);
await runPool(tasks);

// Update metadata
const metaPath = join(OUT, 'meta.json');
const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
meta.levelZooms = [4, 5, 6];
writeFileSync(metaPath, JSON.stringify(meta, null, 2));

console.log(`Done — ${count} Z=6 tiles written.`);

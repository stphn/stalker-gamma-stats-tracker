/**
 * Upscale low-res level maps 4× with Lanczos + light sharpen (preserves
 * terrain grain), then regenerate Z=4/5/6 tiles for those levels.
 *
 * Note: tried the Qualcomm Real-ESRGAN ONNX model — it denoises terrain
 * into mush, removing the grain that makes these maps readable. Lanczos
 * keeps the texture and is sharper for satellite-style imagery.
 *
 * Usage: node scripts/upscale-maps.mjs
 */

import { existsSync, mkdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const ROOT   = join(dirname(fileURLToPath(import.meta.url)), '..');
const MAPS   = join(ROOT, 'client', 'public', 'maps');
const TILES  = join(ROOT, 'client', 'public', 'tiles');
const LEVELS = JSON.parse(readFileSync(join(ROOT, 'client', 'src', 'data', 'map-levels.json'), 'utf8'));

console.log('Upscaling with Lanczos 4× + sharpen (preserves grain, alpha kept)');

// Maps that need upscaling (shorter dimension < 2048px)
const NEEDS_UPSCALE = [
  'l11_hospital',   // 512×1024
  'l05_bar',        // 1024×2048
  'l06_rostok',     // 1024×2048
  'l04_darkvalley', // 1024×2048
  'l10_limansk',    // 1024×2048
  'l12_stancia',    // 2048×1024
  'l12_stancia_2',  // 2048×1024
];

const SCALE = 4;

// ── Lanczos 4× upscale, preserving alpha & terrain grain ──────────────────
async function upscaleImage(srcPath, dstPath) {
  const { width: w, height: h, hasAlpha } = await sharp(srcPath).metadata();
  const ow = w * SCALE, oh = h * SCALE;
  console.log(`  Input: ${w}×${h} → ${ow}×${oh}`);

  // Upscale RGB with Lanczos + light unsharp mask to recover crispness.
  // Process RGB and alpha separately so the sharpen never bleeds into the
  // transparency mask (which would create halos along the level boundary).
  const rgb = await sharp(srcPath)
    .removeAlpha()
    .resize(ow, oh, { kernel: 'lanczos3' })
    .sharpen({ sigma: 1.0, m1: 0.8, m2: 0.4 })
    .removeAlpha()
    .raw()
    .toBuffer();

  let pipeline;
  if (hasAlpha) {
    // Nearest-neighbour keeps the mask edge hard — no semi-transparent fringe
    const alpha = await sharp(srcPath)
      .extractChannel(3)
      .resize(ow, oh, { kernel: 'nearest' })
      .raw()
      .toBuffer();
    pipeline = sharp(rgb, { raw: { width: ow, height: oh, channels: 3 } })
      .joinChannel(alpha, { raw: { width: ow, height: oh, channels: 1 } });
  } else {
    pipeline = sharp(rgb, { raw: { width: ow, height: oh, channels: 3 } });
  }

  await pipeline.png({ compressionLevel: 7 }).toFile(dstPath);
  console.log(`  ✓ Output: ${ow}×${oh}${hasAlpha ? ' (alpha preserved)' : ''}`);
}

// ── Tile generation ────────────────────────────────────────────────────────
const WORLD_W = 1024, WORLD_H = 2634, TILE_SIZE = 256, CONCURRENCY = 12;
const tileWU   = z => WORLD_W / 2 ** z;
const tileCols = z => 2 ** z;
const tileRows = z => Math.ceil(WORLD_H / tileWU(z));

async function runPool(tasks) {
  let i = 0;
  async function worker() { while (i < tasks.length) await tasks[i++](); }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
}

async function retile(levelId, upscaledPath) {
  const level = LEVELS.levels.find(l => l.id === levelId);
  if (!level) { console.log(`  Skipping tiles — ${levelId} not in map-levels.json`); return; }

  const { width: lw, height: lh } = await sharp(upscaledPath).metadata();
  const rr = level.rawRect;

  for (const Z of [4, 5, 6]) {
    const WU = tileWU(Z);
    const tasks = [];
    const txMin = Math.max(0,            Math.floor(rr.x1 / WU));
    const txMax = Math.min(tileCols(Z)-1, Math.floor((rr.x2 - 1e-9) / WU));
    const tyMin = Math.max(0,            Math.floor(rr.y1 / WU));
    const tyMax = Math.min(tileRows(Z)-1, Math.floor((rr.y2 - 1e-9) / WU));

    for (let X = txMin; X <= txMax; X++) {
      for (let Y = tyMin; Y <= tyMax; Y++) {
        const ox1 = Math.max(X*WU,     rr.x1), ox2 = Math.min((X+1)*WU, rr.x2);
        const oy1 = Math.max(Y*WU,     rr.y1), oy2 = Math.min((Y+1)*WU, rr.y2);
        if (ox2 <= ox1 || oy2 <= oy1) continue;

        const dX = Math.round((ox1-X*WU)/WU*TILE_SIZE);
        const dY = Math.round((oy1-Y*WU)/WU*TILE_SIZE);
        const dW = Math.max(1, Math.round((ox2-ox1)/WU*TILE_SIZE));
        const dH = Math.max(1, Math.round((oy2-oy1)/WU*TILE_SIZE));
        const sX = Math.round((ox1-rr.x1)/(rr.x2-rr.x1)*lw);
        const sY = Math.round((oy1-rr.y1)/(rr.y2-rr.y1)*lh);
        const sW = Math.max(1, Math.min(Math.round((ox2-ox1)/(rr.x2-rr.x1)*lw), lw-sX));
        const sH = Math.max(1, Math.min(Math.round((oy2-oy1)/(rr.y2-rr.y1)*lh), lh-sY));

        tasks.push(async () => {
          const overlay = await sharp(upscaledPath)
            .extract({ left: Math.min(sX,lw-1), top: Math.min(sY,lh-1), width: sW, height: sH })
            .resize(dW, dH, { fit: 'fill' }).png().toBuffer();

          const dir = join(TILES, String(Z), String(X));
          if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
          await sharp({ create: { width: TILE_SIZE, height: TILE_SIZE, channels: 4,
                                  background: { r:0,g:0,b:0,alpha:0 } } })
            .composite([{ input: overlay, left: dX, top: dY }])
            .png({ compressionLevel: 7 })
            .toFile(join(dir, `${Y}.png`));
        });
      }
    }
    await runPool(tasks);
    console.log(`  Z=${Z}: ${tasks.length} tiles`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────
for (const levelId of NEEDS_UPSCALE) {
  const src      = join(MAPS, `${levelId}.png`);
  const upscaled = join(MAPS, `${levelId}-up.png`);

  if (!existsSync(src)) { console.log(`\nSKIP ${levelId} — source not found`); continue; }

  console.log(`\n── ${levelId} ──`);

  if (!existsSync(upscaled)) {
    await upscaleImage(src, upscaled);
  } else {
    const m = await sharp(upscaled).metadata();
    console.log(`  Upscaled PNG exists (${m.width}×${m.height}), skipping inference`);
  }

  await retile(levelId, upscaled);
}

console.log('\n✓ Done — hard-refresh the browser (Ctrl+Shift+R) to see updated tiles.');

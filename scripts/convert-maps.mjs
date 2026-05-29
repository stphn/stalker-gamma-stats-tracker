/**
 * Convert STALKER GAMMA map DDS textures to PNG for the minimap.
 *
 * Sources (in priority order, matching MO2 load order):
 *   1. C:/GAMMA/mods/26- High Res PDA Maps - Bazingarrey/gamedata/textures/map/
 *   2. C:/GAMMA/mods/358- Global Map Rework - DeadEnvoy/gamedata/textures/map/
 *
 * Output: client/public/maps/{levelId}.png   (full-res per-level overlay)
 *         client/public/maps/global.png       (full-res global, archival)
 *         client/public/maps/global-web.jpg   (2048px backdrop the app loads)
 *
 * Usage: node scripts/convert-maps.mjs
 * Requires: parse-dds, decode-dxt, sharp  (devDependencies in stralker root)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
const parseDDS = require('parse-dds');
const decodeDXT = require('decode-dxt');

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const OUT  = join(ROOT, 'client', 'public', 'maps');

const MOD_HIGH_RES = 'C:/GAMMA/mods/26- High Res PDA Maps - Bazingarrey/gamedata/textures';
const MOD_REWORK   = 'C:/GAMMA/mods/358- Global Map Rework - DeadEnvoy/gamedata/textures';

// level.name() → DDS base name (without extension)
const LEVEL_MAP = {
  l01_escape:           'map_escape',
  l02_garbage:          'map_garbage',
  l03_agroprom:         'map_agroprom',
  l04_darkvalley:       'map_l04_darkvalley',
  l05_bar:              'map_l05_bar',
  l06_rostok:           'map_l06_rostok',
  l07_military:         'map_l07_military',
  l08_yantar:           'map_l08_yantar',
  l09_deadcity:         'map_l09_deadcity',
  l10_limansk:          'map_limansk',
  l10_radar:            'map_l10_radar',
  l10_red_forest:       'map_red_forest',
  l11_hospital:         'map_hospital',
  l11_pripyat:          'map_l11_pripyat',
  l12_stancia:          'map_aes_1',
  l12_stancia_2:        'map_aes_2',
  l13_generators:       'map_l13_generators',
  jupiter:              'map_jupiter',
  k00_marsh:            'map_marsh',
  k01_darkscape:        'map_k01_darkscape',
  k02_trucks_cemetery:  'map_k02_trucks_cemetery',
  pripyat:              'map_pripyat',
  zaton:                'map_zaton',
  y04_pole:             'map_y04_pole',
};

function findDDS(subdir, name) {
  for (const base of [MOD_HIGH_RES, MOD_REWORK]) {
    const p = join(base, subdir, name + '.dds').replace(/\//g, '\\');
    if (existsSync(p)) return p;
  }
  return null;
}

function decodeDDSFile(path) {
  const buf = readFileSync(path);
  const ab  = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  const info = parseDDS(ab);
  const img  = info.images[0];
  const w = img.shape[0], h = img.shape[1];
  const view = new DataView(ab, img.offset, img.length);
  const rgba = decodeDXT(view, w, h, info.format);
  return { width: w, height: h, data: Buffer.from(rgba.buffer, rgba.byteOffset, rgba.byteLength) };
}

mkdirSync(OUT, { recursive: true });

// Per-level maps
for (const [levelId, ddsName] of Object.entries(LEVEL_MAP)) {
  const src = findDDS('map', ddsName);
  if (!src) { console.log(`  SKIP  ${levelId} — ${ddsName}.dds not found`); continue; }

  process.stdout.write(`  ${levelId.padEnd(24)} → `);
  const { width, height, data } = decodeDDSFile(src);
  const outPath = join(OUT, `${levelId}.png`);
  await sharp(data, { raw: { width, height, channels: 4 } }).png({ compressionLevel: 6 }).toFile(outPath);
  console.log(`${width}×${height}  ${outPath.split('\\').pop()}`);
}

// Global map (ui_global_map)
const globalSrc = findDDS('ui', 'ui_global_map');
if (globalSrc) {
  process.stdout.write(`  ${'global'.padEnd(24)} → `);
  const { width, height, data } = decodeDDSFile(globalSrc);
  const rgba = sharp(data, { raw: { width, height, channels: 4 } });
  await rgba.clone().png({ compressionLevel: 6 }).toFile(join(OUT, 'global.png'));
  // Downscaled backdrop the app actually loads (the 4096px PNG is too heavy).
  // 2048-wide JPG is plenty — it only shows as context behind the full-res
  // current-level overlay.
  await rgba.clone()
    .resize(2048, null, { kernel: 'lanczos3' })
    .flatten({ background: '#0c0e0d' })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(join(OUT, 'global-web.jpg'));
  console.log(`${width}×${height}  global.png + global-web.jpg`);
} else {
  console.log('  SKIP  global map — ui_global_map.dds not found');
}

console.log('\nDone. PNGs written to client/public/maps/');

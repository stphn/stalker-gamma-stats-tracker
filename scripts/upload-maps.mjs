/**
 * Upload generated map images to a public Supabase Storage bucket so the
 * deployed app can serve them (client/public/maps/ is gitignored).
 *
 * Reads from server/.env:
 *   SUPABASE_URL         — project URL
 *   SUPABASE_SECRET_KEY  — secret/service key (sb_secret_… or service_role JWT).
 *                          Required: the publishable key cannot write Storage.
 *                          Get it from Supabase → Settings → API keys.
 *
 * Uploads client/public/maps/*.png + global-web.jpg (skips the 44MB archival
 * global.png, which the app never loads).
 *
 * After uploading, set the client's VITE_MAPS_BASE_URL to:
 *   <SUPABASE_URL>/storage/v1/object/public/maps
 *
 * Usage: node scripts/upload-maps.mjs
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MAPS = join(ROOT, 'client', 'public', 'maps');
const BUCKET = 'maps';

// --- env (from server/.env) ---
const env = Object.fromEntries(
  readFileSync(join(ROOT, 'server', '.env'), 'utf8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)]; }),
);

const URL = env.SUPABASE_URL;
// Prefer a write-capable secret key; fall back to the publishable key, which
// only works if the bucket has an RLS policy allowing anon inserts.
const KEY = env.SUPABASE_SECRET_KEY || env.SUPABASE_KEY;
const USING_SECRET = !!env.SUPABASE_SECRET_KEY;

if (!URL || !KEY) {
  console.error('Missing SUPABASE_URL / key in server/.env');
  process.exit(1);
}
console.log(USING_SECRET
  ? 'Using secret key (full Storage write access)'
  : 'Using publishable key (will only work if the bucket allows anon insert)');

const supabase = createClient(URL, KEY, { auth: { persistSession: false } });

// --- ensure public bucket (best-effort; may already exist or need dashboard) ---
const { data: buckets } = await supabase.storage.listBuckets();
if (buckets?.some(b => b.name === BUCKET)) {
  console.log(`Bucket "${BUCKET}" exists`);
} else {
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: '50MB',
  });
  if (error) {
    console.warn(`Could not create bucket ("${error.message}") — will try uploading anyway`);
    console.warn(`If uploads fail, create a PUBLIC bucket named "${BUCKET}" in the dashboard first.`);
  } else {
    console.log(`Created public bucket "${BUCKET}"`);
  }
}

// --- files to upload ---
const files = readdirSync(MAPS).filter(f =>
  (f.endsWith('.png') && f !== 'global.png') || f === 'global-web.jpg',
);

console.log(`Uploading ${files.length} files...`);
let ok = 0;
for (const f of files) {
  const body = readFileSync(join(MAPS, f));
  const contentType = f.endsWith('.jpg') ? 'image/jpeg' : 'image/png';
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(f, body, { contentType, upsert: true });
  if (error) { console.error(`  ✗ ${f}: ${error.message}`); continue; }
  ok++;
  process.stdout.write(`  ✓ ${ok}/${files.length}\r`);
}

console.log(`\nDone — ${ok}/${files.length} uploaded.`);
console.log(`Public base URL:\n  ${URL}/storage/v1/object/public/${BUCKET}`);
console.log('Set client VITE_MAPS_BASE_URL to that, then rebuild the client.');

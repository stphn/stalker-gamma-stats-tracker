/**
 * Sync the game-side Stats Tracker mod between this repo (canonical) and the
 * deployed GAMMA install. The mod is one Lua script kept in two places:
 *
 *   repo:    mod/Stats Tracker/gamedata/scripts/stats_tracker.script   (source of truth)
 *   install: <GAMMA_MODS>/Stats Tracker/gamedata/scripts/stats_tracker.script
 *
 * The install path defaults to C:/GAMMA/mods; override with the GAMMA_MODS env var.
 *
 * Usage:
 *   node scripts/sync-mod.mjs            deploy  — copy repo → install (push your edits to the game)
 *   node scripts/sync-mod.mjs pull       pull    — copy install → repo (bring live edits back)
 *   node scripts/sync-mod.mjs check      check   — compare the two, report drift (exit 1 if they differ)
 *
 *   GAMMA_MODS="D:/Anomaly/mods" node scripts/sync-mod.mjs
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REL = join('Stats Tracker', 'gamedata', 'scripts', 'stats_tracker.script');

const REPO = join(ROOT, 'mod', REL);
const INSTALL_MODS = process.env.GAMMA_MODS || 'C:/GAMMA/mods';
const INSTALL = join(INSTALL_MODS, REL);

const mode = (() => {
  const a = process.argv.slice(2).map(s => s.toLowerCase());
  if (a.some(s => ['pull', '--pull', '--in'].includes(s))) return 'pull';
  if (a.some(s => ['check', '--check', 'diff', '--diff'].includes(s))) return 'check';
  return 'deploy';
})();

// Normalise CRLF → LF so line-ending differences (git autocrlf vs. the install)
// don't read as real drift.
const norm = p => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

function copy(from, to, fromLabel, toLabel) {
  if (!existsSync(from)) {
    console.error(`✗ source not found (${fromLabel}):\n  ${from}`);
    process.exit(1);
  }
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
  console.log(`✓ ${fromLabel} → ${toLabel}`);
  console.log(`  ${from}\n  → ${to} (${statSync(to).size} bytes)`);
}

console.log(`repo:    ${REPO}`);
console.log(`install: ${INSTALL}\n`);

if (mode === 'check') {
  if (!existsSync(REPO)) {
    console.error(`✗ repo copy missing:\n  ${REPO}`);
    process.exit(1);
  }
  // The install is environment-specific (absent on clones / CI), so treat it as
  // a skip rather than a failure — keeps this usable as a portable git hook.
  if (!existsSync(INSTALL)) {
    console.log(`• install not present — skipping drift check\n  ${INSTALL}`);
    process.exit(0);
  }
  const same = norm(REPO) === norm(INSTALL);
  const rawSame = readFileSync(REPO).equals(readFileSync(INSTALL));
  if (same) {
    console.log(rawSame ? '✓ in sync' : '✓ in sync (line endings differ only)');
    process.exit(0);
  }
  console.error('✗ DRIFT — repo and install differ.');
  console.error('  Run `node scripts/sync-mod.mjs` to deploy the repo copy,');
  console.error('  or `node scripts/sync-mod.mjs pull` to bring the install copy back.');
  process.exit(1);
}

if (mode === 'pull') {
  copy(INSTALL, REPO, 'install', 'repo');
  console.log('\nPulled live edits into the repo. Review the diff, then commit.');
} else {
  copy(REPO, INSTALL, 'repo', 'install');
  console.log('\nDeployed to the GAMMA install. Restart the game to reload the script.');
}

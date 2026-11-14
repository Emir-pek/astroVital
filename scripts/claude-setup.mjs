#!/usr/bin/env node
// Installs the team's Claude Code plugins listed in .claude/settings.json (project scope).
// Safe to re-run. Skips everything if the `claude` CLI is not installed.
// Usage: node scripts/claude-setup.mjs
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const win = process.platform === 'win32';
const sh = (args) =>
  spawnSync('claude', args, { stdio: 'inherit', shell: win, cwd: root }).status === 0;

if (spawnSync('claude', ['--version'], { shell: win }).status !== 0) {
  console.log('• Claude Code CLI not found — skipping plugin install. See docs/CLAUDE_SETUP.md.');
  process.exit(0);
}

const settingsPath = join(root, '.claude/settings.json');
const originalText = readFileSync(settingsPath, 'utf8');
const settings = JSON.parse(originalText);
const ids = Object.entries(settings.enabledPlugins ?? {})
  .filter(([, on]) => on)
  .map(([id]) => id);
const marketplaces = new Set(ids.map((id) => id.split('@')[1]));

// The official marketplace is only auto-registered after the first interactive session.
if (marketplaces.has('claude-plugins-official')) {
  sh(['plugin', 'marketplace', 'add', 'anthropics/claude-plugins-official']);
}
for (const [name, cfg] of Object.entries(settings.extraKnownMarketplaces ?? {})) {
  if (cfg?.source?.repo) sh(['plugin', 'marketplace', 'add', cfg.source.repo]);
  else console.log(`• Marketplace ${name}: add it manually (non-GitHub source).`);
}

let ok = 0;
for (const id of ids) {
  console.log(`→ ${id}`);
  if (sh(['plugin', 'install', id, '--scope', 'project'])) ok++;
}

// `claude plugin install --scope project` rewrites .claude/settings.json. If the content is
// unchanged, restore the committed text so teammates don't end up with a spurious git diff.
const canon = (v) =>
  JSON.stringify(v, (k, x) =>
    x && typeof x === 'object' && !Array.isArray(x)
      ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => a.localeCompare(b)))
      : x,
  );
if (canon(JSON.parse(readFileSync(settingsPath, 'utf8'))) === canon(settings)) {
  writeFileSync(settingsPath, originalText);
}
console.log(
  `\n${ok}/${ids.length} plugins installed. Open Claude Code in this folder, accept the trust prompt and approve the MCP servers from .mcp.json.`,
);
console.log('If a Claude Code session was already open, run /reload-plugins in it.');

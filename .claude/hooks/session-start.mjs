#!/usr/bin/env node
// SessionStart hook: puts the latest team changes into Claude's context at the start of
// every session, so each teammate's Claude knows what the others changed.
// Output on stdout is added to the session context by Claude Code.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const MAX_LINES = 80;

let changelog = '';
try {
  const lines = readFileSync(join(root, 'CHANGELOG.md'), 'utf8').split('\n');
  const marker = lines.findIndex((l) => l.includes('NEW ENTRIES BELOW'));
  changelog = lines
    .slice(marker + 1, marker + 1 + MAX_LINES)
    .join('\n')
    .trim();
} catch {
  changelog = '(CHANGELOG.md not found)';
}

let log = '';
try {
  log = execSync('git log -8 "--pretty=format:%h %an: %s"', { cwd: root, encoding: 'utf8' });
} catch {}

console.log(
  [
    '## Team context (auto-loaded by .claude/hooks/session-start.mjs)',
    "Latest CHANGELOG entries — read these before working; mention any 'Ekip ne yapmalı' items to the user:",
    changelog,
    '',
    'Recent commits:',
    log,
  ].join('\n'),
);

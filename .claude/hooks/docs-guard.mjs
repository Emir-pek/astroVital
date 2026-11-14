#!/usr/bin/env node
// Stop hook: before Claude ends its turn, make sure any code/config change it left in the
// working tree is documented in CHANGELOG.md. If not, Claude is told to keep working.
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

let input = '';
process.stdin.on('data', (c) => (input += c));
process.stdin.on('end', () => {
  let payload = {};
  try {
    payload = JSON.parse(input || '{}');
  } catch {}
  // Avoid loops: if we already blocked once in this stop cycle, let Claude stop.
  if (payload.stop_hook_active) process.exit(0);

  const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const r = spawnSync('node', [join(root, 'scripts', 'docs-check.mjs'), '--worktree'], {
    cwd: root,
    encoding: 'utf8',
  });
  if (r.status === 0) process.exit(0);

  process.stdout.write(
    JSON.stringify({
      decision: 'block',
      reason:
        'Code/config changed but CHANGELOG.md is not updated. Follow the document-change skill: ' +
        "add a CHANGELOG.md entry (what, why, files, 'Teammates must'), and update docs/ if behaviour, " +
        'setup or architecture changed. Details:\n' +
        (r.stderr || r.stdout),
    }),
  );
  process.exit(0);
});

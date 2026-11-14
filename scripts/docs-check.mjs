#!/usr/bin/env node
// Documentation guard: if code/config changed, CHANGELOG.md must change too.
// Used by: .githooks/pre-commit (--staged), CI (--base <ref>), Claude Stop hook (--worktree).
//
// Usage:
//   node scripts/docs-check.mjs --staged
//   node scripts/docs-check.mjs --base origin/main
//   node scripts/docs-check.mjs --worktree
// Escape hatch (typo fixes etc.): SKIP_DOCS=1 git commit ...
import { execSync } from 'node:child_process';

// Paths whose changes must be documented. Docs-only changes never need a changelog entry.
const DOCUMENTED = [
  /^src\//,
  /^public\//,
  /^index\.html$/,
  /^scripts\//,
  /^\.claude\//,
  /^\.mcp\.json$/,
  /^\.github\/workflows\//,
  /^\.githooks\//,
  /^\.devcontainer\//,
  /^package\.json$/,
  /^(vite|vitest)\.config\.ts$/,
  /^eslint\.config\.js$/,
  /^tsconfig.*\.json$/,
];
const IGNORED = [/^\.claude\/settings\.local\.json$/];

const git = (cmd) =>
  execSync(`git ${cmd}`, { encoding: 'utf8' })
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

function changedFiles(mode, base) {
  if (mode === '--staged') return git('diff --cached --name-only --diff-filter=ACMRD');
  if (mode === '--base') return git(`diff --name-only ${base}...HEAD`);
  // --worktree: staged + unstaged (vs HEAD) + untracked
  return [
    ...new Set([...git('diff --name-only HEAD'), ...git('ls-files --others --exclude-standard')]),
  ];
}

function check(files) {
  const needDocs = files.filter(
    (f) => DOCUMENTED.some((r) => r.test(f)) && !IGNORED.some((r) => r.test(f)),
  );
  const hasChangelog = files.includes('CHANGELOG.md');
  return { ok: needDocs.length === 0 || hasChangelog, needDocs };
}

{
  if (process.env.SKIP_DOCS === '1') {
    console.log('docs-check: skipped (SKIP_DOCS=1)');
    process.exit(0);
  }
  const mode = process.argv[2] ?? '--worktree';
  const { ok, needDocs } = check(changedFiles(mode, process.argv[3] ?? 'origin/main'));
  if (ok) {
    console.log('docs-check: OK');
    process.exit(0);
  }
  console.error(
    '\n✖ docs-check: kod/config değişti ama CHANGELOG.md güncellenmedi.\n' +
      needDocs.map((f) => `   - ${f}`).join('\n') +
      "\n\n  CHANGELOG.md'nin en üstüne kayıt ekle (format dosyada) ve davranış değiştiyse ilgili docs/ dosyasını güncelle." +
      '\n  Claude Code\'da: "bu değişikliği dokümante et" (skill: document-change).' +
      '\n  Gerçekten not gerektirmeyen ufak düzeltme: SKIP_DOCS=1 git commit ...\n',
  );
  process.exit(1);
}

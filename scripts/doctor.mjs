#!/usr/bin/env node
// Automated part of docs/SETUP_CHECK.md (§ 1–2) + team tooling checks.
// Usage: npm run doctor   (exit code 1 if a required item fails)
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const win = process.platform === 'win32';
let failed = 0;

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', shell: win, cwd: root });
  return r.status === 0 ? (r.stdout || r.stderr).trim() : null;
}
function check(name, ok, detail = '', required = true) {
  const mark = ok ? '✔' : required ? '✖' : '•';
  if (!ok && required) failed++;
  console.log(`${mark} ${name}${detail ? ` — ${detail}` : ''}`);
}
const major = (v) => Number(String(v).replace(/^v/, '').split('.')[0]);

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const needNode = major((pkg.engines?.node ?? '>=22').replace(/[^\d.]/g, ''));
check('Node.js', major(process.version) >= needNode, `${process.version} (gerekli >=${needNode})`);
const npmV = run('npm', ['-v']);
check('npm', !!npmV && major(npmV) >= 10, npmV ?? 'bulunamadı');
const gitV = run('git', ['--version']);
check('git', !!gitV, gitV ?? 'bulunamadı — https://git-scm.com');

const hasModules = existsSync(join(root, 'node_modules'));
check('node_modules', hasModules, hasModules ? '' : 'çalıştır: npm ci');
if (hasModules) {
  const ls = spawnSync('npm', ['ls', '--depth=0'], { encoding: 'utf8', shell: win, cwd: root });
  check(
    'npm ls (eksik/fazla paket yok)',
    ls.status === 0,
    ls.status === 0 ? '' : 'çalıştır: npm ci',
  );
}
const hooksPath = run('git', ['config', 'core.hooksPath']);
check(
  "Git hook'ları (.githooks)",
  hooksPath === '.githooks',
  hooksPath ?? 'çalıştır: git config core.hooksPath .githooks',
);

const claude = run('claude', ['--version']);
check('Claude Code CLI', !!claude, claude ?? 'isteğe bağlı — docs/CLAUDE_SETUP.md', false);
if (claude) {
  const list = run('claude', ['plugin', 'list']) ?? '';
  const settings = JSON.parse(readFileSync(join(root, '.claude/settings.json'), 'utf8'));
  for (const id of Object.keys(settings.enabledPlugins ?? {})) {
    const ok = list.includes(id.split('@')[0]);
    check(`plugin ${id}`, ok, ok ? '' : 'çalıştır: npm run claude:setup', false);
  }
}
const tsls = run('typescript-language-server', ['--version']);
check(
  'typescript-language-server (typescript-lsp plugin için)',
  !!tsls,
  tsls ?? 'npm i -g typescript-language-server typescript',
  false,
);

console.log(
  failed
    ? `\n${failed} zorunlu madde eksik. Kurulum script'ini tekrar çalıştır (README › Quick start).`
    : '\nZorunlu maddeler tamam. Tam kontrol için: npm run verify (docs/SETUP_CHECK.md § 3).',
);
process.exit(failed ? 1 : 0);

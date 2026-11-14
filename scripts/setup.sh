#!/usr/bin/env bash
# One-command setup for macOS, Linux, WSL and Git Bash. Safe to re-run.
# Usage:  bash scripts/setup.sh              full setup
#         bash scripts/setup.sh --no-claude  skip Claude Code plugin install
#         bash scripts/setup.sh --verify     also run `npm run verify` at the end
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
SKIP_CLAUDE=0; VERIFY=0
for a in "$@"; do
  [[ "$a" == "--no-claude" ]] && SKIP_CLAUDE=1
  [[ "$a" == "--verify" ]] && VERIFY=1
done

step() { printf '\n\033[1;36m==> %s\033[0m\n' "$1"; }
die()  { printf '\033[1;31m✖ %s\033[0m\n' "$1"; exit 1; }

step "1/5 Checking tools (docs/SETUP_CHECK.md § 1)"
command -v git  >/dev/null || die "git not found: https://git-scm.com"
command -v node >/dev/null || die "Node.js not found. Install Node 24 LTS: https://nodejs.org"
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[[ "$NODE_MAJOR" -ge 22 ]] || die "Node >=22 required, found $(node -v)"
echo "node $(node -v) · npm $(npm -v) · $(git --version)"

step "2/5 Dependencies (npm ci)"
npm ci --no-audit --no-fund || { echo "npm ci failed — retrying with a clean node_modules"; rm -rf node_modules; npm install --no-audit --no-fund; }

step "3/5 Git hooks"
git config core.hooksPath .githooks
chmod +x .githooks/* 2>/dev/null || true
echo "core.hooksPath = .githooks (pre-commit: docs check · post-merge: change summary)"

step "4/5 Claude Code plugins (project scope)"
if [[ "$SKIP_CLAUDE" -eq 1 ]]; then echo "skipped (--no-claude)"; else node scripts/claude-setup.mjs; fi

step "5/5 Checking"
node scripts/doctor.mjs || true
if [[ "$VERIFY" -eq 1 ]]; then npm run verify; fi

printf '\n\033[1;32m✔ Setup finished.\033[0m  npm run dev  →  http://localhost:5173\n'
printf 'Read the latest team changes in CHANGELOG.md. Full check: npm run verify\n'

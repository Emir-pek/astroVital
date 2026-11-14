# One-command setup for Windows (PowerShell 5.1+ / 7+). Safe to re-run.
# Usage:  powershell -ExecutionPolicy Bypass -File scripts\setup.ps1
#         powershell -ExecutionPolicy Bypass -File scripts\setup.ps1 -NoClaude
#         powershell -ExecutionPolicy Bypass -File scripts\setup.ps1 -Verify
param([switch]$NoClaude, [switch]$Verify)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Step($m) { Write-Host "`n==> $m" -ForegroundColor Cyan }
function Die($m)  { Write-Host "X $m" -ForegroundColor Red; exit 1 }
function Has($c)  { [bool](Get-Command $c -ErrorAction SilentlyContinue) }

Step "1/5 Checking tools (docs/SETUP_CHECK.md 1)"
if (-not (Has git))  { Die "git not found. Install: winget install Git.Git" }
if (-not (Has node)) { Die "Node.js not found. Install: winget install OpenJS.NodeJS.LTS" }
$nodeMajor = [int]((node -p "process.versions.node.split('.')[0]").Trim())
if ($nodeMajor -lt 22) { Die "Node >=22 required, found $(node -v)" }
Write-Host "node $(node -v) | npm $(npm -v) | $(git --version)"

Step "2/5 Dependencies (npm ci)"
npm ci --no-audit --no-fund
if ($LASTEXITCODE -ne 0) {
  Write-Host "npm ci failed (often ENOTEMPTY/EPERM on Windows) - retrying with a clean node_modules" -ForegroundColor Yellow
  if (Test-Path node_modules) { Remove-Item -Recurse -Force node_modules }
  npm install --no-audit --no-fund
  if ($LASTEXITCODE -ne 0) { Die "npm install failed - see docs/SETUP_CHECK.md 2.1" }
}

Step "3/5 Git hooks"
git config core.hooksPath .githooks
Write-Host "core.hooksPath = .githooks (pre-commit: docs check | post-merge: change summary)"

Step "4/5 Claude Code plugins (project scope)"
if ($NoClaude) { Write-Host "skipped (-NoClaude)" } else { node scripts\claude-setup.mjs }

Step "5/5 Checking"
node scripts\doctor.mjs
if ($Verify) { npm run verify }

Write-Host "`nSetup finished.  npm run dev  ->  http://localhost:5173" -ForegroundColor Green
Write-Host "Read the latest team changes in CHANGELOG.md. Full check: npm run verify"

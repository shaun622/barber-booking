# Balis Barber — one-shot Cloudflare provisioning + deploy.
# Prerequisite: `npx wrangler login` (one browser click) has been completed.
# Re-runnable: skips resources that already exist.

$ErrorActionPreference = 'Stop'
$proj = 'balis-barber-booking'
$dbName = 'balis_barber'

function Wr { npx wrangler @args }

Write-Host "`n=== 1. Verify Cloudflare auth ===" -ForegroundColor Cyan
$who = (npx wrangler whoami 2>&1 | Out-String)
if ($who -match 'Failed|not authenticated|wrangler login') {
  Write-Host "Not logged in. Run:  npx wrangler login" -ForegroundColor Red
  exit 1
}
Write-Host "Authenticated."

Write-Host "`n=== 2. D1 database ===" -ForegroundColor Cyan
$dbList = (npx wrangler d1 list --json 2>&1 | Out-String)
$dbId = $null
try { $dbId = (($dbList | ConvertFrom-Json) | Where-Object { $_.name -eq $dbName }).uuid } catch {}
if (-not $dbId) {
  $out = (npx wrangler d1 create $dbName 2>&1 | Out-String)
  if ($out -match 'database_id\s*=\s*"([^"]+)"') { $dbId = $Matches[1] }
}
if (-not $dbId) { Write-Host "Could not resolve D1 id." -ForegroundColor Red; exit 1 }
Write-Host "D1 id: $dbId"

function Get-OrCreate-KV($title) {
  $list = (npx wrangler kv namespace list 2>&1 | Out-String)
  $id = $null
  try { $id = (($list | ConvertFrom-Json) | Where-Object { $_.title -eq $title }).id } catch {}
  if (-not $id) {
    $o = (npx wrangler kv namespace create $title 2>&1 | Out-String)
    if ($o -match 'id\s*=\s*"([^"]+)"') { $id = $Matches[1] }
    elseif ($o -match '"id":\s*"([^"]+)"') { $id = $Matches[1] }
  }
  return $id
}

Write-Host "`n=== 3. KV namespaces ===" -ForegroundColor Cyan
$rlId = Get-OrCreate-KV 'RATE_LIMIT'
$slId = Get-OrCreate-KV 'SLOT_LOCKS'
Write-Host "RATE_LIMIT id: $rlId"
Write-Host "SLOT_LOCKS id: $slId"

Write-Host "`n=== 4. Patch wrangler.toml ===" -ForegroundColor Cyan
$toml = Get-Content wrangler.toml -Raw
$toml = $toml -replace 'REPLACE_WITH_DB_ID_AFTER_wrangler_d1_create', $dbId
$toml = $toml -replace 'REPLACE_WITH_RATE_LIMIT_KV_ID', $rlId
$toml = $toml -replace 'REPLACE_WITH_SLOT_LOCKS_KV_ID', $slId
Set-Content wrangler.toml $toml -NoNewline -Encoding utf8
Write-Host "wrangler.toml updated."

Write-Host "`n=== 5. Build ===" -ForegroundColor Cyan
npm run build

Write-Host "`n=== 6. Pages project ===" -ForegroundColor Cyan
$projList = (npx wrangler pages project list 2>&1 | Out-String)
if ($projList -notmatch [regex]::Escape($proj)) {
  npx wrangler pages project create $proj --production-branch main
} else {
  Write-Host "Project '$proj' already exists."
}

Write-Host "`n=== 7. Migrations + seed (remote D1) ===" -ForegroundColor Cyan
npx wrangler d1 migrations apply $dbName --remote
npx wrangler d1 execute $dbName --remote --file=migrations/0002_seed.sql

Write-Host "`n=== 8. Deploy ===" -ForegroundColor Cyan
npx wrangler pages deploy .svelte-kit/cloudflare --project-name $proj --branch main

Write-Host "`nDONE. Set secrets next (see set-secrets.ps1)." -ForegroundColor Green

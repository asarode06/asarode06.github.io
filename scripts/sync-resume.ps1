<#
  Keeps public/resume/Akash_Sarode.pdf identical to the working copy of the resume
  that lives outside this repo, and pushes the change so the deployed site picks it up.

  Run by hand with `npm run resume:sync`, and automatically by the scheduled task
  "CatanPortfolio-ResumeSync" (registered by scripts/install-resume-sync.ps1).

  It is deliberately dull: compare hashes, and if they differ copy, commit that one
  path, push. Anything unexpected (wrong branch, mid-rebase, failed push) is logged
  and left alone rather than guessed at.
#>
param(
  [string]$Source = 'C:\GT\Resumes\Model\Summer27\Juno\Akash_Sarode.pdf',
  [switch]$NoPush
)

$ErrorActionPreference = 'Stop'

$repo   = Split-Path -Parent $PSScriptRoot
$dest   = Join-Path $repo 'public\resume\Akash_Sarode.pdf'
$logDir = Join-Path $env:LOCALAPPDATA 'catan-portfolio'
$log    = Join-Path $logDir 'resume-sync.log'

if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }

function Say([string]$msg) {
  $line = ('{0}  {1}' -f (Get-Date -Format 's'), $msg)
  Add-Content -Path $log -Value $line -Encoding utf8
  Write-Output $line
}

function Trim-Log {
  if (Test-Path $log) {
    $lines = Get-Content $log
    if ($lines.Count -gt 500) {
      Set-Content -Path $log -Value ($lines | Select-Object -Last 300) -Encoding utf8
    }
  }
}

if (-not (Test-Path $Source)) { Say "source missing: $Source"; Trim-Log; exit 1 }

$srcHash = (Get-FileHash -Algorithm SHA256 -Path $Source).Hash
$dstHash = $null
if (Test-Path $dest) { $dstHash = (Get-FileHash -Algorithm SHA256 -Path $dest).Hash }

if ($srcHash -eq $dstHash) { Trim-Log; exit 0 }

Copy-Item -Path $Source -Destination $dest -Force
Say "copied resume ($([math]::Round((Get-Item $dest).Length / 1kb)) KB)"

if ($NoPush) { Say 'skipping commit and push (-NoPush)'; Trim-Log; exit 0 }

Set-Location $repo

$branch = (& git rev-parse --abbrev-ref HEAD).Trim()
if ($branch -ne 'main') { Say "on branch '$branch', not main: copied but not committed"; Trim-Log; exit 0 }

$gitDir = (& git rev-parse --git-dir).Trim()
if ((Test-Path (Join-Path $gitDir 'MERGE_HEAD')) -or (Test-Path (Join-Path $gitDir 'rebase-merge')) -or (Test-Path (Join-Path $gitDir 'rebase-apply'))) {
  Say 'repo is mid-merge or mid-rebase: copied but not committed'; Trim-Log; exit 0
}

# Pathspec-limited commit, so whatever else is staged or dirty in the tree is untouched.
& git commit -q -m 'Update resume PDF' -- 'public/resume/Akash_Sarode.pdf'
if (-not $?) { Say 'git commit failed: copied but not committed'; Trim-Log; exit 1 }
Say ('committed ' + (& git rev-parse --short HEAD).Trim())

& git push -q origin main
if (-not $?) { Say 'git push failed (commit is local; push it yourself)'; Trim-Log; exit 1 }
Say 'pushed to origin/main'

Trim-Log

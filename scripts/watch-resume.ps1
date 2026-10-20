<#
  The long-running half of the resume sync: polls the source PDF once a minute and
  hands off to sync-resume.ps1 whenever it has changed. Started at logon by the
  shortcut that scripts/install-resume-sync.ps1 drops in the Startup folder.

  Polling rather than a FileSystemWatcher on purpose: editors and PDF exporters
  replace the file by writing a temp and renaming it, which fires a scatter of
  events a watcher then has to debounce. A hash check on a timer has none of that
  and costs nothing on a 230 KB file.
#>
param(
  [string]$Source = 'C:\GT\Resumes\Model\Summer27\Juno\Akash_Sarode.pdf',
  [int]$IntervalSeconds = 60
)

$sync = Join-Path $PSScriptRoot 'sync-resume.ps1'

while ($true) {
  try { & $sync -Source $Source | Out-Null } catch { }
  Start-Sleep -Seconds $IntervalSeconds
}

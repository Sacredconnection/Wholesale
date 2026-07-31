$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$logDirectory = Join-Path $projectRoot "tmp"
$standardOutputLog = Join-Path $logDirectory "persistent-localhost.out.log"
$standardErrorLog = Join-Path $logDirectory "persistent-localhost.err.log"
$activityLog = Join-Path $logDirectory "persistent-localhost.activity.log"

New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null

$existingListener = Get-NetTCPConnection `
  -LocalPort 3000 `
  -State Listen `
  -ErrorAction SilentlyContinue |
  Select-Object -First 1

if ($existingListener) {
  Add-Content `
    -LiteralPath $activityLog `
    -Value "[$(Get-Date -Format o)] Port 3000 is already active (PID $($existingListener.OwningProcess))." `
    -Encoding UTF8
  exit 0
}

$npmCommand = (Get-Command npm.cmd -ErrorAction Stop).Source

Add-Content `
  -LiteralPath $activityLog `
  -Value "[$(Get-Date -Format o)] Starting Sacred Wholesale on http://localhost:3000" `
  -Encoding UTF8

while ($true) {
  $server = Start-Process `
    -FilePath $npmCommand `
    -ArgumentList @("run", "dev") `
    -WorkingDirectory $projectRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput $standardOutputLog `
    -RedirectStandardError $standardErrorLog `
    -PassThru `
    -Wait

  Add-Content `
    -LiteralPath $activityLog `
    -Value "[$(Get-Date -Format o)] Development server exited with code $($server.ExitCode); restarting." `
    -Encoding UTF8
  Start-Sleep -Seconds 5
}

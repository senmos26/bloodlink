param(
  [string]$Connect,            # ADB connect target (ip:port)
  [string]$Serial,             # ANDROID_SERIAL (optional)
  [int]$MetroPort = 8081,
  [int]$WebPort = 3000,
  [switch]$RebuildMobile,      # If set, performs a full native rebuild (expo run:android)
  [switch]$Fast                # If set, skip cache cleanup
)
$ErrorActionPreference = "Stop"

function Stop-Port($port) {
  try {
    $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conns) {
      $ownerPids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
      foreach ($ownerPid in $ownerPids) {
        try { Stop-Process -Id $ownerPid -Force } catch {}
      }
    }
  } catch {}
}

# Resolve paths
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir ".."))
$repoRoot = $repoRoot.Path
$mobileRoot = Join-Path $repoRoot "mobile_app"
$webRoot = Join-Path $repoRoot "center_web"
 $configPath = Join-Path $scriptDir "dev-all.config.json"

# ADB
$adb = Join-Path $env:LOCALAPPDATA "Android\Sdk\platform-tools\adb.exe"
if (-not (Test-Path $adb)) { $adb = "adb" }

 # Load defaults from config if available and not provided via args
 if (-not $Connect -and -not $Serial -and (Test-Path $configPath)) {
   try {
     $cfg = Get-Content $configPath -Raw | ConvertFrom-Json
     if ($cfg.MetroPort) { $MetroPort = [int]$cfg.MetroPort }
     if ($cfg.WebPort) { $WebPort = [int]$cfg.WebPort }
     if ($cfg.DeviceConnect) { $Connect = [string]$cfg.DeviceConnect }
     if ($cfg.Serial) { $Serial = [string]$cfg.Serial }
   } catch {}
 }

 Write-Host "==> Stopping dev servers on ports $MetroPort (Metro), $WebPort (Next.js)" -ForegroundColor Cyan
Stop-Port $MetroPort
Stop-Port $WebPort

if (-not $Fast) {
  # Clean Next.js cache
  if (Test-Path (Join-Path $webRoot ".next")) {
    Write-Host "- Cleaning center_web/.next" -ForegroundColor DarkGray
    Remove-Item -LiteralPath (Join-Path $webRoot ".next") -Recurse -Force -ErrorAction SilentlyContinue
  }
}

# Connect or select device for Android if rebuild
if ($RebuildMobile -or $Serial -or $Connect) {
  if ($Connect) {
    Write-Host "==> ADB connect $Connect" -ForegroundColor Cyan
    & $adb connect $Connect | Out-Host
  }
  if (-not $Serial -and $Connect) {
    # Prefer the provided Connect target as ANDROID_SERIAL
    $Serial = $Connect
  }
  if (-not $Serial) {
    $out = & $adb devices -l
    $line = ($out -split "`r?`n") | Where-Object { $_ -match "^\s*(\S+)\s+device\b" } | Select-Object -First 1
    if ($line) { $Serial = ($line -split "\s+")[0] }
  }
  if ($Serial) { $env:ANDROID_SERIAL = $Serial }
}

# Start backend (Next.js) in a new terminal
Write-Host "==> Starting center_web dev (Next.js)" -ForegroundColor Cyan
Start-Process -FilePath powershell -ArgumentList @(
  '-NoExit',
  '-Command',
  "Set-Location `"$webRoot`"; npm run dev"
) | Out-Null

if ($RebuildMobile) {
  # Full native rebuild + install on device
  Write-Host "==> Rebuilding Android app (expo run:android)" -ForegroundColor Cyan
  if ($env:ANDROID_SERIAL) { Write-Host "- Target device: $env:ANDROID_SERIAL" -ForegroundColor DarkGray }
  Set-Location $mobileRoot
  if (-not $Fast) {
    if (Test-Path .\android\gradlew.bat) { .\android\gradlew.bat clean }
  }
  npx expo run:android
} else {
  # Start Metro (JS only) with clean cache
  Write-Host "==> Starting Metro (Expo) on port $MetroPort with cache clear" -ForegroundColor Cyan
  Start-Process -FilePath powershell -ArgumentList @(
    '-NoExit',
    '-Command',
    "Set-Location `"$mobileRoot`"; npx expo start --port $MetroPort --clear"
  ) | Out-Null
}

Write-Host "==> All set. Backend on http://localhost:$WebPort, Metro on :$MetroPort" -ForegroundColor Green

param(
  [string]$Serial,
  [string]$Connect,
  [int]$MetroPort = 8081,
  [switch]$InstallWebView,
  [switch]$Clean
)
$ErrorActionPreference = "Stop"

$adb = Join-Path $env:LOCALAPPDATA "Android\Sdk\platform-tools\adb.exe"
if (-not (Test-Path $adb)) { $adb = "adb" }

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$mobileRoot = (Resolve-Path (Join-Path $scriptDir "..")).Path
Set-Location $mobileRoot

if ($Connect) { & $adb connect $Connect | Out-Host }

try {
  $conns = Get-NetTCPConnection -LocalPort $MetroPort -ErrorAction SilentlyContinue
  if ($conns) {
    $ownerPids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($ownerPid in $ownerPids) { try { Stop-Process -Id $ownerPid -Force } catch {} }
  }
} catch {}

if (-not $Serial) {
  $out = & $adb devices -l
  $line = ($out -split "`r?`n") | Where-Object { $_ -match "^\s*(\S+)\s+device\b" } | Select-Object -First 1
  if ($line) { $Serial = ($line -split "\s+")[0] }
}

if (-not $Serial) {
  Write-Host "No device found. Use -Connect <ip:port> or -Serial <serial>." -ForegroundColor Red
  exit 1
}

$env:ANDROID_SERIAL = $Serial

if ($InstallWebView) {
  npx expo install react-native-webview
}

if ($Clean) {
  if (Test-Path .\android\gradlew.bat) { .\android\gradlew.bat clean }
}

npx expo run:android

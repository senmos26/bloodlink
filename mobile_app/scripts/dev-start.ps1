param(
  [int]$Port = 8081
)
$ErrorActionPreference = "Stop"

# Kill existing Metro on port
try {
  $conns = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
  if ($conns) {
    $ownerPids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($ownerPid in $ownerPids) { try { Stop-Process -Id $ownerPid -Force } catch {} }
  }
} catch {}

npx expo start --port $Port

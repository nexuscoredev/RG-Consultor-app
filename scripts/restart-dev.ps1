# Reinicia API + sistema web (Windows)
# Uso: powershell -ExecutionPolicy Bypass -File scripts/restart-dev.ps1

$ports = @(5173, 3001)
foreach ($port in $ports) {
  $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  foreach ($c in $conns) {
    $pid = $c.OwningProcess
    if ($pid -and $pid -ne 0) {
      Write-Host "Encerrando processo $pid na porta $port..."
      Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
  }
}

Set-Location $PSScriptRoot\..
Write-Host "Iniciando API + RG Consultor..."
npm run dev

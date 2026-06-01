# Stop EHIPAP local Java services only (never kills Docker / other apps on shared ports)
$ports = @(8880, 8081, 8082, 8083, 8084, 8085, 8086, 8087, 8088, 8183, 8184)
$stopped = 0

foreach ($port in $ports) {
    $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    foreach ($conn in $conns) {
        $procId = $conn.OwningProcess
        if (-not $procId) { continue }
        $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
        if ($proc -and $proc.ProcessName -ieq 'java') {
            Write-Host "Stopping Java on port $port (PID $procId)..."
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            $stopped++
        }
    }
}

if ($stopped -eq 0) {
    Write-Host "No EHIPAP Java services were running."
} else {
    Write-Host "Stopped $stopped Java service(s). Wait 3 seconds before rebuilding..."
    Start-Sleep -Seconds 3
}

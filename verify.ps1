# Quick health check - run after run.ps1
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

Write-Host "EHIPAP Health Check" -ForegroundColor Cyan
Write-Host "-------------------"

try {
    docker exec ehipap-postgres pg_isready -U ehipap -d ehipap 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) { Write-Host "Postgres  : OK" -ForegroundColor Green } else { Write-Host "Postgres  : FAIL" -ForegroundColor Red }
} catch { Write-Host "Postgres  : FAIL (Docker down?)" -ForegroundColor Red }

try {
    (Invoke-RestMethod "http://localhost:8880/actuator/health" -TimeoutSec 5).status | Out-Null
    Write-Host "Gateway   : OK" -ForegroundColor Green
} catch { Write-Host "Gateway   : FAIL" -ForegroundColor Red }

try {
    $r = Invoke-RestMethod -Uri "http://localhost:8880/api/v1/auth/login" -Method Post -Body '{"username":"superadmin","password":"Admin@123"}' -ContentType "application/json" -TimeoutSec 8
    Write-Host "Login     : OK ($($r.user.username))" -ForegroundColor Green
} catch { Write-Host "Login     : FAIL" -ForegroundColor Red }

try {
    $code = (Invoke-WebRequest "http://localhost:5173" -UseBasicParsing -TimeoutSec 5).StatusCode
    Write-Host "Frontend  : OK (HTTP $code)" -ForegroundColor Green
} catch {
    try {
        $code = (Invoke-WebRequest "http://localhost:3001" -UseBasicParsing -TimeoutSec 5).StatusCode
        Write-Host "Frontend  : OK on 3001 (HTTP $code)" -ForegroundColor Green
    } catch { Write-Host "Frontend  : FAIL (run: cd frontend; npm run dev)" -ForegroundColor Red }
}

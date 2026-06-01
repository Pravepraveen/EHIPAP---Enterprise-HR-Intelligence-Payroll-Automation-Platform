# One-shot: Docker infra + backend + frontend (run from project root)
# Usage: .\scripts\start-all.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "`n=== EHIPAP start-all ===" -ForegroundColor Cyan

# Docker
$dockerOk = $false
for ($i = 1; $i -le 30; $i++) {
    docker ps 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) { $dockerOk = $true; break }
    if ($i -eq 1) {
        Start-Process "$env:LOCALAPPDATA\Programs\DockerDesktop\Docker Desktop.exe" -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 4
}
if (-not $dockerOk) {
    Write-Host "ERROR: Start Docker Desktop, then run this script again." -ForegroundColor Red
    exit 1
}

docker compose -f docker-compose.infra.yml up -d | Out-Null

if (-not (Test-Path "backend\infrastructure\api-gateway\target\api-gateway-1.0.0.jar")) {
    & "$Root\scripts\build-backend.ps1"
}

& "$Root\scripts\start-local.ps1"

Write-Host "`nWaiting for API login..." -ForegroundColor Yellow
$ready = $false
for ($i = 1; $i -le 40; $i++) {
    try {
        $body = '{"username":"superadmin","password":"Admin@123"}'
        $r = Invoke-RestMethod -Uri "http://localhost:8880/api/v1/auth/login" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 5
        if ($r.accessToken) { $ready = $true; break }
    } catch { Start-Sleep -Seconds 3 }
}
if ($ready) {
    Write-Host "Backend login: OK" -ForegroundColor Green
} else {
    Write-Host "Backend login: not ready yet (check logs\*.log)" -ForegroundColor Yellow
}

# Frontend
$frontendRunning = (Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue)
if (-not $frontendRunning) {
    Write-Host "Starting frontend on http://localhost:5173 ..." -ForegroundColor Yellow
    $frontendDir = Join-Path $Root "frontend"
    if (-not (Test-Path (Join-Path $frontendDir "node_modules"))) {
        Push-Location $frontendDir
        npm install
        Pop-Location
    }
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendDir'; npm run dev"
} else {
    Write-Host "Frontend already running on http://localhost:5173" -ForegroundColor Green
}

Write-Host "`n=== Ready ===" -ForegroundColor Cyan
Write-Host "  Frontend:  http://localhost:5173"
Write-Host "  API:       http://localhost:8880"
Write-Host "  Login:     superadmin / Admin@123"
Write-Host "  Logs:      $Root\logs\"
Write-Host ""

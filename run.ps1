# EHIPAP - ONE COMMAND START (always run from project root)
# Usage:
#   cd "c:\Users\DELL\OneDrive\Desktop\H R project"
#   .\run.ps1

$ProjectRoot = $PSScriptRoot
Set-Location $ProjectRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  EHIPAP - Starting Full Local Stack" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Checking Docker Desktop..." -ForegroundColor Yellow
$dockerReady = $false
for ($i = 1; $i -le 45; $i++) {
    docker info 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        $dockerReady = $true
        Write-Host "Docker is ready." -ForegroundColor Green
        break
    }
    if ($i -eq 1) {
        Write-Host "Starting Docker Desktop (wait up to 3 min)..." -ForegroundColor Yellow
        Start-Process "$env:LOCALAPPDATA\Programs\DockerDesktop\Docker Desktop.exe" -ErrorAction SilentlyContinue
    }
    if ($i % 5 -eq 0) { Write-Host "  still waiting... ($i/45)" }
    Start-Sleep -Seconds 4
}
if (-not $dockerReady) {
    Write-Host ""
    Write-Host "ERROR: Docker Desktop is not running." -ForegroundColor Red
    Write-Host "1. Open Docker Desktop manually from Start menu" -ForegroundColor White
    Write-Host "2. Wait until it shows Running" -ForegroundColor White
    Write-Host "3. Run .\run.ps1 again" -ForegroundColor White
    exit 1
}

& "$ProjectRoot\scripts\stop-local.ps1"
& "$ProjectRoot\scripts\start-local.ps1"

Write-Host ""
Write-Host "Waiting for API Gateway + Login..." -ForegroundColor Yellow
$ready = $false
for ($i = 1; $i -le 40; $i++) {
    try {
        $body = '{"username":"superadmin","password":"Admin@123"}'
        $r = Invoke-RestMethod -Uri "http://localhost:8880/api/v1/auth/login" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 8
        if ($r.accessToken) { $ready = $true; break }
    } catch {
        if ($i % 5 -eq 0) { Write-Host "  still starting... ($i/40)" }
        Start-Sleep -Seconds 3
    }
}

Write-Host ""
if ($ready) {
    Write-Host "LOGIN TEST: OK (superadmin)" -ForegroundColor Green
} else {
    Write-Host "LOGIN TEST: FAILED - backend may still be starting" -ForegroundColor Red
    Write-Host "Wait 60 seconds, then run verify.ps1" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  NEXT STEP - open a NEW terminal:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host '  cd "c:\Users\DELL\OneDrive\Desktop\H R project\frontend"' -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Open browser: http://localhost:5173" -ForegroundColor Green
Write-Host 'Login: superadmin / Admin@123' -ForegroundColor Green
Write-Host ""

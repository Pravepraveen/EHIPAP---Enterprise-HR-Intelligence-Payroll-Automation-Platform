# Verify the backend URL that a physical Android phone should use.
$ErrorActionPreference = "Stop"

function Get-LanIPv4 {
    $candidates = Get-NetIPConfiguration |
        Where-Object { $_.IPv4DefaultGateway -and $_.NetAdapter.Status -eq "Up" } |
        ForEach-Object { $_.IPv4Address.IPAddress } |
        Where-Object {
            $_ -and
            $_ -notlike "169.254.*" -and
            $_ -ne "127.0.0.1"
        }

    if (-not $candidates) {
        $candidates = Get-NetIPAddress -AddressFamily IPv4 |
            Where-Object {
                $_.IPAddress -notlike "169.254.*" -and
                $_.IPAddress -ne "127.0.0.1"
            } |
            Select-Object -ExpandProperty IPAddress
    }

    return $candidates | Select-Object -First 1
}

$lanIp = Get-LanIPv4
if (-not $lanIp) {
    Write-Host "FAIL: Could not detect PC LAN IP." -ForegroundColor Red
    exit 1
}

$apiBaseUrl = "http://${lanIp}:8880"
Write-Host "Phone backend URL: $apiBaseUrl" -ForegroundColor Cyan

try {
    $health = Invoke-RestMethod "$apiBaseUrl/actuator/health" -TimeoutSec 5
    Write-Host "Gateway health: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "FAIL: Gateway not reachable at $apiBaseUrl" -ForegroundColor Red
    Write-Host "Run: .\scripts\start-all.ps1" -ForegroundColor Yellow
    exit 1
}

try {
    $body = @{ username = "hrmanager"; password = "HRManager@123" } | ConvertTo-Json
    $login = Invoke-RestMethod -Method Post -Uri "$apiBaseUrl/api/v1/auth/login" -ContentType "application/json" -Body $body -TimeoutSec 10
    Write-Host "Login: OK ($($login.user.username))" -ForegroundColor Green
} catch {
    Write-Host "FAIL: Login endpoint failed." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor DarkGray
    exit 1
}

Write-Host ""
Write-Host "Open this on phone browser to double-check:"
Write-Host "$apiBaseUrl/actuator/health"

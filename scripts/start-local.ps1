# EHIPAP local dev - infra in Docker, core services on host (low RAM friendly)
$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$env:DB_URL = "jdbc:postgresql://localhost:5433/ehipap"
$env:DB_USERNAME = "ehipap"
$env:DB_PASSWORD = "ehipap_secret_2024"
$env:REDIS_HOST = "localhost"
$env:REDIS_PORT = "6381"
$env:REDIS_PASSWORD = ""
$env:JWT_SECRET = "ehipap_jwt_super_secret_key_2024_production_grade_minimum_256_bits"

function Test-PortOpen([int]$Port) {
    return (Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue).TcpTestSucceeded
}

Write-Host "Stopping conflicting services on EHIPAP ports..."
& (Join-Path $PSScriptRoot "stop-local.ps1")

if (-not (Test-PortOpen 5433)) {
    Write-Host "Postgres not running - starting Docker infrastructure..."
    $infraUp = $false
    for ($i = 1; $i -le 20; $i++) {
        docker info 2>$null | Out-Null
        if ($LASTEXITCODE -ne 0) {
            if ($i -eq 1) {
                Write-Host "Starting Docker Desktop..."
                Start-Process "$env:LOCALAPPDATA\Programs\DockerDesktop\Docker Desktop.exe" -ErrorAction SilentlyContinue
            }
            Write-Host "  waiting for Docker ($i/20)..."
            Start-Sleep -Seconds 5
            continue
        }
        docker compose -f docker-compose.infra.yml up -d 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) { $infraUp = $true; break }
        Start-Sleep -Seconds 3
    }
    if (-not $infraUp) {
        Write-Host ""
        Write-Host "ERROR: Cannot start Postgres. Open Docker Desktop, wait until Running, then run:" -ForegroundColor Red
        Write-Host '  cd "c:\Users\DELL\OneDrive\Desktop\H R project"' -ForegroundColor Yellow
        Write-Host "  .\run.ps1" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "Postgres already running on port 5433."
}

Write-Host "Waiting for Postgres..."
$postgresReady = $false
for ($i = 1; $i -le 30; $i++) {
    if (Test-PortOpen 5433) {
        docker exec ehipap-postgres pg_isready -U ehipap -d ehipap 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) { $postgresReady = $true; Write-Host "Postgres ready."; break }
    }
    Start-Sleep -Seconds 2
}
if (-not $postgresReady) {
    Write-Host "ERROR: Postgres did not become ready." -ForegroundColor Red
    exit 1
}

Write-Host "Applying demo user passwords..."
Get-Content (Join-Path $Root "infra\docker\postgres\fix-passwords.sql") | docker exec -i ehipap-postgres psql -U ehipap -d ehipap 2>$null | Out-Null

$Backend = Join-Path $Root "backend"

function Start-ServiceJar {
    param(
        [string]$Name,
        [string]$JarPath,
        [hashtable]$ExtraEnv = @{}
    )
    if (-not (Test-Path $JarPath)) {
        Write-Host "ERROR: Missing JAR: $JarPath" -ForegroundColor Red
        Write-Host "Run: .\scripts\build-backend.ps1" -ForegroundColor Yellow
        exit 1
    }
    $logDir = Join-Path $Root "logs"
    if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
    $logFile = Join-Path $logDir "$Name.log"

    $procEnv = @{
        DB_URL            = $env:DB_URL
        DB_USERNAME       = $env:DB_USERNAME
        DB_PASSWORD       = $env:DB_PASSWORD
        REDIS_HOST        = $env:REDIS_HOST
        REDIS_PORT        = $env:REDIS_PORT
        REDIS_PASSWORD    = $env:REDIS_PASSWORD
        JWT_SECRET        = $env:JWT_SECRET
        AUTH_SERVICE_URL  = $env:AUTH_SERVICE_URL
        ANALYTICS_SERVICE_URL = $env:ANALYTICS_SERVICE_URL
        EMPLOYEE_SERVICE_URL  = $env:EMPLOYEE_SERVICE_URL
        PAYROLL_SERVICE_URL   = $env:PAYROLL_SERVICE_URL
        ATTENDANCE_SERVICE_URL = $env:ATTENDANCE_SERVICE_URL
        RECRUITMENT_SERVICE_URL = $env:RECRUITMENT_SERVICE_URL
        PERFORMANCE_SERVICE_URL = $env:PERFORMANCE_SERVICE_URL
        NOTIFICATION_SERVICE_URL = $env:NOTIFICATION_SERVICE_URL
    }
    foreach ($key in $ExtraEnv.Keys) { $procEnv[$key] = $ExtraEnv[$key] }

    Write-Host "Starting $Name... (log: logs\$Name.log)"
    # Quote path - project folder "H R project" breaks java -jar without quotes
    $jarFull = (Resolve-Path $JarPath).Path
    $argList = "-jar `"$jarFull`""
    $startParams = @{
        FilePath               = "java"
        ArgumentList           = $argList
        WorkingDirectory       = (Split-Path $jarFull)
        WindowStyle            = "Hidden"
        RedirectStandardOutput = $logFile
        RedirectStandardError  = "$logFile.err"
        PassThru               = $true
    }
    $prev = @{}
    foreach ($key in ($procEnv.Keys + $ExtraEnv.Keys | Select-Object -Unique)) {
        $val = if ($ExtraEnv.ContainsKey($key)) { $ExtraEnv[$key] } else { $procEnv[$key] }
        if ($null -ne $val -and $val -ne "") {
            $prev[$key] = [Environment]::GetEnvironmentVariable($key, "Process")
            Set-Item -Path "Env:$key" -Value $val
        }
    }
    if (-not $ExtraEnv.ContainsKey("SERVER_PORT")) { Remove-Item Env:SERVER_PORT -ErrorAction SilentlyContinue }
    Start-Process @startParams | Out-Null
    foreach ($key in $prev.Keys) {
        if ($null -eq $prev[$key]) { Remove-Item "Env:$key" -ErrorAction SilentlyContinue }
        else { Set-Item -Path "Env:$key" -Value $prev[$key] }
    }
}

function Resolve-ServicePort([int]$Preferred, [int]$Fallback) {
    if (Test-PortOpen $Preferred) {
        Write-Host "  Port $Preferred in use - using $Fallback for this service" -ForegroundColor Yellow
        return $Fallback
    }
    return $Preferred
}

$payrollPort = Resolve-ServicePort 8083 8183
$attendancePort = Resolve-ServicePort 8084 8184

Start-ServiceJar -Name "identity-auth-service" -JarPath (Join-Path $Backend "services\identity-auth-service\target\identity-auth-service-1.0.0.jar")
Start-Sleep -Seconds 12
Start-ServiceJar -Name "analytics-reporting-service" -JarPath (Join-Path $Backend "services\analytics-reporting-service\target\analytics-reporting-service-1.0.0.jar")
Start-Sleep -Seconds 8
Start-ServiceJar -Name "employee-lifecycle-service" -JarPath (Join-Path $Backend "services\employee-lifecycle-service\target\employee-lifecycle-service-1.0.0.jar")
Start-Sleep -Seconds 8
Start-ServiceJar -Name "payroll-computation-engine" -JarPath (Join-Path $Backend "services\payroll-computation-engine\target\payroll-computation-engine-1.0.0.jar") -ExtraEnv @{ SERVER_PORT = "$payrollPort" }
Start-Sleep -Seconds 6
Start-ServiceJar -Name "attendance-leave-service" -JarPath (Join-Path $Backend "services\attendance-leave-service\target\attendance-leave-service-1.0.0.jar") -ExtraEnv @{ SERVER_PORT = "$attendancePort" }
Start-Sleep -Seconds 6
Start-ServiceJar -Name "recruitment-ats-service" -JarPath (Join-Path $Backend "services\recruitment-ats-service\target\recruitment-ats-service-1.0.0.jar")
Start-Sleep -Seconds 5
Start-ServiceJar -Name "performance-management-service" -JarPath (Join-Path $Backend "services\performance-management-service\target\performance-management-service-1.0.0.jar")
Start-Sleep -Seconds 5
Start-ServiceJar -Name "notification-communication-service" -JarPath (Join-Path $Backend "services\notification-communication-service\target\notification-communication-service-1.0.0.jar")
Start-Sleep -Seconds 5

$env:AUTH_SERVICE_URL = "http://localhost:8081"
$env:ANALYTICS_SERVICE_URL = "http://localhost:8088"
$env:EMPLOYEE_SERVICE_URL = "http://localhost:8082"
$env:PAYROLL_SERVICE_URL = "http://localhost:$payrollPort"
$env:ATTENDANCE_SERVICE_URL = "http://localhost:$attendancePort"
$env:RECRUITMENT_SERVICE_URL = "http://localhost:8085"
$env:PERFORMANCE_SERVICE_URL = "http://localhost:8086"
$env:NOTIFICATION_SERVICE_URL = "http://localhost:8087"
Start-ServiceJar -Name "api-gateway" -JarPath (Join-Path $Backend "infrastructure\api-gateway\target\api-gateway-1.0.0.jar") -ExtraEnv @{ SERVER_PORT = "8880" }

Write-Host ""
Write-Host "=== EHIPAP Backend Started ===" -ForegroundColor Green
Write-Host "API Gateway:  http://localhost:8880"
Write-Host 'Frontend:     cd frontend; npm run dev  (http://localhost:5173)'
Write-Host 'Login:        superadmin / Admin@123'

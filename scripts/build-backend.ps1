# Build backend (stops running services first so Maven can delete JARs)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

& (Join-Path $PSScriptRoot "stop-local.ps1")

Set-Location (Join-Path $Root "backend")
Write-Host "Building backend..."
$ErrorActionPreference = "Continue"
mvn clean install -DskipTests 2>&1 | Out-Null
$ErrorActionPreference = "Stop"

if ($LASTEXITCODE -ne 0) {
    Write-Error "Maven build failed."
}
Write-Host "Backend build SUCCESS."

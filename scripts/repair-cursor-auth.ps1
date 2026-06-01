# Repair Cursor auth: network/time fixes + optional auth cache reset + fresh login
# Run: powershell -ExecutionPolicy Bypass -File .\scripts\repair-cursor-auth.ps1

param(
    [switch]$ResetAuth,
    [switch]$SkipDeepLink
)

$ErrorActionPreference = 'Stop'
$cursorExe = 'C:\Program Files\cursor\Cursor.exe'
$stateDb = Join-Path $env:APPDATA 'Cursor\User\globalStorage\state.vscdb'

Write-Host '=== Cursor Auth Repair ===' -ForegroundColor Cyan

# 1) Windows Time (OAuth is time-sensitive)
$w32 = Get-Service W32Time -ErrorAction SilentlyContinue
if ($w32 -and $w32.Status -ne 'Running') {
    Write-Host 'Starting Windows Time service...'
    try {
        Start-Service W32Time -ErrorAction Stop
        w32tm /resync /force | Out-Null
        Write-Host 'Time service started and resynced.' -ForegroundColor Green
    } catch {
        Write-Warning "Could not start W32Time (run terminal as Admin): $_"
    }
} else {
    Write-Host 'Windows Time service OK or already running.'
}

# 2) Network sanity
$targets = @('https://authenticator.cursor.sh', 'https://cursor.com', 'https://api2.cursor.sh')
foreach ($u in $targets) {
    try {
        $r = Invoke-WebRequest -Uri $u -Method Head -MaximumRedirection 5 -TimeoutSec 15 -UseBasicParsing
        Write-Host "  OK $u ($($r.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Warning "  FAIL $u : $($_.Exception.Message)"
    }
}

if ($ResetAuth) {
    Write-Host 'Closing Cursor processes...' -ForegroundColor Yellow
    Get-Process -Name 'Cursor' -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2

    if (Test-Path $stateDb) {
        Write-Host 'Removing stale cursorAuth keys from state DB...'
        $py = @"
import sqlite3, os
db = os.path.join(os.environ['APPDATA'], 'Cursor', 'User', 'globalStorage', 'state.vscdb')
keys = ['cursorAuth/accessToken','cursorAuth/refreshToken','cursorAuth/cachedEmail',
        'cursorAuth/cachedSignUpType','cursorAuth/onboardingDate','cursorAuth/stripeMembershipType']
conn = sqlite3.connect(db)
for k in keys:
    conn.execute('DELETE FROM ItemTable WHERE key=?', (k,))
conn.commit()
conn.close()
print('Auth keys cleared.')
"@
        python -c $py
    }

    $partitions = Join-Path $env:APPDATA 'Cursor\Partitions\cursor-browser'
    if (Test-Path $partitions) {
        Write-Host 'Clearing embedded auth browser partition...'
        Remove-Item -Path $partitions -Recurse -Force -ErrorAction SilentlyContinue
    }
}

if (-not $SkipDeepLink) {
    Write-Host 'Launching Sign In from Cursor (fresh OAuth, not a bookmarked URL)...'
    if (Test-Path $cursorExe) {
        Start-Process -FilePath $cursorExe -ArgumentList '--open-url', 'cursor://anysphere.cursor-deeplink/auth/login'
    } else {
        Write-Warning "Cursor not found at $cursorExe"
    }
}

# 3) Ensure login opens in a real browser (empty default often breaks OAuth on Windows)
$settingsPath = Join-Path $env:APPDATA 'Cursor\User\settings.json'
if (Test-Path $settingsPath) {
    $settings = Get-Content $settingsPath -Raw | ConvertFrom-Json
    if (-not $settings.'cursor.browser') {
        $settings | Add-Member -NotePropertyName 'cursor.browser' -NotePropertyValue 'msedge' -Force
        $settings | ConvertTo-Json | Set-Content $settingsPath -Encoding UTF8
        Write-Host 'Set cursor.browser=msedge in settings.json' -ForegroundColor Green
    }
}

Write-Host ''
Write-Host '=== REQUIRED: full restart ===' -ForegroundColor Yellow
Write-Host '1. File -> Exit (or tray -> Quit) until ALL Cursor processes end.'
Write-Host '2. Reopen Cursor from Start menu.'
Write-Host '3. Sign In from inside the app (do NOT paste old authenticator.cursor.sh URLs).'
Write-Host '4. After browser login, click Open Cursor when prompted.'
Write-Host ''
Write-Host 'If still broken after restart, run: .\scripts\repair-cursor-auth.ps1 -ResetAuth' -ForegroundColor Cyan

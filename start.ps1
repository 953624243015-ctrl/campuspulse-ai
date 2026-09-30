# ============================================================
# CampusPulse AI — One-Click Startup Script
# Run this from the project root:  .\start.ps1
# ============================================================

$env:PATH = "C:\Program Files\PostgreSQL\18\bin;$env:PATH"
$ProjectRoot = $PSScriptRoot
$DataDir     = "C:\Users\$env:USERNAME\campuspulse_pgdata"
$LogFile     = "C:\Users\$env:USERNAME\campuspulse_pg.log"

Write-Host ""
Write-Host "  ╔═══════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║     CampusPulse AI — Starting Up      ║" -ForegroundColor Cyan
Write-Host "  ╚═══════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ── 1. PostgreSQL ────────────────────────────────────────────
Write-Host "[1/3] PostgreSQL..." -ForegroundColor Yellow
$pgStatus = pg_ctl status -D $DataDir 2>&1
if ($pgStatus -match "server is running") {
    Write-Host "      Already running ✅" -ForegroundColor Green
} else {
    pg_ctl -D $DataDir -l $LogFile start 2>&1 | Out-Null
    Start-Sleep -Seconds 4
    $env:PGPASSWORD = "campuspulse_secret"
    $test = psql -U campuspulse -h 127.0.0.1 -p 5433 -d campuspulse -tAc "SELECT 1;" 2>&1
    if ($test -match "1") {
        Write-Host "      Started on port 5433 ✅" -ForegroundColor Green
    } else {
        Write-Host "      Failed to start! Check: $LogFile" -ForegroundColor Red
        exit 1
    }
}

# ── 2. Backend ───────────────────────────────────────────────
Write-Host "[2/3] Backend (port 5000)..." -ForegroundColor Yellow
$be = Test-NetConnection -ComputerName 127.0.0.1 -Port 5000 -InformationLevel Quiet -WarningAction SilentlyContinue 2>$null
if ($be) {
    Write-Host "      Already running ✅" -ForegroundColor Green
} else {
    Start-Process powershell -ArgumentList "-NoExit", "-Command",
        "Set-Location '$ProjectRoot\backend'; node dist\index.js" `
        -WindowStyle Normal
    Start-Sleep -Seconds 4
    $beCheck = Invoke-WebRequest "http://localhost:5000/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($beCheck.StatusCode -eq 200) {
        Write-Host "      Started ✅" -ForegroundColor Green
    } else {
        Write-Host "      Check the backend window for errors" -ForegroundColor Yellow
    }
}

# ── 3. Frontend ──────────────────────────────────────────────
Write-Host "[3/3] Frontend (port 3000)..." -ForegroundColor Yellow
$fe = Test-NetConnection -ComputerName 127.0.0.1 -Port 3000 -InformationLevel Quiet -WarningAction SilentlyContinue 2>$null
if ($fe) {
    Write-Host "      Already running ✅" -ForegroundColor Green
} else {
    Start-Process powershell -ArgumentList "-NoExit", "-Command",
        "Set-Location '$ProjectRoot\frontend'; node node_modules\vite\bin\vite.js --port 3000" `
        -WindowStyle Normal
    Start-Sleep -Seconds 6
    $feCheck = Invoke-WebRequest "http://localhost:3000" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($feCheck.StatusCode -eq 200) {
        Write-Host "      Started ✅" -ForegroundColor Green
    } else {
        Write-Host "      Check the frontend window for errors" -ForegroundColor Yellow
    }
}

# ── Done ─────────────────────────────────────────────────────
Write-Host ""
Write-Host "  ╔═══════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "  ║  CampusPulse AI is ready!                             ║" -ForegroundColor Green
Write-Host "  ║                                                       ║" -ForegroundColor Green
Write-Host "  ║  Frontend  →  http://localhost:3000                   ║" -ForegroundColor Green
Write-Host "  ║  Backend   →  http://localhost:5000                   ║" -ForegroundColor Green
Write-Host "  ║  API Docs  →  http://localhost:5000/health            ║" -ForegroundColor Green
Write-Host "  ║                                                       ║" -ForegroundColor Green
Write-Host "  ║  Demo Accounts  (password: CampusPulse@123)           ║" -ForegroundColor Green
Write-Host "  ║  Student   →  student.arun@campuspulse.edu            ║" -ForegroundColor Green
Write-Host "  ║  Faculty   →  faculty.rani@campuspulse.edu            ║" -ForegroundColor Green
Write-Host "  ║  HOD       →  hod.cse@campuspulse.edu                 ║" -ForegroundColor Green
Write-Host "  ║  Admin     →  admin@campuspulse.edu                   ║" -ForegroundColor Green
Write-Host "  ║  Principal →  principal@campuspulse.edu               ║" -ForegroundColor Green
Write-Host "  ╚═══════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

# Open browser automatically
Start-Process "http://localhost:3000"

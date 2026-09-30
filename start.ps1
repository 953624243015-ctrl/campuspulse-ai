$env:PATH = "C:\Program Files\PostgreSQL\18\bin;" + $env:PATH
$ProjectRoot = $PSScriptRoot
$DataDir     = "C:\Users\" + $env:USERNAME + "\campuspulse_pgdata"
$LogFile     = "C:\Users\" + $env:USERNAME + "\campuspulse_pg.log"
$LocalFront  = "C:\Users\" + $env:USERNAME + "\campuspulse_frontend"

Write-Host ""
Write-Host "  CampusPulse AI - Starting Up" -ForegroundColor Cyan
Write-Host ""

# 1. PostgreSQL
Write-Host "[1/3] PostgreSQL (port 5433)..." -ForegroundColor Yellow
$pgStatus = pg_ctl status -D $DataDir 2>&1
if ($pgStatus -match "server is running") {
    Write-Host "      Already running" -ForegroundColor Green
} else {
    pg_ctl -D $DataDir -l $LogFile start 2>&1 | Out-Null
    Start-Sleep -Seconds 5
    Write-Host "      Started on port 5433" -ForegroundColor Green
}

# 2. Backend
Write-Host "[2/3] Backend (port 5000)..." -ForegroundColor Yellow
$beTest = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue
if ($beTest) {
    Write-Host "      Already running" -ForegroundColor Green
} else {
    $backendPath = Join-Path $ProjectRoot "backend"
    Start-Process powershell -ArgumentList "-NoExit -Command Set-Location '$backendPath'; node dist\index.js"
    Start-Sleep -Seconds 5
    Write-Host "      Started" -ForegroundColor Green
}

# 3. Frontend (runs from LOCAL C:\ path to avoid Z:\ network drive EPERM error)
Write-Host "[3/3] Frontend (port 3000)..." -ForegroundColor Yellow
$feTest = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($feTest) {
    Write-Host "      Already running" -ForegroundColor Green
} else {
    if (-not (Test-Path "$LocalFront\node_modules\vite")) {
        Write-Host "      node_modules missing - copying src files..." -ForegroundColor Yellow
        New-Item -ItemType Directory -Path $LocalFront -Force | Out-Null
        foreach ($item in @("src","public","index.html","package.json","vite.config.ts","tailwind.config.js","postcss.config.js","tsconfig.json","tsconfig.node.json")) {
            $s = Join-Path $ProjectRoot "frontend\$item"
            if (Test-Path $s) { Copy-Item $s "$LocalFront\$item" -Recurse -Force }
        }
        Set-Content "$LocalFront\.env" "VITE_API_URL=http://localhost:5000/api"
        # Install packages
        $env:NODE_TLS_REJECT_UNAUTHORIZED = "0"
        npm config set registry https://registry.npmmirror.com 2>&1 | Out-Null
        Push-Location $LocalFront
        npm install 2>&1 | Out-Null
        Pop-Location
    }
    Start-Process powershell -ArgumentList "-NoExit -Command Set-Location '$LocalFront'; node node_modules\vite\bin\vite.js --port 3000"
    Start-Sleep -Seconds 8
    Write-Host "      Started from local C:\ path" -ForegroundColor Green
}

Write-Host ""
Write-Host "  All services running!" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend  ->  http://localhost:3000" -ForegroundColor White
Write-Host "  Backend   ->  http://localhost:5000" -ForegroundColor White
Write-Host ""
Write-Host "  Demo login (password: CampusPulse@123)" -ForegroundColor White
Write-Host "  Student   ->  student.arun@campuspulse.edu" -ForegroundColor Gray
Write-Host "  Faculty   ->  faculty.rani@campuspulse.edu" -ForegroundColor Gray
Write-Host "  HOD       ->  hod.cse@campuspulse.edu" -ForegroundColor Gray
Write-Host "  Admin     ->  admin@campuspulse.edu" -ForegroundColor Gray
Write-Host "  Principal ->  principal@campuspulse.edu" -ForegroundColor Gray
Write-Host ""

Start-Process "http://localhost:3000"

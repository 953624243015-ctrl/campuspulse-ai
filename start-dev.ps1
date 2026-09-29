# CampusPulse AI – Local Development Startup Script (PowerShell)
# Run this from the project root: .\start-dev.ps1

Write-Host "Starting CampusPulse AI Development Environment..." -ForegroundColor Cyan

# 1. Start PostgreSQL + Redis via Docker Compose
Write-Host "`n[1/4] Starting database services (PostgreSQL + Redis)..." -ForegroundColor Yellow
docker compose up postgres redis -d

Write-Host "Waiting for PostgreSQL to be ready..." -ForegroundColor Gray
Start-Sleep -Seconds 8

# 2. Install backend dependencies if needed
if (-Not (Test-Path "backend\node_modules")) {
    Write-Host "`n[2/4] Installing backend dependencies..." -ForegroundColor Yellow
    Push-Location backend
    npm install
    Pop-Location
} else {
    Write-Host "`n[2/4] Backend dependencies already installed." -ForegroundColor Green
}

# 3. Install frontend dependencies if needed
if (-Not (Test-Path "frontend\node_modules")) {
    Write-Host "`n[3/4] Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location frontend
    npm install
    Pop-Location
} else {
    Write-Host "`n[3/4] Frontend dependencies already installed." -ForegroundColor Green
}

Write-Host "`n[4/4] Starting services in separate terminals..." -ForegroundColor Yellow

# Start backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\backend'; Write-Host 'Backend starting...' -ForegroundColor Cyan; npm run dev"

# Start frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\frontend'; Write-Host 'Frontend starting...' -ForegroundColor Cyan; npm run dev"

# Start AI service (requires Python + venv)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\ai-service'; Write-Host 'AI Service starting...' -ForegroundColor Cyan; python app.py"

Write-Host "`n✅ CampusPulse AI is starting up!" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend  → http://localhost:3000" -ForegroundColor White
Write-Host "  Backend   → http://localhost:5000" -ForegroundColor White
Write-Host "  AI Service→ http://localhost:8000" -ForegroundColor White
Write-Host ""
Write-Host "Demo Accounts (password: CampusPulse@123):" -ForegroundColor Yellow
Write-Host "  Student  → student.arun@campuspulse.edu" -ForegroundColor Gray
Write-Host "  Faculty  → faculty.rani@campuspulse.edu" -ForegroundColor Gray
Write-Host "  HOD      → hod.cse@campuspulse.edu" -ForegroundColor Gray
Write-Host "  Admin    → admin@campuspulse.edu" -ForegroundColor Gray
Write-Host "  Principal→ principal@campuspulse.edu" -ForegroundColor Gray

# CampusPulse AI – Database Setup Script
# Run this from the project root in PowerShell:
#   .\setup-db.ps1 -PgPassword "your_postgres_password"
#
# Or if you don't know your postgres password, use pgAdmin 4:
#   See the "Manual Setup" section at the bottom of this file.

param(
    [Parameter(Mandatory=$true)]
    [string]$PgPassword,
    [string]$PgHost = "127.0.0.1",
    [int]$PgPort = 5432,
    [string]$PgSuperUser = "postgres"
)

$env:PATH = "C:\Program Files\PostgreSQL\18\bin;$env:PATH"
$env:PGPASSWORD = $PgPassword

Write-Host ""
Write-Host "CampusPulse AI – Database Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# ── 1. Test connection ────────────────────────────────────────────────────────
Write-Host "`n[1/5] Testing PostgreSQL connection..." -ForegroundColor Yellow
$test = psql -U $PgSuperUser -h $PgHost -p $PgPort -c "SELECT version();" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Cannot connect to PostgreSQL." -ForegroundColor Red
    Write-Host "  Password provided may be wrong, or the service is not running." -ForegroundColor Red
    Write-Host ""
    Write-Host "  Check the service:  services.msc → postgresql-x64-18 → must be Running" -ForegroundColor Yellow
    Write-Host "  Retry command:      .\setup-db.ps1 -PgPassword `"YourCorrectPassword`"" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  If you forgot your postgres password, open pgAdmin 4 from the Start Menu" -ForegroundColor Yellow
    Write-Host "  and follow the Manual Setup instructions at the bottom of this file." -ForegroundColor Yellow
    exit 1
}
Write-Host "  Connected successfully!" -ForegroundColor Green

# ── 2. Create user ────────────────────────────────────────────────────────────
Write-Host "`n[2/5] Creating database user 'campuspulse'..." -ForegroundColor Yellow
psql -U $PgSuperUser -h $PgHost -p $PgPort -c @"
DO `$`$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'campuspulse') THEN
    CREATE USER campuspulse WITH PASSWORD 'campuspulse_secret';
    RAISE NOTICE 'User campuspulse created.';
  ELSE
    ALTER USER campuspulse WITH PASSWORD 'campuspulse_secret';
    RAISE NOTICE 'User campuspulse password updated.';
  END IF;
END `$`$;
"@ 2>&1 | Out-Null
Write-Host "  Done." -ForegroundColor Green

# ── 3. Create database ────────────────────────────────────────────────────────
Write-Host "`n[3/5] Creating database 'campuspulse'..." -ForegroundColor Yellow
$exists = psql -U $PgSuperUser -h $PgHost -p $PgPort -tAc "SELECT 1 FROM pg_database WHERE datname='campuspulse'" 2>&1
if ($exists -match "1") {
    Write-Host "  Database already exists – skipping creation." -ForegroundColor Green
} else {
    psql -U $PgSuperUser -h $PgHost -p $PgPort -c "CREATE DATABASE campuspulse OWNER campuspulse ENCODING 'UTF8';" 2>&1 | Out-Null
    Write-Host "  Database 'campuspulse' created." -ForegroundColor Green
}
psql -U $PgSuperUser -h $PgHost -p $PgPort -c "GRANT ALL PRIVILEGES ON DATABASE campuspulse TO campuspulse;" 2>&1 | Out-Null

# ── 4. Load schema ────────────────────────────────────────────────────────────
Write-Host "`n[4/5] Loading schema..." -ForegroundColor Yellow
$env:PGPASSWORD = "campuspulse_secret"
$schemaFile = "$PSScriptRoot\backend\src\db\schema.sql"

$schemaOut = psql -U campuspulse -h $PgHost -p $PgPort -d campuspulse -f "$schemaFile" 2>&1
if ($LASTEXITCODE -ne 0) {
    $errors = $schemaOut | Select-String "ERROR" | Where-Object { $_ -notmatch "already exists" }
    if ($errors) {
        Write-Host "  Schema errors:" -ForegroundColor Yellow
        $errors | ForEach-Object { Write-Host "    $_" -ForegroundColor Yellow }
    } else {
        Write-Host "  Schema applied (some objects already existed – OK)." -ForegroundColor Green
    }
} else {
    Write-Host "  Schema loaded successfully." -ForegroundColor Green
}

# ── 5. Load seed data ─────────────────────────────────────────────────────────
Write-Host "`n[5/5] Loading seed / demo data..." -ForegroundColor Yellow
$seedFile = "$PSScriptRoot\backend\src\db\seed.sql"
$seedOut = psql -U campuspulse -h $PgHost -p $PgPort -d campuspulse -f "$seedFile" 2>&1
if ($LASTEXITCODE -ne 0) {
    $errors = $seedOut | Select-String "ERROR" | Where-Object { $_ -notmatch "duplicate key|already exists|violates unique" }
    if ($errors) {
        Write-Host "  Seed errors:" -ForegroundColor Yellow
        $errors | Select-Object -First 5 | ForEach-Object { Write-Host "    $_" -ForegroundColor Yellow }
    } else {
        Write-Host "  Seed data applied (duplicates skipped – OK)." -ForegroundColor Green
    }
} else {
    Write-Host "  Seed data loaded successfully." -ForegroundColor Green
}

# ── Update .env files ─────────────────────────────────────────────────────────
Write-Host "`nUpdating .env files..." -ForegroundColor Yellow
$connStr = "postgresql://campuspulse:campuspulse_secret@${PgHost}:${PgPort}/campuspulse"

$backendEnv = Get-Content "$PSScriptRoot\backend\.env" -Raw
$backendEnv = $backendEnv -replace "DATABASE_URL=.*", "DATABASE_URL=$connStr"
Set-Content "$PSScriptRoot\backend\.env" $backendEnv -Encoding UTF8

$aiEnv = Get-Content "$PSScriptRoot\ai-service\.env" -Raw
$aiEnv = $aiEnv -replace "DATABASE_URL=.*", "DATABASE_URL=$connStr"
Set-Content "$PSScriptRoot\ai-service\.env" $aiEnv -Encoding UTF8

Write-Host "  backend\.env  ✓" -ForegroundColor Green
Write-Host "  ai-service\.env  ✓" -ForegroundColor Green

# ── Done ──────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Database setup complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host ""
Write-Host "  1. Start backend (new terminal):"  -ForegroundColor Yellow
Write-Host "     cd `"z:\campus pulseai\backend`"" -ForegroundColor Gray
Write-Host "     npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Start frontend (another terminal):" -ForegroundColor Yellow
Write-Host "     cd `"z:\campus pulseai\frontend`"" -ForegroundColor Gray
Write-Host "     npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Open browser: http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Demo login (password: CampusPulse@123):" -ForegroundColor White
Write-Host "    Student:   student.arun@campuspulse.edu" -ForegroundColor Gray
Write-Host "    Faculty:   faculty.rani@campuspulse.edu" -ForegroundColor Gray
Write-Host "    HOD:       hod.cse@campuspulse.edu" -ForegroundColor Gray
Write-Host "    Admin:     admin@campuspulse.edu" -ForegroundColor Gray
Write-Host "    Principal: principal@campuspulse.edu" -ForegroundColor Gray
Write-Host ""

# ══════════════════════════════════════════════════════════════════════════════
# MANUAL SETUP (if you don't know your postgres password)
# ══════════════════════════════════════════════════════════════════════════════
# 1. Open pgAdmin 4 from the Windows Start Menu
# 2. Connect to your local server (localhost:5432)
# 3. Open the Query Tool (Tools → Query Tool)
# 4. Run this SQL:
#
#    CREATE USER campuspulse WITH PASSWORD 'campuspulse_secret';
#    CREATE DATABASE campuspulse OWNER campuspulse ENCODING 'UTF8';
#    GRANT ALL PRIVILEGES ON DATABASE campuspulse TO campuspulse;
#
# 5. Open a new Query Tool connected to the campuspulse database and run:
#    - The contents of: backend\src\db\schema.sql
#    - Then:           backend\src\db\seed.sql
#
# OR: Reset your postgres password via pgAdmin:
#    Right-click on the postgres role → Properties → Password → set a new one
#    Then re-run: .\setup-db.ps1 -PgPassword "your_new_password"
# ══════════════════════════════════════════════════════════════════════════════

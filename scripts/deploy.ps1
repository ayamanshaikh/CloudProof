<#
.SYNOPSIS
    CloudProof Turnkey Deployment Script (Windows PowerShell)

.DESCRIPTION
    Automates containerized orchestration for CloudProof on Windows systems.
    Supports Production (Nginx + PostgreSQL), Zero-Cost College Lab (SQLite), and Dev modes.

.EXAMPLE
    .\scripts\deploy.ps1 -Mode Prod
    .\scripts\deploy.ps1 -Mode Sqlite
    .\scripts\deploy.ps1 -Action Down
#>

[CmdletBinding()]
param (
    [ValidateSet("Prod", "Sqlite", "Dev")]
    [string]$Mode = "Prod",

    [ValidateSet("Up", "Down", "Status", "Logs")]
    [string]$Action = "Up"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
Set-Location $RootDir

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "        CloudProof Deployment Orchestrator (Windows)  " -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

# 1. Validate Docker availability
$DockerCmd = Get-Command "docker" -ErrorAction SilentlyContinue
if (-not $DockerCmd) {
    Write-Host "[ERROR] Docker is not installed or not in system PATH." -ForegroundColor Red
    Write-Host "To run containerized CloudProof, please install Docker Desktop for Windows:" -ForegroundColor Yellow
    Write-Host "  https://docs.docker.com/desktop/install/windows-install/" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Note: For local execution without Docker on Windows:" -ForegroundColor Cyan
    Write-Host "  Backend: py -3.13 -m uvicorn app.main:app --reload (in backend/)" -ForegroundColor Gray
    Write-Host "  Frontend: npm run dev (in frontend/)" -ForegroundColor Gray
    exit 1
}

# 2. Determine Compose Command
$ComposeCmd = "docker compose"

# 3. Handle Action: Down
if ($Action -eq "Down") {
    Write-Host "[*] Stopping CloudProof containers..." -ForegroundColor Yellow
    & docker compose -f docker-compose.prod.yml down --remove-orphans 2>$null
    & docker compose -f docker-compose.sqlite.yml down --remove-orphans 2>$null
    & docker compose -f docker-compose.yml down --remove-orphans 2>$null
    Write-Host "[✓] All CloudProof containers stopped cleanly." -ForegroundColor Green
    exit 0
}

# 4. Handle Action: Status
if ($Action -eq "Status") {
    Write-Host "[*] Checking CloudProof Container Status:" -ForegroundColor Cyan
    & docker compose -f docker-compose.prod.yml ps
    & docker compose -f docker-compose.sqlite.yml ps
    & docker compose -f docker-compose.yml ps
    exit 0
}

# 5. Handle Action: Logs
if ($Action -eq "Logs") {
    $composeFile = switch ($Mode) {
        "Prod" { "docker-compose.prod.yml" }
        "Sqlite" { "docker-compose.sqlite.yml" }
        "Dev" { "docker-compose.yml" }
    }
    & docker compose -f $composeFile logs -f --tail=100
    exit 0
}

# 6. Handle Action: Up
switch ($Mode) {
    "Prod" {
        Write-Host "[*] Launching Full Production Stack (Nginx + PostgreSQL + Backend + Frontend)..." -ForegroundColor Green
        if (-not (Test-Path ".env.production")) {
            Write-Host "[!] .env.production not found. Initializing from template..." -ForegroundColor Yellow
            Copy-Item ".env.production.example" ".env.production"
            Write-Host "[!] Created .env.production. Please update JWT_SECRET and DB passwords." -ForegroundColor Yellow
        }
        & docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
        Start-Sleep -Seconds 5
        & docker compose -f docker-compose.prod.yml ps
        Write-Host "[✓] CloudProof is accessible at: http://localhost" -ForegroundColor Green
        Write-Host "[✓] API Gateway is accessible at: http://localhost/api/v1/health" -ForegroundColor Green
    }

    "Sqlite" {
        Write-Host "[*] Launching Lightweight Zero-Cost College Lab Stack (SQLite + Backend + Frontend)..." -ForegroundColor Green
        if (-not (Test-Path "data")) {
            New-Item -ItemType Directory -Path "data" | Out-Null
        }
        & docker compose -f docker-compose.sqlite.yml up -d --build
        Start-Sleep -Seconds 5
        & docker compose -f docker-compose.sqlite.yml ps
        Write-Host "[✓] Frontend is accessible at: http://localhost:3000" -ForegroundColor Green
        Write-Host "[✓] Backend API is accessible at: http://localhost:8000/api/v1/health" -ForegroundColor Green
    }

    "Dev" {
        Write-Host "[*] Launching Development Stack (PostgreSQL + Backend + Frontend)..." -ForegroundColor Green
        & docker compose -f docker-compose.yml up -d --build
        Start-Sleep -Seconds 5
        & docker compose -f docker-compose.yml ps
        Write-Host "[✓] Frontend: http://localhost:3000 | Backend: http://localhost:8000" -ForegroundColor Green
    }
}

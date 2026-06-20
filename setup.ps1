# Bimbel Platform - Windows Setup Script (PowerShell)
# Run from project root: .\setup.ps1

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Bimbel Platform - Setup Script" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Check Node.js
try { $null = Get-Command node -ErrorAction Stop } catch { Write-Host "Error: Node.js is required." -ForegroundColor Red; exit 1 }

# Check PHP
try { $null = Get-Command php -ErrorAction Stop } catch { Write-Host "Error: PHP (>=8.2) is required." -ForegroundColor Red; exit 1 }

# Check Composer
$composer = "composer"
try { $null = Get-Command composer -ErrorAction Stop } catch {
    Write-Host "Composer not found. Looking for composer.phar..."
    if (Test-Path "composer.phar") {
        $composer = "php composer.phar"
    } elseif (Test-Path "backend\composer.phar") {
        $composer = "php backend\composer.phar"
    } else {
        Write-Host "Error: Composer is required." -ForegroundColor Red
        exit 1
    }
}

# Check Docker (optional)
try {
    $null = Get-Command docker -ErrorAction Stop
    Write-Host "Docker found. Starting services..."
    docker compose up -d postgres redis minio mailhog 2>$null
    Write-Host "Waiting for PostgreSQL..."
    Start-Sleep -Seconds 5
} catch {
    Write-Host "Docker not available. Start PostgreSQL manually." -ForegroundColor Yellow
}

# Backend Setup
Write-Host "`n--- Backend Setup ---" -ForegroundColor Green
Push-Location backend

Write-Host "Installing Composer dependencies..."
Invoke-Expression "$composer install --no-interaction"

if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
    Write-Host "Generated .env from .env.example"
}

php artisan key:generate --force

Write-Host "Running database migrations..."
php artisan migrate --force

Write-Host "Seeding database..."
php artisan db:seed --force

try { php artisan storage:link 2>$null } catch {}

Pop-Location

# Frontend Setup
Write-Host "`n--- Frontend Setup ---" -ForegroundColor Green
Push-Location frontend

Write-Host "Installing npm dependencies..."
npm install

Pop-Location

Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Default accounts (password: 'password'):"
Write-Host "  Super Admin:  admin@bimbel.co.id"
Write-Host "  Admin Cabang: admin.cabang@bimbel.co.id"
Write-Host "  Tutor:        tutor@bimbel.co.id"
Write-Host "  Siswa:        siswa@bimbel.co.id"
Write-Host ""
Write-Host "Start development servers:"
Write-Host "  Backend:  cd backend; php artisan serve"
Write-Host "  Frontend: cd frontend; npm run dev"
Write-Host ""
Write-Host "  Website:       http://localhost:3000"
Write-Host "  LMS:           http://localhost:3001"
Write-Host "  Admin Finance: http://localhost:3002"
Write-Host "  API:           http://localhost:8000"
Write-Host "  Mailhog:       http://localhost:8025"
Write-Host "  MinIO Console: http://localhost:9001"

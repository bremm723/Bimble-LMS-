#!/bin/bash
# Bimbel Platform - Auto Setup Script
# Run this from the project root directory

set -e

echo "========================================="
echo "  Bimbel Platform - Setup Script"
echo "========================================="

# Check for required tools
command -v node >/dev/null 2>&1 || { echo "Error: Node.js is required but not installed."; exit 1; }
command -v php >/dev/null 2>&1 || { echo "Error: PHP (>=8.2) is required but not installed."; exit 1; }

# Check Composer (download if missing)
if ! command -v composer >/dev/null 2>&1; then
    echo "Composer not found. Downloading..."
    php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
    php composer-setup.php --install-dir=. --filename=composer.phar
    rm composer-setup.php
    COMPOSER="php composer.phar"
else
    COMPOSER="composer"
fi

# Check Docker (optional)
if command -v docker >/dev/null 2>&1; then
    echo "Docker found. Starting services..."
    docker compose up -d postgres redis minio mailhog 2>/dev/null || echo "Docker Compose not available. Skipping services."
    echo "Waiting for PostgreSQL to be ready..."
    sleep 5
fi

echo ""
echo "--- Backend Setup ---"
cd backend

# Install PHP dependencies
echo "Installing Composer dependencies..."
$COMPOSER install --no-interaction

# Copy .env if not exists
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Generated .env from .env.example"
fi

# Generate app key
php artisan key:generate --force

# Run migrations
echo "Running database migrations..."
php artisan migrate --force

# Run seeders
echo "Seeding database..."
php artisan db:seed --force

# Create storage link
php artisan storage:link 2>/dev/null || true

cd ..

echo ""
echo "--- Frontend Setup ---"
cd frontend

# Install Node dependencies
echo "Installing npm dependencies..."
npm install

cd ..

echo ""
echo "========================================="
echo "  Setup Complete!"
echo "========================================="
echo ""
echo "Default accounts (password: 'password'):"
echo "  Super Admin:  admin@bimbel.co.id"
echo "  Admin Cabang: admin.cabang@bimbel.co.id"
echo "  Tutor:        tutor@bimbel.co.id"
echo "  Siswa:        siswa@bimbel.co.id"
echo ""
echo "Start development servers:"
echo "  Backend:  cd backend && php artisan serve"
echo "  Frontend: cd frontend && npm run dev"
echo ""
echo "  Website:       http://localhost:3000"
echo "  LMS:           http://localhost:3001"
echo "  Admin Finance: http://localhost:3002"
echo "  API:           http://localhost:8000"
echo "  Mailhog:       http://localhost:8025"
echo "  MinIO Console: http://localhost:9001"
echo ""

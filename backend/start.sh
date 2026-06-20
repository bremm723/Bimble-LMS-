#!/bin/sh
set -e

echo "===== Starting Bimble LMS Backend ====="

cd /app

# ---- Setup .env dari environment variables HuggingFace ----
if [ ! -f /app/.env ]; then
    echo "Creating .env from environment variables..."
    cp /app/.env.example /app/.env
fi

# Override nilai penting dari env HuggingFace Secrets
# Menggunakan "EOF" agar tanda $ pada variabel dibaca dengan benar oleh builder
cat > /app/.env << "EOF"
APP_NAME="Bimble LMS"
APP_ENV=production
APP_KEY=${APP_KEY}
APP_DEBUG=true
APP_URL=https://bremm723-bimbel-lms.hf.space

LOG_CHANNEL=stderr
LOG_LEVEL=error

DB_CONNECTION=sqlite
DB_DATABASE=/app/database/database.sqlite

BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120

SANCTUM_STATEFUL_DOMAINS=bremm723-bimble-lms.hf.space,db92-114-4-78-17.ngrok-free.app,29f4-114-4-78-17.ngrok-free.app

CORS_ALLOWED_ORIGINS=*
EOF

# Generate APP_KEY jika masih kosong
if [ -z "$APP_KEY" ]; then
    echo "APP_KEY not set, generating..."
    php artisan key:generate --force
fi

# ---- Setup Storage & Database Permissions ----
echo "Setting up storage and database permissions..."
mkdir -p /app/storage/app/public
mkdir -p /app/storage/framework/cache/data
mkdir -p /app/storage/framework/sessions
mkdir -p /app/storage/framework/views
mkdir -p /app/storage/logs

# Memastikan folder database dan file SQLite internal terbentuk
mkdir -p /app/database
touch /app/database/database.sqlite

# Berikan hak akses penuh (baca & tulis) ke folder storage, cache, dan database
chmod -R 777 /app/storage /app/bootstrap/cache /app/database
chown -R www-data:www-data /app/storage /app/bootstrap/cache /app/database /app/database/database.sqlite
chmod 666 /app/database/database.sqlite

# ---- Run database migration TERLEBIH DAHULU ----
echo "Running migrations..."
php artisan migrate --force

# ---- Run seeder jika database kosong ----
echo "Seeding database if empty..."
php artisan db:seed --force 2>/dev/null || echo "Seeding skipped (already seeded or no seeders)"

# ---- Clear dan cache ulang config ----
echo "Clearing and caching config..."
php artisan config:clear
php artisan cache:clear

# ---- Start PHP-FPM ----
echo "Starting PHP-FPM..."
php-fpm -D

# Tunggu PHP-FPM siap
sleep 2

echo "===== Server ready at port 7860 ====="

# ---- Start Nginx (foreground) ----
exec nginx -g "daemon off;"
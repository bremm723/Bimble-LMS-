FROM php:8.2-fpm-alpine

# Install system dependencies & nginx
RUN apk add --no-cache \
    nginx \
    wget \
    git \
    curl \
    sqlite \
    shadow \
    libpng-dev \
    oniguruma-dev \
    libxml2-dev \
    zip \
    unzip

# Install PHP extensions untuk Laravel (termasuk SQLite!)
RUN docker-php-ext-install \
    pdo \
    pdo_mysql \
    pdo_sqlite \
    mbstring \
    exif \
    pcntl \
    bcmath \
    gd \
    xml

# Install Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

WORKDIR /app
COPY . .

# Install dependencies Laravel
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Buat SQLite database
RUN mkdir -p /app/database && touch /app/database/database.sqlite

# Set permissions
RUN chmod -R 775 /app/storage /app/bootstrap/cache \
    && chown -R www-data:www-data /app/storage /app/bootstrap/cache /app/database

# Konfigurasi Nginx untuk HuggingFace (port 7860)
RUN echo 'server { \
    listen 7860; \
    root /app/public; \
    index index.php index.html; \
    client_max_body_size 50M; \
    location / { \
        try_files $uri $uri/ /index.php?$query_string; \
    } \
    location ~ \.php$ { \
        try_files $uri =404; \
        fastcgi_split_path_info ^(.+\.php)(/.+)$; \
        fastcgi_pass 127.0.0.1:9000; \
        fastcgi_index index.php; \
        include fastcgi_params; \
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name; \
        fastcgi_param PATH_INFO $fastcgi_path_info; \
    } \
    location ~ /\.ht { \
        deny all; \
    } \
}' > /etc/nginx/http.d/default.conf

# Buat startup script langsung di dalam Dockerfile (tanpa COPY file eksternal)
RUN printf '#!/bin/sh\nset -e\ncd /app\n\n# Setup .env\ncat > /app/.env << ENVEOF\nAPP_NAME="Bimble LMS"\nAPP_ENV=production\nAPP_KEY=${APP_KEY:-}\nAPP_DEBUG=false\nAPP_URL=https://bremm723-bimble-lms.hf.space\nLOG_CHANNEL=stderr\nLOG_LEVEL=error\nDB_CONNECTION=sqlite\nDB_DATABASE=/app/database/database.sqlite\nCACHE_DRIVER=file\nSESSION_DRIVER=file\nQUEUE_CONNECTION=sync\nCORS_ALLOWED_ORIGINS=*\nENVEOF\n\n# Generate key jika kosong\nif [ -z "$APP_KEY" ]; then\n    php artisan key:generate --force\nfi\n\n# Fix permissions\nmkdir -p /app/storage/framework/cache/data /app/storage/framework/sessions /app/storage/framework/views /app/storage/logs\nchmod -R 775 /app/storage /app/bootstrap/cache\nchown -R www-data:www-data /app/storage /app/bootstrap/cache\n\n# Clear config lama & migrate\nphp artisan config:clear\nphp artisan migrate --force\nphp artisan db:seed --force 2>/dev/null || true\n\necho "=== Starting PHP-FPM and Nginx ==="\nphp-fpm -D\nsleep 2\nexec nginx -g "daemon off;"\n' > /start.sh \
    && chmod +x /start.sh

EXPOSE 7860

CMD ["/start.sh"]

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

# Set working directory
WORKDIR /app
COPY . .

# Install dependencies Laravel (tanpa dev, optimized)
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Buat file SQLite database jika belum ada
RUN mkdir -p /app/database && touch /app/database/database.sqlite

# Set permissions untuk storage dan cache
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

# Salin startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 7860

CMD ["/start.sh"]

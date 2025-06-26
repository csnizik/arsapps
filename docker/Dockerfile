# Multi-stage Dockerfile for Drupal 11 Production
# Following DEVELOPER_NOTES.md multi-stage build strategy

# Stage 1: Composer Dependencies
FROM composer:2.7 AS composer_build
WORKDIR /app

# Install required PHP extensions for Drupal
RUN apk add --no-cache \
    freetype-dev \
    libjpeg-turbo-dev \
    libpng-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) gd \
    && php -m | grep gd

# Copy Composer files first for better layer caching
COPY composer.json composer.lock ./

# Install dependencies without dev packages or scripts
RUN composer install --no-dev --no-scripts --prefer-dist \
    && ls -la /app/ \
    && echo "Checking if vendor directory exists:" \
    && ls -la /app/vendor/ || echo "Vendor directory not found"

# Copy all source code
COPY . .

# Complete Composer install with optimized autoloader
RUN composer install --no-dev --optimize-autoloader \
    && echo "Final vendor directory check:" \
    && ls -la /app/vendor/ \
    && echo "Autoload file check:" \
    && ls -la /app/vendor/autoload.php

# Stage 2: Frontend Asset Compilation
FROM node:22-alpine AS frontend_build
WORKDIR /app

# Copy theme package files and install theme dependencies
COPY web/themes/custom/arsapps_theme/package*.json ./web/themes/custom/arsapps_theme/
WORKDIR /app/web/themes/custom/arsapps_theme
RUN npm ci

# Copy only necessary files for building (exclude dev tools and configs from final image)
COPY web/themes/custom/arsapps_theme/webpack.config.js ./
COPY web/themes/custom/arsapps_theme/js/ ./js/
COPY web/themes/custom/arsapps_theme/scss/ ./scss/
COPY web/themes/custom/arsapps_theme/css/ ./css/

# Build frontend assets - creates dist/ directory with compiled assets
RUN npm run build

# Stage 3: Production Runtime
FROM drupal:11.1.5-php8.3-fpm-bookworm AS production

# Override the base image's working directory to ensure consistency
WORKDIR /var/www/html

# Install additional PHP extensions and tools needed for Drupal and healthcheck
RUN apt-get update && apt-get install -y \
    libzip-dev \
    curl \
    && docker-php-ext-install zip \
    && rm -rf /var/lib/apt/lists/*

# Create secure user structure as per DEVELOPER_NOTES.md
RUN groupadd -r deploy && useradd -r -g deploy -G www-data deploy

# Copy Composer dependencies (production only, no dev tools)
COPY --from=composer_build --chown=deploy:www-data /app/vendor ./vendor
# Verify vendor directory was copied successfully
RUN ls -la /var/www/html/vendor/ && ls -la /var/www/html/vendor/autoload.php
COPY --from=composer_build --chown=deploy:www-data /app/web ./web
COPY --from=composer_build --chown=deploy:www-data /app/composer.json ./composer.json
COPY --from=composer_build --chown=deploy:www-data /app/composer.lock ./composer.lock

# Copy ONLY compiled frontend assets (exclude source files and dev tools)
COPY --from=frontend_build --chown=deploy:www-data /app/web/themes/custom/arsapps_theme/dist ./web/themes/custom/arsapps_theme/dist

# Copy configuration files
COPY --chown=deploy:www-data config/ ./config/

# Apply secure file permissions following DEVELOPER_NOTES.md security practices
# Files: 640 (owner: rw, group: r, other: none)
RUN find . -type f -exec chmod 640 {} \;

# Directories: 750 (owner: rwx, group: rx, other: none)  
RUN find . -type d -exec chmod 750 {} \;

# Create and configure files directory with special permissions
# Files directory: 770 (both owner and group: rwx, other: none)
RUN mkdir -p web/sites/default/files && \
    chmod 770 web/sites/default/files && \
    chown deploy:www-data web/sites/default/files

# Ensure settings.php has secure permissions (contains sensitive database credentials)
RUN if [ -f web/sites/default/settings.php ]; then \
        chmod 640 web/sites/default/settings.php; \
    fi

# Copy custom healthcheck script
COPY --chown=deploy:www-data docker/healthcheck.sh /usr/local/bin/healthcheck.sh
RUN chmod +x /usr/local/bin/healthcheck.sh

# Final ownership pass to ensure deploy user owns files, www-data group can read
RUN chown -R deploy:www-data /var/www/html

# Ensure we're in the correct working directory for runtime
WORKDIR /var/www/html

# Run container as non-root user for security
USER deploy:www-data

# Expose port 9000 for PHP-FPM
EXPOSE 9000

# Comprehensive health check that verifies site functionality
HEALTHCHECK --interval=30s --timeout=15s --start-period=120s --retries=3 \
    CMD /usr/local/bin/healthcheck.sh
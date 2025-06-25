# Multi-stage Dockerfile for Drupal 11 Production
# Following DEVELOPER_NOTES.md multi-stage build strategy

# Stage 1: Composer Dependencies
FROM composer:2.7 AS composer_build
WORKDIR /app

# Copy Composer files first for better layer caching
COPY composer.json composer.lock ./

# Install dependencies without dev packages, autoloader, or scripts
RUN composer install --no-dev --no-autoloader --no-scripts --prefer-dist

# Copy all source code
COPY . .

# Complete Composer install with optimized autoloader
RUN composer install --no-dev --optimize-autoloader

# Stage 2: Frontend Asset Compilation
FROM node:22-alpine AS frontend_build
WORKDIR /app

# Copy root package files first for better layer caching
COPY package*.json ./

# Install root dependencies for webpack config
RUN npm ci --only=production

# Copy theme package files and install theme dependencies
COPY web/themes/custom/arsapps_theme/package*.json ./web/themes/custom/arsapps_theme/
WORKDIR /app/web/themes/custom/arsapps_theme
RUN npm ci

# Copy theme source files and build configuration
WORKDIR /app
COPY webpack.config.js ./
COPY web/themes/custom/arsapps_theme/ ./web/themes/custom/arsapps_theme/

# Build frontend assets for theme
WORKDIR /app/web/themes/custom/arsapps_theme
RUN npm run build

# Also run root build for any global assets
WORKDIR /app
RUN npm run build

# Stage 3: Production Runtime
FROM drupal:11.1.5-php8.3-fpm-bookworm AS production
WORKDIR /var/www/html

# Create secure user structure as per DEVELOPER_NOTES.md
RUN groupadd -r deploy && useradd -r -g deploy -G www-data deploy

# Copy Composer dependencies (excluding dev tools)
COPY --from=composer_build --chown=deploy:www-data /app/vendor ./vendor
COPY --from=composer_build --chown=deploy:www-data /app/web ./web
COPY --from=composer_build --chown=deploy:www-data /app/composer.json ./composer.json
COPY --from=composer_build --chown=deploy:www-data /app/composer.lock ./composer.lock

# Copy compiled frontend assets
COPY --from=frontend_build --chown=deploy:www-data /app/web/themes/custom/*/dist ./web/themes/custom/*/dist

# Copy configuration files
COPY --chown=deploy:www-data config/ ./config/

# Apply secure file permissions as per DEVELOPER_NOTES.md
RUN find . -type f -exec chmod 640 {} \; && \
    find . -type d -exec chmod 750 {} \;

# Create and configure files directory with proper permissions
RUN mkdir -p web/sites/default/files && \
    chmod 770 web/sites/default/files && \
    chown deploy:www-data web/sites/default/files

# Ensure settings.php has secure permissions
RUN if [ -f web/sites/default/settings.php ]; then \
        chmod 640 web/sites/default/settings.php; \
    fi

# Install additional PHP extensions needed for Drupal
RUN apt-get update && apt-get install -y \
    libzip-dev \
    && docker-php-ext-install zip \
    && rm -rf /var/lib/apt/lists/*

# Set working directory ownership
RUN chown -R deploy:www-data /var/www/html

# Run as non-root user for security
USER deploy:www-data

# Expose port 9000 for PHP-FPM
EXPOSE 9000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD php-fpm-healthcheck || exit 1
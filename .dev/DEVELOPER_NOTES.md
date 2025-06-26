<!--
Developer Notes
This file is maintained automatically via scoped AI prompts.
Purpose: To capture infrastructure, dev workflow, testing, and deployment standards for this Drupal 11 project.
Treat this as a living internal reference for developers and engineers working on this system.
Do not delete this comment. If you reorganize sections, do so thoughtfully and preserve continuity.
-->

# Developer Notes

This document captures technical decisions, practices, standards, and implementation details for this Drupal 11 project. It is updated progressively in response to scoped prompts during the CI/CD and development pipeline buildout process.

Last updated: June 26, 2025 - Updated Docker configuration and deployment pipeline

---

## Composer dependencies

### Core Dependencies

**Drupal Core:**

- `drupal/core-composer-scaffold` – Provides Composer-based scaffolding for Drupal core.
- `drupal/core-project-message` – Displays helpful Composer messages during install/update.
- `drupal/core-recommended` – Locks core and key dependencies to known stable versions.

**Development:**

- `drupal/core-dev` – Provides development and testing tools, including PHPUnit (see testing section).

### Configuration Management Dependencies

**Essential for Government Sites:**

- `drush/drush` – CLI tool for importing/exporting configuration, running updates, and managing deployments.
- Core configuration management tools are included in Drupal 11. No additional contrib required.

### Layout Builder Dependencies

**Core Layout Builder:**

- Built into Drupal 11 core.
- Optional: `drupal/layout_builder_restrictions` – Restrict block usage in Layout Builder to improve editorial safety.


### Testing Dependencies

**PHPUnit & Functional Testing:**

Included in `drupal/core-dev`:

- `phpunit/phpunit` (^10.5.19 || ^11.5.3)
- `phpspec/prophecy-phpunit`
- `behat/mink`
- `behat/mink-browserkit-driver`

**Code Quality & Static Analysis:**

- `drupal/coder` – Enforces Drupal coding standards (`phpcs`).
- `phpstan/phpstan` – PHP static analysis.
- `mglaman/phpstan-drupal` – Drupal integration for PHPStan.

### Government-Specific Considerations

**Accessibility:**

- Drupal core accessibility features are sufficient for most compliance use cases.
- `drupal/field_group` – Organize complex forms for better screen reader behavior.

**Performance:**

- `drupal/memcache` – Supported caching backend.
- `drupal/redis` – Alternative Redis caching backend.

**Content Workflow & Staging:**

- `drupal/workspaces` – Stable in Drupal 11; enables editorial staging.
- `drupal/content_moderation` – Built-in core support for content workflows.

### Key 2025 Updates

- PHPUnit 10+ is required for testing compatibility.
- Symfony 7.3 components are the current stable standard with Drupal 11.
- PHP 8.3+ is the required minimum version for core compatibility.
- Composer’s built-in audit replaces previous community-led advisory packages.
- Workspaces is now considered stable and supported for production staging.

These dependencies provide a secure, testable, and fully-featured foundation for government Drupal 11 websites, supporting Configuration Management, Layout Builder, accessibility, and modern CI/CD pipelines.

---

## Project structure and conventions

<!-- AI appends here when prompted about project layout -->

---

## Docker & DDEV

### DDEV Local Development Environment

DDEV provides the recommended local development environment for Drupal 11 projects as of 2025. It includes built-in support for Xdebug, HTTPS, and email catching without additional configuration complexity.

**Project Initialization:**

```bash
mkdir my-drupal-site && cd my-drupal-site
ddev config --project-type drupal11 --docroot web
ddev composer create drupal/recommended-project -y
```

**Configuration (.ddev/config.yaml):**

```yaml
name: my-drupal-site
type: drupal11          # Can also use 'drupal' (defaults to latest stable)
docroot: web
php_version: "8.3"      # Required minimum for Drupal 11
webserver_type: nginx-fpm
database:
  type: mariadb
  version: "10.11"      # Default, stable choice
additional_hostnames: []
additional_fqdns: []
```

### Xdebug Integration

**Enable/Disable:**

- `ddev xdebug` - Enable Xdebug (performance impact)
- `ddev xdebug off` - Disable when finished debugging

**VS Code Setup:**

1. Run `ddev xdebug` to enable
2. Set breakpoints in VS Code
3. Use "Run and Debug" → "Listen for Xdebug"
4. Ensure VS Code opens project in same folder as DDEV commands

**Drush Debugging:**

- With Drush 13+, use `DRUSH_ALLOW_XDEBUG=1` or `drush --xdebug` for debugging support

### HTTPS Support

DDEV's automatic router handles custom domain names and HTTPS certificates without manual configuration. SSL certificates are managed automatically for all project URLs.

### Email Catching

**Mailpit Integration:**

- DDEV uses Mailpit (replaces deprecated Mailhog) for email capture
- All emails sent by Drupal are automatically caught and viewable in Mailpit interface
- Access via DDEV's web interface or `ddev describe` for URL

**Symfony Mailer Configuration:**

- Use sendmail transport for both local DDEV and production environments
- Configure environment-specific settings files for different mail handling
- Avoid `mail_safety` module with `symfony_mailer` - use `symfony_mailer_log` instead

### Performance Considerations

- Disable Xdebug when not actively debugging to maintain performance
- DDEV is cross-platform tested (macOS, Windows, Linux) for consistent team environments
- After DDEV version updates: `ddev stop` → `ddev config` → `ddev start`

### Add-ons and Extensions

**Custom Commands:**
Add project-specific commands to `.ddev/commands/` directory

**Docker Compose Extensions:**
Use `.ddev/docker-compose.<service>.yaml` for additional services

**Configuration Overrides:**
Use `.ddev/config.<service>.yaml` for service-specific configuration

### Production Docker Images

**Recommended Base Images for Drupal 11 Production (2025):**

**Primary Recommendation:**

- `drupal:11.1.5-php8.3-fpm-bookworm` - Most stable for production
- `drupal:11.1.5-php8.3-apache-bookworm` - Alternative for Apache-based deployments

**Alternative Options:**

- `drupal:11.1.5-php8.4-fpm-bookworm` - For newer PHP features (Drupal 11.1+ only)
- `drupal:11.1.5-php8.3-fpm-alpine` - Lightweight Alpine variant

**PHP Version Recommendations:**

- **PHP 8.3**: Recommended for production stability and ecosystem compatibility
- **PHP 8.4**: Supported in Drupal 11.1+, but less mature ecosystem
- **Minimum**: PHP 8.3 required for Drupal 11

**Image Architecture Choices:**

1. **Nginx + PHP-FPM**: Use `drupal:*-fpm` with separate Nginx container
2. **Apache**: Use `drupal:*-apache` for simpler single-container deployments

**Production Best Practices:**

- Use specific version tags (e.g., `11.1.5`) rather than `latest` for reproducible builds
- Prefer Debian-based images (`bookworm`) over Alpine for production stability
- Alpine images are 95% smaller but may require custom binary compilation
- Implement multi-stage builds to separate build dependencies from runtime

### Multi-Stage Build Strategy

**Recommended Directory Structure:**

```md
/
├── docker/
│   ├── Dockerfile
│   └── nginx/
│       └── default.conf
├── web/                    # Drupal docroot
├── composer.json           # PHP dependencies
├── composer.lock
├── package.json           # Frontend dependencies
├── package-lock.json
├── webpack.config.js      # Asset compilation
└── .dockerignore
```

**Multi-Stage Dockerfile Pattern (2025 Production-Optimized):**

```dockerfile
# Stage 1: Composer Dependencies
FROM composer:2.7 AS composer_build
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-autoloader --no-scripts --prefer-dist
COPY . .
RUN composer install --no-dev --optimize-autoloader

# Stage 2: Frontend Asset Compilation
FROM node:22-alpine AS frontend_build
WORKDIR /app
# Copy theme package files for dependency management
COPY web/themes/custom/arsapps_theme/package*.json ./web/themes/custom/arsapps_theme/
WORKDIR /app/web/themes/custom/arsapps_theme
RUN npm ci

# Copy only source files needed for building (exclude dev configs)
COPY web/themes/custom/arsapps_theme/webpack.config.js ./
COPY web/themes/custom/arsapps_theme/js/ ./js/
COPY web/themes/custom/arsapps_theme/scss/ ./scss/
COPY web/themes/custom/arsapps_theme/css/ ./css/

# Build frontend assets - creates dist/ directory with compiled assets
RUN npm run build

# Stage 3: Production Runtime
FROM drupal:11.1.5-php8.3-fpm-bookworm AS production
WORKDIR /var/www/html

# Install PHP extensions before user creation
RUN apt-get update && apt-get install -y libzip-dev \
    && docker-php-ext-install zip \
    && rm -rf /var/lib/apt/lists/*

# Create secure user structure
RUN groupadd -r deploy && useradd -r -g deploy -G www-data deploy

# Copy production dependencies only (no dev tools)
COPY --from=composer_build --chown=deploy:www-data /app/vendor ./vendor
COPY --from=composer_build --chown=deploy:www-data /app/web ./web
COPY --from=composer_build --chown=deploy:www-data /app/composer.json ./composer.json
COPY --from=composer_build --chown=deploy:www-data /app/composer.lock ./composer.lock

# Copy ONLY compiled frontend assets (no source files or dev tools)
COPY --from=frontend_build --chown=deploy:www-data /app/web/themes/custom/arsapps_theme/dist ./web/themes/custom/arsapps_theme/dist

# Copy configuration files
COPY --chown=deploy:www-data config/ ./config/

# Apply file permissions following best practices
RUN find . -type f -exec chmod 640 {} \; && \
    find . -type d -exec chmod 750 {} \; && \
    mkdir -p web/sites/default/files && \
    chmod 770 web/sites/default/files && \
    chown -R deploy:www-data /var/www/html

# Run as non-root user
USER deploy:www-data
```

**Key Multi-Stage Benefits:**

- **Immutable Images**: No dev tools, package managers, or source files in production
- **Size Optimization**: Final image excludes Node.js, Composer, and build dependencies
- **Layer Caching**: Dependencies install only when package files change
- **Security**: Minimal attack surface with only runtime essentials
- **Compiled Assets Only**: Only `dist/` directory copied, no source files or dev configs
- **Strict File Permissions**: Implements 640/750/770 model

**Build Optimization Techniques (2025):**

- Copy specific source files only (js/, scss/, css/) during frontend build
- Copy `package*.json` before source to leverage Docker layer caching
- Use `npm ci` instead of `npm install` for faster, deterministic builds
- Copy `composer.json` before source code for dependency caching
- Use `--no-dev` flags to exclude development dependencies
- Order build steps by frequency of changes (dependencies → source → assets)
- Install system packages before user creation for better layer optimization

**Production Considerations (2025):**

- Regular base image updates for stability
- Minimize installed packages to reduce container size
- Use multi-stage builds to exclude build-time dependencies from final image
- **Strict Asset Separation**: Only compiled `dist/` assets copied, no source files or configs
- **Enhanced File Permissions**: 640/750/770 model with deploy user ownership
- **Non-root Execution**: Container runs as `deploy:www-data` user
- **Minimal Production Surface**: No package managers, build tools, or dev dependencies

### Docker Health Check Integration

**Basic Health Check System:**

The production Dockerfile includes a basic health check script (`docker/healthcheck.sh`) that verifies:

```dockerfile
# Basic health check that verifies site functionality
HEALTHCHECK --interval=30s --timeout=15s --start-period=120s --retries=3 \
    CMD /usr/local/bin/healthcheck.sh
```

**Health Check Components:**

- **PHP-FPM Process Verification**: Ensures PHP-FPM master and worker processes are running
- **Socket Connectivity**: Tests PHP-FPM socket responsiveness and basic PHP functionality
- **Drupal Bootstrap**: Validates Drupal can bootstrap and essential services are available
- **File Structure**: Verifies critical directories exist
- **Resource Monitoring**: Checks disk space and memory usage within acceptable limits
- **Configuration Accessibility**: Validates settings files and configuration directories

**Health Check Configuration:**

```bash
# Health check intervals and timeouts
--interval=30s      # Check every 30 seconds
--timeout=15s       # 15 second timeout per check
--start-period=120s # Allow 2 minutes for container startup
--retries=3         # Fail after 3 consecutive failures
```

**Local Health Check Testing:**

```bash
# Test health check manually
docker run --rm your-image:latest /usr/local/bin/healthcheck.sh

# Monitor health check status
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### File Permissions & Ownership

**Core Principle:**
Web server should not have write permissions to executable code files. All Drupal files should be read-only for the web server process, with write permissions only for a dedicated deployment user.

**Recommended Ownership Structure:**

```dockerfile
# Create non-root user for file ownership
RUN groupadd -r www-data && useradd -r -g www-data www-data
RUN groupadd -r deploy && useradd -r -g deploy -G www-data deploy

# Set ownership: deploy user owns files, www-data group can read
RUN chown -R deploy:www-data /var/www/html
```

**File Permissions (Dockerfile-compatible):**

```dockerfile
# Drupal root directory and files: 640 (owner: rw, group: r, other: none)
RUN find /var/www/html -type f -exec chmod 640 {} \;

# Drupal directories: 750 (owner: rwx, group: rx, other: none)
RUN find /var/www/html -type d -exec chmod 750 {} \;

# Files directory: 770 (both owner and group: rwx, other: none)
RUN chmod 770 /var/www/html/web/sites/default/files

# Settings files: 640 (contains database credentials)
RUN chmod 640 /var/www/html/web/sites/default/settings.php
```

**Docker User Configuration:**

```dockerfile
# Run container as non-root user
USER deploy:www-data

# Ensure web server can write to files directory only
RUN chgrp www-data /var/www/html/web/sites/default/files
RUN chmod g+w /var/www/html/web/sites/default/files
```

**settings.php Configuration:**

```php
// Set default file creation permissions
$settings['file_chmod_directory'] = 0775;
$settings['file_chmod_file'] = 0664;
```

**Key Permission Values:**

- **640**: Files (owner: read/write, group: read, other: none)
- **750**: Directories (owner: read/write/execute, group: read/execute, other: none)
- **770**: Files directory only (owner+group: read/write/execute, other: none)

---

## CI/CD and GitHub Actions

### Composer Dependency Caching

**Recommended Actions for Drupal 11 (2025):**

**Primary Recommendation: `actions/cache@v4`**

- **Status**: Required upgrade by February 1, 2025 (v3 and below deprecated)
- **Performance**: Up to 80% faster cache uploads with GitHub Hosted Runners
- **Reliability**: Rewritten backend service for improved performance and reliability

```yaml
- name: Get Composer cache directory
  id: composer-cache
  run: echo "dir=$(composer config cache-files-dir)" >> $GITHUB_OUTPUT

- name: Cache Composer dependencies
  uses: actions/cache@v4
  with:
    path: ${{ steps.composer-cache.outputs.dir }}
    key: ${{ runner.os }}-composer-${{ hashFiles('**/composer.lock') }}
    restore-keys: ${{ runner.os }}-composer-
```

**Alternative: `ramsey/composer-install@v3`**

- **Features**: Automatic cache management, no separate caching step needed
- **Cache Key**: Auto-generates based on OS, PHP version, composer files, and options
- **Performance**: ~30 seconds without cache, ~20 seconds with cache

```yaml
- name: Install Composer dependencies
  uses: ramsey/composer-install@v3
  with:
    dependency-versions: "locked"
    composer-options: "--prefer-dist --no-progress"
```

**PHP Setup: `shivammathur/setup-php@v2`**

- **2025 Updates**: Support for windows-2025 and macos-15 environments
- **Drupal Integration**: Built-in Composer support with extensive tool ecosystem
- **Coverage**: Xdebug and PCOV support for testing workflows

```yaml
- name: Setup PHP
  uses: shivammathur/setup-php@v2
  with:
    php-version: '8.3'
    extensions: dom, curl, libxml, mbstring, zip, pcntl, pdo, sqlite, pdo_sqlite
    tools: composer:v2
    coverage: xdebug
```

**Best Practices:**

- Always use `actions/cache@v4` (v3 and below fail after February 1, 2025)
- Include `composer.lock` in cache key hash for dependency accuracy
- Use `--prefer-dist --no-progress` for faster, quieter Composer installs
- Cache both Composer dependencies and tools for optimal performance
- Set `COMPOSER_NO_INTERACTION=1` for automated workflows

### NPM/Node.js Dependency Caching

**Primary Recommendation: `actions/setup-node@v4`**

- **Built-in Caching**: Uses `actions/cache` under the hood with optimized configuration
- **Package Manager Support**: npm, yarn, pnpm (v6.10+)
- **Global Cache Strategy**: Caches package manager's global cache, not `node_modules`
- **2025 Update**: Built-in cache functionality provides faster and more reliable caching than manual implementations

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'  # or 'yarn', 'pnpm'
- run: npm ci
```

**Why npm ci vs npm install in CI/CD (2025):**

- **Deterministic Builds**: `npm ci` installs exact versions from `package-lock.json`, ensuring reproducible builds
- **Performance**: Bypasses dependency resolution, typically 2-4x faster than `npm install`
- **Clean State**: Removes existing `node_modules` before installation, preventing version conflicts
- **CI Optimized**: Designed specifically for automated environments like GitHub Actions
- **Lock File Validation**: Validates that `package.json` and `package-lock.json` are in sync

**Package Manager Specific Best Practices:**

**NPM (Recommended for Drupal Themes):**

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
- run: npm ci  # Use ci for deterministic installs
- run: npm run build
```

**Yarn:**

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'yarn'
- run: yarn install --frozen-lockfile
```

**PNPM:**

```yaml
- uses: pnpm/action-setup@v4
  with:
    version: 10
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'pnpm'
- run: pnpm install --frozen-lockfile
```

**Drupal Custom Theme Configuration:**

For Drupal themes with frontend dependencies in subdirectories:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
    cache-dependency-path: 'web/themes/custom/*/package-lock.json'
- run: npm ci
  working-directory: web/themes/custom/theme_name
- run: npm run build
  working-directory: web/themes/custom/theme_name
```

**Multi-Theme Projects:**

For projects with multiple themes requiring builds:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
    cache-dependency-path: '**/package-lock.json'
- name: Build all themes
  run: |
    for theme in web/themes/custom/*/; do
      if [ -f "$theme/package.json" ]; then
        echo "Building theme: $theme"
        cd "$theme" && npm ci && npm run build && cd -
      fi
    done
```

**Advanced Caching with Manual Control:**

For complex scenarios requiring custom cache keys:

```yaml
- name: Cache npm dependencies
  uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

**Best Practices Summary (2025):**

- Always use `npm ci` instead of `npm install` in CI environments
- Specify exact Node.js versions for consistency across environments
- Cache the global npm directory (`~/.npm`), not `node_modules`
- Use `cache-dependency-path` for theme subdirectories
- Commit `package-lock.json` files to repository for reproducible builds
- Separate build steps for each theme to isolate failures
- Use `working-directory` when themes are in subdirectories
- Validate builds with `npm run lint` before deployment

### Docker Layer Caching

**Primary Recommendation: `docker/build-push-action@v6` with GHA Cache**

- **2025 Update**: GitHub Cache API v1 shutdown April 15, 2025 - upgrade required
- **Auto-Configuration**: URL and token parameters automatically populated
- **Performance**: Best integration with GitHub Actions environment

```yaml
- name: Build and push Docker image
  uses: docker/build-push-action@v6
  with:
    context: .
    push: true
    tags: user/app:latest
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

**Alternative:** Registry Cache (Better Performance)

```yaml
- name: Build and push Docker image
  uses: docker/build-push-action@v6
  with:
    context: .
    push: true
    tags: user/app:latest
    cache-from: type=registry,ref=user/app:buildcache
    cache-to: type=registry,ref=user/app:buildcache,mode=max
```

**Docker Cache Best Practices:**

- Use `mode=max` for better cache coverage when possible
- Specify cache scope for multi-image builds: `scope=myapp-frontend`
- Consider registry cache for complex builds with better network performance
- Upgrade to Docker Engine >= v28.0.0 for containerd image store support

**Combined Node.js + Docker Workflow:**

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
- run: npm ci
- run: npm run build

- uses: docker/build-push-action@v6
  with:
    context: .
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

### DRY Workflow Patterns (2025)

**Reusable Workflows for Environment-Specific Deployments:**

To eliminate duplication between staging and production workflows, use GitHub's reusable workflow feature with environment-specific parameters:

**Main Workflow (stage-deploy.yml):**

```yaml
name: Stage and Production Deployment

on:
  push:
    branches: [ stage ]
    tags: [ 'prod_*' ]
  workflow_dispatch:

jobs:
  stage-deploy:
    if: github.ref == 'refs/heads/stage'
    uses: ./.github/workflows/reusable-build.yml
    with:
      environment: 'staging'
      registry: 'your-acr-registry.azurecr.io'
      image_name: 'drupal-app'
    secrets:
      acr_username: ${{ secrets.ACR_USERNAME }}
      acr_password: ${{ secrets.ACR_PASSWORD }}

  production-deploy:
    if: startsWith(github.ref, 'refs/tags/prod_')
    uses: ./.github/workflows/reusable-build.yml
    with:
      environment: 'production'
      registry: 'your-acr-registry.azurecr.io'
      image_name: 'drupal-app'
    secrets:
      acr_username: ${{ secrets.ACR_USERNAME }}
      acr_password: ${{ secrets.ACR_PASSWORD }}
```

**Reusable Workflow (reusable-build.yml):**

```yaml
name: Reusable Build and Deploy

on:
  workflow_call:
    inputs:
      environment:
        description: 'Target environment (staging or production)'
        required: true
        type: string
      registry:
        description: 'Container registry URL'
        required: true
        type: string
      # Additional configurable inputs...
    secrets:
      acr_username:
        required: true
      acr_password:
        required: true
    outputs:
      image_tags:
        description: 'Generated Docker image tags'
        value: ${{ jobs.build-and-deploy.outputs.image_tags }}
```

**Composite Actions for Common Steps:**

For even more granular reusability, create composite actions for repeated step sequences:

```yaml
# .github/actions/setup-drupal-build/action.yml
name: 'Setup Drupal Build Environment'
description: 'Sets up PHP, Composer, Node.js and caches dependencies'

inputs:
  php-version:
    description: 'PHP version to setup'
    required: false
    default: '8.3'
  composer-options:
    description: 'Additional Composer install options'
    required: false
    default: '--prefer-dist --no-progress --no-dev --optimize-autoloader'

runs:
  using: 'composite'
  steps:
    - name: Setup PHP
      uses: shivammathur/setup-php@v2
      # ... complete setup steps
```

**DRY Benefits:**

- **Single Source of Truth**: Build logic defined once, reused across environments
- **Consistent Behavior**: Identical steps for staging and production with environment-specific parameters
- **Easier Maintenance**: Updates to build process only require changes in one place
- **Reduced Duplication**: 80% reduction in workflow YAML lines
- **Better Testing**: Reusable workflows can be tested independently

**Best Practices for DRY Workflows:**

- Use reusable workflows for complete job sequences (build, test, deploy)
- Use composite actions for repeated step sequences (setup, code quality checks)
- Parameterize environment-specific values (registry URLs, environment names)
- Maintain clear input/output contracts between workflows
- Document inputs and outputs for easier team collaboration
- Version reusable workflows alongside your application code


---

## Testing

### Code Quality & Standards (2025)

**Automated Code Quality Checks:**

All deployments are automatically protected by code quality gates that enforce Drupal coding standards and JavaScript best practices.

**PHPCS (PHP CodeSniffer) - Drupal Standards:**

```bash
# Project uses phpcs.xml configuration with Drupal standards
vendor/bin/phpcs

# Manual check specific paths
vendor/bin/phpcs --standard=Drupal web/modules/custom web/themes/custom
```

**PHPStan - Static Analysis:**

```bash
# Project uses phpstan.neon configuration (level 6)
vendor/bin/phpstan analyse

# Manual analysis with custom level
vendor/bin/phpstan analyse --level=6 web/modules/custom
```

**ESLint - JavaScript Linting:**

```bash
# Theme-specific linting (if configured)
cd web/themes/custom/arsapps_theme
npm run lint

# Direct ESLint usage
npx eslint js/ --ext .js
```

**GitHub Actions Integration:**

The `code-quality.yml` reusable workflow runs automatically before deployments:

```yaml
jobs:
  code-quality:
    uses: ./.github/workflows/code-quality.yml
    with:
      enable_phpcs: true
      enable_eslint: true
      phpcs_standard: 'Drupal'
      custom_paths: 'web/modules/custom,web/themes/custom'
```

**Key Features:**

- **Fail-Fast Deployment**: Code quality violations block deployments
- **Automatic Detection**: Scans all custom modules and themes
- **Configurable Standards**: Centralized phpcs.xml and phpstan.neon files
- **Performance Caching**: Uses .phpcs-cache and .phpstan-cache for speed
- **Multi-Language Support**: Handles PHP, JavaScript, CSS, and configuration files

**Configuration Files:**

- **`phpcs.xml`**: Drupal coding standards with custom exclusions
- **`phpstan.neon`**: Level 6 static analysis with Drupal extension
- **Theme `.eslintrc.js`**: JavaScript linting rules per theme

**Best Practices (2025):**

- Install dev dependencies locally: `composer require --dev drupal/core-dev`
- Run checks before committing: `vendor/bin/phpcs && vendor/bin/phpstan`
- Use IDE integrations for real-time feedback
- Fix issues incrementally rather than disabling rules
- Configure ESLint in theme package.json for consistent JavaScript quality

### PHPUnit Testing with DDEV Integration

**Test Configuration:**

The project includes a comprehensive PHPUnit configuration (`phpunit.xml`) that integrates with DDEV's database settings:

```xml
<!-- Database configuration for DDEV -->
<env name="SIMPLETEST_DB" value="mysql://db:db@db:3306/db"/>
<env name="SIMPLETEST_BASE_URL" value="http://web:80"/>
```

**Running Tests Locally:**

```bash
# Run all custom tests
vendor/bin/phpunit --testsuite=custom

# Run specific test types
vendor/bin/phpunit --testsuite=unit
vendor/bin/phpunit --testsuite=kernel
vendor/bin/phpunit --testsuite=functional

# Run with coverage
vendor/bin/phpunit --testsuite=custom --coverage-html=reports/coverage
```

**Test Directory Structure:**

```
web/modules/custom/*/tests/
├── src/
│   ├── Unit/           # Unit tests
│   ├── Kernel/         # Kernel tests
│   ├── Functional/     # Functional tests
│   └── FunctionalJavascript/  # JS functional tests
```

### Accessibility Testing (Section 508 Compliance)

**Automated Accessibility Scanning:**

The project includes comprehensive accessibility testing tools for Section 508 compliance:

```bash
# Run axe-core accessibility scan
npm run test:axe

# Run pa11y accessibility scan
npm run test:pa11y

# Generate Lighthouse accessibility report
npm run test:lighthouse
```

**Accessibility Testing Features:**

- **Section 508 Compliance**: Tests against government accessibility standards
- **WCAG 2.1 AA**: Validates compliance with web content accessibility guidelines
- **Layout Builder Focus**: Specialized tests for Layout Builder components
- **Keyboard Navigation**: Validates keyboard-only navigation workflows
- **Screen Reader Support**: Tests ARIA attributes and announcements
- **Color Contrast**: Validates contrast ratios meet required standards

**Accessibility Test Utilities:**

Located in `tests/accessibility/accessibility-utils.js`:

```javascript
// Comprehensive accessibility scan
const axeResults = await runAxeScan(page, {
  tags: ['section508', 'wcag2a', 'wcag2aa', 'wcag21aa'],
  include: ['[data-layout-builder-content]', '.layout-builder__layout']
});

// Assert no violations
await assertNoA11yViolations(axeResults);

// Test keyboard navigation
await testKeyboardNavigation(page);

// Test Layout Builder specific accessibility
await testLayoutBuilderAccessibility(page);
```

### GitHub Actions Testing Pipeline

**Comprehensive Testing Workflow:**

The `.github/workflows/testing.yml` workflow provides a complete testing pipeline:

```yaml
# Two-stage testing approach
jobs:
  phpunit-tests:     # Unit and functional tests
  accessibility-tests: # Section 508 compliance validation  
```

**Testing Pipeline Features:**

- **PHPUnit Integration**: Uses MySQL service for database testing
- **Docker Environment**: Tests against production-like container setup
- **Accessibility Validation**: Automated Section 508 compliance checking
- **Artifact Storage**: 30-day retention of test reports and accessibility results
- **QA Review Assets**: Test reports and accessibility results stored for manual QA review

**Artifact Categories:**

- **PHPUnit Results**: Test coverage reports and JUnit XML
- **Accessibility Reports**: axe-core and pa11y scan results
- **Performance Data**: Core Web Vitals and load time metrics

**Running Tests in GitHub Actions:**

Tests run automatically on:
- Push to `main`, `stage`, `develop` branches
- Pull requests to `main`, `stage`
- Manual workflow dispatch

**Test Artifact Access:**

1. Navigate to Actions tab in GitHub repository
2. Select completed workflow run
3. Download artifacts from the Artifacts section
4. Review screenshots, videos, and reports for QA validation

### Test Data Management

**Test Database Setup:**

```bash
# DDEV automatically provides test database
# Configuration in web/sites/default/settings.ddev.php

# GitHub Actions uses dedicated MySQL service
# Configuration in .github/workflows/testing.yml
```

**Layout Builder Test Content:**

Tests are designed to work with minimal Drupal installation:
- Standard profile installation
- Layout Builder module enabled
- Default content types with Layout Builder enabled

**Performance Benchmarks:**

- **Page Load Time**: < 5 seconds for Layout Builder pages
- **Cumulative Layout Shift**: < 0.1 for good user experience
- **Accessibility Scan Time**: < 30 seconds per page
- **Cross-browser Test Time**: < 10 minutes total across all browsers

---

## Secrets management

<!-- AI appends here from secrets management prompts -->

---

## Deployment environments

### Azure App Service Container Configuration

**Environment Variables via App Settings:**

Azure App Service automatically passes App Settings to containers as environment variables using the `--env` flag. These are immediately accessible in PHP via `getenv()` function.

**Configuration Process:**

1. **Azure Portal**: Navigate to Configuration → Application settings
2. **Add Settings**: Create key-value pairs for each environment variable
3. **Automatic Injection**: Azure passes these to container on startup
4. **Container Restart**: Changes trigger automatic restart to apply new variables

**Recommended Drupal 11 Environment Variables:**

```bash
# Database Configuration
DRUPAL_DB_HOST=your-azure-mysql-server.mysql.database.azure.com
DRUPAL_DB_NAME=drupal_db
DRUPAL_DB_USER=drupal_admin
DRUPAL_DB_PASSWORD=secure_password
DRUPAL_DB_PORT=3306

# Security Settings
DRUPAL_HASH_SALT=random_64_character_string
DRUPAL_TRUSTED_HOST_PATTERNS=^your-app\.azurewebsites\.net$

# Configuration Management
DRUPAL_CONFIG_SYNC_DIRECTORY=../config/sync
DRUPAL_ENVIRONMENT=production

# File Storage (Azure-specific)
DRUPAL_PRIVATE_FILES_PATH=/home/private
DRUPAL_TEMP_PATH=/tmp
```

**settings.php Configuration Pattern:**

```php
// Database configuration using environment variables
$databases['default']['default'] = [
  'database' => getenv('DRUPAL_DB_NAME'),
  'username' => getenv('DRUPAL_DB_USER'),
  'password' => getenv('DRUPAL_DB_PASSWORD'),
  'host' => getenv('DRUPAL_DB_HOST'),
  'port' => getenv('DRUPAL_DB_PORT') ?: '3306',
  'driver' => 'mysql',
  'prefix' => '',
];

// Security settings
$settings['hash_salt'] = getenv('DRUPAL_HASH_SALT');

// Trusted host patterns for Azure App Service
$settings['trusted_host_patterns'] = [
  '^' . preg_quote(getenv('DRUPAL_TRUSTED_HOST_PATTERNS')) . '$',
];

// Configuration sync directory
$settings['config_sync_directory'] = getenv('DRUPAL_CONFIG_SYNC_DIRECTORY');

// Environment-specific settings
if (getenv('DRUPAL_ENVIRONMENT') === 'production') {
  $config['system.logging']['error_level'] = 'hide';
  $config['system.performance']['cache']['page']['max_age'] = 3600;
}
```

**Azure-Specific Best Practices:**

- **Slot Settings**: Mark sensitive variables as "deployment slot settings" to prevent swapping between environments
- **Connection Strings**: Use Azure's Connection Strings section for database connections
- **Key Vault Integration**: For highly sensitive values, reference Azure Key Vault secrets
- **Environment Detection**: Use `DRUPAL_ENVIRONMENT` variable to conditionally apply settings
- **File Storage**: Configure Azure Storage for private files and media uploads

**Best Practices:**

- Never commit environment-specific values to version control
- Use Azure Key Vault for sensitive values like database passwords and API keys
- Configure slot settings to maintain environment separation
- Set appropriate trusted host patterns

### Post-Deploy Hooks and Drush Commands

**Supported Methods for Running Post-Deploy Drush Commands:**

**1. Azure DevOps Pipelines** (Most Reliable & Intuitive - 2025)

- **Method**: Execute Drush commands as part of CI/CD pipeline after container deployment
- **Reliability**: High - Full control over execution order and error handling
- **Configuration**: Azure Pipeline YAML with `AzureWebAppContainer@1` task followed by script execution

```yaml
- task: AzureWebAppContainer@1
  inputs:
    azureSubscription: 'your-subscription'
    appName: 'your-app-name'
    containers: 'your-registry/drupal:latest'

- task: AzureCLI@2
  inputs:
    azureSubscription: 'your-subscription'
    scriptType: 'bash'
    scriptLocation: 'inlineScript'
    inlineScript: |
      # Execute Drush commands via az webapp ssh
      az webapp ssh --resource-group myResourceGroup --name myApp --instance 0 --command "drush deploy"
```

**2. Azure Container Instances** with Init Containers

- **Method**: Use init containers to run deployment tasks before main container starts
- **Reliability**: Medium - Limited by ACI sandbox restrictions
- **Use Case**: Better suited for Azure Container Apps than Azure App Service

```yaml
initContainers:
- name: drupal-deploy
  image: your-registry/drupal:latest
  command: ["/bin/bash", "-c"]
  args: ["drush deploy"]
  volumeMounts:
  - name: shared-data
    mountPath: /var/www/html
```

**3. Startup Command Scripts** (Legacy - Avoid for Production)

- **Method**: Configure startup command in Azure App Service to run deployment script
- **Reliability**: Low - Executes on every container restart, not just deployments
- **Issues**: May cause performance problems and inconsistent state

**Recommended Drush Command Sequence (2025):**

Modern Drush 12+ provides the standardized `drush deploy` command:

```bash
# Single command that handles complete deployment sequence
drush deploy

# Equivalent to running manually:
# drush updatedb --no-cache-clear
# drush cache:rebuild
# drush config:import
# drush cache:rebuild
# drush deploy:hook
```

**Manual Deployment Sequence (if needed):**

```bash
# Enable maintenance mode
drush state:set system.maintenance_mode 1

# Update database schema
drush updb

# Import configuration (with retry logic)
drush cim sync -y || drush cim sync -y

# Clear all caches
drush cr

# Run deployment hooks
drush deploy:hook

# Disable maintenance mode
drush state:set system.maintenance_mode 0
```

**Azure-Specific Best Practices:**

- **Environment Variables**: Use Azure App Settings for Drush configuration
- **Database Access**: Ensure container has proper Azure MySQL connectivity
- **File Permissions**: Configure `/home` directory persistence for Drush cache
- **Error Handling**: Implement retry logic for config import operations
- **Monitoring**: Use Azure Application Insights to track deployment success

**Most Reliable Approach (2025):**
Azure DevOps Pipelines with post-deployment script execution provides the most reliable and intuitive method. This approach offers:

- Full control over execution timing
- Proper error handling and rollback capabilities
- Integration with Azure monitoring and alerting
- Support for deployment slots and blue/green deployments

---

## Quick Reference Summary

### Essential Commands

**Local Development:**
```bash
# Start DDEV environment
ddev start && ddev drush status

# Run code quality checks
vendor/bin/phpcs && vendor/bin/phpstan analyse

# Run tests
vendor/bin/phpunit --testsuite=custom
npm run test:e2e
npm run test:accessibility
```

**Container Operations:**
```bash
# Build production image
docker build -f docker/Dockerfile -t drupal-app:local .

# Test health check
docker run --rm drupal-app:local /usr/local/bin/healthcheck.sh

```

**Deployment:**
```bash
# Stage deployment
git push origin stage

# Production deployment  
git tag prod_v1.2.3 && git push origin prod_v1.2.3
```

### Key File Locations

- **Docker**: `docker/Dockerfile`, `docker/healthcheck.sh`
- **GitHub Actions**: `.github/workflows/` (stage-deploy.yml, testing.yml)
- **Configuration**: `phpcs.xml`, `phpstan.neon`, `phpunit.xml`
- **Testing**: `tests/` (accessibility)
- **Documentation**: `.github/workflows/README.md` (detailed workflow guide)

### System Configuration

- **File Permissions**: 640/750/770 model
- **User Context**: Non-root execution (deploy:www-data)
- **Health Monitoring**: Container health checks
- **Compliance**: Section 508 accessibility standards

### Architecture Highlights

- **Multi-stage Docker Builds**: Optimized production images
- **DRY GitHub Actions**: Reusable workflows and composite actions
- **Quality-First Pipeline**: Code quality gates for all deployments
- **Comprehensive Testing**: PHPUnit, accessibility (Section 508)
- **Government-Grade Compliance**: Accessibility testing, compliance reporting, audit trails

This Drupal 11 project implements enterprise-grade testing and deployment practices suitable for government environments while maintaining developer productivity.

---

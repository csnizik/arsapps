<!--
Developer Notes
This file is maintained automatically via scoped AI prompts.
Purpose: To capture infrastructure, dev workflow, testing, and deployment standards for this Drupal 11 project.
Treat this as a living internal reference for developers and engineers working on this system.
Do not delete this comment. If you reorganize sections, do so thoughtfully and preserve continuity.
-->

# Developer Notes

This document captures technical decisions, practices, standards, and implementation details for this Drupal 11 project. It is updated progressively in response to scoped prompts during the CI/CD and development pipeline buildout process.

Last updated: June 25, 2025

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

### Security Dependencies

**Authentication & Policy:**

- `drupal/tfa` – Two-factor authentication. Recommended to use the latest version (security updates in 2025).
- `drupal/security_review` – Performs a checklist of common security issues.
- `drupal/password_policy` – Enforce complex password requirements.

**Security Monitoring:**

- Use `composer audit` – Native Composer feature replaces deprecated `drupal-composer/drupal-security-advisories`.

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
- Composer’s built-in audit replaces previous community-led security packages.
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

**Multi-Stage Dockerfile Pattern:**

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
COPY package*.json ./
RUN npm ci --only=production
COPY webpack.config.js ./
COPY web/themes/custom/ ./web/themes/custom/
RUN npm run build

# Stage 3: Production Runtime
FROM drupal:11.1.5-php8.3-fpm-bookworm AS production
WORKDIR /var/www/html

# Copy Composer dependencies (excluding dev tools)
COPY --from=composer_build /app/vendor ./vendor
COPY --from=composer_build /app/web ./web

# Copy compiled frontend assets
COPY --from=frontend_build /app/web/themes/custom/*/dist ./web/themes/custom/*/dist

# Apply secure file permissions
RUN find . -type f -exec chmod 640 {} \; && \
    find . -type d -exec chmod 750 {} \; && \
    chown -R www-data:www-data .
```

**Key Multi-Stage Benefits:**

- **Immutable Images**: No dev tools, package managers, or source files in production
- **Size Optimization**: Final image excludes Node.js, Composer, and build dependencies
- **Layer Caching**: Dependencies install only when package files change
- **Security**: Minimal attack surface with only runtime essentials
- **Compiled Assets**: CSS/JS built during image creation, not runtime

**Build Optimization Techniques:**

- Copy `package*.json` before full source to leverage Docker layer caching
- Use `npm ci` instead of `npm install` for faster, deterministic builds
- Copy `composer.json` before source code for dependency caching
- Use `--no-dev` flags to exclude development dependencies
- Order build steps by frequency of changes (dependencies → source → assets)

**Security Considerations:**

- Regular base image updates for security patches
- Minimize installed packages to reduce attack surface
- Use multi-stage builds to exclude build-time dependencies from final image
- Consider vulnerability scanning with tools like Snyk for ongoing security assessment

### Secure File Permissions & Ownership

**Core Security Principle:**
Web server should not have write permissions to executable code files. All Drupal files should be read-only for the web server process, with write permissions only for a dedicated deployment user.

**Recommended Ownership Structure:**

```dockerfile
# Create non-root user for secure file ownership
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

# Settings files: 640 (contains sensitive database credentials)
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

**settings.php Security Configuration:**

```php
// Set secure default file creation permissions
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

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'  # or 'yarn', 'pnpm'
- run: npm ci
```

**Package Manager Specific Best Practices:**

**NPM:**
```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
- run: npm ci  # Use ci for deterministic installs
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

**Monorepo Support:**
```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
    cache-dependency-path: 'sub-project/package-lock.json'
```

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

**Alternative: Registry Cache (Better Performance)**
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

---

## Testing

<!-- AI appends here from test-related prompts -->

---

## Security & secrets management

<!-- AI appends here from security-related prompts -->

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
- **Connection Strings**: Use Azure's Connection Strings section for database connections (additional security layer)
- **Key Vault Integration**: For highly sensitive values, reference Azure Key Vault secrets
- **Environment Detection**: Use `DRUPAL_ENVIRONMENT` variable to conditionally apply settings
- **File Storage**: Configure Azure Storage for private files and media uploads

**Security Considerations:**
- Never commit environment-specific values to version control
- Use Azure Key Vault for secrets like database passwords and API keys
- Configure slot settings to maintain environment separation
- Set appropriate trusted host patterns to prevent host header attacks

### Post-Deploy Hooks and Drush Commands

**Supported Methods for Running Post-Deploy Drush Commands:**

**1. Azure DevOps Pipelines (Most Reliable & Intuitive - 2025)**
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

**2. Azure Container Instances with Init Containers**
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

**3. Startup Command Scripts (Legacy - Avoid for Production)**
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

## Prompt history index (optional)

<!-- Optional: AI may add bullet summaries here to help orient future iterations -->

---

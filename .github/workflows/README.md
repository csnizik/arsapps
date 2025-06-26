# GitHub Actions Workflows

This directory contains GitHub Actions workflows for automated CI/CD of the Drupal 11 project.

## DRY Architecture (2025)

The workflow system uses a DRY (Don't Repeat Yourself) approach with reusable workflows and composite actions:

- **`stage-deploy.yml`**: Main workflow handling both staging and production triggers
- **`reusable-build.yml`**: Shared build and deployment logic for all environments
- **`code-quality.yml`**: Reusable workflow for PHPCS and ESLint code quality checks
- **`.github/actions/setup-drupal-build/`**: Composite action for Drupal build environment setup

### Workflow Structure

```
.github/
├── workflows/
│   ├── stage-deploy.yml          # Main workflow (stage + production triggers)
│   ├── reusable-build.yml        # Shared build logic
│   └── code-quality.yml          # Code quality checks (PHPCS + ESLint)
└── actions/
    └── setup-drupal-build/
        └── action.yml            # Composite action for build setup
```

## Stage and Production Deployment

The `stage-deploy.yml` workflow runs automatically when:

- Code is pushed to the `stage` branch (staging deployment)
- Git tags prefixed with `prod_*` are created (production deployment)

### Workflow Features

- **Code Quality Gates**: PHPCS and ESLint checks block deployments on violations
- **DRY Architecture**: Shared build logic eliminates duplication
- **Environment-Specific Logic**: Conditional behavior for staging vs production
- **Multi-stage Docker build** following DEVELOPER_NOTES.md guidelines
- **Composite Actions**: Reusable build environment setup
- **Enhanced Security**: Production-specific validation and auditing
- **Frontend Asset Building**: Webpack-based SCSS and JavaScript compilation in custom themes
- **Dependency Caching**: Optimized caching for Composer and Node.js
- **Docker layer caching** using GitHub Actions cache
- **Security scanning** with Trivy vulnerability scanner
- **Azure Container Registry** push with environment-specific tags

### Required Secrets

Configure these secrets in your GitHub repository settings:

- `ACR_USERNAME`: Azure Container Registry username
- `ACR_PASSWORD`: Azure Container Registry password

### Environment Variables

Update these variables in the workflow file:

- `REGISTRY`: Your Azure Container Registry URL (e.g., `myregistry.azurecr.io`)
- `IMAGE_NAME`: Your container image name (e.g., `drupal-app`)

### Tags Generated

The workflow generates environment-specific Docker image tags:

**Stage Branch Builds:**

- `stage`: Always applied for stage branch builds
- `stage-<commit-sha>`: Unique tag with branch and commit SHA

**Production Tag Builds:**

- `production`: Always applied for production tag builds
- `prod-<commit-sha>`: Unique tag with commit SHA
- Original tag name (e.g., `prod_v1.2.3`)

**All Builds:**

- `latest`: Applied when building the default branch

### Security Features

- **Vulnerability scanning** with Trivy
- **SARIF upload** to GitHub Security tab
- **Secure file permissions** in Docker image (640/750 as per DEVELOPER_NOTES.md)
- **Non-root user** execution in container
- **Multi-stage build** to minimize attack surface

### Dependencies Aligned with DEVELOPER_NOTES.md

- Uses recommended PHP 8.3 and Drupal 11.1.5 base image
- Implements secure file ownership (deploy:www-data)
- Follows multi-stage build pattern for optimal caching
- Uses latest GitHub Actions versions (cache@v4, build-push-action@v6)
- Includes Composer security audit step

## Reusable Components

### Composite Action: setup-drupal-build

Reusable action that handles common Drupal build environment setup:

```yaml
- name: Setup Drupal build environment
  uses: ./.github/actions/setup-drupal-build
  with:
    php-version: '8.3'
    node-version: '20'
    composer-options: '--prefer-dist --no-progress --no-dev'
    enable-security-audit: 'true'
```

**Features:**

- PHP environment setup with extensions
- Composer dependency caching and installation
- Node.js environment setup with npm caching
- Security audit execution
- Frontend asset compilation (webpack builds for theme SCSS/JS)

### Reusable Workflow: reusable-build.yml

Centralized build and deployment logic that can be called from multiple workflows:

**Usage:**

```yaml
jobs:
  deploy:
    uses: ./.github/workflows/reusable-build.yml
    with:
      environment: 'staging'
      registry: 'your-registry.azurecr.io'
      image_name: 'drupal-app'
      enable_security_scan: true
    secrets:
      acr_username: ${{ secrets.ACR_USERNAME }}
      acr_password: ${{ secrets.ACR_PASSWORD }}
```

**Benefits:**

- Single source of truth for build logic
- Environment-specific parameter injection
- Consistent behavior across staging and production
- Easier maintenance and updates

## Code Quality Workflow

### Automatic Code Quality Checks

The `code-quality.yml` workflow runs automatically before any deployment and includes:

- **PHPCS (PHP CodeSniffer)**: Enforces Drupal coding standards on custom modules and themes
- **PHPStan**: Static analysis for PHP code quality and type safety
- **ESLint**: JavaScript linting for custom theme assets

### Configuration Files

The project includes centralized configuration files:

- **`phpcs.xml`**: PHPCS configuration with Drupal standards
- **`phpstan.neon`**: PHPStan configuration with Drupal-specific rules

### Code Quality Features

- **Fail-Fast**: Deployments are blocked if code quality checks fail
- **Automatic Detection**: Finds all custom modules and themes automatically
- **Configurable Standards**: Can be customized per project needs
- **Performance Optimized**: Uses caching for faster subsequent runs

### Running Code Quality Checks Locally

```bash
# Install development dependencies
composer require --dev drupal/core-dev

# Run PHPCS
vendor/bin/phpcs

# Run PHPStan
vendor/bin/phpstan analyse

# Run ESLint (in theme directory)
cd web/themes/custom/arsapps_theme
npm run lint
```

### Local Testing

To test the Docker build locally:

```bash
# Build the image
docker build -f docker/Dockerfile -t drupal-app:local .

# Run the container
docker run -p 9000:9000 drupal-app:local
```

### Troubleshooting

1. **Code Quality Failures**: 
   - Check PHPCS errors: `vendor/bin/phpcs --report=full`
   - Fix PHPStan issues: `vendor/bin/phpstan analyse --level=0` (start with level 0)
   - ESLint errors: Check theme's `npm run lint` output
2. **ACR Authentication Errors**: Verify ACR_USERNAME and ACR_PASSWORD secrets
3. **Build Cache Issues**: Clear GitHub Actions cache if builds become inconsistent
4. **Composer Errors**: Ensure composer.lock is committed and up to date
5. **Node.js Build Errors**: Verify package.json and package-lock.json are present
6. **Dev Dependencies Missing**: Run `composer require --dev drupal/core-dev` locally

For more details, see the project's DEVELOPER_NOTES.md file.

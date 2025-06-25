# GitHub Actions Workflows

This directory contains GitHub Actions workflows for automated CI/CD of the Drupal 11 project.

## DRY Architecture (2025)

The workflow system uses a DRY (Don't Repeat Yourself) approach with reusable workflows and composite actions:

- **`stage-deploy.yml`**: Main workflow handling both staging and production triggers
- **`reusable-build.yml`**: Shared build and deployment logic for all environments
- **`.github/actions/setup-drupal-build/`**: Composite action for Drupal build environment setup

### Workflow Structure

```
.github/
├── workflows/
│   ├── stage-deploy.yml          # Main workflow (stage + production triggers)
│   └── reusable-build.yml        # Shared build logic
└── actions/
    └── setup-drupal-build/
        └── action.yml            # Composite action for build setup
```

## Stage and Production Deployment

The `stage-deploy.yml` workflow runs automatically when:
- Code is pushed to the `stage` branch (staging deployment)
- Git tags prefixed with `prod_*` are created (production deployment)

### Workflow Features

- **DRY Architecture**: Shared build logic eliminates duplication
- **Environment-Specific Logic**: Conditional behavior for staging vs production
- **Multi-stage Docker build** following DEVELOPER_NOTES.md guidelines
- **Composite Actions**: Reusable build environment setup
- **Enhanced Security**: Production-specific validation and auditing
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
- Frontend asset compilation

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

### Local Testing

To test the Docker build locally:

```bash
# Build the image
docker build -f docker/Dockerfile -t drupal-app:local .

# Run the container
docker run -p 9000:9000 drupal-app:local
```

### Troubleshooting

1. **ACR Authentication Errors**: Verify ACR_USERNAME and ACR_PASSWORD secrets
2. **Build Cache Issues**: Clear GitHub Actions cache if builds become inconsistent
3. **Composer Errors**: Ensure composer.lock is committed and up to date
4. **Node.js Build Errors**: Verify package.json and package-lock.json are present

For more details, see the project's DEVELOPER_NOTES.md file.
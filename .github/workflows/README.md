# GitHub Actions Workflows

This directory contains comprehensive GitHub Actions workflows for automated CI/CD and testing of the Drupal 11 project. The system implements comprehensive testing pipelines and automated deployment workflows.

## TL;DR

- Workflows can be triggered manually from the console (this assumes the gh CLI is installed): `gh workflow run <workflow-name>.yml --branch <BRANCH_NAME>`. Progress on running workflows can be monitored in the Actions tab of the repo on Github.

## Architecture Overview

The workflow system uses a DRY (Don't Repeat Yourself) approach with reusable workflows and composite actions:

### Core Workflows

- **`deploy.yml`**: Main deployment workflow
- **`reusable-build.yml`**: Shared build and deployment logic for all environments
- **`code-quality.yml`**: Reusable workflow for PHPCS, PHPStan, and ESLint checks
- **`testing.yml`**: Comprehensive testing pipeline (PHPUnit, accessibility)

### Composite Actions

- **`.github/actions/setup-drupal-build/`**: Drupal build environment setup with caching

### Workflow Structure

```
.github/
├── workflows/
│   ├── deploy.yml               # Main deployment workflow
│   ├── reusable-build.yml        # Shared build logic
│   ├── code-quality.yml          # Code quality checks
│   └── testing.yml               # Testing pipeline (PHPUnit, a11y)
└── actions/
    └── setup-drupal-build/
        └── action.yml            # Composite action for build setup
```

## Deployment Pipeline

### Automated Quality Gates

All deployments go through mandatory quality verification:

```yaml
jobs:
  code-quality:     # PHPCS, PHPStan, ESLint checks
  deploy:           # Only proceeds if quality gates pass
    needs: [code-quality]
```

## Docker Health Check System

### Comprehensive Health Verification

The production containers include a comprehensive health check (`docker/healthcheck.sh`) that verifies:

- **PHP-FPM Process Health**: Master and worker process verification
- **Socket Connectivity**: PHP-FPM responsiveness testing
- **Drupal Bootstrap**: Core functionality and service availability
- **File Structure Integrity**: Required directories and immutability
- **Security Context**: User permissions and execution context
- **Resource Monitoring**: Disk space and memory usage

### Health Check Configuration

```dockerfile
HEALTHCHECK --interval=30s --timeout=15s --start-period=120s --retries=3 \
    CMD /usr/local/bin/healthcheck.sh
```

## Workflow Triggers and Environments

### Automatic Triggers

**Development Deployment:**
- Push to `develop` branch
- Manual workflow dispatch

**Production Deployment:**
- Push to `main` branch
- Git tags prefixed with `prod_*` (e.g., `prod_v1.2.3`)

**Testing Pipeline:**
- All pushes to `main`, `develop`
- All pull requests to `main`, `develop`

### Environment-Specific Behavior

**Development Deployments:**
- Standard quality verification
- Artifact retention: 30 days

**Production Deployments:**
- Enhanced quality auditing
- Additional production-specific checks
- Extended artifact retention: 90 days

## Container Registry and Tagging Strategy

### Image Tags Generated

**Develop Branch Builds:**
```
your-registry.azurecr.io/drupal-app:develop
your-registry.azurecr.io/drupal-app:develop-<commit-sha>
```

**Main Branch/Production Builds:**
```
your-registry.azurecr.io/drupal-app:main
your-registry.azurecr.io/drupal-app:main-<commit-sha>
your-registry.azurecr.io/drupal-app:prod_v1.2.3
```


## Quality Assurance and Reporting

### Quality Standards

The pipeline ensures compliance with:

- **Drupal Coding Standards**: PHP and JavaScript code quality
- **Government Accessibility Standards**: Section 508 and WCAG 2.1 AA compliance
- **Best Practices**: Modern development practices and conventions

### Automated Quality Reports

**Generated Reports:**
- Code quality analysis results
- Test coverage reports
- Accessibility compliance reports
- Comprehensive quality documentation

**GitHub Integration:**
- Pull request quality comments
- Automated quality summaries
- Artifact storage for audit trails

## Testing Infrastructure

### Comprehensive Testing Pipeline

**PHPUnit Tests:**
- Unit, kernel, and functional tests
- DDEV database integration
- Coverage reporting

**Accessibility Testing:**
- Section 508 compliance verification
- WCAG 2.1 AA standard validation
- Layout Builder accessibility testing
- axe-core and pa11y integration

### Test Artifact Management

**Artifact Categories:**
- Test coverage reports (30-day retention)
- Screenshot comparisons (30-day retention)
- Accessibility scan results (30-day retention)
- Performance metrics and reports (30-day retention)

## Configuration and Setup

### Required Secrets

Configure these secrets in your GitHub repository settings:

**For Azure Container Registry:**
- `ACR_USERNAME`: Azure Container Registry username
- `ACR_PASSWORD`: Azure Container Registry password

**For GitHub Container Registry (alternative):**
- `GITHUB_TOKEN`: Automatically provided by GitHub Actions

### Environment Variables

Update these variables in workflow files:

```yaml
env:
  REGISTRY: your-acr-registry.azurecr.io  # Your container registry
  IMAGE_NAME: drupal-app                  # Your image name
```

### Local Development Setup

**Prerequisites:**
```bash
# Install development dependencies
composer require --dev drupal/core-dev

# Install Node.js dependencies for testing
npm ci

```

## Usage Examples

### Git Workflow and Deployment Process

This project follows a **main/develop** branching model with security gates and pull request requirements:

#### Development Workflow

**1. Feature Development:**
```bash
# Start from develop branch
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add new functionality"
git push origin feature/your-feature-name
```

**2. Pull Request Process:**
```bash
# Create PR via GitHub UI: feature/your-feature-name → develop
# This triggers: code-quality checks, testing pipeline, security scanning
# Require: Code review approval, all checks pass
# Merge: Squash and merge to develop
```

**3. Development Deployment (Testing Environment):**
```bash
# After PR merge to develop, deployment is automatic
git checkout develop
git pull origin develop
git push origin develop
# Triggers: code-quality → deploy (development environment)
```

**4. Production Deployment:**
```bash
# After develop testing validation, merge to main
git checkout main
git merge develop  # or merge via PR: develop → main
git push origin main
# Triggers: code-quality → deploy (production environment)

# Create production tag (optional)
git tag -a prod_v1.2.3 -m "Production release v1.2.3"
git push origin prod_v1.2.3
```

#### Branch Protection and Requirements

**Recommended Branch Protection Rules:**

- **`main`**: Require PR reviews, require status checks, no direct pushes
- **`develop`**: Require PR reviews, require status checks
- **Feature branches**: Delete after merge

**Required Status Checks:**
- Code Quality (PHPCS, PHPStan, ESLint)
- Testing Pipeline (PHPUnit, accessibility)

#### Hotfix Process

**Critical Production Fixes:**
```bash
# Create hotfix from main
git checkout main
git checkout -b hotfix/critical-fix

# Make fix and test locally
git commit -m "fix: resolve critical security issue"
git push origin hotfix/critical-fix

# Create PR: hotfix/critical-fix → main
# After approval and checks: merge and tag
git tag -a prod_v1.2.4 -m "Hotfix release v1.2.4"
git push origin prod_v1.2.4

# Backport to develop
git checkout develop
git merge main
git push origin develop
```

#### Branching Strategy Explained

**Branch Purpose:**
- **`main`**: Represents the tagged release that is on production
- **`develop`**: When main is tagged for a release, develop branch is an exact duplicate of main. As work is done, feature branches are made from the develop branch and merged back into develop. When a release is ready, develop is merged into main which is tagged as a release
- **`feature/*`**: Individual feature development branches created from develop
- **`hotfix/*`**: Critical production fixes

**Why This Workflow:**
- **Quality Assurance**: All changes require code review and automated testing
- **Deployment Safety**: Develop branch testing before production deployment
- **Audit Trail**: Clear history of what was deployed when
- **Rollback Capability**: Tagged releases enable quick rollbacks

**Workflow Automation:**
- **PR Creation**: Triggers code quality checks and testing
- **Development Deployment**: Automatic deployment to development environment for testing
- **Production Deployment**: Merge to main triggers production deployment

### Running Individual Workflows

**Manual Testing:**
```bash
# Via GitHub UI: Actions → Testing Pipeline → Run workflow
gh workflow run testing.yml

# Manual deployment workflow
gh workflow run deploy.yml --branch develop  # For development deployment
gh workflow run deploy.yml --branch main     # For production deployment
```

### Local Testing and Verification

**Code Quality Checks:**
```bash
# PHP standards
vendor/bin/phpcs
vendor/bin/phpstan analyse

# JavaScript linting
cd web/themes/custom/arsapps_theme
npm run lint
```

**Docker Build and Test:**
```bash
# Build production image
docker build -f docker/Dockerfile -t drupal-app:local .

# Test health check
docker run --rm drupal-app:local /usr/local/bin/healthcheck.sh
```

**Accessibility Testing:**
```bash
# Accessibility testing
npm run test:axe
npm run test:pa11y
```

## Monitoring and Troubleshooting

### Common Issues and Solutions

**1. Health Check Failures:**
```bash
# Test locally: docker run --rm your-image /usr/local/bin/healthcheck.sh
# Check logs: docker logs container-name
# Verify PHP-FPM: docker exec container-name ps aux | grep php-fpm
```

**2. Code Quality Failures:**
```bash
# PHPCS issues: vendor/bin/phpcs --report=full
# PHPStan issues: vendor/bin/phpstan analyse --level=0
# ESLint issues: cd web/themes/custom/arsapps_theme && npm run lint
```

**3. Test Failures:**
```bash
# PHPUnit: vendor/bin/phpunit --testsuite=custom --verbose
# Accessibility: Check reports in GitHub Actions artifacts
```

### Performance Optimization

**Cache Management:**
- GitHub Actions cache is automatically managed
- Clear cache if builds become inconsistent: GitHub Settings → Actions → Caches
- Use cache keys for reproducible builds

**Build Optimization:**
- Multi-stage Docker builds minimize image size
- Layer caching optimizes build times
- Parallel job execution reduces pipeline duration

### Best Practices

**Regular Maintenance:**
- Update base images monthly or when issues detected
- Review quality reports in GitHub Actions
- Monitor compliance artifacts

**Access Control:**
- Use repository secrets for sensitive values
- Implement branch protection rules
- Require quality checks passage for deployments
- Enable signed commits for production tags

## Integration with External Systems

### Azure Container Registry Integration

The workflows support seamless integration with Azure services:

```yaml
# Azure-specific configuration
registry: your-acr-registry.azurecr.io
secrets:
  acr_username: ${{ secrets.ACR_USERNAME }}
  acr_password: ${{ secrets.ACR_PASSWORD }}
```

### GitHub Integration

Quality results are automatically integrated with GitHub's features:

- **Pull Request Comments**: Automated quality summaries on PRs
- **Actions Tab**: Detailed workflow execution logs
- **Dependency Insights**: Integration with GitHub's dependency graph

### Monitoring and Alerting

The pipeline integrates with monitoring systems:

- **Azure Application Insights**: Container health and performance metrics
- **GitHub Actions Insights**: Workflow performance and reliability metrics

## Advanced Configuration

### Custom Quality Policies

To customize code quality rules:

```yaml
# In code-quality.yml
- name: Run PHPCS with custom rules
  run: |
    vendor/bin/phpcs --standard=custom-ruleset.xml
```

### Environment-Specific Testing

Configure different test suites for different environments:

```yaml
# Environment-specific test configuration
- name: Run production-specific tests
  if: startsWith(github.ref, 'refs/tags/prod_')
  run: npm run test:production
```

### Custom Health Checks

Extend the health check script for application-specific validation:

```bash
# Add to docker/healthcheck.sh
check_custom_functionality() {
    # Your custom health checks here
    log "Checking custom application functionality..."
}
```

This comprehensive workflow system provides automated testing and reliable deployment pipelines while maintaining developer productivity and system reliability.

For detailed technical specifications, see the project's DEVELOPER_NOTES.md file.

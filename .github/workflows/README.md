# GitHub Actions Workflows

This directory contains comprehensive GitHub Actions workflows for automated CI/CD, security scanning, and testing of the Drupal 11 project. The system implements a multi-layered security approach with automated vulnerability scanning, image immutability verification, and comprehensive testing pipelines.

## TL;DR

- A workflow can be triggered manually from the console (this assumes the gh CLI is installed): `gh workflow run image-security.yml --ref develop`. Progress on running workflows can be monitored in the Actions tab of the repo on Github.

## Architecture Overview

The workflow system uses a DRY (Don't Repeat Yourself) approach with reusable workflows and composite actions:

### Core Workflows

- **`stage-deploy.yml`**: Main deployment workflow with integrated security gates
- **`reusable-build.yml`**: Shared build and deployment logic for all environments
- **`image-security.yml`**: Comprehensive container security verification and vulnerability scanning
- **`code-quality.yml`**: Reusable workflow for PHPCS, PHPStan, and ESLint checks
- **`testing.yml`**: Comprehensive testing pipeline (PHPUnit, accessibility)

### Composite Actions

- **`.github/actions/setup-drupal-build/`**: Drupal build environment setup with caching

### Workflow Structure

```
.github/
├── workflows/
│   ├── stage-deploy.yml          # Main deployment workflow
│   ├── reusable-build.yml        # Shared build logic
│   ├── image-security.yml        # Security verification & vulnerability scanning
│   ├── code-quality.yml          # Code quality checks
│   └── testing.yml               # Testing pipeline (PHPUnit, a11y)
└── actions/
    └── setup-drupal-build/
        └── action.yml            # Composite action for build setup
```

## Security-First Deployment Pipeline

### Automated Security Gates

All deployments go through mandatory security verification:

```yaml
jobs:
  code-quality:     # PHPCS, PHPStan, ESLint checks
  image-security:   # Vulnerability scanning & immutability verification
  stage-deploy:     # Only proceeds if security gates pass
    needs: [code-quality, image-security]
```

### Multi-Scanner Vulnerability Detection

The security pipeline uses multiple industry-standard scanners:

- **Trivy**: Comprehensive vulnerability database with SARIF output
- **Grype**: Anchore's open-source vulnerability scanner
- **Docker Bench for Security**: CIS Docker Benchmark compliance

### Image Immutability Verification

Automated verification ensures production images are secure and complete:

✅ **Required Components Present:**
- `vendor/` directory with complete Composer dependencies
- `web/themes/custom/*/dist/` compiled frontend assets
- Drupal core files and directory structure
- Configuration directories and essential files

✅ **Development Tools Absent:**
- No `node_modules` directories in production
- No source files (`.scss`, `.js`, `package.json`)
- No development dependencies or build tools
- No package managers (`npm`, `composer`) in runtime

✅ **Security Model Enforced:**
- File permissions follow 640/750/770 security model
- Non-root user execution confirmed
- Proper user group membership (deploy:www-data)
- Secure file ownership throughout container

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

**Stage Deployment:**
- Push to `stage` branch
- Manual workflow dispatch

**Production Deployment:**
- Git tags prefixed with `prod_*` (e.g., `prod_v1.2.3`)

**Security Scanning:**
- All pushes to `main`, `stage`, `develop`
- All pull requests to `main`, `stage`
- Weekly scheduled scans (Monday 6 AM UTC)
- Manual workflow dispatch

**Testing Pipeline:**
- All pushes to `main`, `stage`, `develop`
- All pull requests to `main`, `stage`

### Environment-Specific Behavior

**Staging Deployments:**
- Standard security verification
- All vulnerability scanners enabled
- Artifact retention: 30 days

**Production Deployments:**
- Enhanced security auditing
- Additional production-specific checks
- Comprehensive compliance reporting
- Extended artifact retention: 90 days

## Container Registry and Tagging Strategy

### Image Tags Generated

**Stage Branch Builds:**
```
your-registry.azurecr.io/drupal-app:stage
your-registry.azurecr.io/drupal-app:stage-<commit-sha>
```

**Production Tag Builds:**
```
your-registry.azurecr.io/drupal-app:production
your-registry.azurecr.io/drupal-app:prod-<commit-sha>
your-registry.azurecr.io/drupal-app:prod_v1.2.3
```

**Security Verification:**
```
ghcr.io/your-org/repo:main
ghcr.io/your-org/repo:<branch-name>
ghcr.io/your-org/repo:<commit-sha>
```

## Security Compliance and Reporting

### Compliance Standards

The security pipeline ensures compliance with:

- **NIST Cybersecurity Framework**: Container security controls
- **CIS Docker Benchmark**: Container image security standards
- **OWASP Container Security**: Top 10 container security risks
- **Government Security Standards**: Section 508 and accessibility compliance

### Automated Security Reports

**Generated Reports:**
- Vulnerability scan results (SARIF format)
- Image immutability verification reports
- Security baseline compliance reports
- Comprehensive security compliance documentation

**GitHub Integration:**
- Security tab integration with SARIF uploads
- Pull request security comments
- Security alert notifications
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

This project follows a **Git Flow** branching model with security gates and pull request requirements:

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

**3. Stage Deployment (Testing Environment):**
```bash
# After PR merge to develop, create stage release
git checkout develop
git pull origin develop

# Merge develop to stage branch for deployment
git checkout stage
git merge develop
git push origin stage
# Triggers: code-quality → image-security → stage-deploy
```

**4. Production Deployment:**
```bash
# After stage testing validation, create production release
git checkout main
git merge develop  # or merge via PR: develop → main

# Create production tag
git tag -a prod_v1.2.3 -m "Production release v1.2.3"
git push origin prod_v1.2.3
# Triggers: code-quality → image-security → production-deploy (enhanced security)
```

#### Branch Protection and Requirements

**Recommended Branch Protection Rules:**

- **`main`**: Require PR reviews, require status checks, no direct pushes
- **`develop`**: Require PR reviews, require status checks
- **`stage`**: Fast-forward merges from develop only
- **Feature branches**: Delete after merge

**Required Status Checks:**
- Code Quality (PHPCS, PHPStan, ESLint)
- Security Scanning (vulnerability detection)
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
- **`main`**: Production-ready code, always deployable
- **`develop`**: Integration branch for features, pre-production testing
- **`stage`**: Deployment branch for staging environment testing
- **`feature/*`**: Individual feature development branches
- **`hotfix/*`**: Critical production fixes

**Why This Workflow:**
- **Security Gates**: Every code change goes through security scanning
- **Quality Assurance**: All changes require code review and automated testing
- **Deployment Safety**: Stage testing before production deployment
- **Audit Trail**: Clear history of what was deployed when
- **Rollback Capability**: Tagged releases enable quick rollbacks

**Workflow Automation:**
- **PR Creation**: Triggers code quality checks and security scanning
- **Stage Deployment**: Automatic deployment to staging environment for testing
- **Production Deployment**: Manual tagging triggers enhanced security verification
- **Security Monitoring**: Weekly scans and vulnerability detection

### Running Individual Workflows

**Manual Security Scan:**
```bash
# Via GitHub UI: Actions → Image Security and Verification → Run workflow
# Or via GitHub CLI:
gh workflow run image-security.yml
```

**Manual Testing:**
```bash
# Via GitHub UI: Actions → Testing Pipeline → Run workflow
gh workflow run testing.yml
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

**Docker Build and Security Test:**
```bash
# Build production image
docker build -f docker/Dockerfile -t drupal-app:local .

# Test health check
docker run --rm drupal-app:local /usr/local/bin/healthcheck.sh

# Run security verification
docker run --rm -v $(pwd):/workspace aquasec/trivy image drupal-app:local
```

**Accessibility Testing:**
```bash
# Accessibility testing
npm run test:axe
npm run test:pa11y
```

## Monitoring and Troubleshooting

### Common Issues and Solutions

**1. Security Scan Failures:**
```bash
# View security issues in GitHub Security tab
# Update base images: Update Dockerfile FROM statements
# Check for vulnerable dependencies: composer audit
```

**2. Image Immutability Failures:**
```bash
# Verify frontend build: cd web/themes/custom/arsapps_theme && npm run build
# Check .gitignore: Ensure dist/ is not ignored
# Verify Dockerfile: Check COPY statements for dist/ directories
```

**3. Health Check Failures:**
```bash
# Test locally: docker run --rm your-image /usr/local/bin/healthcheck.sh
# Check logs: docker logs container-name
# Verify PHP-FPM: docker exec container-name ps aux | grep php-fpm
```

**4. Code Quality Failures:**
```bash
# PHPCS issues: vendor/bin/phpcs --report=full
# PHPStan issues: vendor/bin/phpstan analyse --level=0
# ESLint issues: cd web/themes/custom/arsapps_theme && npm run lint
```

**5. Test Failures:**
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

### Security Best Practices

**Regular Maintenance:**
- Weekly vulnerability scans run automatically
- Update base images monthly or when vulnerabilities detected
- Review security reports in GitHub Security tab
- Monitor security compliance artifacts

**Access Control:**
- Use repository secrets for sensitive values
- Implement branch protection rules
- Require security scan passage for deployments
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

### GitHub Security Integration

Security results are automatically integrated with GitHub's security features:

- **Security Tab**: Vulnerability findings appear in repository security tab
- **Pull Request Comments**: Automated security summaries on PRs
- **Security Alerts**: Notifications for critical vulnerabilities
- **Dependency Insights**: Integration with GitHub's dependency graph

### Monitoring and Alerting

The pipeline integrates with monitoring systems:

- **Azure Application Insights**: Container health and performance metrics
- **GitHub Actions Insights**: Workflow performance and reliability metrics
- **Security Monitoring**: Automated alerts for security violations

## Advanced Configuration

### Custom Security Policies

To customize security scanning rules:

```yaml
# In image-security.yml
- name: Run Trivy with custom policy
  uses: aquasecurity/trivy-action@master
  with:
    severity: 'CRITICAL,HIGH'
    ignore-unfixed: true
    trivyignores: .trivyignore  # Custom ignore file
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

This comprehensive workflow system provides government-grade security, automated testing, and reliable deployment pipelines while maintaining developer productivity and system reliability.

For detailed technical specifications, see the project's DEVELOPER_NOTES.md file.

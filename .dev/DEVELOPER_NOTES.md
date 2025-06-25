<!--
Developer Notes
This file is maintained automatically via scoped AI prompts.
Purpose: To capture infrastructure, dev workflow, testing, and deployment standards for this Drupal 11 project.
Treat this as a living internal reference for developers and engineers working on this system.
Do not delete this comment. If you reorganize sections, do so thoughtfully and preserve continuity.
-->

# Developer Notes

This document captures technical decisions, practices, standards, and implementation details for this Drupal 11 project. It is updated progressively in response to scoped prompts during the CI/CD and development pipeline buildout process.

_Last updated: June 25, 2025_

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

**Security Considerations:**
- Regular base image updates for security patches
- Minimize installed packages to reduce attack surface
- Use multi-stage builds to exclude build-time dependencies from final image
- Consider vulnerability scanning with tools like Snyk for ongoing security assessment

---

## CI/CD and GitHub Actions

<!-- AI appends here from all CI/CD related prompts -->

---

## Testing

<!-- AI appends here from test-related prompts -->

---

## Security & secrets management

<!-- AI appends here from security-related prompts -->

---

## Deployment environments

<!-- AI appends here based on deployment prompts -->

---

## Prompt history index (optional)

<!-- Optional: AI may add bullet summaries here to help orient future iterations -->

---

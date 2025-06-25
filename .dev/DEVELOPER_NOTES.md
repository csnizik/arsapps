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

<!-- AI appends here from prompts about Docker and DDEV -->

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

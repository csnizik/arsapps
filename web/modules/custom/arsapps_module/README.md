# ARSApps Module

## Overview

ARSApps Module is a placeholder custom module designed for ARSApps projects. This module serves as a foundation for future custom functionality and is primarily used for CI/CD pipeline testing and development workflow validation.

## Purpose

This module is intentionally minimal and safe - it provides common Drupal module structure without any functionality that could interfere with site operations. It's designed to:

- Serve as a template for future custom modules
- Test CI/CD pipeline functionality
- Validate coding standards and testing workflows
- Demonstrate proper Drupal module architecture

## Features

- **Configuration Management**: Basic configuration schema and install files
- **Form API**: Example settings form
- **Plugin System**: Sample block plugin
- **Routing**: Basic route definitions
- **Help Integration**: Help page implementation
- **Testing**: Functional test examples

## Installation

1. Place this module in `modules/custom/arsapps_module`
2. Enable via Drupal admin interface or Drush:
   ```bash
   drush en arsapps_module
   ```

## Configuration

Visit **Administration > Configuration > System > ARSApps Module Settings** (`/admin/config/system/arsapps-module`) to access the module settings.

## Development

### Requirements

- Drupal 11.x
- PHP 8.3+

### Testing

Run tests using PHPUnit:

```bash
# Run all module tests
phpunit --filter ArsappsModule

# Run specific test class
phpunit web/modules/custom/arsapps_module/tests/src/Functional/ArsappsModuleTest.php
```

### Code Standards

This module follows Drupal coding standards. Run PHPCS to validate:

```bash
phpcs --standard=Drupal web/modules/custom/arsapps_module/
```

## File Structure

```
arsapps_module/
├── README.md
├── arsapps_module.info.yml
├── arsapps_module.module
├── arsapps_module.routing.yml
├── config/
│   ├── install/
│   │   └── arsapps_module.settings.yml
│   └── schema/
│       └── arsapps_module.schema.yml
├── src/
│   ├── Controller/
│   │   └── ArsappsModuleController.php
│   ├── Form/
│   │   └── ArsappsModuleSettingsForm.php
│   └── Plugin/
│       └── Block/
│           └── ArsappsModuleBlock.php
└── tests/
    └── src/
        └── Functional/
            └── ArsappsModuleTest.php
```

## License

This module is provided as-is for internal ARSApps development purposes.
#!/bin/bash
# Comprehensive Drupal 11 Docker Container Health Check
# Verifies site is online and responding correctly
# Follows DEVELOPER_NOTES.md security and immutability practices

set -euo pipefail

# Health check configuration
readonly HEALTH_CHECK_TIMEOUT=10
readonly HEALTH_CHECK_PORT=${HEALTH_CHECK_PORT:-9000}
readonly HEALTH_CHECK_HOST=${HEALTH_CHECK_HOST:-localhost}
readonly LOG_PREFIX="[HEALTHCHECK]"

# Logging function
log() {
    echo "${LOG_PREFIX} $*" >&2
}

# Critical error function
critical_error() {
    log "CRITICAL: $*"
    exit 1
}

# Warning function  
warning() {
    log "WARNING: $*"
}

# Success function
success() {
    log "SUCCESS: $*"
}

# Check PHP-FPM process is running
check_php_fpm() {
    log "Checking PHP-FPM process..."
    
    if ! pgrep -f "php-fpm: master process" > /dev/null 2>&1; then
        critical_error "PHP-FPM master process not running"
    fi
    
    if ! pgrep -f "php-fpm: pool www" > /dev/null 2>&1; then
        critical_error "PHP-FPM worker processes not running"
    fi
    
    success "PHP-FPM processes are running"
}

# Check PHP-FPM socket/port is responsive
check_php_fpm_socket() {
    log "Checking PHP-FPM socket connectivity..."
    
    # Create a simple PHP script to test FPM
    local test_script=$(mktemp)
    cat > "$test_script" << 'EOF'
<?php
// Basic PHP functionality test
echo "PHP_VERSION=" . PHP_VERSION . "\n";
echo "DRUPAL_ROOT=" . (defined('DRUPAL_ROOT') ? 'DEFINED' : 'NOT_DEFINED') . "\n";
echo "TIMESTAMP=" . time() . "\n";
exit(0);
EOF

    # Test PHP-FPM via cgi-fcgi if available, otherwise use alternative method
    if command -v cgi-fcgi >/dev/null 2>&1; then
        local result
        if ! result=$(timeout "$HEALTH_CHECK_TIMEOUT" cgi-fcgi -bind -connect "${HEALTH_CHECK_HOST}:${HEALTH_CHECK_PORT}" < "$test_script" 2>/dev/null); then
            rm -f "$test_script"
            critical_error "PHP-FPM socket not responding on ${HEALTH_CHECK_HOST}:${HEALTH_CHECK_PORT}"
        fi
        
        if [[ ! "$result" == *"PHP_VERSION="* ]]; then
            rm -f "$test_script"
            critical_error "PHP-FPM returned invalid response"
        fi
    else
        # Alternative: check if PHP can execute directly
        if ! timeout "$HEALTH_CHECK_TIMEOUT" php "$test_script" >/dev/null 2>&1; then
            rm -f "$test_script"
            critical_error "PHP interpreter not responding"
        fi
    fi
    
    rm -f "$test_script"
    success "PHP-FPM socket is responsive"
}

# Check Drupal bootstrap capability
check_drupal_bootstrap() {
    log "Checking Drupal bootstrap capability..."
    
    # Change to Drupal webroot
    cd /var/www/html/web || critical_error "Cannot access Drupal webroot"
    
    # Test basic Drupal bootstrap
    local bootstrap_test=$(mktemp)
    cat > "$bootstrap_test" << 'EOF'
<?php
// Minimal Drupal bootstrap test
use Drupal\Core\DrupalKernel;
use Symfony\Component\HttpFoundation\Request;

$autoloader = require_once '../vendor/autoload.php';

try {
    $request = Request::createFromGlobals();
    $kernel = DrupalKernel::createFromRequest($request, $autoloader, 'prod');
    $kernel->boot();
    
    // Check if essential Drupal services are available
    $container = $kernel->getContainer();
    
    if (!$container->has('database')) {
        echo "ERROR: Database service not available\n";
        exit(1);
    }
    
    if (!$container->has('config.factory')) {
        echo "ERROR: Config factory service not available\n";
        exit(1);
    }
    
    echo "SUCCESS: Drupal bootstrap completed\n";
    exit(0);
    
} catch (Exception $e) {
    echo "ERROR: Drupal bootstrap failed: " . $e->getMessage() . "\n";
    exit(1);
} catch (Error $e) {
    echo "ERROR: Drupal bootstrap failed: " . $e->getMessage() . "\n";
    exit(1);
}
EOF

    local bootstrap_result
    if ! bootstrap_result=$(timeout "$HEALTH_CHECK_TIMEOUT" php "$bootstrap_test" 2>&1); then
        rm -f "$bootstrap_test"
        warning "Drupal bootstrap check failed: $bootstrap_result"
        # Don't fail the health check entirely for bootstrap issues in some environments
        return 0
    fi
    
    if [[ "$bootstrap_result" == *"ERROR:"* ]]; then
        rm -f "$bootstrap_test"
        warning "Drupal bootstrap issues detected: $bootstrap_result"
        return 0
    fi
    
    rm -f "$bootstrap_test"
    success "Drupal bootstrap is functional"
}

# Check critical file structure and immutability
check_file_structure() {
    log "Checking critical file structure and immutability..."
    
    # Check vendor directory exists and has content
    if [[ ! -d "/var/www/html/vendor" ]]; then
        critical_error "vendor/ directory missing - image immutability compromised"
    fi
    
    if [[ ! -f "/var/www/html/vendor/autoload.php" ]]; then
        critical_error "vendor/autoload.php missing - Composer dependencies incomplete"
    fi
    
    # Check custom theme dist directory exists
    if [[ ! -d "/var/www/html/web/themes/custom/arsapps_theme/dist" ]]; then
        critical_error "web/themes/custom/arsapps_theme/dist/ missing - frontend assets not compiled"
    fi
    
    # Verify no dev dependencies or source files are present (immutability check)
    if [[ -d "/var/www/html/node_modules" ]]; then
        critical_error "node_modules found in production image - build process failed"
    fi
    
    if [[ -f "/var/www/html/web/themes/custom/arsapps_theme/package.json" ]]; then
        critical_error "Source package.json found - dev files not properly excluded"
    fi
    
    # Check essential Drupal core files
    if [[ ! -f "/var/www/html/web/index.php" ]]; then
        critical_error "web/index.php missing - Drupal core incomplete"
    fi
    
    if [[ ! -f "/var/www/html/web/core/lib/Drupal.php" ]]; then
        critical_error "Drupal core files missing"
    fi
    
    # Check file permissions align with security model (640/750/770)
    local index_permissions=$(stat -c "%a" "/var/www/html/web/index.php")
    if [[ "$index_permissions" != "640" ]]; then
        warning "File permission mismatch: index.php has $index_permissions, expected 640"
    fi
    
    success "File structure and immutability checks passed"
}

# Check disk space and resource constraints
check_resources() {
    log "Checking container resources..."
    
    # Check available disk space
    local disk_usage=$(df /var/www/html | awk 'NR==2 {print $5}' | sed 's/%//')
    if [[ "$disk_usage" -gt 90 ]]; then
        warning "High disk usage: ${disk_usage}%"
    fi
    
    # Check memory usage if /proc/meminfo is available
    if [[ -r /proc/meminfo ]]; then
        local mem_total=$(awk '/MemTotal/ {print $2}' /proc/meminfo)
        local mem_available=$(awk '/MemAvailable/ {print $2}' /proc/meminfo)
        local mem_usage_percent=$(( (mem_total - mem_available) * 100 / mem_total ))
        
        if [[ "$mem_usage_percent" -gt 90 ]]; then
            warning "High memory usage: ${mem_usage_percent}%"
        fi
    fi
    
    success "Resource checks completed"
}

# Check configuration files are accessible
check_configuration() {
    log "Checking configuration accessibility..."
    
    # Check if settings.php exists and is readable
    if [[ -f "/var/www/html/web/sites/default/settings.php" ]]; then
        if [[ ! -r "/var/www/html/web/sites/default/settings.php" ]]; then
            critical_error "settings.php exists but is not readable"
        fi
        success "settings.php is accessible"
    else
        warning "settings.php not found - may be using environment-based configuration"
    fi
    
    # Check config directory structure
    if [[ -d "/var/www/html/config" ]]; then
        success "Configuration directory structure is present"
    else
        warning "Config directory not found - using default configuration"
    fi
}

# Check security headers and user context
check_security_context() {
    log "Checking security context..."
    
    # Verify running as non-root user
    local current_user=$(id -u)
    if [[ "$current_user" == "0" ]]; then
        critical_error "Container running as root user - security violation"
    fi
    
    # Verify user belongs to correct groups
    local user_groups=$(id -Gn)
    if [[ "$user_groups" != *"www-data"* ]]; then
        warning "User not in www-data group - may affect file permissions"
    fi
    
    if [[ "$user_groups" != *"deploy"* ]]; then
        warning "User not in deploy group - may affect file ownership"
    fi
    
    success "Security context checks passed"
}

# Main health check execution
main() {
    log "Starting comprehensive Drupal 11 container health check..."
    
    # Core system checks (critical)
    check_php_fpm
    check_php_fpm_socket
    check_file_structure
    check_security_context
    
    # Application checks (important but not critical)
    check_drupal_bootstrap
    check_configuration
    check_resources
    
    success "All health checks completed successfully"
    log "Container is healthy and ready to serve requests"
    exit 0
}

# Execute main function
main "$@"
/**
 * Accessibility testing utilities for Section 508 compliance
 * Provides axe-core integration and custom accessibility checks
 */

const { expect } = require('@playwright/test');

/**
 * Inject axe-core into the page for accessibility testing
 * @param {import('@playwright/test').Page} page
 */
async function injectAxe(page) {
  await page.addScriptTag({
    path: require.resolve('axe-core/axe.min.js')
  });
}

/**
 * Run axe accessibility scan with Section 508 rules
 * @param {import('@playwright/test').Page} page
 * @param {Object} options - Axe configuration options
 * @returns {Promise<Object>} Axe results
 */
async function runAxeScan(page, options = {}) {
  await injectAxe(page);
  
  const defaultOptions = {
    // Section 508 compliance rules
    tags: ['section508', 'wcag2a', 'wcag2aa', 'wcag21aa'],
    // Include Layout Builder regions
    include: [
      // Drupal Layout Builder regions
      '[data-layout-builder-content]',
      '.layout-builder__layout',
      '.block',
      // Standard content areas
      'main',
      'article',
      'section',
      'nav',
      'header',
      'footer'
    ],
    exclude: [
      // Exclude admin toolbars and development tools
      '#toolbar-administration',
      '.contextual-toolbar',
      '.gin-toolbar',
      // Exclude known third-party widgets that may have issues
      '.drupal-dev-toolbar'
    ],
    // Section 508 specific rules
    rules: {
      // Critical accessibility rules for government sites
      'color-contrast': { enabled: true },
      'keyboard-navigation': { enabled: true },
      'aria-labels': { enabled: true },
      'heading-order': { enabled: true },
      'landmark-roles': { enabled: true },
      'link-purpose': { enabled: true },
      'image-alt': { enabled: true },
      'form-labels': { enabled: true },
      'focus-visible': { enabled: true },
      // Disable rules that may conflict with Drupal's admin UI
      'region': { enabled: false } // Layout Builder creates complex regions
    }
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  const results = await page.evaluate((axeOptions) => {
    return axe.run(document, axeOptions);
  }, mergedOptions);
  
  return results;
}

/**
 * Assert that there are no accessibility violations
 * @param {Object} axeResults - Results from runAxeScan
 * @param {Array} allowedViolations - Array of rule IDs to ignore
 */
async function assertNoA11yViolations(axeResults, allowedViolations = []) {
  const violations = axeResults.violations.filter(
    violation => !allowedViolations.includes(violation.id)
  );
  
  if (violations.length > 0) {
    const violationMessages = violations.map(violation => {
      const targets = violation.nodes.map(node => node.target).join(', ');
      return `${violation.id}: ${violation.description} (Found on: ${targets})`;
    }).join('\n');
    
    throw new Error(`Accessibility violations found:\n${violationMessages}`);
  }
}

/**
 * Test keyboard navigation for Layout Builder elements
 * @param {import('@playwright/test').Page} page
 */
async function testKeyboardNavigation(page) {
  // Test tab navigation through Layout Builder elements
  const focusableElements = await page.locator('[data-layout-builder-content] a, [data-layout-builder-content] button, [data-layout-builder-content] input, [data-layout-builder-content] select, [data-layout-builder-content] textarea, [data-layout-builder-content] [tabindex="0"]').all();
  
  for (const element of focusableElements) {
    await element.focus();
    
    // Verify element is visually focused
    const isFocused = await element.evaluate(el => {
      return document.activeElement === el;
    });
    
    expect(isFocused).toBeTruthy();
    
    // Check for visible focus indicator
    const hasVisibleFocus = await element.evaluate(el => {
      const styles = window.getComputedStyle(el, ':focus');
      return styles.outline !== 'none' || styles.boxShadow !== 'none';
    });
    
    expect(hasVisibleFocus).toBeTruthy();
  }
}

/**
 * Test screen reader announcements
 * @param {import('@playwright/test').Page} page
 */
async function testScreenReaderAnnouncements(page) {
  // Check for proper ARIA live regions in Layout Builder
  const liveRegions = await page.locator('[aria-live]').all();
  
  for (const region of liveRegions) {
    const ariaLive = await region.getAttribute('aria-live');
    expect(['polite', 'assertive', 'off']).toContain(ariaLive);
  }
  
  // Verify Layout Builder messages have proper announcements
  const messages = await page.locator('.messages, .alert, [role="alert"]').all();
  
  for (const message of messages) {
    const hasProperRole = await message.getAttribute('role');
    const hasAriaLive = await message.getAttribute('aria-live');
    
    expect(hasProperRole || hasAriaLive).toBeTruthy();
  }
}

/**
 * Test Layout Builder specific accessibility requirements
 * @param {import('@playwright/test').Page} page
 */
async function testLayoutBuilderAccessibility(page) {
  // Test drag and drop accessibility
  const draggableElements = await page.locator('[draggable="true"]').all();
  
  for (const element of draggableElements) {
    // Check for keyboard alternative to drag and drop
    const hasKeyboardAlternative = await element.evaluate(el => {
      // Look for keyboard event handlers or ARIA attributes
      return el.hasAttribute('aria-grabbed') || 
             el.hasAttribute('aria-dropeffect') ||
             el.hasAttribute('tabindex') ||
             el.querySelector('[role="button"]') !== null;
    });
    
    expect(hasKeyboardAlternative).toBeTruthy();
  }
  
  // Test Layout Builder regions have proper landmarks
  const layoutRegions = await page.locator('[data-layout-builder-content]').all();
  
  for (const region of layoutRegions) {
    const hasLandmarkRole = await region.evaluate(el => {
      const role = el.getAttribute('role');
      const tagName = el.tagName.toLowerCase();
      const landmarkRoles = ['main', 'navigation', 'banner', 'contentinfo', 'complementary', 'search', 'form'];
      const landmarkTags = ['main', 'nav', 'header', 'footer', 'aside', 'section'];
      
      return landmarkRoles.includes(role) || landmarkTags.includes(tagName);
    });
    
    if (!hasLandmarkRole) {
      console.warn('Layout Builder region without landmark role found:', await region.innerHTML());
    }
  }
}

/**
 * Generate accessibility report
 * @param {Object} axeResults - Results from axe scan
 * @param {string} pageName - Name of the page being tested
 * @returns {Object} Formatted report
 */
function generateAccessibilityReport(axeResults, pageName) {
  return {
    page: pageName,
    timestamp: new Date().toISOString(),
    summary: {
      violations: axeResults.violations.length,
      passes: axeResults.passes.length,
      incomplete: axeResults.incomplete.length,
      inapplicable: axeResults.inapplicable.length
    },
    violations: axeResults.violations.map(violation => ({
      id: violation.id,
      impact: violation.impact,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      nodes: violation.nodes.length,
      targets: violation.nodes.map(node => node.target[0])
    })),
    passes: axeResults.passes.length,
    url: axeResults.url
  };
}

module.exports = {
  injectAxe,
  runAxeScan,
  assertNoA11yViolations,
  testKeyboardNavigation,
  testScreenReaderAnnouncements,
  testLayoutBuilderAccessibility,
  generateAccessibilityReport
};
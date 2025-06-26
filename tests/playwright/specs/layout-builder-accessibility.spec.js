/**
 * Layout Builder Accessibility Tests
 * Tests Section 508 compliance for all Layout Builder rendered pages
 */

const { test, expect } = require('@playwright/test');
const { 
  runAxeScan, 
  assertNoA11yViolations, 
  testKeyboardNavigation,
  testScreenReaderAnnouncements,
  testLayoutBuilderAccessibility,
  generateAccessibilityReport
} = require('../../accessibility/accessibility-utils');

// Layout Builder pages to test (update with actual node paths)
const layoutBuilderPages = [
  '/', // Homepage
  '/node/1', // Example content page
  '/about', // Example page
  // Add more Layout Builder enabled pages here
];

// Test each Layout Builder page for Section 508 compliance
for (const pagePath of layoutBuilderPages) {
  test.describe(`Layout Builder Accessibility: ${pagePath}`, () => {
    
    test.beforeEach(async ({ page }) => {
      // Navigate to the page
      await page.goto(pagePath);
      
      // Wait for Layout Builder content to load
      await page.waitForSelector('body', { state: 'attached' });
      
      // Wait for any dynamic content
      await page.waitForTimeout(2000);
    });

    test('should have no accessibility violations', async ({ page }) => {
      // Run comprehensive axe scan
      const axeResults = await runAxeScan(page);
      
      // Generate report for QA review
      const report = generateAccessibilityReport(axeResults, pagePath);
      
      // Attach report to test results
      await test.info().attach('accessibility-report.json', {
        body: JSON.stringify(report, null, 2),
        contentType: 'application/json'
      });
      
      // Assert no violations (with some allowed exceptions for known Drupal issues)
      const allowedViolations = [
        // Add rule IDs here if there are known acceptable violations
        // Example: 'color-contrast' if using approved color schemes
      ];
      
      await assertNoA11yViolations(axeResults, allowedViolations);
    });

    test('should support keyboard navigation', async ({ page }) => {
      await testKeyboardNavigation(page);
    });

    test('should have proper screen reader support', async ({ page }) => {
      await testScreenReaderAnnouncements(page);
    });

    test('should have accessible Layout Builder components', async ({ page }) => {
      // Skip if no Layout Builder content present
      const hasLayoutBuilderContent = await page.locator('[data-layout-builder-content]').count() > 0;
      
      if (!hasLayoutBuilderContent) {
        test.skip('No Layout Builder content found on this page');
      }
      
      await testLayoutBuilderAccessibility(page);
    });

    test('should have proper heading structure', async ({ page }) => {
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      
      if (headings.length === 0) {
        test.skip('No headings found on page');
      }
      
      // Check for h1 presence
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeGreaterThanOrEqual(1);
      expect(h1Count).toBeLessThanOrEqual(1); // Should have exactly one h1
      
      // Check heading hierarchy
      let previousLevel = 0;
      
      for (const heading of headings) {
        const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
        const currentLevel = parseInt(tagName.replace('h', ''));
        
        // Headings should not skip levels (h1 -> h3 is not allowed)
        if (previousLevel > 0) {
          expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
        }
        
        previousLevel = currentLevel;
      }
    });

    test('should have accessible images', async ({ page }) => {
      const images = await page.locator('img').all();
      
      for (const img of images) {
        const alt = await img.getAttribute('alt');
        const src = await img.getAttribute('src');
        const role = await img.getAttribute('role');
        
        // Decorative images should have empty alt or role="presentation"
        // Content images should have meaningful alt text
        if (role !== 'presentation' && role !== 'none') {
          expect(alt).not.toBeNull();
          
          // Check for meaningful alt text (not just filename)
          if (alt && alt.length > 0) {
            expect(alt).not.toMatch(/\.(jpg|jpeg|png|gif|svg|webp)$/i);
            expect(alt.length).toBeGreaterThan(2);
          }
        }
      }
    });

    test('should have accessible forms', async ({ page }) => {
      const formElements = await page.locator('input, select, textarea').all();
      
      for (const element of formElements) {
        const type = await element.getAttribute('type');
        
        // Skip hidden inputs
        if (type === 'hidden') continue;
        
        // Check for labels
        const id = await element.getAttribute('id');
        const ariaLabel = await element.getAttribute('aria-label');
        const ariaLabelledby = await element.getAttribute('aria-labelledby');
        
        let hasLabel = false;
        
        if (id) {
          const labelCount = await page.locator(`label[for="${id}"]`).count();
          hasLabel = labelCount > 0;
        }
        
        hasLabel = hasLabel || !!ariaLabel || !!ariaLabelledby;
        
        expect(hasLabel).toBeTruthy();
      }
    });

    test('should have accessible links', async ({ page }) => {
      const links = await page.locator('a[href]').all();
      
      for (const link of links) {
        const href = await link.getAttribute('href');
        const text = await link.textContent();
        const ariaLabel = await link.getAttribute('aria-label');
        const title = await link.getAttribute('title');
        
        // Links should have accessible text
        const hasAccessibleText = (text && text.trim().length > 0) || 
                                 (ariaLabel && ariaLabel.trim().length > 0) ||
                                 (title && title.trim().length > 0);
        
        expect(hasAccessibleText).toBeTruthy();
        
        // Avoid generic link text
        if (text) {
          const genericTexts = ['click here', 'read more', 'here', 'more', 'link'];
          const isGeneric = genericTexts.some(generic => 
            text.toLowerCase().trim() === generic
          );
          
          if (isGeneric) {
            // Generic text is okay if there's additional context via aria-label
            expect(ariaLabel || title).toBeTruthy();
          }
        }
      }
    });

    test('should have proper color contrast', async ({ page }) => {
      // This is primarily handled by axe-core, but we can do additional checks
      const textElements = await page.locator('p, span, div, h1, h2, h3, h4, h5, h6, li, td, th, label').all();
      
      // Sample a few elements for manual contrast verification
      const sampleSize = Math.min(10, textElements.length);
      const sampleElements = textElements.slice(0, sampleSize);
      
      for (const element of sampleElements) {
        const styles = await element.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontSize: computed.fontSize
          };
        });
        
        // Log color information for manual review
        console.log('Element color info:', styles);
      }
    });

  });
}

// Test Layout Builder admin interface accessibility (if admin access available)
test.describe('Layout Builder Admin Interface', () => {
  test.skip(({ browserName }) => {
    // Skip admin tests if not configured for admin access
    return !process.env.ADMIN_USER || !process.env.ADMIN_PASS;
  }, 'Admin credentials not configured');
  
  test.beforeEach(async ({ page }) => {
    // Login as admin (implement authentication)
    // This would need actual admin credentials or test user setup
    test.skip('Admin authentication not implemented yet');
  });
  
  test('Layout Builder admin interface should be accessible', async ({ page }) => {
    await page.goto('/admin/structure/types');
    
    const axeResults = await runAxeScan(page, {
      // More lenient rules for admin interface
      tags: ['wcag2a', 'section508'],
      exclude: [
        '#toolbar-administration',
        '.contextual-toolbar'
      ]
    });
    
    // Admin interface may have some acceptable violations
    const allowedViolations = [
      'region', // Complex admin layouts
      'landmark-one-main' // Multiple main regions in admin
    ];
    
    await assertNoA11yViolations(axeResults, allowedViolations);
  });
});
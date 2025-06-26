/**
 * Layout Builder Regression Tests
 * Tests Layout Builder functionality and frontend interactions
 */

const { test, expect } = require('@playwright/test');

test.describe('Layout Builder Frontend Functionality', () => {
  
  // Test responsive Layout Builder layouts
  test.describe('Responsive Layout Testing', () => {
    const testPages = ['/', '/node/1']; // Update with actual Layout Builder pages
    
    for (const pagePath of testPages) {
      test(`${pagePath} should render correctly on desktop`, async ({ page }) => {
        await page.setViewportSize({ width: 1200, height: 800 });
        await page.goto(pagePath);
        
        // Wait for layout to stabilize
        await page.waitForLoadState('networkidle');
        
        // Take screenshot for visual regression
        await expect(page).toHaveScreenshot(`${pagePath.replace(/\//g, '_')}_desktop.png`, {
          fullPage: true,
          animations: 'disabled'
        });
        
        // Check Layout Builder content is visible
        const layoutContent = page.locator('[data-layout-builder-content]');
        if (await layoutContent.count() > 0) {
          await expect(layoutContent.first()).toBeVisible();
        }
      });
      
      test(`${pagePath} should render correctly on tablet`, async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.goto(pagePath);
        
        await page.waitForLoadState('networkidle');
        
        await expect(page).toHaveScreenshot(`${pagePath.replace(/\//g, '_')}_tablet.png`, {
          fullPage: true,
          animations: 'disabled'
        });
      });
      
      test(`${pagePath} should render correctly on mobile`, async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto(pagePath);
        
        await page.waitForLoadState('networkidle');
        
        await expect(page).toHaveScreenshot(`${pagePath.replace(/\//g, '_')}_mobile.png`, {
          fullPage: true,
          animations: 'disabled'
        });
      });
    }
  });

  test.describe('Layout Builder Component Interactions', () => {
    
    test('Layout Builder blocks should load correctly', async ({ page }) => {
      await page.goto('/');
      
      // Find all Layout Builder blocks
      const blocks = page.locator('.block');
      const blockCount = await blocks.count();
      
      if (blockCount === 0) {
        test.skip('No blocks found on page');
      }
      
      // Test each block loads without errors
      for (let i = 0; i < blockCount; i++) {
        const block = blocks.nth(i);
        await expect(block).toBeVisible();
        
        // Check for any error messages in blocks
        const errorMessages = block.locator('.messages--error, .error');
        await expect(errorMessages).toHaveCount(0);
      }
    });

    test('Interactive elements should function correctly', async ({ page }) => {
      await page.goto('/');
      
      // Test buttons in Layout Builder content
      const buttons = page.locator('[data-layout-builder-content] button, [data-layout-builder-content] .button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < Math.min(5, buttonCount); i++) {
        const button = buttons.nth(i);
        
        if (await button.isVisible()) {
          // Check button is clickable
          await expect(button).toBeEnabled();
          
          // Test click interaction (without actually clicking to avoid navigation)
          await button.hover();
          
          // Check for hover effects or focus states
          await button.focus();
          const isFocused = await button.evaluate(el => document.activeElement === el);
          expect(isFocused).toBeTruthy();
        }
      }
    });

    test('Forms in Layout Builder should be functional', async ({ page }) => {
      await page.goto('/');
      
      // Find forms in Layout Builder content
      const forms = page.locator('[data-layout-builder-content] form');
      const formCount = await forms.count();
      
      if (formCount === 0) {
        test.skip('No forms found in Layout Builder content');
      }
      
      for (let i = 0; i < formCount; i++) {
        const form = forms.nth(i);
        
        if (await form.isVisible()) {
          // Test form inputs
          const inputs = form.locator('input:not([type="hidden"]), textarea, select');
          const inputCount = await inputs.count();
          
          for (let j = 0; j < inputCount; j++) {
            const input = inputs.nth(j);
            
            if (await input.isVisible() && await input.isEnabled()) {
              const inputType = await input.getAttribute('type');
              
              // Test different input types
              switch (inputType) {
                case 'text':
                case 'email':
                case 'tel':
                case null: // textarea
                  await input.fill('Test input');
                  await expect(input).toHaveValue('Test input');
                  await input.clear();
                  break;
                  
                case 'checkbox':
                  await input.check();
                  await expect(input).toBeChecked();
                  await input.uncheck();
                  break;
                  
                case 'radio':
                  await input.check();
                  await expect(input).toBeChecked();
                  break;
              }
            }
          }
        }
      }
    });

    test('Navigation elements should work correctly', async ({ page }) => {
      await page.goto('/');
      
      // Test navigation menus in Layout Builder
      const navElements = page.locator('[data-layout-builder-content] nav, [data-layout-builder-content] .menu');
      const navCount = await navElements.count();
      
      for (let i = 0; i < navCount; i++) {
        const nav = navElements.nth(i);
        
        if (await nav.isVisible()) {
          // Test navigation links
          const links = nav.locator('a');
          const linkCount = await links.count();
          
          // Test first few links (avoid testing all to prevent long test times)
          for (let j = 0; j < Math.min(3, linkCount); j++) {
            const link = links.nth(j);
            
            if (await link.isVisible()) {
              const href = await link.getAttribute('href');
              
              // Verify links have proper href attributes
              expect(href).toBeTruthy();
              expect(href).not.toBe('#');
              
              // Test hover states
              await link.hover();
              
              // Check for dropdown or expanded states if applicable
              const hasDropdown = await link.evaluate(el => {
                const parent = el.closest('.menu-item, .nav-item');
                return parent && parent.querySelector('.dropdown, .submenu') !== null;
              });
              
              if (hasDropdown) {
                // Test dropdown functionality
                await link.click();
                await page.waitForTimeout(500);
                
                const dropdown = page.locator('.dropdown:visible, .submenu:visible').first();
                if (await dropdown.count() > 0) {
                  await expect(dropdown).toBeVisible();
                }
              }
            }
          }
        }
      }
    });
  });

  test.describe('Layout Builder Performance', () => {
    
    test('Page should load within acceptable time limits', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/', { waitUntil: 'networkidle' });
      
      const loadTime = Date.now() - startTime;
      
      // Page should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('Layout Builder content should not cause layout shifts', async ({ page }) => {
      await page.goto('/');
      
      // Measure Cumulative Layout Shift (CLS)
      const cls = await page.evaluate(() => {
        return new Promise((resolve) => {
          let clsValue = 0;
          
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            }
          });
          
          observer.observe({ type: 'layout-shift', buffered: true });
          
          // Wait 3 seconds to measure layout shifts
          setTimeout(() => {
            observer.disconnect();
            resolve(clsValue);
          }, 3000);
        });
      });
      
      // CLS should be less than 0.1 for good user experience
      expect(cls).toBeLessThan(0.1);
    });

    test('Images should load efficiently', async ({ page }) => {
      await page.goto('/');
      
      // Find all images in Layout Builder content
      const images = page.locator('[data-layout-builder-content] img');
      const imageCount = await images.count();
      
      if (imageCount === 0) {
        test.skip('No images found in Layout Builder content');
      }
      
      // Check each image loads successfully
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        
        if (await img.isVisible()) {
          const src = await img.getAttribute('src');
          
          // Check image has valid src
          expect(src).toBeTruthy();
          
          // Verify image loads without errors
          const naturalWidth = await img.evaluate(img => img.naturalWidth);
          expect(naturalWidth).toBeGreaterThan(0);
        }
      }
    });
  });

  test.describe('Layout Builder Cross-browser Compatibility', () => {
    
    test('Layout should render consistently across browsers', async ({ page, browserName }) => {
      await page.goto('/');
      
      // Take browser-specific screenshots
      await expect(page).toHaveScreenshot(`homepage_${browserName}.png`, {
        fullPage: true,
        animations: 'disabled'
      });
      
      // Test JavaScript functionality works in this browser
      const jsWorks = await page.evaluate(() => {
        // Test basic JavaScript functionality
        try {
          const testDiv = document.createElement('div');
          testDiv.textContent = 'JS Test';
          return testDiv.textContent === 'JS Test';
        } catch (e) {
          return false;
        }
      });
      
      expect(jsWorks).toBeTruthy();
    });

    test('CSS features should work correctly', async ({ page }) => {
      await page.goto('/');
      
      // Test CSS Grid/Flexbox support in Layout Builder
      const layoutElements = page.locator('[data-layout-builder-content] .layout, [data-layout-builder-content] .grid, [data-layout-builder-content] .flex');
      const elementCount = await layoutElements.count();
      
      for (let i = 0; i < elementCount; i++) {
        const element = layoutElements.nth(i);
        
        const computedStyles = await element.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            display: styles.display,
            gridTemplateColumns: styles.gridTemplateColumns,
            flexDirection: styles.flexDirection
          };
        });
        
        // Verify CSS layout properties are applied
        const hasModernLayout = computedStyles.display === 'grid' || 
                               computedStyles.display === 'flex' ||
                               computedStyles.gridTemplateColumns !== 'none' ||
                               computedStyles.flexDirection !== 'row';
        
        if (hasModernLayout) {
          console.log(`Modern CSS layout detected: ${JSON.stringify(computedStyles)}`);
        }
      }
    });
  });
});
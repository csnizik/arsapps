/**
 * Global setup for Playwright tests
 * Prepares Drupal site for Layout Builder and accessibility testing
 */

const { chromium } = require('@playwright/test');

async function globalSetup(config) {
  console.log('Setting up Drupal environment for testing...');
  
  // Launch browser for setup
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Ensure we can reach the site
    const baseURL = config.webServer?.port ? 
      `http://localhost:${config.webServer.port}` : 
      process.env.BASE_URL || 'http://localhost:8080';
    
    console.log(`Testing connection to: ${baseURL}`);
    
    // Basic connectivity test
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    
    // Check if Drupal is installed (look for Drupal.drupalSettings)
    const isDrupalReady = await page.evaluate(() => {
      return typeof window.Drupal !== 'undefined';
    });
    
    if (isDrupalReady) {
      console.log('✓ Drupal site is accessible and ready for testing');
    } else {
      console.log('⚠ Drupal may not be fully loaded, proceeding with tests');
    }
    
    // Save authentication state if needed (for admin tests)
    // await context.storageState({ path: 'tests/playwright/auth/admin-auth.json' });
    
  } catch (error) {
    console.error('Setup error:', error.message);
    // Don't fail - tests may still be able to run
  } finally {
    await browser.close();
  }
  
  console.log('Global setup completed');
}

module.exports = globalSetup;
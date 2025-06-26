// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright configuration for Drupal 11 Layout Builder testing
 * Tests Layout Builder functionality and Section 508 accessibility compliance
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests/playwright',
  timeout: 30000,
  expect: {
    timeout: 10000
  },
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Parallel tests */
  workers: process.env.CI ? 2 : undefined,
  
  /* Reporter configuration - store artifacts for QA review */
  reporter: [
    ['html', { outputFolder: 'reports/playwright' }],
    ['junit', { outputFile: 'reports/playwright-junit.xml' }],
    ['json', { outputFile: 'reports/playwright-results.json' }]
  ],
  
  /* Shared settings for all projects */
  use: {
    /* Base URL for tests */
    baseURL: process.env.BASE_URL || 'http://localhost:8080',
    
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* Record video for failed tests */
    video: 'retain-on-failure',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Collect accessibility data */
    ignoreHTTPSErrors: true,
  },

  /* Configure test projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Enable accessibility tree for Section 508 testing
        contextOptions: {
          reducedMotion: 'prefer'
        }
      },
    },
    
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        contextOptions: {
          reducedMotion: 'prefer'
        }
      },
    },

    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        contextOptions: {
          reducedMotion: 'prefer'
        }
      },
    },

    /* Mobile testing for responsive Layout Builder */
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        contextOptions: {
          reducedMotion: 'prefer'
        }
      },
    },
    
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        contextOptions: {
          reducedMotion: 'prefer'
        }
      },
    },
  ],

  /* Local dev server configuration for testing */
  webServer: process.env.CI ? undefined : {
    command: 'echo "Using existing DDEV environment"',
    port: 8080,
    reuseExistingServer: true,
  },
  
  /* Global setup and teardown */
  globalSetup: require.resolve('./tests/playwright/setup/global-setup.js'),
  globalTeardown: require.resolve('./tests/playwright/setup/global-teardown.js'),
});
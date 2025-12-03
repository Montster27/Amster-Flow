/**
 * Playwright Global Setup
 *
 * This runs ONCE before all tests to:
 * 1. Log in to the application
 * 2. Save the authenticated session state
 * 3. All tests will reuse this session (no need to login in each test)
 *
 * This is much faster and more reliable than logging in for each test.
 */

import { chromium, FullConfig } from '@playwright/test';
import { getTestUser } from './fixtures/auth';

async function globalSetup(config: FullConfig) {
  const baseURL = config.use?.baseURL || process.env.PLAYWRIGHT_BASE_URL;

  if (!baseURL) {
    console.error('❌ No base URL configured');
    return;
  }

  console.log('\n🔐 Setting up authenticated session...');
  console.log(`📍 Base URL: ${baseURL}`);

  const browser = await chromium.launch();
  const context = await browser.newContext({
    ignoreHTTPSErrors: true, // For local HTTPS with self-signed certs
  });
  const page = await context.newPage();

  try {
    // Navigate to login page
    await page.goto(`${baseURL}/login`);
    await page.waitForLoadState('domcontentloaded');

    console.log('🔑 Logging in as test user...');

    // Get test credentials
    const user = getTestUser();

    // Wait for Supabase Auth UI to load
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    // Fill in credentials
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);

    // Submit login
    await page.click('button[type="submit"]');

    // Wait for successful login - dashboard or any authenticated page
    // The app might redirect differently, so be flexible
    await Promise.race([
      page.waitForURL(/\/dashboard/, { timeout: 20000 }).catch(() => {}),
      page.waitForURL(url => !url.includes('/login'), { timeout: 20000 }),
    ]);

    // Give it a moment to finish any redirects
    await page.waitForTimeout(2000);

    console.log('✅ Login successful!');
    console.log(`📍 Current URL: ${page.url()}`);

    // Save the authenticated state
    await context.storageState({ path: 'e2e/.auth/user.json' });

    console.log('💾 Session saved to e2e/.auth/user.json');
    console.log('🚀 All tests will reuse this authenticated session\n');

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

export default globalSetup;

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

    // Check if we're on Vercel's password protection page
    const pageTitle = await page.title();
    const pageContent = await page.content();

    if (pageTitle.includes('Vercel') || pageContent.includes('Log in to Vercel')) {
      console.error('❌ BLOCKED BY VERCEL PASSWORD PROTECTION!');
      console.error('📍 The preview deployment still has Vercel authentication enabled.');
      console.error('🔧 To fix this:');
      console.error('   1. Go to Vercel Dashboard → Project Settings → Deployment Protection');
      console.error('   2. Disable "Password Protection" or "Vercel Authentication"');
      console.error('   3. Redeploy the preview branch if needed');
      await page.screenshot({ path: 'e2e/.auth/vercel-blocked.png', fullPage: true });
      throw new Error('Vercel password protection is blocking access to the application');
    }

    // Get test credentials
    const user = getTestUser();

    // Wait for Supabase Auth UI to load
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    console.log('✅ Email field found');

    // Fill in credentials
    await page.fill('input[type="email"]', user.email);
    console.log('✅ Email filled');

    // Debug: Check if password field exists
    const passwordFields = await page.locator('input[type="password"]').count();
    console.log(`🔍 Password fields found: ${passwordFields}`);

    if (passwordFields === 0) {
      console.log('⚠️  No password field found! Taking screenshot...');
      await page.screenshot({ path: 'e2e/.auth/debug-login-page.png', fullPage: true });

      // Log all input fields present
      const allInputs = await page.locator('input').all();
      console.log(`📋 Total input fields: ${allInputs.length}`);
      for (const input of allInputs) {
        const type = await input.getAttribute('type');
        const name = await input.getAttribute('name');
        const placeholder = await input.getAttribute('placeholder');
        console.log(`  - Input: type="${type}" name="${name}" placeholder="${placeholder}"`);
      }

      throw new Error('Password field not found - check debug-login-page.png');
    }

    await page.fill('input[type="password"]', user.password);
    console.log('✅ Password filled');

    // Submit login
    await page.click('button[type="submit"]');
    console.log('🔄 Login form submitted, waiting for response...');

    // Wait a moment for any immediate response
    await page.waitForTimeout(3000);

    // Take screenshot after submission to see what happened
    await page.screenshot({ path: 'e2e/.auth/after-login-submit.png', fullPage: true });
    console.log('📸 Screenshot saved: after-login-submit.png');

    // Check for error messages
    const errorElements = await page.locator('text=/error|invalid|wrong|failed|check your email/i').all();
    if (errorElements.length > 0) {
      console.log('⚠️  Possible error messages found:');
      for (const element of errorElements) {
        const text = await element.textContent();
        console.log(`  - ${text}`);
      }
    }

    // Check current URL
    console.log(`📍 Current URL after submit: ${page.url()}`);

    // Check if we need to verify localStorage for auth tokens
    const hasAuthToken = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      const authKeys = keys.filter(k => k.includes('supabase') || k.includes('auth'));
      console.log('LocalStorage auth keys:', authKeys);
      return authKeys.length > 0;
    });
    console.log(`🔑 Auth tokens in localStorage: ${hasAuthToken}`);

    // Wait for successful login - dashboard or any authenticated page
    // The app might redirect differently, so be flexible
    await Promise.race([
      page.waitForURL(/\/dashboard/, { timeout: 20000 }).catch(() => {}),
      page.waitForURL(url => !url.toString().includes('/login'), { timeout: 20000 }),
    ]);

    // Give it a moment to finish any redirects
    await page.waitForTimeout(2000);

    console.log('✅ Login process completed');
    console.log(`📍 Final URL: ${page.url()}`);

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

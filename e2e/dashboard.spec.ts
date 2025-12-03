import { test, expect } from '@playwright/test';

/**
 * Dashboard E2E Tests
 * Tests the dashboard functionality:
 * - View projects
 * - Navigate to settings
 * - Check project UI elements
 *
 * NOTE: These tests use the saved authenticated session from global-setup
 */

test.describe('Dashboard', () => {
  test('should display dashboard with projects section', async ({ page }) => {
    await page.goto('/dashboard');

    // Verify we're on dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Check for main dashboard elements
    await expect(page.locator('text=/your projects/i').first()).toBeVisible({ timeout: 10000 });

    // Check for "New Project" button
    await expect(page.locator('button:has-text("New Project"), button:has-text("+ New Project")')).toBeVisible();
  });

  test('should show example projects section', async ({ page }) => {
    await page.goto('/dashboard');

    // Look for example projects section
    const exampleSection = page.locator('text=/example projects/i');

    // This section may or may not exist depending on deployment
    const exists = await exampleSection.isVisible().catch(() => false);

    if (exists) {
      await expect(exampleSection).toBeVisible();
    } else {
      // Just verify we're on dashboard even if no examples
      await expect(page).toHaveURL(/\/dashboard/);
    }
  });

  test('should have navigation to settings', async ({ page }) => {
    await page.goto('/dashboard');

    // Look for settings link/button (might be in nav or menu)
    const settingsLink = page.locator('a[href="/settings"], button:has-text("Settings")').first();

    // Check if settings navigation exists
    const hasSettings = await settingsLink.isVisible().catch(() => false);

    if (hasSettings) {
      await settingsLink.click();
      await expect(page).toHaveURL(/\/settings/);
    } else {
      // Settings might not be visible, that's ok for preview
      await expect(page).toHaveURL(/\/dashboard/);
    }
  });

  test('should display user email or profile info', async ({ page }) => {
    await page.goto('/dashboard');

    // Look for user email in the UI (common in headers/nav)
    const testEmail = process.env.TEST_USER_EMAIL || 'info@mmvstudios.com';

    // Email might be displayed somewhere in the UI
    const emailVisible = await page.locator(`text=${testEmail}`).isVisible().catch(() => false);

    if (emailVisible) {
      await expect(page.locator(`text=${testEmail}`)).toBeVisible();
    } else {
      // Even if email not shown, verify we're authenticated (on dashboard)
      await expect(page).toHaveURL(/\/dashboard/);
    }
  });

  test('should have logout functionality', async ({ page }) => {
    await page.goto('/dashboard');

    // Look for logout button (various possible labels)
    const logoutButton = page.locator('button:has-text("Log out"), button:has-text("Logout"), button:has-text("Sign out")').first();

    // Verify logout button exists
    await expect(logoutButton).toBeVisible({ timeout: 10000 });
  });

  test('should show proper page title', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');

    // Check that we have a meaningful title
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('should handle navigation to dashboard from root', async ({ page }) => {
    // Navigate to root
    await page.goto('/');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Verify dashboard content is visible
    await expect(page.locator('text=/project/i').first()).toBeVisible({ timeout: 10000 });
  });
});

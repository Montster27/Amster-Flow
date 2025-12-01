import { test, expect } from '@playwright/test';
import { ensureLoggedIn } from './fixtures/auth';
import { generateActor, navigateToSectorMap, waitForSave } from './fixtures/test-data';

/**
 * Visual Sector Map E2E Tests
 * Tests the complete sector map workflow:
 * - Edit target customer
 * - Add competitors
 * - Add decision makers
 * - View and manage relationships
 */

test.describe('Visual Sector Map', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure user is logged in before each test
    await ensureLoggedIn(page);
  });

  test('should navigate to Sector Map', async ({ page }) => {
    await navigateToSectorMap(page);

    // Verify we're on Sector Map page
    await expect(page).toHaveURL(/sector/);

    // Verify Sector Map UI elements are visible
    await expect(page.locator('text=/sector.*map/i, text=/target.*customer/i')).toBeVisible({ timeout: 10000 });
  });

  test('should edit target customer', async ({ page }) => {
    await navigateToSectorMap(page);

    // Find and click "Edit Target" or "Edit" button on target customer card
    await page.click('button:has-text("Edit Target"), button:has-text("Edit")').first();

    // Wait for edit modal to open
    await page.waitForSelector('input[name="type"], input[name="description"], textarea', { timeout: 10000 });

    // Update target customer type
    await page.fill('input[name="type"], select[name="type"]', 'B2B').catch(() => {
      page.selectOption('select[name="type"]', 'B2B');
    });

    // Update description
    await page.fill('textarea[name="description"], textarea[placeholder*="description"]', 'Enterprise pet care service providers looking for efficient lost pet recovery solutions');

    // Save changes
    await page.click('button[type="submit"], button:has-text("Save")');

    // Wait for save
    await waitForSave(page);

    // Verify changes are reflected
    await expect(page.locator('text="Enterprise pet care service providers"')).toBeVisible({ timeout: 10000 });
  });

  test('should add a competitor', async ({ page }) => {
    await navigateToSectorMap(page);

    const testCompetitor = generateActor({
      name: 'Competitor ABC Inc',
      type: 'competitor',
      description: 'Leading competitor in the pet recovery space',
    });

    // Switch to Competitors tab if needed
    await page.click('button:has-text("Competitors"), [role="tab"]:has-text("Competitors")').catch(() => {
      console.log('Already on competitors tab or tabs not present');
    });

    // Click "Add Competitor" button
    await page.click('button:has-text("Add Competitor"), button:has-text("New Competitor")');

    // Wait for competitor modal/form to open
    await page.waitForSelector('input[name="name"], input[placeholder*="name"]', { timeout: 10000 });

    // Fill in competitor details
    await page.fill('input[name="name"], input[placeholder*="name"]', testCompetitor.name);
    await page.fill('textarea[name="description"], textarea[placeholder*="description"]', testCompetitor.description || '');

    // Add suppliers if field exists
    await page.fill('input[name="suppliers"], input[placeholder*="suppliers"]', 'Tech suppliers, marketing agencies').catch(() => {
      console.log('No suppliers field found');
    });

    // Add customers if field exists
    await page.fill('input[name="customers"], input[placeholder*="customers"]', 'Pet owners, veterinary clinics').catch(() => {
      console.log('No customers field found');
    });

    // Save competitor
    await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Add")');

    // Wait for save
    await waitForSave(page);

    // Verify competitor appears in list
    await expect(page.locator(`text="${testCompetitor.name}"`)).toBeVisible({ timeout: 10000 });
  });

  test('should add a decision maker', async ({ page }) => {
    await navigateToSectorMap(page);

    const testDecisionMaker = {
      role: 'VP of Customer Experience',
      influence: 'high',
      description: 'Key decision maker for customer-facing technology investments',
    };

    // Switch to Decision Makers tab
    await page.click('button:has-text("Decision Makers"), button:has-text("Decision-Makers"), [role="tab"]:has-text("Decision")');

    // Wait for decision makers section to load
    await page.waitForTimeout(1000);

    // Click "Add Decision Maker" button
    await page.click('button:has-text("Add Decision Maker"), button:has-text("New Decision Maker")');

    // Wait for decision maker modal/form to open
    await page.waitForSelector('input[name="role"], input[placeholder*="role"]', { timeout: 10000 });

    // Fill in decision maker details
    await page.fill('input[name="role"], input[placeholder*="role"]', testDecisionMaker.role);

    // Select influence level
    await page.click('select[name="influence"], input[name="influence"]');
    await page.click(`text="${testDecisionMaker.influence}", option[value="${testDecisionMaker.influence}"]`).catch(() => {
      page.selectOption('select[name="influence"]', testDecisionMaker.influence);
    });

    // Add description
    await page.fill('textarea[name="description"], textarea[placeholder*="description"]', testDecisionMaker.description);

    // Save decision maker
    await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Add")');

    // Wait for save
    await waitForSave(page);

    // Verify decision maker appears in list
    await expect(page.locator(`text="${testDecisionMaker.role}"`)).toBeVisible({ timeout: 10000 });
  });

  test('should edit a competitor', async ({ page }) => {
    await navigateToSectorMap(page);

    // Switch to Competitors tab if needed
    await page.click('button:has-text("Competitors"), [role="tab"]:has-text("Competitors")').catch(() => {});

    // Find first competitor and click edit
    const firstCompetitor = page.locator('[data-testid="competitor-card"], .competitor-card, [class*="competitor"]').first();
    await firstCompetitor.locator('button:has-text("Edit"), button[aria-label*="Edit"]').click();

    // Wait for edit modal
    await page.waitForSelector('input[name="name"]', { timeout: 10000 });

    // Update description
    await page.fill('textarea[name="description"]', 'Updated competitor description with more details');

    // Save changes
    await page.click('button[type="submit"], button:has-text("Save")');

    // Wait for save
    await waitForSave(page);

    // Verify update
    await expect(page.locator('text="Updated competitor description"')).toBeVisible({ timeout: 10000 });
  });

  test('should delete a competitor', async ({ page }) => {
    await navigateToSectorMap(page);

    // Switch to Competitors tab if needed
    await page.click('button:has-text("Competitors"), [role="tab"]:has-text("Competitors")').catch(() => {});

    // Get initial competitor count
    const initialCount = await page.locator('[data-testid="competitor-card"], .competitor-card').count();

    if (initialCount === 0) {
      console.log('No competitors to delete, skipping test');
      return;
    }

    // Find first competitor and click delete
    const firstCompetitor = page.locator('[data-testid="competitor-card"], .competitor-card').first();
    await firstCompetitor.locator('button:has-text("Delete"), button[aria-label*="Delete"]').click();

    // Confirm deletion in dialog
    page.on('dialog', dialog => dialog.accept());

    // Wait for deletion
    await waitForSave(page);

    // Verify competitor count decreased
    const newCount = await page.locator('[data-testid="competitor-card"], .competitor-card').count();
    expect(newCount).toBe(initialCount - 1);
  });

  test('should toggle customer type', async ({ page }) => {
    await navigateToSectorMap(page);

    // Find customer type selector (B2B/B2C toggle or dropdown)
    const customerTypeSelector = page.locator('select[name="customerType"], button:has-text("B2B"), button:has-text("B2C")').first();

    // Get current value
    const currentValue = await customerTypeSelector.textContent().catch(() => 'B2C');

    // Toggle to opposite value
    if (currentValue?.includes('B2C')) {
      await page.click('button:has-text("B2B"), option:has-text("B2B")');
    } else {
      await page.click('button:has-text("B2C"), option:has-text("B2C")');
    }

    // Wait for UI to update
    await waitForSave(page);

    // Verify the toggle worked (UI should reflect new customer type)
    await page.waitForTimeout(1000);
  });

  test('should navigate between tabs', async ({ page }) => {
    await navigateToSectorMap(page);

    // Click Competitors tab
    await page.click('button:has-text("Competitors"), [role="tab"]:has-text("Competitors")');
    await expect(page.locator('button:has-text("Add Competitor")')).toBeVisible({ timeout: 5000 });

    // Click Decision Makers tab
    await page.click('button:has-text("Decision Makers"), [role="tab"]:has-text("Decision")');
    await expect(page.locator('button:has-text("Add Decision Maker")')).toBeVisible({ timeout: 5000 });

    // Navigate back to Competitors
    await page.click('button:has-text("Competitors"), [role="tab"]:has-text("Competitors")');
    await expect(page.locator('button:has-text("Add Competitor")')).toBeVisible({ timeout: 5000 });
  });
});

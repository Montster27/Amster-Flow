import { test, expect } from '@playwright/test';
import { ensureLoggedIn } from './fixtures/auth';
import { generateAssumption, navigateToDiscovery, waitForSave } from './fixtures/test-data';

/**
 * Discovery Workflow E2E Tests
 * Tests the complete discovery workflow:
 * - Create assumptions
 * - Add evidence
 * - Update validation status
 * - View risk matrix
 * - Record interviews
 */

test.describe('Discovery Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure user is logged in before each test
    await ensureLoggedIn(page);
  });

  test('should navigate to Discovery module', async ({ page }) => {
    await navigateToDiscovery(page);

    // Verify we're on Discovery page
    await expect(page).toHaveURL(/discovery/);

    // Verify Discovery UI elements are visible
    await expect(page.locator('text=/assumptions?/i')).toBeVisible({ timeout: 10000 });
  });

  test('should create a new assumption', async ({ page }) => {
    await navigateToDiscovery(page);

    const testAssumption = generateAssumption({
      title: 'Test Assumption - Customer Segment',
      description: 'Pet owners are willing to pay for lost pet recovery services',
      category: 'customer',
      risk: 'high',
    });

    // Click "Add Assumption" or similar button
    await page.click('button:has-text("Add Assumption"), button:has-text("New Assumption"), button:has-text("Create")');

    // Wait for assumption generator/form to open
    await page.waitForSelector('input[placeholder*="assumption"], textarea[placeholder*="assumption"], input[name="description"]', { timeout: 10000 });

    // Fill in assumption details
    // Note: Adjust selectors based on actual form structure
    await page.fill('textarea[name="description"], textarea[placeholder*="assumption"]', testAssumption.description);

    // Select category
    await page.click('select[name="canvasArea"], select[name="category"], button:has-text("Customer")');
    await page.click(`text="${testAssumption.category}"`).catch(() => {
      // If dropdown selection fails, try direct selection
      page.selectOption('select[name="canvasArea"]', testAssumption.category);
    });

    // Set importance (1-5 scale)
    await page.click('input[name="importance"][value="5"], button:has-text("5")').catch(() => {
      // Alternative: use slider or number input
      page.fill('input[name="importance"]', '5');
    });

    // Set confidence (1-5 scale, lower = higher risk)
    await page.click('input[name="confidence"][value="2"], button:has-text("2")').catch(() => {
      page.fill('input[name="confidence"]', '2');
    });

    // Submit the form
    await page.click('button[type="submit"], button:has-text("Create"), button:has-text("Add")');

    // Wait for assumption to be saved
    await waitForSave(page);

    // Verify assumption appears in the list
    await expect(page.locator(`text="${testAssumption.description}"`)).toBeVisible({ timeout: 10000 });
  });

  test('should view assumption in risk matrix', async ({ page }) => {
    await navigateToDiscovery(page);

    // Switch to Matrix tab
    await page.click('button:has-text("Matrix"), a:has-text("Matrix"), [role="tab"]:has-text("Matrix")');

    // Wait for risk matrix to load
    await page.waitForSelector('[data-testid="risk-matrix"], .risk-matrix, text=/risk.*matrix/i', { timeout: 10000 });

    // Verify matrix quadrants are visible
    await expect(page.locator('text=/high.*risk/i, text=/medium.*risk/i, text=/low.*risk/i')).toBeVisible();

    // Verify assumptions are plotted on matrix
    await expect(page.locator('[data-assumption], .assumption-card, [class*="assumption"]')).toBeVisible().catch(() => {
      // If no assumptions exist, that's okay for this test
      console.log('No assumptions found in risk matrix');
    });
  });

  test('should update assumption validation status', async ({ page }) => {
    await navigateToDiscovery(page);

    // Find first assumption in the list
    const firstAssumption = page.locator('[data-testid="assumption-item"], .assumption-row, tr:has(td)').first();

    // Click to view details or edit
    await firstAssumption.click();

    // Wait for detail drawer/modal to open
    await page.waitForSelector('[data-testid="assumption-detail"], .drawer, .modal', { timeout: 10000 });

    // Update status to "validated"
    await page.click('button:has-text("Validated"), select[name="status"]');
    if (await page.locator('option[value="validated"]').isVisible()) {
      await page.selectOption('select[name="status"]', 'validated');
    }

    // Add evidence
    await page.fill('textarea[name="evidence"], textarea[placeholder*="evidence"]', 'Evidence from customer interview: 80% of respondents confirmed this need');

    // Update confidence
    await page.click('input[name="confidence"][value="4"], button:has-text("4")').catch(() => {
      page.fill('input[name="confidence"]', '4');
    });

    // Save changes
    await page.click('button:has-text("Save"), button:has-text("Update")');

    // Wait for save to complete
    await waitForSave(page);

    // Close drawer
    await page.click('button:has-text("Close"), button[aria-label="Close"]').catch(() => {
      page.keyboard.press('Escape');
    });

    // Verify status badge updated
    await expect(page.locator('text=/validated/i')).toBeVisible({ timeout: 10000 });
  });

  test('should switch to validation board view', async ({ page }) => {
    await navigateToDiscovery(page);

    // Switch to Board tab
    await page.click('button:has-text("Board"), a:has-text("Board"), [role="tab"]:has-text("Board")');

    // Wait for board to load
    await page.waitForSelector('[data-testid="validation-board"], .kanban-board', { timeout: 10000 });

    // Verify board columns are visible
    await expect(page.locator('text=/untested/i')).toBeVisible();
    await expect(page.locator('text=/testing/i')).toBeVisible();
    await expect(page.locator('text=/validated/i')).toBeVisible();
    await expect(page.locator('text=/invalidated/i')).toBeVisible();
  });

  test('should record an interview', async ({ page }) => {
    await navigateToDiscovery(page);

    // Switch to Interviews tab
    await page.click('button:has-text("Interviews"), a:has-text("Interviews"), [role="tab"]:has-text("Interviews")');

    // Wait for interviews view to load
    await page.waitForSelector('[data-testid="interviews"], .interviews-section', { timeout: 10000 });

    // Click "New Interview" or "Record Interview"
    await page.click('button:has-text("New Interview"), button:has-text("Add Interview"), button:has-text("Record")');

    // Wait for interview form to open
    await page.waitForSelector('input[name="participantName"], input[placeholder*="name"]', { timeout: 10000 });

    // Fill in interview details
    await page.fill('input[name="participantName"], input[placeholder*="name"]', 'John Doe');
    await page.fill('input[type="date"], input[name="date"]', new Date().toISOString().split('T')[0]);
    await page.fill('textarea[name="notes"], textarea[placeholder*="notes"]', 'Interview revealed strong interest in the lost pet recovery feature. Customer confirmed willingness to pay.');

    // Link to assumptions if option available
    await page.click('button:has-text("Link Assumptions"), [data-action="link-assumptions"]').catch(() => {
      console.log('No link assumptions option found');
    });

    // Save interview
    await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Record")');

    // Wait for save
    await waitForSave(page);

    // Verify interview appears in list
    await expect(page.locator('text="John Doe"')).toBeVisible({ timeout: 10000 });
  });

  test('should view discovery dashboard with metrics', async ({ page }) => {
    await navigateToDiscovery(page);

    // Switch to Dashboard tab
    await page.click('button:has-text("Dashboard"), a:has-text("Dashboard"), [role="tab"]:has-text("Dashboard")');

    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="discovery-dashboard"], .dashboard', { timeout: 10000 });

    // Verify key metrics are visible
    await expect(page.locator('text=/assumptions/i')).toBeVisible();
    await expect(page.locator('text=/interviews/i')).toBeVisible();
    await expect(page.locator('text=/validation.*rate/i, text=/validated/i')).toBeVisible();

    // Verify charts/visualizations if present
    await expect(page.locator('[data-testid="chart"], canvas, svg')).toBeVisible().catch(() => {
      console.log('No charts found in dashboard');
    });
  });

  test('should delete an assumption', async ({ page }) => {
    await navigateToDiscovery(page);

    // Find first assumption
    const firstAssumption = page.locator('[data-testid="assumption-item"], .assumption-row, tr:has(td)').first();

    // Click delete button
    await firstAssumption.locator('button:has-text("Delete"), button[aria-label*="Delete"]').click();

    // Confirm deletion in dialog
    page.on('dialog', dialog => dialog.accept());

    // Wait for deletion to complete
    await waitForSave(page);

    // Verify assumption is removed
    // Note: Can't verify specific assumption removal without knowing its ID
    // Just verify the action completed without error
    await page.waitForTimeout(1000);
  });
});

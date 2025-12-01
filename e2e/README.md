# E2E Test Suite

Comprehensive end-to-end tests for ArmsterFlow using Playwright.

## Overview

This test suite covers critical user workflows:
- **Authentication** (`auth.spec.ts`) - Login, logout, session persistence
- **Discovery Module** (`discovery.spec.ts`) - Assumption creation, validation, interviews
- **Visual Sector Map** (`sector-map.spec.ts`) - Target customer, competitors, decision makers
- **Pivot Analysis** (`pivot.spec.ts`) - Pre-mortem, progress metrics, pivot/proceed decision

## Prerequisites

### 1. Install Playwright Browsers

```bash
npx playwright install chromium
```

### 2. Create Test User in Supabase

1. Log in to your Supabase dashboard
2. Navigate to Authentication > Users
3. Create a new user with:
   - Email: `test@example.com` (or your preferred email)
   - Password: Strong password (save this!)
4. Confirm the user's email (mark as verified)

### 3. Configure Environment Variables

Copy `.env.test` and fill in your values:

```bash
# Supabase Configuration (same as production)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Test User Credentials
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=your-test-user-password
```

⚠️ **Important**: Never commit `.env.test` with real credentials to version control!

## Running Tests

### Run all E2E tests
```bash
npm run test:e2e
```

### Run tests in UI mode (interactive)
```bash
npm run test:e2e:ui
```

### Run tests in debug mode
```bash
npm run test:e2e:debug
```

### Run specific test file
```bash
npx playwright test e2e/auth.spec.ts
```

### Run specific test
```bash
npx playwright test -g "should login with valid credentials"
```

### View test report
```bash
npm run test:e2e:report
```

## Test Structure

### Fixtures (`fixtures/`)

**`auth.ts`** - Authentication helpers:
- `getTestUser()` - Get test credentials from env
- `login(page, email, password)` - Log in a user
- `logout(page)` - Log out current user
- `ensureLoggedIn(page)` - Ensure user is logged in
- `clearAuth(page)` - Clear all auth state

**`test-data.ts`** - Test data generation:
- `generateAssumption()` - Create test assumption data
- `generateInterview()` - Create test interview data
- `generateActor()` - Create test actor data
- `navigateToDiscovery(page)` - Navigate to Discovery
- `navigateToSectorMap(page)` - Navigate to Sector Map
- `navigateToPivot(page)` - Navigate to Pivot
- `waitForSave(page)` - Wait for data to save

### Test Files

Each test file follows this pattern:
```typescript
test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test('should do something', async ({ page }) => {
    // Test implementation
  });
});
```

## CI/CD Integration

### GitHub Actions

Tests run automatically on pull requests to `main` branch.

**Workflow**: `.github/workflows/e2e-tests.yml`

**Required Secrets** (set in GitHub repository settings):
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key
- `TEST_USER_EMAIL` - Test user email
- `TEST_USER_PASSWORD` - Test user password

**To add secrets**:
1. Go to repository Settings > Secrets and variables > Actions
2. Click "New repository secret"
3. Add each secret with its value

## Debugging Failed Tests

### 1. View Screenshots
Failed tests automatically capture screenshots:
```
test-results/<test-name>/screenshot.png
```

### 2. View Videos
Failed tests record videos:
```
test-results/<test-name>/video.webm
```

### 3. View Traces
Traces are captured on first retry:
```bash
npx playwright show-trace test-results/<test-name>/trace.zip
```

### 4. Run in Debug Mode
```bash
npm run test:e2e:debug
```

This opens Playwright Inspector where you can:
- Step through tests
- See selector highlights
- View console logs
- Pause/resume execution

## Best Practices

### 1. Test Isolation
- Each test should be independent
- Use `beforeEach` to set up fresh state
- Don't rely on test execution order

### 2. Selector Strategy
Priority order:
1. **Data attributes**: `[data-testid="element"]`
2. **Role + text**: `button:has-text("Save")`
3. **Text content**: `text="Welcome"`
4. **CSS classes**: `.assumption-card` (last resort)

### 3. Waiting Strategy
- Use `waitForSelector` with explicit timeout
- Use `expect().toBeVisible()` for assertions
- Use `waitForSave()` helper after form submissions
- Avoid `waitForTimeout` except for debugging

### 4. Error Handling
```typescript
await page.click('button').catch(() => {
  console.log('Optional action failed, continuing...');
});
```

### 5. Page Objects (Future Enhancement)
Consider creating page object classes for complex pages:
```typescript
class DiscoveryPage {
  constructor(private page: Page) {}

  async createAssumption(data: AssumptionData) {
    // Encapsulated logic
  }
}
```

## Troubleshooting

### "Test user credentials not found"
- Ensure `.env.test` exists and contains `TEST_USER_EMAIL` and `TEST_USER_PASSWORD`
- Check that values are not empty

### "Timeout waiting for selector"
- Increase timeout: `await page.waitForSelector('...', { timeout: 30000 })`
- Check if selector is correct using Playwright Inspector
- Verify the element actually exists in the UI

### "Element not visible"
- Element might be outside viewport: `await page.locator('...').scrollIntoViewIfNeeded()`
- Element might be behind modal: Close modals first
- Element might not be rendered yet: Add `waitForSelector`

### "Tests pass locally but fail in CI"
- Check CI environment variables are set
- CI runs in headless mode - timing differences may occur
- Increase timeouts for CI: `timeout: process.env.CI ? 60000 : 30000`

## Maintenance

### Adding New Tests
1. Create new spec file: `e2e/feature-name.spec.ts`
2. Follow existing test patterns
3. Use fixtures for common operations
4. Document any new test data generators

### Updating Selectors
If UI changes break tests:
1. Use Playwright Inspector to find new selectors
2. Update test files
3. Consider adding `data-testid` attributes to stable elements

### Test Data Cleanup
Currently tests rely on browser storage cleanup. Future improvements:
- Direct database cleanup via Supabase client
- Dedicated test database or project
- Automated cleanup scripts

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Selectors Guide](https://playwright.dev/docs/selectors)
- [Debugging Guide](https://playwright.dev/docs/debug)

## Contributing

When adding new features:
1. Write E2E tests covering critical paths
2. Ensure tests pass locally before committing
3. Add documentation for new fixtures/helpers
4. Update this README if test patterns change

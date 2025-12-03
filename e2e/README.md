# E2E Test Suite

Comprehensive end-to-end tests for ArmsterFlow using Playwright.

Tests can run against **local**, **preview (Vercel)**, or **production** environments with environment-aware safety controls.

## Overview

This test suite covers critical user workflows:
- **Authentication** (`auth.spec.ts`) - Login, logout, session persistence
- **Discovery Module** (`discovery.spec.ts`) - Assumption creation, validation, interviews
- **Visual Sector Map** (`sector-map.spec.ts`) - Target customer, competitors, decision makers
- **Pivot Analysis** (`pivot.spec.ts`) - Pre-mortem, progress metrics, pivot/proceed decision

## Quick Start

```bash
# Run tests locally (default)
npm run test:e2e

# Run tests against preview environment
npm run test:e2e:preview

# Run smoke tests against production
npm run test:e2e:production
```

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

The test suite uses environment-specific configuration files:

- `.env.test.local` - Local development (gitignored)
- `.env.test.preview` - Preview/staging environment (gitignored)
- `.env.test.production` - Production environment (gitignored)
- `.env.test.example` - Template (committed to git)

#### Local Environment Setup

Create `.env.test.local`:

```bash
VITE_SUPABASE_URL=https://localhost:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key
TEST_USER_EMAIL=test@armsterflow.local
TEST_USER_PASSWORD=Test123!@#
PLAYWRIGHT_BASE_URL=https://127.0.0.1:3001
```

**Local Supabase with HTTPS**:
- Ensure `supabase/config.toml` has TLS enabled (`api.tls.enabled=true`)
- Set `cert_path`/`key_path` to your local certs
- Set `site_url` / `additional_redirect_urls` to `https://localhost:3000`

#### Preview Environment Setup

Create `.env.test.preview`:

```bash
VITE_SUPABASE_URL=https://your-preview-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-preview-anon-key
TEST_USER_EMAIL=test@preview.example.com
TEST_USER_PASSWORD=SecurePassword123!
PLAYWRIGHT_BASE_URL=https://your-preview-deployment.vercel.app
```

**Recommended**: Use a separate Supabase project for preview testing.

#### Production Environment Setup

Create `.env.test.production`:

```bash
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
TEST_USER_EMAIL=test@production.example.com
TEST_USER_PASSWORD=SecureProductionPassword123!
PLAYWRIGHT_BASE_URL=https://armsterflow.com
```

**IMPORTANT**: Production tests run in READ-ONLY mode. No test data will be created.

⚠️ **Security**: Never commit `.env.test.*` files (except `.env.test.example`) to version control!

## Running Tests

### Local Environment (Default)

```bash
# Run all tests locally
npm run test:e2e

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Run tests in debug mode
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

### Preview Environment

```bash
# Run all tests against preview
npm run test:e2e:preview

# Run with UI mode
npm run test:e2e:preview:ui

# Run in headed mode (see browser)
npm run test:e2e:preview:headed
```

### Production Environment

```bash
# Run smoke tests only (recommended)
npm run test:e2e:production

# Run all tests (use with caution)
npm run test:e2e:production:full

# Run smoke tests in headed mode
npm run test:e2e:production:headed
```

### All Environments

```bash
# Run tests in all environments sequentially
npm run test:e2e:all
```

### Running Specific Tests

```bash
# Run specific test file
npx playwright test e2e/auth.spec.ts

# Run specific test by name
npx playwright test -g "should login with valid credentials"

# Run only tests with specific tag
npm run test:e2e -- --grep @smoke

# Run all except specific tag
npm run test:e2e -- --grep-invert @destructive
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
- `cleanupTestData(page)` - Environment-aware cleanup

**`environment.ts`** - Environment detection utilities:
- `getTestEnvironment()` - Get current environment ('local' | 'preview' | 'production')
- `isLocal()` - Check if running locally
- `isPreview()` - Check if running in preview
- `isProduction()` - Check if running in production
- `shouldCreateTestData()` - Check if data creation is allowed
- `getTestDataPrefix()` - Get environment-specific data prefix
- `getEnvironmentConfig()` - Get full environment configuration

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

## Test Tags

Tests use tags to control which environments they run in:

### Available Tags

- `@smoke` - Critical path tests, safe for production
- `@critical` - Must-pass tests for deployments
- `@local` - Only run in local environment
- `@preview` - Safe to run in preview environment
- `@production` - Safe to run in production (read-only)
- `@destructive` - Creates test data (never runs in production)

### Tagging Tests

```typescript
// Runs in all environments
test('should login with valid credentials @smoke @critical', async ({ page }) => {
  // Test implementation
});

// Only runs locally and in preview
test('should create new project @local @preview @destructive', async ({ page }) => {
  // This test creates data, so it won't run in production
});

// Production-safe read-only test
test('should display user profile @smoke @production', async ({ page }) => {
  // Only reads data, safe for production
});
```

### Environment-Aware Test Logic

```typescript
import { isProduction, shouldCreateTestData } from './fixtures/environment';

test('conditional test logic', async ({ page }) => {
  if (isProduction()) {
    // Read-only operations in production
    await page.goto('/dashboard');
    await expect(page.locator('text=Welcome')).toBeVisible();
  } else {
    // Full CRUD operations in local/preview
    const projectName = generateProjectName();
    await createProject(page, projectName);
  }
});

test('skip data creation in production', async ({ page }) => {
  // This will automatically throw error in production
  if (!shouldCreateTestData()) {
    test.skip();
  }

  const assumption = generateAssumption();
  await createAssumption(page, assumption);
});
```

## CI/CD Integration

### GitHub Actions

Tests can run automatically on pull requests and deployments.

**Workflow**: `.github/workflows/e2e-tests.yml`

**Required Secrets** (set in GitHub repository settings):

**Preview Environment:**
- `TEST_SUPABASE_URL_PREVIEW` - Preview Supabase project URL
- `TEST_SUPABASE_ANON_KEY_PREVIEW` - Preview anon key
- `TEST_USER_EMAIL_PREVIEW` - Preview test user email
- `TEST_USER_PASSWORD_PREVIEW` - Preview test user password

**Production Environment:**
- `TEST_SUPABASE_URL_PROD` - Production Supabase project URL
- `TEST_SUPABASE_ANON_KEY_PROD` - Production anon key
- `TEST_USER_EMAIL_PROD` - Production test user email
- `TEST_USER_PASSWORD_PROD` - Production test user password

**To add secrets**:
1. Go to repository Settings > Secrets and variables > Actions
2. Click "New repository secret"
3. Add each secret with its value

### Example Workflow

```yaml
name: E2E Tests

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  test-preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - name: Run E2E tests (Preview)
        env:
          VITE_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL_PREVIEW }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY_PREVIEW }}
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL_PREVIEW }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD_PREVIEW }}
          PLAYWRIGHT_BASE_URL: ${{ steps.vercel.outputs.preview-url }}
        run: npm run test:e2e:preview

  test-production-smoke:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - name: Run Smoke Tests (Production)
        env:
          VITE_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL_PROD }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY_PROD }}
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL_PROD }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD_PROD }}
        run: npm run test:e2e:production
```

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

### Multi-Environment Testing

1. **Tag all tests appropriately**
   - Use `@smoke` for critical paths safe in all environments
   - Use `@destructive` for tests that create/modify data
   - Use `@local @preview` for tests that shouldn't run in production

2. **Use environment helpers**
   - Always use `generateProjectName()`, `generateAssumption()`, etc. for test data
   - Use `shouldCreateTestData()` to check if data creation is allowed
   - Use `isProduction()` to conditionally skip or modify test behavior

3. **Clean up after tests**
   - Always call `cleanupTestData(page)` in `afterEach` hooks
   - Environment-aware cleanup prevents accidental data deletion in production

4. **Separate Supabase projects**
   - Use dedicated Supabase projects for local, preview, and production
   - Prevents test data from mixing with real user data
   - Allows isolated schema changes and testing

5. **Never hard-code credentials**
   - Always use environment variables from `.env.test.{environment}`
   - Never commit credentials to git
   - Rotate test credentials periodically

### Test Development

1. **Test Isolation**
   - Each test should be independent
   - Use `beforeEach` to set up fresh state
   - Don't rely on test execution order

2. **Selector Strategy**
   Priority order:
   1. **Data attributes**: `[data-testid="element"]`
   2. **Role + text**: `button:has-text("Save")`
   3. **Text content**: `text="Welcome"`
   4. **CSS classes**: `.assumption-card` (last resort)

3. **Waiting Strategy**
   - Use `waitForSelector` with explicit timeout
   - Use `expect().toBeVisible()` for assertions
   - Use `waitForSave()` helper after form submissions
   - Avoid `waitForTimeout` except for debugging

4. **Error Handling**
   ```typescript
   await page.click('button').catch(() => {
     console.log('Optional action failed, continuing...');
   });
   ```

5. **Page Objects** (Future Enhancement)
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

### Environment Configuration Issues

**"Missing required environment variables"**
- Ensure `.env.test.{environment}` file exists for the target environment
- Verify all required variables are set: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`
- Check file is in the correct location (project root)

**"Test data creation not allowed in production environment"**
- This is expected behavior for production safety
- Either skip the test in production or use conditional logic with `isProduction()`
- Use `@local @preview` tags to prevent test from running in production

**CORS errors during authentication**
- Ensure `VITE_SUPABASE_URL` and `PLAYWRIGHT_BASE_URL` use matching origins
- For HTTPS: both should use `https://`, not mixing http/https
- For local: both should use `localhost` or both use `127.0.0.1`, not mixed
- Check Supabase `site_url` matches your app's URL

### Test Execution Issues

**"Test user credentials not found"**
- Ensure environment-specific `.env.test.{environment}` exists
- Check that `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` are not empty
- Verify test user exists in the target Supabase instance

**Test user login fails**
- Verify user exists in Supabase Auth Users table
- Check `email_confirmed_at` is set (not NULL)
- Ensure password is correct in `.env.test.{environment}`
- Try logging in manually via the UI to verify credentials

**"Timeout waiting for selector"**
- Production tests have longer timeouts (90s vs 60s)
- Increase timeout: `await page.waitForSelector('...', { timeout: 30000 })`
- Check if selector is correct using Playwright Inspector
- Verify the element actually exists in the UI

**"Element not visible"**
- Element might be outside viewport: `await page.locator('...').scrollIntoViewIfNeeded()`
- Element might be behind modal: Close modals first
- Element might not be rendered yet: Add `waitForSelector`

**"Tests pass locally but fail in CI/preview/production"**
- Check environment variables are correctly set for that environment
- Different environments may have different data or state
- Network latency varies by environment - increase timeouts if needed
- CI runs in headless mode - timing differences may occur
- Production may have different data than local/preview

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

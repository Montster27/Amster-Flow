/**
 * Step 0 → Quick Check → Discovery happy-path E2E.
 *
 * This test exists specifically to catch the graduation-pipeline regressions
 * that were fixed in graduationService.ts and QuickCheckPage.tsx:
 *
 *   1. ID type mismatch — the Step 0 store uses numeric segment IDs
 *      (Date.now() based), but an earlier version of QuickCheckPage stringified
 *      them before handing to `graduateToDiscovery`. `segments.find(s => s.id === id)`
 *      then never matched, so migration silently produced zero assumptions.
 *   2. `GraduationResult` ignored — QuickCheckPage navigated to Discovery
 *      regardless of `result.success`, burying any error from step 1.
 *   5. `beachhead_completed` dropped by the 1s debounce — the flag was set in
 *      local state and relied on auto-save, but the component unmounted on
 *      navigate and the save timeout was cancelled. The Discovery gate then
 *      bounced the user back to Quick Check.
 *
 * Strategy: seed a project + Step 0 + Quick Check directly via the authenticated
 * Supabase client (fast, deterministic), then drive only the critical graduation
 * interaction through the UI, and finally verify the resulting DB state.
 */

import { test, expect } from '@playwright/test';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getTestUser } from './fixtures/auth';
import { isProduction, getTestDataPrefix } from './fixtures/environment';

type SeedResult = {
  projectId: string;
  organizationId: string;
  userId: string;
  focusedSegmentId: number;
  focusedSegmentName: string;
  projectName: string;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

async function buildAuthedClient(): Promise<{ supabase: SupabaseClient; userId: string }> {
  const url = requireEnv('VITE_SUPABASE_URL');
  const key = requireEnv('VITE_SUPABASE_ANON_KEY');
  const { email, password } = getTestUser();

  const supabase = createClient(url, key, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    throw new Error(`Supabase auth failed for test user: ${error?.message}`);
  }
  return { supabase, userId: data.user.id };
}

async function seedProject(supabase: SupabaseClient, userId: string): Promise<SeedResult> {
  // 1. Find any organization the test user belongs to. In the local test env
  //    the user is bootstrapped with exactly one org; in preview it's the same.
  const { data: membership, error: memberError } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (memberError) throw new Error(`Could not load org membership: ${memberError.message}`);
  if (!membership) throw new Error('Test user has no organization membership — seed one first.');

  const organizationId = membership.organization_id as string;

  // 2. Create a fresh project so test state is isolated and cleanup-safe.
  const projectName = `${getTestDataPrefix()} Graduation Flow`;
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      organization_id: organizationId,
      name: projectName,
      description: 'E2E seed for Step 0 → Quick Check → Discovery graduation',
      created_by: userId,
    })
    .select()
    .single();

  if (projectError || !project) {
    throw new Error(`Could not create project: ${projectError?.message}`);
  }
  const projectId = project.id as string;

  // 3. Seed Step 0: one idea + one customer + one segment marked as beachhead.
  //    Numeric IDs mirror what the Step0 store generates via Date.now().
  const customerId = Date.now();
  const segmentId = customerId + 1;
  const focusedSegmentName = 'Small design agencies';

  const step0Idea = {
    building: 'a shared project-status dashboard',
    helps: 'small design agencies',
    achieve: 'keep clients informed without weekly status calls',
  };
  const step0Customers = [
    {
      id: customerId,
      text: 'Small design agencies',
      benefits: [
        { text: 'stop chasing clients for feedback', needCategory: 'efficiency' },
        { text: 'avoid losing hours to status meetings', needCategory: 'economic' },
      ],
    },
  ];
  const step0Segments = [
    {
      id: segmentId,
      name: focusedSegmentName,
      customerId,
      benefits: [
        { text: 'stop chasing clients for feedback', needCategory: 'efficiency' },
        { text: 'avoid losing hours to status meetings', needCategory: 'economic' },
      ],
      need: 'stop chasing clients for feedback',
      accessRank: 5,
    },
  ];

  const { error: step0Error } = await supabase.from('project_step0').insert({
    project_id: projectId,
    idea: step0Idea,
    customers: step0Customers,
    segments: step0Segments,
    focused_segment_id: segmentId,
  });
  if (step0Error) {
    throw new Error(`Could not seed project_step0: ${step0Error.message}`);
  }

  // 4. Seed Quick Check pre-populated with the beachhead segment + enough fields
  //    that only the contact entries remain to fill in the UI. We intentionally
  //    leave one contact blank so canGraduate() returns true after we fill one.
  const quickCheckSegments = [
    {
      segmentId,
      segmentName: focusedSegmentName,
      isBeachhead: true,
      problem: 'They struggle with chasing clients for feedback every week.',
      contacts: ['', '', ''],
      solution: 'A landing page that offers a shared project-status dashboard.',
      hypothesis:
        'We believe small design agencies will adopt our solution because they struggle with chasing clients for feedback, if we build a shared project-status dashboard.',
    },
  ];

  const { error: qcError } = await (supabase as unknown as {
    from: (t: string) => {
      upsert: (
        row: Record<string, unknown>,
        opts?: Record<string, unknown>
      ) => Promise<{ error: { message: string } | null }>;
    };
  })
    .from('project_quick_check')
    .upsert(
      {
        project_id: projectId,
        segments: quickCheckSegments,
        beachhead_completed: false,
        updated_by: userId,
      },
      { onConflict: 'project_id' }
    );
  if (qcError) {
    throw new Error(`Could not seed project_quick_check: ${qcError.message}`);
  }

  return {
    projectId,
    organizationId,
    userId,
    focusedSegmentId: segmentId,
    focusedSegmentName,
    projectName,
  };
}

async function cleanupProject(supabase: SupabaseClient, projectId: string) {
  // Delete child rows that might not have an ON DELETE CASCADE, then the project.
  // Errors here are logged but don't fail the test — cleanup is best-effort.
  const tables = ['project_assumptions', 'project_quick_check', 'project_step0'];
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().eq('project_id', projectId);
    if (error) console.warn(`Cleanup of ${table} failed: ${error.message}`);
  }
  const { error: projectError } = await supabase.from('projects').delete().eq('id', projectId);
  if (projectError) console.warn(`Cleanup of projects failed: ${projectError.message}`);
}

test.describe('Step 0 → Quick Check → Discovery graduation', () => {
  // Don't run against production — this test mutates the database.
  test.skip(isProduction(), 'Graduation flow mutates DB; skipped in production');

  let supabase: SupabaseClient;
  let authedUserId: string;
  let seed: SeedResult;

  test.beforeAll(async () => {
    ({ supabase, userId: authedUserId } = await buildAuthedClient());
  });

  test.beforeEach(async () => {
    // A fresh seed per test keeps assertions about counts unambiguous.
    seed = await seedProject(supabase, authedUserId);
  });

  test.afterEach(async () => {
    if (seed?.projectId) {
      await cleanupProject(supabase, seed.projectId);
    }
  });

  test('user can graduate from Quick Check and lands on Discovery with assumptions @critical', async ({
    page,
  }) => {
    // Visit the Quick Check page directly — Step 0 data is already seeded in
    // the DB, so the page should load with the beachhead segment pre-filled.
    await page.goto(`/project/${seed.projectId}/quick-check`);

    // Wait for the Quick Check heading, which means the provider + data hook
    // finished loading. If the user isn't authenticated or the project is
    // inaccessible, they'd be bounced to login or the dashboard instead.
    await expect(page.getByRole('heading', { name: /Quick Check/i })).toBeVisible({
      timeout: 15000,
    });

    // Expand the beachhead card if it isn't already (it opens by default when
    // segments are loaded, but we defensively toggle if it's collapsed).
    const beachheadCard = page
      .locator('div')
      .filter({ hasText: 'STARTING POINT' })
      .filter({ hasText: seed.focusedSegmentName })
      .first();
    await expect(beachheadCard).toBeVisible();

    // The only gate remaining before canGraduate() is filling at least one
    // contact. The placeholder identifies the first contact input uniquely.
    const firstContactInput = page.getByPlaceholder(/Someone you know with this problem/i);
    await firstContactInput.fill('Alex Rivera — owner of a 4-person agency, met via my LinkedIn');

    // Continue to Discovery.
    const continueBtn = page.getByRole('button', { name: /Continue to Discovery/i });
    await expect(continueBtn).toBeEnabled({ timeout: 5000 });
    await continueBtn.click();

    // If graduation fails, QuickCheckPage now renders an inline error banner
    // rather than silently navigating. Fail fast with a useful message if we
    // see it — the screenshot + trace will make the root cause obvious.
    const errorBanner = page.getByRole('alert');
    await expect
      .poll(
        async () => {
          if (await errorBanner.isVisible().catch(() => false)) {
            return (await errorBanner.textContent()) || 'error banner visible';
          }
          return page.url();
        },
        {
          message:
            'Expected to navigate to /discovery after clicking Continue; got error banner or stayed on /quick-check',
          timeout: 20000,
        }
      )
      .toMatch(/\/project\/.+\/discovery/);

    // Assert the final URL explicitly — this is the key bug #5 regression catch:
    // if beachhead_completed wasn't persisted before navigation, the Discovery
    // page's gate would bounce the user back to /quick-check.
    await expect(page).toHaveURL(/\/project\/.+\/discovery/, { timeout: 10000 });

    // --- DB assertions ---------------------------------------------------
    //
    // Assumptions must exist. Pre-fix, the silent ID-type failure produced
    // zero rows. Post-fix we expect at least the two customer-identity +
    // problem-severity auto-generated assumptions, plus one per benefit.
    const { data: assumptions, error: assumptionsError } = await supabase
      .from('project_assumptions')
      .select('*')
      .eq('project_id', seed.projectId);

    expect(assumptionsError).toBeNull();
    expect(assumptions?.length ?? 0).toBeGreaterThan(0);
    // At least one assumption must be tagged as coming from the focused segment.
    expect(
      assumptions?.some((a: Record<string, unknown>) => a.source_segment === seed.focusedSegmentName)
    ).toBe(true);

    // beachhead_completed must be persisted in project_quick_check.
    const { data: qc, error: qcError } = await (supabase as unknown as {
      from: (t: string) => {
        select: (s: string) => {
          eq: (
            col: string,
            val: string
          ) => {
            maybeSingle: () => Promise<{
              data: { beachhead_completed?: boolean } | null;
              error: { message: string } | null;
            }>;
          };
        };
      };
    })
      .from('project_quick_check')
      .select('*')
      .eq('project_id', seed.projectId)
      .maybeSingle();

    expect(qcError).toBeNull();
    expect(qc?.beachhead_completed).toBe(true);

    // beachhead_data on the project carries both the beachhead selection and
    // the parked-segment metadata we write at graduation time.
    const { data: projectRow, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', seed.projectId)
      .single();

    expect(projectError).toBeNull();
    const beachheadData =
      (projectRow as unknown as { beachhead_data?: Record<string, unknown> }).beachhead_data ?? {};
    expect(beachheadData.quickCheckCompleted).toBe(true);
    expect(beachheadData.segmentName).toBe(seed.focusedSegmentName);
  });
});

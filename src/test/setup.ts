import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi, beforeAll, afterAll } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Supabase client globally
vi.mock('../lib/supabase', () => {
  const FIXED_DATE = '2025-11-12T20:00:00.000Z';

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    aud: 'authenticated',
    role: 'authenticated',
    created_at: FIXED_DATE,
    updated_at: FIXED_DATE,
  };

  const mockSession = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    expires_at: 1699912800000, // Fixed timestamp
    token_type: 'bearer',
    user: mockUser,
  };

  return {
    supabase: {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: mockSession },
          error: null,
        }),
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { user: mockUser, session: mockSession },
          error: null,
        }),
        signUp: vi.fn().mockResolvedValue({
          data: { user: mockUser, session: mockSession },
          error: null,
        }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
        onAuthStateChange: vi.fn().mockReturnValue({
          data: {
            subscription: {
              unsubscribe: vi.fn(),
            },
          },
        }),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
    },
  };
});

// Mock Sentry
vi.mock('../lib/sentry', () => ({
  initSentry: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  setUser: vi.fn(),
  addBreadcrumb: vi.fn(),
}));

// Mock environment variables
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');
vi.stubEnv('VITE_SENTRY_DSN', ''); // Disable Sentry in tests

// Mock window.matchMedia (used by some components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver (used by lazy loading)
global.IntersectionObserver = class IntersectionObserver {
  constructor() { }
  disconnect() { }
  observe() { }
  takeRecords() {
    return [];
  }
  unobserve() { }
} as any;

// Suppress console errors in tests (unless debugging)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
        args[0].includes('Not implemented: HTMLFormElement.prototype.submit'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

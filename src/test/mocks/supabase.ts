import { vi } from 'vitest';

/**
 * Mock Supabase client for testing
 * Provides chainable mock methods that match Supabase API
 */

// Mock auth response
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const mockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() + 3600000,
  token_type: 'bearer',
  user: mockUser,
};

// Create mock query builder
const createMockQueryBuilder = (mockData: any = []) => ({
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  neq: vi.fn().mockReturnThis(),
  gt: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lt: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  like: vi.fn().mockReturnThis(),
  ilike: vi.fn().mockReturnThis(),
  is: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  contains: vi.fn().mockReturnThis(),
  containedBy: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  match: vi.fn().mockReturnThis(),
  not: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  filter: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: mockData[0] || null, error: null }),
  maybeSingle: vi.fn().mockResolvedValue({ data: mockData[0] || null, error: null }),
  then: vi.fn((resolve) => resolve({ data: mockData, error: null })),
});

// Mock Supabase client
export const createMockSupabaseClient = (customMocks?: any) => ({
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
    ...customMocks?.auth,
  },
  from: vi.fn((table: string) => {
    return createMockQueryBuilder(customMocks?.tables?.[table] || []);
  }),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
      download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
      remove: vi.fn().mockResolvedValue({ data: {}, error: null }),
      list: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
});

// Default mock export
export const mockSupabase = createMockSupabaseClient();

// Mock the supabase module
vi.mock('../lib/supabase', () => ({
  supabase: mockSupabase,
}));

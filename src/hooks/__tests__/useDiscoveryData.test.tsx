import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDiscoveryData } from '../useDiscoveryData';
import { supabase } from '../../lib/supabase';
import { DiscoveryProvider } from '../../contexts/DiscoveryContext';
import { AuthProvider } from '../../contexts/AuthContext';

// Wrapper with all required providers
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <DiscoveryProvider>{children}</DiscoveryProvider>
  </AuthProvider>
);

describe('useDiscoveryData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should start with loading true', () => {
      const { result } = renderHook(() => useDiscoveryData('test-project-id'), { wrapper });

      expect(result.current.loading).toBe(true);
    });

    it('should set loading to false after data loads', async () => {
      const { result } = renderHook(() => useDiscoveryData('test-project-id'), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 3000 });
    });

    it('should handle undefined projectId', () => {
      const { result } = renderHook(() => useDiscoveryData(undefined), { wrapper });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('Assumptions Loading', () => {
    it('should load assumptions from database', async () => {
      const mockAssumptions = [
        {
          id: 'assumption-1',
          project_id: 'test-project-id',
          type: 'customer',
          description: 'Users want this feature',
          status: 'untested',
          confidence: 3,
          evidence: [],
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          created_by: 'test-user-id',
        },
      ];

      vi.mocked(supabase.from('project_assumptions').select).mockResolvedValueOnce({
        data: mockAssumptions,
        error: null,
      } as any);

      vi.mocked(supabase.from('project_interviews_enhanced').select).mockResolvedValueOnce({
        data: [],
        error: null,
      } as any);

      vi.mocked(supabase.from('project_iterations').select).mockResolvedValueOnce({
        data: [],
        error: null,
      } as any);

      const { result } = renderHook(() => useDiscoveryData('test-project-id'), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(supabase.from).toHaveBeenCalledWith('project_assumptions');
    });
  });

  describe('Interviews Loading', () => {
    it('should load enhanced interviews from database', async () => {
      const mockInterviews = [
        {
          id: 'interview-1',
          project_id: 'test-project-id',
          interviewee_type: 'customer',
          segment_name: 'Early Adopters',
          interview_date: '2025-01-01T00:00:00Z',
          context: 'Phone interview',
          status: 'completed',
          main_pain_points: 'Issue with current solution',
          problem_importance: 4,
          current_alternatives: 'Manual process',
          memorable_quotes: ['This would save me hours'],
          surprising_feedback: 'Unexpected use case',
          student_reflection: 'Key insight learned',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ];

      vi.mocked(supabase.from('project_assumptions').select).mockResolvedValueOnce({
        data: [],
        error: null,
      } as any);

      vi.mocked(supabase.from('project_interviews_enhanced').select).mockResolvedValueOnce({
        data: mockInterviews,
        error: null,
      } as any);

      vi.mocked(supabase.from('project_iterations').select).mockResolvedValueOnce({
        data: [],
        error: null,
      } as any);

      const { result } = renderHook(() => useDiscoveryData('test-project-id'), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(supabase.from).toHaveBeenCalledWith('project_interviews_enhanced');
    });
  });

  describe('Iterations Loading', () => {
    it('should load iterations from database', async () => {
      const mockIterations = [
        {
          id: 'iteration-1',
          project_id: 'test-project-id',
          version: 1,
          date: '2025-01-01',
          changes: 'Updated problem statement',
          reasoning: 'Customer feedback',
          assumptions_affected: ['assumption-1'],
          patterns_observed: 'Price sensitivity',
          riskiest_assumption: 'assumption-1',
          next_experiment: 'Test pricing',
          created_by: 'test-user-id',
        },
      ];

      vi.mocked(supabase.from('project_assumptions').select).mockResolvedValueOnce({
        data: [],
        error: null,
      } as any);

      vi.mocked(supabase.from('project_interviews_enhanced').select).mockResolvedValueOnce({
        data: [],
        error: null,
      } as any);

      vi.mocked(supabase.from('project_iterations').select).mockResolvedValueOnce({
        data: mockIterations,
        error: null,
      } as any);

      const { result } = renderHook(() => useDiscoveryData('test-project-id'), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(supabase.from).toHaveBeenCalledWith('project_iterations');
    });
  });

  describe('Error Handling', () => {
    it('should handle assumptions load error', async () => {
      const mockError = new Error('Database error');

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        callCount++;

        if (callCount === 1) {
          // First call: project_assumptions - error
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: mockError,
              }),
            }),
          } as any;
        } else {
          // Subsequent calls shouldn't happen, but return success just in case
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          } as any;
        }
      });

      const { result } = renderHook(() => useDiscoveryData('test-project-id'), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load discovery data');
    });

    it('should handle interviews load error', async () => {
      const mockError = new Error('Interviews fetch failed');

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        callCount++;

        if (callCount === 1) {
          // First call: project_assumptions - success
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          } as any;
        } else if (callCount === 2) {
          // Second call: project_interviews_enhanced - error
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: mockError,
              }),
            }),
          } as any;
        } else {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          } as any;
        }
      });

      const { result } = renderHook(() => useDiscoveryData('test-project-id'), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load discovery data');
    });

    it('should handle iterations load error', async () => {
      const mockError = new Error('Iterations fetch failed');

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        callCount++;

        if (callCount === 1 || callCount === 2) {
          // First two calls: project_assumptions and project_interviews_enhanced - success
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          } as any;
        } else {
          // Third call: project_iterations - error
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: mockError,
              }),
            }),
          } as any;
        }
      });

      const { result } = renderHook(() => useDiscoveryData('test-project-id'), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load discovery data');
    });
  });

  describe('Project ID Changes', () => {
    it('should reset and reload when projectId changes', async () => {
      vi.mocked(supabase.from('project_assumptions').select).mockResolvedValue({
        data: [],
        error: null,
      } as any);

      vi.mocked(supabase.from('project_interviews_enhanced').select).mockResolvedValue({
        data: [],
        error: null,
      } as any);

      vi.mocked(supabase.from('project_iterations').select).mockResolvedValue({
        data: [],
        error: null,
      } as any);

      const { rerender } = renderHook(
        ({ projectId }) => useDiscoveryData(projectId),
        {
          wrapper,
          initialProps: { projectId: 'project-1' },
        }
      );

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalled();
      });

      const initialCallCount = vi.mocked(supabase.from).mock.calls.length;

      // Change project ID
      rerender({ projectId: 'project-2' });

      await waitFor(() => {
        expect(vi.mocked(supabase.from).mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });
  });
});

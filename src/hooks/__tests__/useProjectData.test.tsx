import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useProjectData } from '../useProjectData';
import { supabase } from '../../lib/supabase';
import { GuideProvider } from '../../contexts/GuideContext';
import { AuthProvider } from '../../contexts/AuthContext';

// Wrapper with all required providers
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <GuideProvider>{children}</GuideProvider>
  </AuthProvider>
);

describe('useProjectData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should start with loading true', () => {
      const { result } = renderHook(() => useProjectData('test-project-id'), { wrapper });

      expect(result.current.loading).toBe(true);
    });

    it('should set loading to false after data loads', async () => {
      const { result } = renderHook(() => useProjectData('test-project-id'), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should not load data if projectId is undefined', () => {
      const { result } = renderHook(() => useProjectData(undefined), { wrapper });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('Data Loading', () => {
    it('should load project answers from database', async () => {
      // Mock data that would come from Supabase
      const mockAnswers = [
        {
          project_id: 'test-project-id',
          module_name: 'problem',
          question_index: 0,
          answer: 'Test problem answer',
        },
        {
          project_id: 'test-project-id',
          module_name: 'problem',
          question_index: 1,
          answer: 'Another answer',
        },
      ];

      // Mock Supabase response
      vi.mocked(supabase.from('project_modules').select).mockResolvedValueOnce({
        data: mockAnswers,
        error: null,
      } as any);

      vi.mocked(supabase.from('project_module_completion').select).mockResolvedValueOnce({
        data: [],
        error: null,
      } as any);

      const { result } = renderHook(() => useProjectData('test-project-id'), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify Supabase was called with correct params
      expect(supabase.from).toHaveBeenCalledWith('project_modules');
      expect(supabase.from).toHaveBeenCalledWith('project_module_completion');
    });

    it('should load module completion status', async () => {
      const mockCompletion = [
        {
          project_id: 'test-project-id',
          module_name: 'problem',
          completed: true,
        },
      ];

      vi.mocked(supabase.from('project_modules').select).mockResolvedValueOnce({
        data: [],
        error: null,
      } as any);

      vi.mocked(supabase.from('project_module_completion').select).mockResolvedValueOnce({
        data: mockCompletion,
        error: null,
      } as any);

      const { result } = renderHook(() => useProjectData('test-project-id'), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle database load errors', async () => {
      const mockError = new Error('Database connection failed');

      // Mock the chain: from().select().eq()
      const mockEq = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const { result } = renderHook(() => useProjectData('test-project-id'), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load project data');
    });

    it('should handle completion load errors', async () => {
      const mockError = new Error('Completion fetch failed');

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        callCount++;

        if (callCount === 1) {
          // First call: project_modules - success
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          } as any;
        } else {
          // Second call: project_module_completion - error
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

      const { result } = renderHook(() => useProjectData('test-project-id'), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load project data');
    });
  });

  describe('Project ID Changes', () => {
    it('should reload data when projectId changes', async () => {
      const { rerender } = renderHook(
        ({ projectId }) => useProjectData(projectId),
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

    it('should reset store when projectId changes', async () => {
      vi.mocked(supabase.from('project_modules').select).mockResolvedValue({
        data: [],
        error: null,
      } as any);

      vi.mocked(supabase.from('project_module_completion').select).mockResolvedValue({
        data: [],
        error: null,
      } as any);

      const { rerender } = renderHook(
        ({ projectId }) => useProjectData(projectId),
        {
          wrapper,
          initialProps: { projectId: 'project-1' },
        }
      );

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalled();
      });

      // Clear mocks to track new calls
      vi.clearAllMocks();

      // Change to new project
      rerender({ projectId: 'project-2' });

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('project_modules');
      });
    });
  });
});

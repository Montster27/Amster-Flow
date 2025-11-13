import { useEffect, useState } from 'react';
import { captureException } from '../lib/sentry';

import { useParams, useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

import { supabase } from '../lib/supabase';

import App from '../App';

import type { Database } from '../types/database';


type Project = Database['public']['Tables']['projects']['Row'];

export function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !projectId) return;

    const loadProject = async () => {
      try {
        // Load project and verify access (exclude soft-deleted)
        const { data, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (projectError) throw projectError;

        setProject(data);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error loading project'); captureException(error, { extra: { projectId, context: 'ProjectPage load' } });
        setError('Project not found or you don\'t have access');
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [projectId, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Project Not Found</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Render the existing App with project context
  return (
    <div className="relative">
      {/* Project Header Bar */}
      <div className="absolute top-0 left-0 right-0 bg-white border-b border-gray-200 z-10 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <div className="border-l border-gray-300 pl-4">
            <h2 className="font-semibold text-gray-900">{project.name}</h2>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          {user?.email}
        </div>
      </div>

      {/* Main App - with padding for header and projectId */}
      <div className="pt-12">
        <App projectId={projectId} />
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { captureException } from '../lib/sentry';

import { useParams, useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

import { supabase } from '../lib/supabase';

import App from '../App';

import { ProjectDataProvider } from '../components/ProjectDataProvider';
import { ProjectHeaderBar } from '../components/ProjectHeaderBar';

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
          .is('deleted_at', null)
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
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-app)' }}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full mx-auto mb-4"
            style={{
              width: 40,
              height: 40,
              borderWidth: 2,
              borderStyle: 'solid',
              borderColor: 'var(--border-1)',
              borderBottomColor: 'var(--sky-600)',
            }}
          />
          <p style={{ color: 'var(--fg-3)', fontSize: 14 }}>Loading project…</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-app)' }}
      >
        <div className="pk-panel" style={{ padding: 32, maxWidth: 420, textAlign: 'center' }}>
          <div className="pk-kicker" style={{ marginBottom: 8, color: 'var(--danger-700)' }}>
            Error
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--fg-1)', margin: '0 0 8px' }}>
            Project Not Found
          </h2>
          <p style={{ color: 'var(--fg-3)', fontSize: 14, margin: '0 0 20px' }}>{error}</p>
          <button onClick={() => navigate('/dashboard')} className="pk-btn pk-btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <ProjectHeaderBar projectName={project.name} />
      <ProjectDataProvider projectId={projectId}>
        <App projectId={projectId} />
      </ProjectDataProvider>
    </div>
  );
}

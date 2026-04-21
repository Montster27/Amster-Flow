/**
 * SectorMapPage - Page wrapper for the redesigned Sector Map Dashboard
 *
 * This page provides the route-level wrapper for the new sector map UI,
 * handling project ID from the route and data persistence.
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSectorMapData } from '../hooks/useSectorMapData';
import { SectorMapDashboard } from '../components/sector-map';
import { ProjectHeaderBar } from '../components/ProjectHeaderBar';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { captureException } from '../lib/sentry';
import type { Database } from '../types/database';

type Project = Database['public']['Tables']['projects']['Row'];

export function SectorMapPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { loading, error } = useSectorMapData(projectId);
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    if (!user || !projectId) return;
    (async () => {
      try {
        const { data, error: err } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .is('deleted_at', null)
          .single();
        if (err) throw err;
        setProject(data);
      } catch (err) {
        const e = err instanceof Error ? err : new Error('Error loading project');
        captureException(e, { extra: { projectId, context: 'SectorMapPage load' } });
      }
    })();
  }, [projectId, user]);

  if (loading) {
    return (
      <div
        className="h-screen flex items-center justify-center"
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
          <p style={{ color: 'var(--fg-3)', fontSize: 14 }}>Loading sector map…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-app)' }}
      >
        <div className="pk-panel" style={{ padding: 32, maxWidth: 420, textAlign: 'center' }}>
          <div className="pk-kicker" style={{ marginBottom: 8, color: 'var(--danger-700)' }}>
            Error
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--fg-1)', margin: '0 0 8px' }}>
            Couldn't load Sector Map
          </h2>
          <p style={{ color: 'var(--fg-3)', fontSize: 14, margin: '0 0 20px' }}>{error}</p>
          <button onClick={() => window.location.reload()} className="pk-btn pk-btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      {project && (
        <ProjectHeaderBar
          projectName={project.name}
          section="Sector Map"
          rightSlot={
            <button
              onClick={() => navigate(`/project/${projectId}`)}
              className="pk-btn pk-btn-secondary"
              style={{ padding: '6px 12px', fontSize: 12 }}
            >
              Back to Project
            </button>
          }
        />
      )}
      <SectorMapDashboard />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DiscoveryModule } from '../components/discovery/DiscoveryModule';
import { DiscoveryProvider } from '../contexts/DiscoveryContext';
import { useDiscoveryData } from '../hooks/useDiscoveryData';
import { useAuth } from '../hooks/useAuth';
import { useGuide } from '../contexts/GuideContext';
import { useProjectContext } from '../contexts/ProjectDataContext';
import { Sidebar } from '../components/Sidebar';
import { ProjectDataProvider } from '../components/ProjectDataProvider';
import { ProjectHeaderBar } from '../components/ProjectHeaderBar';
import { supabase } from '../lib/supabase';
import { captureException } from '../lib/sentry';
import type { Database } from '../types/database';

type Project = Database['public']['Tables']['projects']['Row'];

/**
 * Discovery Page Inner
 * Renders the Discovery module with sidebar
 */
function DiscoveryPageContent() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { loading, error } = useDiscoveryData(projectId);
  const { questionsData } = useProjectContext();
  const { setCurrentModule, setCurrentQuestionIndex } = useGuide();
  const [gateChecked, setGateChecked] = useState(false);
  const [gateTarget, setGateTarget] = useState<null | 'quickcheck' | 'sanitycheck'>(null);

  const modules = questionsData ? Object.keys(questionsData) : [];

  // Gate: require Quick Check → Sanity Check before Discovery.
  // Existing assumptions bypass the gate for projects that graduated under the
  // old flow.
  useEffect(() => {
    if (!projectId) return;
    const checkGate = async () => {
      const { data: assumptions } = await supabase
        .from('project_assumptions')
        .select('id')
        .eq('project_id', projectId)
        .limit(1);

      if (assumptions && assumptions.length > 0) {
        setGateChecked(true);
        return;
      }

      const { data: qcData } = await (supabase as any)
        .from('project_quick_check')
        .select('beachhead_completed')
        .eq('project_id', projectId)
        .maybeSingle();

      if (!qcData || !(qcData as any).beachhead_completed) {
        setGateTarget('quickcheck');
        setGateChecked(true);
        return;
      }

      const { data: scData } = await (supabase as any)
        .from('project_sanity_check')
        .select('completed')
        .eq('project_id', projectId)
        .maybeSingle();

      if (!scData || !(scData as any).completed) {
        setGateTarget('sanitycheck');
      }
      setGateChecked(true);
    };
    checkGate();
  }, [projectId]);

  const handleModuleClick = (module: string) => {
    setCurrentModule(module);
    setCurrentQuestionIndex(0);
    navigate(`/project/${projectId}`);
  };

  if (loading || !gateChecked) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
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
          <p style={{ color: 'var(--fg-3)', fontSize: 14 }}>Loading Discovery…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ background: 'var(--bg-app)' }}
      >
        <div className="pk-panel" style={{ padding: 32, maxWidth: 420, textAlign: 'center' }}>
          <div className="pk-kicker" style={{ marginBottom: 8, color: 'var(--danger-700)' }}>
            Error
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--fg-1)', margin: '0 0 8px' }}>
            Couldn't load Discovery
          </h2>
          <p style={{ color: 'var(--fg-3)', fontSize: 14, margin: '0 0 20px' }}>{error}</p>
          <button
            onClick={() => navigate(`/project/${projectId}`)}
            className="pk-btn pk-btn-primary"
          >
            Back to Project
          </button>
        </div>
      </div>
    );
  }

  if (gateTarget === 'quickcheck') {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-app)' }}
      >
        <div className="pk-panel" style={{ padding: 32, maxWidth: 460, textAlign: 'center' }}>
          <div className="pk-kicker" style={{ marginBottom: 8, color: 'var(--warn-800)' }}>
            Gate
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--fg-1)', margin: '0 0 10px' }}>
            Complete Quick Check First
          </h2>
          <p style={{ color: 'var(--fg-3)', fontSize: 14, margin: '0 0 24px', lineHeight: 1.55 }}>
            Before starting interviews, articulate what you're testing for each segment. This takes
            5 minutes and makes your interviews much more focused.
          </p>
          <button
            onClick={() => navigate(`/project/${projectId}/quick-check`)}
            className="pk-btn pk-btn-primary"
          >
            Go to Quick Check
          </button>
        </div>
      </div>
    );
  }

  if (gateTarget === 'sanitycheck') {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-app)' }}
      >
        <div className="pk-panel" style={{ padding: 32, maxWidth: 460, textAlign: 'center' }}>
          <div className="pk-kicker" style={{ marginBottom: 8, color: 'var(--warn-800)' }}>
            Gate
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--fg-1)', margin: '0 0 10px' }}>
            Run a Sanity Check First
          </h2>
          <p style={{ color: 'var(--fg-3)', fontSize: 14, margin: '0 0 24px', lineHeight: 1.55 }}>
            Before Discovery, talk to your 3 contacts to confirm the problem is real and they're
            already trying to solve it. This keeps you from burning weeks on a problem nobody has.
          </p>
          <button
            onClick={() => navigate(`/project/${projectId}/sanity-check`)}
            className="pk-btn pk-btn-primary"
          >
            Go to Sanity Check
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex" style={{ minHeight: 'calc(100vh - 52px)' }}>
      <Sidebar modules={modules} onModuleClick={handleModuleClick} projectId={projectId} />
      <main className="flex-1 overflow-y-auto" style={{ background: 'var(--bg-app)' }}>
        <DiscoveryModule
          projectId={projectId}
          onBack={() => navigate(`/project/${projectId}`)}
          onGoToStep0={() => navigate(`/project/${projectId}/discovery/step-0`)}
        />
      </main>
    </div>
  );
}

/**
 * Discovery Page
 * Wrapper that loads project data and provides contexts
 */
export function DiscoveryPage() {
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
        const { data, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .is('deleted_at', null)
          .single();

        if (projectError) throw projectError;
        setProject(data);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error loading project');
        captureException(error, { extra: { projectId, context: 'DiscoveryPage load' } });
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
      <ProjectHeaderBar projectName={project.name} section="Discovery" />
      <ProjectDataProvider projectId={projectId}>
        <DiscoveryProvider>
          <DiscoveryPageContent />
        </DiscoveryProvider>
      </ProjectDataProvider>
    </div>
  );
}

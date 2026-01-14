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
import { supabase } from '../lib/supabase';
import { captureException } from '../lib/sentry';
import type { Database } from '../types/database';

type Project = Database['public']['Tables']['projects']['Row'];

/**
 * Discovery Page Inner
 * Renders the Discovery module with sidebar (matching Old Discovery behavior)
 */
function DiscoveryPageContent() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { loading, error } = useDiscoveryData(projectId);
  const { questionsData } = useProjectContext();
  const { setCurrentModule, setCurrentQuestionIndex } = useGuide();

  const modules = questionsData ? Object.keys(questionsData) : [];

  const handleModuleClick = (module: string) => {
    setCurrentModule(module);
    setCurrentQuestionIndex(0);
    // Navigate back to project page to show the selected module
    navigate(`/project/${projectId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Discovery...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-600 font-medium mb-2">Error loading Discovery</p>
          <p className="text-gray-600 text-sm mb-4">{error}</p>
          <button
            onClick={() => navigate(`/project/${projectId}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar modules={modules} onModuleClick={handleModuleClick} projectId={projectId} />
      <main className="flex-1 overflow-y-auto">
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

      {/* Main content with padding for header */}
      <div className="pt-12">
        <ProjectDataProvider projectId={projectId}>
          <DiscoveryProvider>
            <DiscoveryPageContent />
          </DiscoveryProvider>
        </ProjectDataProvider>
      </div>
    </div>
  );
}

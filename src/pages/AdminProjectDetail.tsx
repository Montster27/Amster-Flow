import { useState, useEffect } from 'react';
import { captureException } from '../lib/sentry';

import { useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

import { useAdmin } from '../hooks/useAdmin';

import { supabase } from '../lib/supabase';

import type { Database } from '../types/database';

import type { QuestionsData } from '../App';


type Project = Database['public']['Tables']['projects']['Row'];
type Organization = Database['public']['Tables']['organizations']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type OrganizationMember = Database['public']['Tables']['organization_members']['Row'];
type Assumption = Database['public']['Tables']['project_assumptions']['Row'];
type Interview = Database['public']['Tables']['project_interviews']['Row'];
type Iteration = Database['public']['Tables']['project_iterations']['Row'];
type Competitor = Database['public']['Tables']['project_competitors']['Row'];
type DecisionMaker = Database['public']['Tables']['project_decision_makers']['Row'];
type FirstTarget = Database['public']['Tables']['project_first_target']['Row'];

interface ModuleAnswers {
  [questionIndex: number]: string;
}

export function AdminProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user, signOut } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [creator, setCreator] = useState<Profile | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [moduleAnswers, setModuleAnswers] = useState<Record<string, ModuleAnswers>>({});
  const [assumptions, setAssumptions] = useState<Assumption[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [iterations, setIterations] = useState<Iteration[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [decisionMakers, setDecisionMakers] = useState<DecisionMaker[]>([]);
  const [firstTarget, setFirstTarget] = useState<FirstTarget | null>(null);
  const [questionsData, setQuestionsData] = useState<QuestionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, adminLoading, navigate]);

  // Load questions data
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const res = await fetch('/questions.json');
        if (!res.ok) throw new Error('Failed to load questions');
        const data = await res.json();
        setQuestionsData(data);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error loading questions'); captureException(error, { extra: { context: 'AdminProjectDetail questions load' } });
      }
    };
    loadQuestions();
  }, []);

  // Load project data
  useEffect(() => {
    if (!projectId || !isAdmin) return;

    const loadProjectData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get project
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (projectError) throw projectError;
        setProject(projectData);

        // Get organization
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', projectData.organization_id)
          .single();

        if (orgError) throw orgError;
        setOrganization(orgData);

        // Get creator
        if (projectData.created_by) {
          const { data: creatorData, error: creatorError } = await supabase
            .from('profiles')
            .select('id, email, full_name, avatar_url, affiliation, is_admin, created_at, updated_at')
            .eq('id', projectData.created_by)
            .single();

          if (creatorError) throw creatorError;
          setCreator(creatorData);
        }

        // Get organization members
        const { data: membersData, error: membersError } = await supabase
          .from('organization_members')
          .select('*')
          .eq('organization_id', projectData.organization_id);

        if (membersError) throw membersError;
        setMembers(membersData || []);

        // Get module answers
        const { data: modulesData, error: modulesError } = await supabase
          .from('project_modules')
          .select('*')
          .eq('project_id', projectId);

        if (modulesError) throw modulesError;

        // Organize answers by module
        const answersMap: Record<string, ModuleAnswers> = {};
        (modulesData || []).forEach(module => {
          if (!answersMap[module.module_name]) {
            answersMap[module.module_name] = {};
          }
          answersMap[module.module_name][module.question_index] = module.answer;
        });
        setModuleAnswers(answersMap);

        // Get discovery data
        const { data: assumptionsData, error: assumptionsError } = await supabase
          .from('project_assumptions')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });

        if (assumptionsError) throw assumptionsError;
        setAssumptions(assumptionsData || []);

        const { data: interviewsData, error: interviewsError } = await supabase
          .from('project_interviews')
          .select('*')
          .eq('project_id', projectId)
          .order('date', { ascending: false });

        if (interviewsError) throw interviewsError;
        setInterviews(interviewsData || []);

        const { data: iterationsData, error: iterationsError } = await supabase
          .from('project_iterations')
          .select('*')
          .eq('project_id', projectId)
          .order('version', { ascending: false });

        if (iterationsError) throw iterationsError;
        setIterations(iterationsData || []);

        // Get sector map data
        const { data: competitorsData, error: competitorsError } = await supabase
          .from('project_competitors')
          .select('*')
          .eq('project_id', projectId);

        if (competitorsError) throw competitorsError;
        setCompetitors(competitorsData || []);

        const { data: decisionMakersData, error: decisionMakersError } = await supabase
          .from('project_decision_makers')
          .select('*')
          .eq('project_id', projectId);

        if (decisionMakersError) throw decisionMakersError;
        setDecisionMakers(decisionMakersData || []);

        const { data: firstTargetData, error: firstTargetError } = await supabase
          .from('project_first_target')
          .select('*')
          .eq('project_id', projectId)
          .maybeSingle();

        if (firstTargetError) throw firstTargetError;
        setFirstTarget(firstTargetData);

      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error loading project data'); captureException(error, { extra: { projectId, context: 'AdminProjectDetail load' } });
        setError('Failed to load project data');
      } finally {
        setLoading(false);
      }
    };

    loadProjectData();
  }, [projectId, isAdmin]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (adminLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-red-600">Admin Panel</h1>
              <button
                onClick={() => navigate('/admin')}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                ← Back to Admin
              </button>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading project details...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        ) : !project ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">Project not found</p>
          </div>
        ) : (
          <>
            {/* Project Info Card */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Project Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Project Name</label>
                  <p className="text-lg text-gray-900 font-semibold">{project.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Organization</label>
                  <p className="text-lg text-gray-900">{organization?.name || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Creator</label>
                  <p className="text-lg text-gray-900">{creator?.full_name || creator?.email || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Team Members</label>
                  <p className="text-lg text-gray-900">{members.length}</p>
                </div>
                {project.description && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
                    <p className="text-gray-900">{project.description}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Created</label>
                  <p className="text-gray-900">
                    {project.created_at ? new Date(project.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }) : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Last Updated</label>
                  <p className="text-gray-900">
                    {project.updated_at ? new Date(project.updated_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Standard Modules (Problem, Customer Segments, Solution) */}
            {questionsData && Object.entries(questionsData).map(([moduleKey, moduleData]) => {
              if (moduleData.type === 'discovery' || moduleData.type === 'sectorMap') return null;

              const answers = moduleAnswers[moduleKey] || {};
              const hasAnswers = Object.keys(answers).length > 0;

              if (!hasAnswers) return null;

              return (
                <div key={moduleKey} className="bg-white rounded-lg shadow-lg p-6 mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{moduleData.title}</h2>
                  <p className="text-gray-600 mb-6 italic">{moduleData.intro}</p>

                  <div className="space-y-6">
                    {moduleData.questions?.map((question, index) => {
                      const answer = answers[index];
                      if (!answer) return null;

                      return (
                        <div key={index} className="border-l-4 border-blue-500 pl-4">
                          <p className="text-sm font-semibold text-gray-700 mb-2">
                            Q{index + 1}: {question}
                          </p>
                          <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-4 rounded">
                            {answer}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Discovery Module */}
            {(assumptions.length > 0 || interviews.length > 0 || iterations.length > 0) && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Discovery</h2>

                {/* Assumptions */}
                {assumptions.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                      Assumptions ({assumptions.length})
                    </h3>
                    <div className="space-y-3">
                      {assumptions.map((assumption) => (
                        <div key={assumption.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-gray-900 flex-1">{assumption.description}</p>
                            <span
                              className={`ml-3 px-2 py-1 text-xs font-semibold rounded ${
                                assumption.status === 'validated'
                                  ? 'bg-green-100 text-green-800'
                                  : assumption.status === 'invalidated'
                                  ? 'bg-red-100 text-red-800'
                                  : assumption.status === 'testing'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {assumption.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="capitalize">{assumption.type}</span>
                            {assumption.confidence !== null && (
                              <span>Confidence: {assumption.confidence}%</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interviews */}
                {interviews.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                      Interviews ({interviews.length})
                    </h3>
                    <div className="space-y-3">
                      {interviews.map((interview) => (
                        <div key={interview.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {interview.interviewee || 'Anonymous'}
                              </p>
                              <p className="text-sm text-gray-600">{interview.customer_segment}</p>
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(interview.date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-700 whitespace-pre-wrap mt-2">{interview.notes}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Iterations */}
                {iterations.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                      Iterations ({iterations.length})
                    </h3>
                    <div className="space-y-3">
                      {iterations.map((iteration) => (
                        <div key={iteration.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <p className="font-semibold text-gray-900">Version {iteration.version}</p>
                            <span className="text-sm text-gray-500">
                              {new Date(iteration.date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-700 mb-2"><strong>Changes:</strong> {iteration.changes}</p>
                          <p className="text-gray-700"><strong>Reasoning:</strong> {iteration.reasoning}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sector Map Module */}
            {(competitors.length > 0 || decisionMakers.length > 0 || firstTarget) && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Sector Map</h2>

                {/* First Target */}
                {firstTarget && (
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">First Target Customer</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Customer Type</p>
                          <p className="text-gray-900 capitalize">{firstTarget.customer_type || '-'}</p>
                        </div>
                        {firstTarget.company_size && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Company Size</p>
                            <p className="text-gray-900">{firstTarget.company_size}</p>
                          </div>
                        )}
                        {firstTarget.location && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Location</p>
                            <p className="text-gray-900">{firstTarget.location}</p>
                          </div>
                        )}
                        {firstTarget.description && (
                          <div className="md:col-span-2">
                            <p className="text-sm font-medium text-gray-500">Description</p>
                            <p className="text-gray-900">{firstTarget.description}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Competitors */}
                {competitors.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                      Competitors ({competitors.length})
                    </h3>
                    <div className="space-y-3">
                      {competitors.map((competitor) => (
                        <div key={competitor.id} className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-2">{competitor.name}</h4>
                          {competitor.description && (
                            <p className="text-gray-700 mb-2">{competitor.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Decision Makers */}
                {decisionMakers.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                      Decision Makers ({decisionMakers.length})
                    </h3>
                    <div className="space-y-3">
                      {decisionMakers.map((dm) => (
                        <div key={dm.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900">{dm.role}</h4>
                              {dm.description && (
                                <p className="text-gray-700 mt-1">{dm.description}</p>
                              )}
                            </div>
                            {dm.influence && (
                              <span className="ml-3 px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-800 rounded capitalize">
                                {dm.influence}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

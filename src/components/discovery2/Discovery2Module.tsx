import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDiscovery2 } from '../../contexts/Discovery2Context';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { AssumptionGenerator } from './AssumptionGenerator';
import { AssumptionFrameworkTable } from './AssumptionFrameworkTable';
import { RiskMatrix2 } from './RiskMatrix2';
import { ValidationBoard } from './ValidationBoard';
import { EnhancedInterviews } from './EnhancedInterviews';
import { DiscoveryDashboard } from './DiscoveryDashboard';
import { seedPetFinderData, hasDiscovery2Data } from '../../utils/seedPetFinderData';
import type { Discovery2Assumption, AssumptionStatus } from '../../types/discovery';

interface Discovery2ModuleProps {
  projectId?: string;
  onBack?: () => void;
}

/**
 * Discovery 2.0 Main Module
 *
 * Enhanced discovery system with:
 * - LBMC (Lean Business Model Canvas) integration
 * - Risk-based prioritization
 * - Assumption-to-interview linking
 * - Enhanced synthesis and iteration tracking
 */
export function Discovery2Module({ projectId, onBack }: Discovery2ModuleProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'assumptions' | 'matrix' | 'board' | 'interviews' | 'dashboard'>('assumptions');
  const [showGenerator, setShowGenerator] = useState(false);
  const [isLoadingSampleData, setIsLoadingSampleData] = useState(false);
  const [autoSeedAttempted, setAutoSeedAttempted] = useState(false);
  const [navigationContext, setNavigationContext] = useState<any>(null);

  const { assumptions, interviews, addAssumption, deleteAssumption, linkAssumptionToActor, linkAssumptionToConnection } = useDiscovery2();
  const { user } = useAuth();

  // Handle navigation context from Visual Sector Map (via URL parameters)
  useEffect(() => {
    const action = searchParams.get('action');
    const actorId = searchParams.get('actorId');
    const connectionId = searchParams.get('connectionId');

    if (action) {
      const context = {
        action,
        actorId: actorId || undefined,
        connectionId: connectionId || undefined,
      };
      setNavigationContext(context);

      // Auto-open generator if action is 'create'
      if (context.action === 'create') {
        setShowGenerator(true);
        setActiveTab('assumptions');
      }

      // Clear the parameters from URL
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // Auto-seed Pet Finder Discovery 2.0 data if project is Pet Finder and has no data
  useEffect(() => {
    async function checkAndSeedPetFinder() {
      if (!projectId || !user || autoSeedAttempted) return;

      try {
        // Check if this is Pet Finder project
        const { data: project } = await supabase
          .from('projects')
          .select('name')
          .eq('id', projectId)
          .single();

        if (!project || !project.name.toLowerCase().includes('pet')) return;

        // Check if it already has Discovery 2.0 data
        const hasData = await hasDiscovery2Data(projectId);

        if (!hasData && assumptions.length === 0) {
          console.log('🌱 Auto-seeding Pet Finder Discovery 2.0 data...');
          setAutoSeedAttempted(true);
          setIsLoadingSampleData(true);

          await seedPetFinderData(projectId, user.id);

          console.log('✅ Auto-seed complete, reloading...');
          window.location.reload();
        }
      } catch (error) {
        console.error('Error auto-seeding Pet Finder data:', error);
        setAutoSeedAttempted(true);
      } finally {
        setIsLoadingSampleData(false);
      }
    }

    checkAndSeedPetFinder();
  }, [projectId, user, assumptions.length, autoSeedAttempted]);

  const handleCreateAssumption = (newAssumption: any) => {
    // Calculate risk score
    const riskScore = (6 - newAssumption.confidence) * newAssumption.importance;

    // Determine priority based on risk score
    let priority: 'high' | 'medium' | 'low' = 'medium';
    if (riskScore >= 15) {
      priority = 'high';
    } else if (riskScore >= 8) {
      priority = 'medium';
    } else {
      priority = 'low';
    }

    const assumptionId = crypto.randomUUID();
    const assumption: Discovery2Assumption = {
      id: assumptionId,
      type: newAssumption.type,
      description: newAssumption.description,
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      status: 'untested' as AssumptionStatus,
      confidence: newAssumption.confidence,
      evidence: newAssumption.evidence || [],

      // Discovery 2.0 specific fields
      canvasArea: newAssumption.canvasArea,
      importance: newAssumption.importance,
      priority,
      riskScore,
      interviewCount: 0,
    };

    addAssumption(assumption);

    // Auto-link to actor/connection from navigation context
    if (navigationContext) {
      if (navigationContext.actorId) {
        linkAssumptionToActor(assumptionId, navigationContext.actorId);
      } else if (navigationContext.connectionId) {
        linkAssumptionToConnection(assumptionId, navigationContext.connectionId);
      }
      // Clear navigation context after linking
      setNavigationContext(null);
    }
  };

  const handleEditAssumption = (assumption: Discovery2Assumption) => {
    // TODO: Implement edit functionality
    console.log('Edit assumption:', assumption);
  };

  const handleDeleteAssumption = (id: string) => {
    if (confirm('Are you sure you want to delete this assumption?')) {
      deleteAssumption(id);
    }
  };

  const handleLoadSampleData = async () => {
    if (!projectId || !user) {
      alert('Unable to load sample data: missing project or user information');
      return;
    }

    if (assumptions.length > 0) {
      const confirmed = confirm(
        'This project already has assumptions. Loading sample data will add more data. Continue?'
      );
      if (!confirmed) return;
    }

    try {
      setIsLoadingSampleData(true);
      await seedPetFinderData(projectId, user.id);
      alert('✅ Sample Pet Finder data loaded successfully! The page will refresh to show the new data.');
      window.location.reload();
    } catch (error) {
      console.error('Error loading sample data:', error);
      alert('Failed to load sample data. Check console for details.');
    } finally {
      setIsLoadingSampleData(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            {/* Back Button */}
            {onBack && (
              <div className="mb-4">
                <button
                  onClick={onBack}
                  className="inline-flex items-center px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Project
                </button>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Discovery 2.0</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Assumptions-driven customer discovery with LBMC integration
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  New
                </span>
                <span className="text-sm text-gray-500">
                  Enhanced discovery system
                </span>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="mt-6 border-b border-gray-200">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('assumptions')}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === 'assumptions'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Assumptions Framework
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('matrix')}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === 'matrix'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                    Risk Matrix
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('board')}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === 'board'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                    Validation Board
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('interviews')}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === 'interviews'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Interviews
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === 'dashboard'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Dashboard
                  </span>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content with Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {activeTab === 'assumptions' && (
              <div>
                {/* Header with Create Button */}
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Assumptions Framework</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Generate and manage assumptions linked to your Lean Business Model Canvas
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowGenerator(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Assumption
                  </button>
                </div>

                {/* Assumptions Table or Empty State */}
                {assumptions.length > 0 ? (
                  <div className="bg-white rounded-lg shadow">
                    <AssumptionFrameworkTable
                      assumptions={assumptions}
                      onEdit={handleEditAssumption}
                      onDelete={handleDeleteAssumption}
                    />
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-center py-12">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No assumptions yet</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Get started by creating your first assumption or load sample data
                      </p>
                      <div className="mt-6 flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => setShowGenerator(true)}
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Create First Assumption
                        </button>
                        {projectId && (
                          <button
                            type="button"
                            onClick={handleLoadSampleData}
                            disabled={isLoadingSampleData}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLoadingSampleData ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Loading...
                              </>
                            ) : (
                              <>
                                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Load Sample Data (Pet Finder)
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'matrix' && (
              <RiskMatrix2 />
            )}

            {activeTab === 'board' && (
              <ValidationBoard assumptions={assumptions} />
            )}

            {activeTab === 'interviews' && (
              <EnhancedInterviews assumptions={assumptions} />
            )}

            {activeTab === 'dashboard' && (
              <DiscoveryDashboard assumptions={assumptions} interviews={interviews} />
            )}
          </div>

          {/* Right Sidebar - Assumptions Ranked by Risk */}
          {assumptions.length > 0 && (
            <div className="w-80 flex-shrink-0">
              <div className="sticky top-6 bg-white rounded-lg shadow-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h3 className="text-sm font-semibold text-gray-900">Highest Risk Assumptions</h3>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Prioritize testing these critical assumptions
                  </p>
                </div>

                <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                  <div className="space-y-3">
                    {[...assumptions]
                      .sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0))
                      .slice(0, 20)
                      .map((assumption, index) => {
                        const riskColor =
                          (assumption.riskScore || 0) >= 15 ? 'bg-red-100 text-red-800 border-red-200' :
                          (assumption.riskScore || 0) >= 10 ? 'bg-orange-100 text-orange-800 border-orange-200' :
                          'bg-yellow-100 text-yellow-800 border-yellow-200';

                        const priorityIcon =
                          assumption.priority === 'high' ? '🔴' :
                          assumption.priority === 'medium' ? '🟡' :
                          '🟢';

                        return (
                          <div
                            key={assumption.id}
                            className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
                          >
                            <div className="flex items-start gap-2 mb-2">
                              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-700">
                                {index + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${riskColor}`}>
                                  <span className="mr-1">{priorityIcon}</span>
                                  Risk: {assumption.riskScore || 0}
                                </div>
                              </div>
                            </div>

                            <p className="text-xs text-gray-700 leading-relaxed line-clamp-3 mb-2">
                              {assumption.description}
                            </p>

                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">
                                {assumption.canvasArea?.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                assumption.status === 'validated' ? 'bg-green-100 text-green-800' :
                                assumption.status === 'invalidated' ? 'bg-red-100 text-red-800' :
                                assumption.status === 'testing' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {assumption.status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div className="p-3 border-t border-gray-200 bg-gray-50">
                  <p className="text-xs text-gray-600 text-center">
                    Showing top {Math.min(20, assumptions.length)} of {assumptions.length} assumptions
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Assumption Generator Modal */}
      {showGenerator && (
        <AssumptionGenerator
          onClose={() => setShowGenerator(false)}
          onSave={handleCreateAssumption}
          initialCanvasArea={navigationContext ? 'customerSegments' : undefined}
        />
      )}
    </div>
  );
}

import { useState } from 'react';
import { useDiscovery2 } from '../../contexts/Discovery2Context';
import { useAuth } from '../../hooks/useAuth';
import { AssumptionGenerator } from './AssumptionGenerator';
import { AssumptionFrameworkTable } from './AssumptionFrameworkTable';
import { ValidationBoard } from './ValidationBoard';
import { EnhancedInterviews } from './EnhancedInterviews';
import { DiscoveryDashboard } from './DiscoveryDashboard';
import { seedPetFinderData } from '../../utils/seedPetFinderData';
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
  const [activeTab, setActiveTab] = useState<'assumptions' | 'board' | 'interviews' | 'dashboard'>('assumptions');
  const [showGenerator, setShowGenerator] = useState(false);
  const [isLoadingSampleData, setIsLoadingSampleData] = useState(false);

  const { assumptions, interviews, addAssumption, deleteAssumption } = useDiscovery2();
  const { user } = useAuth();

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

    const assumption: Discovery2Assumption = {
      id: crypto.randomUUID(),
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

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

      {/* Assumption Generator Modal */}
      {showGenerator && (
        <AssumptionGenerator
          onClose={() => setShowGenerator(false)}
          onSave={handleCreateAssumption}
        />
      )}
    </div>
  );
}

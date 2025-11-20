import { useState } from 'react';
import { useDiscovery2 } from '../../contexts/Discovery2Context';
import { AssumptionGenerator } from './AssumptionGenerator';
import { AssumptionFrameworkTable } from './AssumptionFrameworkTable';
import { ValidationBoard } from './ValidationBoard';
import { EnhancedInterviews } from './EnhancedInterviews';
import type { Discovery2Assumption, AssumptionStatus } from '../../types/discovery';

/**
 * Discovery 2.0 Main Module
 *
 * Enhanced discovery system with:
 * - LBMC (Lean Business Model Canvas) integration
 * - Risk-based prioritization
 * - Assumption-to-interview linking
 * - Enhanced synthesis and iteration tracking
 */
export function Discovery2Module() {
  const [activeTab, setActiveTab] = useState<'assumptions' | 'board' | 'interviews' | 'dashboard'>('assumptions');
  const [showGenerator, setShowGenerator] = useState(false);

  const { assumptions, addAssumption, deleteAssumption } = useDiscovery2();

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
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
                    Get started by creating your first assumption
                  </p>
                  <div className="mt-6">
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
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Discovery Dashboard</h3>
              <p className="mt-1 text-sm text-gray-500">
                View synthesis, patterns, and insights from your discovery process
              </p>
              <p className="mt-4 text-xs text-gray-400">Coming soon...</p>
            </div>
          </div>
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

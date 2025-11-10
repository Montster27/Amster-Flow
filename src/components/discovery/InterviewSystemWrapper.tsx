import { useState, useEffect } from 'react';
import { InterviewLog } from './InterviewLog';
import { InterviewPlanner } from './InterviewPlanner';
import { EnhancedInterviewDashboard } from './EnhancedInterviewDashboard';
import { EnhancedInterviewForm } from './EnhancedInterviewForm';
import { SynthesisMode } from './SynthesisMode';
import { useDiscovery } from '../../contexts/DiscoveryContext';
import { useEnhancedInterviews } from '../../hooks/useEnhancedInterviews';
import { EnhancedInterview } from '../../types/discovery';

interface InterviewSystemWrapperProps {
  projectId?: string;
}

type EnhancedView = 'dashboard' | 'form' | 'synthesis';

export const InterviewSystemWrapper = ({ projectId }: InterviewSystemWrapperProps) => {
  const {
    interviews: enhancedInterviews,
    loading,
    addInterview,
    updateInterview,
    deleteInterview,
  } = useEnhancedInterviews(projectId);

  // Load preference from localStorage
  const [useEnhancedSystem, setUseEnhancedSystem] = useState<boolean>(() => {
    const saved = localStorage.getItem('useEnhancedInterviewSystem');
    return saved !== null ? JSON.parse(saved) : false; // Default to classic for now
  });

  // View state for enhanced system
  const [enhancedView, setEnhancedView] = useState<EnhancedView>('dashboard');
  const [editingInterview, setEditingInterview] = useState<EnhancedInterview | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  // Save preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('useEnhancedInterviewSystem', JSON.stringify(useEnhancedSystem));
  }, [useEnhancedSystem]);

  const handleToggleSystem = () => {
    setUseEnhancedSystem(prev => !prev);
  };

  // Enhanced system handlers
  const handleNewInterview = () => {
    setEditingInterview(undefined);
    setEnhancedView('form');
  };

  const handleBatchSynthesis = () => {
    setEnhancedView('synthesis');
  };

  const handleEditInterview = (id: string) => {
    const interview = enhancedInterviews.find(i => i.id === id);
    if (interview) {
      setEditingInterview(interview);
      setEnhancedView('form');
    }
  };

  const handleDeleteInterview = async (id: string) => {
    const success = await deleteInterview(id);
    if (!success) {
      alert('Failed to delete interview. Please try again.');
    }
  };

  const handleSaveInterview = async (interviewData: Omit<EnhancedInterview, 'id' | 'created' | 'lastUpdated'>) => {
    setSaving(true);
    try {
      let success = false;

      if (editingInterview) {
        // Update existing interview
        success = await updateInterview(editingInterview.id, interviewData);
      } else {
        // Create new interview
        const result = await addInterview(interviewData);
        success = result !== null;
      }

      if (success) {
        setEnhancedView('dashboard');
        setEditingInterview(undefined);
      } else {
        alert('Failed to save interview. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancelForm = () => {
    setEnhancedView('dashboard');
    setEditingInterview(undefined);
  };

  return (
    <div>
      {/* System Toggle */}
      <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-bold text-gray-800 mb-1">Interview System</h3>
            <p className="text-sm text-gray-600">
              {useEnhancedSystem
                ? 'Using Enhanced System with structured capture and assumption tracking'
                : 'Using Classic System with flexible note-taking'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${!useEnhancedSystem ? 'text-blue-700' : 'text-gray-500'}`}>
              Classic
            </span>
            <button
              onClick={handleToggleSystem}
              className={`relative w-16 h-8 rounded-full transition-colors ${
                useEnhancedSystem ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              aria-label="Toggle interview system"
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  useEnhancedSystem ? 'transform translate-x-8' : ''
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${useEnhancedSystem ? 'text-blue-700' : 'text-gray-500'}`}>
              Enhanced
            </span>
          </div>
        </div>

        {/* System Features */}
        <div className="mt-3 pt-3 border-t border-blue-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {useEnhancedSystem ? (
              <>
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="text-green-600">✓</span>
                  <span>Structured interview capture</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="text-green-600">✓</span>
                  <span>Assumption tagging & validation</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="text-green-600">✓</span>
                  <span>Kanban assumption board</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="text-green-600">✓</span>
                  <span>Batch synthesis & patterns</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="text-blue-600">✓</span>
                  <span>Flexible note-taking</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="text-blue-600">✓</span>
                  <span>Y Combinator guidance</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="text-blue-600">✓</span>
                  <span>Quick interview logging</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="text-blue-600">✓</span>
                  <span>Key insights tracking</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Info Banner for Enhanced System */}
        {useEnhancedSystem && (
          <div className="mt-3 pt-3 border-t border-blue-200">
            <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 text-xs text-blue-800">
              <strong>ℹ️ Enhanced System Preview:</strong> The database tables are deployed and ready!
              Full implementation with forms, boards, and synthesis available in{' '}
              <code className="bg-blue-200 px-1 py-0.5 rounded">ENHANCED_INTERVIEW_IMPLEMENTATION_GUIDE.md</code>
            </div>
          </div>
        )}
      </div>

      {/* Render Appropriate System */}
      {useEnhancedSystem ? (
        <>
          {/* Enhanced System */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading interviews...</p>
              </div>
            </div>
          ) : enhancedView === 'form' ? (
            <div className={saving ? 'opacity-50 pointer-events-none' : ''}>
              <EnhancedInterviewForm
                interview={editingInterview}
                onSave={handleSaveInterview}
                onCancel={handleCancelForm}
              />
              {saving && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-20 z-50">
                  <div className="bg-white rounded-lg p-6 shadow-xl">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-700 font-medium">Saving interview...</p>
                  </div>
                </div>
              )}
            </div>
          ) : enhancedView === 'synthesis' ? (
            <div>
              {/* Back button */}
              <button
                onClick={() => setEnhancedView('dashboard')}
                className="mb-4 px-4 py-2 text-gray-700 hover:text-gray-900 font-medium flex items-center gap-2"
              >
                ← Back to Interviews
              </button>
              <SynthesisMode projectId={projectId} />
            </div>
          ) : (
            <EnhancedInterviewDashboard
              interviews={enhancedInterviews}
              onNewInterview={handleNewInterview}
              onBatchSynthesis={handleBatchSynthesis}
              onEditInterview={handleEditInterview}
              onDeleteInterview={handleDeleteInterview}
            />
          )}
        </>
      ) : (
        <>
          {/* Classic System - Check which view to show */}
          <ClassicInterviewView />
        </>
      )}
    </div>
  );
};

// Helper component to handle classic system views
const ClassicInterviewView = () => {
  const { currentView } = useDiscovery();

  if (currentView === 'planner') {
    return <InterviewPlanner />;
  }

  return <InterviewLog />;
};

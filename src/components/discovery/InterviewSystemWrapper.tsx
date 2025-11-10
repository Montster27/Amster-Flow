import { useState } from 'react';
import { EnhancedInterviewDashboard } from './EnhancedInterviewDashboard';
import { EnhancedInterviewForm } from './EnhancedInterviewForm';
import { SynthesisMode } from './SynthesisMode';
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

  // View state
  const [enhancedView, setEnhancedView] = useState<EnhancedView>('dashboard');
  const [editingInterview, setEditingInterview] = useState<EnhancedInterview | undefined>(undefined);
  const [saving, setSaving] = useState(false);

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
      {/* Loading State */}
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
    </div>
  );
};

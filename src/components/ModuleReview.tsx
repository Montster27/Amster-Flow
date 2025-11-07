import { useState } from 'react';
import { useGuide } from '../contexts/GuideContext';

interface ModuleReviewProps {
  module: string;
  moduleTitle: string;
  questions: string[];
  onConfirm: () => void;
  onBack: () => void;
}

export const ModuleReview = ({
  module,
  moduleTitle,
  questions,
  onConfirm,
  onBack,
}: ModuleReviewProps) => {
  const { progress, saveAnswer } = useGuide();
  const moduleProgress = progress[module];
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleStartEdit = (index: number) => {
    const answer = moduleProgress?.answers.find((a) => a.questionIndex === index);
    setEditingIndex(index);
    setEditValue(answer?.answer || '');
  };

  const handleSaveEdit = (index: number) => {
    if (editValue.trim()) {
      saveAnswer(module, index, editValue.trim());
      setEditingIndex(null);
      setEditValue('');
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to questions
        </button>

        <h1 className="text-3xl font-bold text-gray-800 mb-2">Review Your Answers</h1>
        <h2 className="text-xl text-gray-600 mb-4">{moduleTitle}</h2>
        <p className="text-gray-600">
          Review and edit your answers before moving on. Click on any answer to make changes.
        </p>
      </div>

      {/* Answers List */}
      <div className="space-y-6 mb-8">
        {questions.map((question, index) => {
          const answer = moduleProgress?.answers.find((a) => a.questionIndex === index);
          const isEditing = editingIndex === index;

          return (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-3">
                <span className="text-sm font-medium text-blue-600">Question {index + 1}</span>
                <h3 className="text-lg font-semibold text-gray-800 mt-1">{question}</h3>
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(index)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-700 mb-3 whitespace-pre-wrap">{answer?.answer}</p>
                  <button
                    onClick={() => handleStartEdit(index)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Answer
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end sticky bottom-8 bg-gray-50 p-4 rounded-lg shadow-lg border border-gray-200">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-medium"
        >
          Back to Questions
        </button>
        <button
          onClick={onConfirm}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium flex items-center gap-2"
        >
          Confirm & Continue
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

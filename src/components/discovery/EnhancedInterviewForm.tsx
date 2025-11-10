import { useState, useMemo } from 'react';
import {
  EnhancedInterview,
  IntervieweeTypeEnhanced,
  ValidationEffect,
  ConfidenceLevel,
  AssumptionTag,
  Assumption,
} from '../../types/discovery';

interface EnhancedInterviewFormProps {
  existingInterview?: EnhancedInterview; // For editing
  assumptions: Assumption[]; // List of assumptions to tag
  onSave: (interview: Partial<EnhancedInterview>, status: 'draft' | 'completed') => void;
  onCancel: () => void;
}

type FormStep = 1 | 2 | 3 | 4;

interface FormData {
  // Step 1: Metadata
  intervieweeType: IntervieweeTypeEnhanced | '';
  segmentName: string;
  date: string;
  context: string;

  // Step 2: Key Findings
  mainPainPoints: string;
  problemImportance: ConfidenceLevel | '';
  problemImportanceQuote: string;
  currentAlternatives: string;
  memorableQuotes: string[];
  surprisingFeedback: string;

  // Step 3: Assumption Tags
  assumptionTags: AssumptionTag[];

  // Step 4: Reflection
  studentReflection: string;
  mentorFeedback: string;
}

export const EnhancedInterviewForm = ({
  existingInterview,
  assumptions,
  onSave,
  onCancel,
}: EnhancedInterviewFormProps) => {
  const [currentStep, setCurrentStep] = useState<FormStep>(1);

  // Initialize form data
  const [formData, setFormData] = useState<FormData>({
    intervieweeType: existingInterview?.intervieweeType || '',
    segmentName: existingInterview?.segmentName || '',
    date: existingInterview?.date.split('T')[0] || new Date().toISOString().split('T')[0],
    context: existingInterview?.context || '',
    mainPainPoints: existingInterview?.mainPainPoints || '',
    problemImportance: existingInterview?.problemImportance || '',
    problemImportanceQuote: existingInterview?.problemImportanceQuote || '',
    currentAlternatives: existingInterview?.currentAlternatives || '',
    memorableQuotes: existingInterview?.memorableQuotes.length > 0 ? existingInterview.memorableQuotes : [''],
    surprisingFeedback: existingInterview?.surprisingFeedback || '',
    assumptionTags: existingInterview?.assumptionTags || [],
    studentReflection: existingInterview?.studentReflection || '',
    mentorFeedback: existingInterview?.mentorFeedback || '',
  });

  // Validation for each step
  const isStep1Valid = useMemo(() => {
    return (
      formData.intervieweeType !== '' &&
      formData.segmentName.trim() !== '' &&
      formData.date !== '' &&
      formData.context.trim() !== ''
    );
  }, [formData.intervieweeType, formData.segmentName, formData.date, formData.context]);

  const isStep2Valid = useMemo(() => {
    return (
      formData.mainPainPoints.trim() !== '' &&
      formData.problemImportance !== '' &&
      formData.currentAlternatives.trim() !== ''
    );
  }, [formData.mainPainPoints, formData.problemImportance, formData.currentAlternatives]);

  const isStep4Valid = useMemo(() => {
    return formData.studentReflection.trim() !== '';
  }, [formData.studentReflection]);

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as FormStep);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as FormStep);
    }
  };

  const handleSaveDraft = () => {
    onSave(
      {
        ...formData,
        intervieweeType: formData.intervieweeType as IntervieweeTypeEnhanced,
        problemImportance: formData.problemImportance as ConfidenceLevel,
        date: new Date(formData.date).toISOString(),
        memorableQuotes: formData.memorableQuotes.filter(q => q.trim() !== ''),
        status: 'draft',
      },
      'draft'
    );
  };

  const handleComplete = () => {
    if (!isStep1Valid || !isStep2Valid || !isStep4Valid) {
      alert('Please complete all required fields before marking as complete.');
      return;
    }

    onSave(
      {
        ...formData,
        intervieweeType: formData.intervieweeType as IntervieweeTypeEnhanced,
        problemImportance: formData.problemImportance as ConfidenceLevel,
        date: new Date(formData.date).toISOString(),
        memorableQuotes: formData.memorableQuotes.filter(q => q.trim() !== ''),
        status: 'completed',
      },
      'completed'
    );
  };

  const addMemorableQuote = () => {
    setFormData(prev => ({
      ...prev,
      memorableQuotes: [...prev.memorableQuotes, ''],
    }));
  };

  const updateMemorableQuote = (index: number, value: string) => {
    const newQuotes = [...formData.memorableQuotes];
    newQuotes[index] = value;
    setFormData(prev => ({ ...prev, memorableQuotes: newQuotes }));
  };

  const removeMemorableQuote = (index: number) => {
    if (formData.memorableQuotes.length > 1) {
      setFormData(prev => ({
        ...prev,
        memorableQuotes: prev.memorableQuotes.filter((_, i) => i !== index),
      }));
    }
  };

  const toggleAssumptionTag = (assumptionId: string) => {
    const existingTag = formData.assumptionTags.find(t => t.assumptionId === assumptionId);

    if (existingTag) {
      // Remove tag
      setFormData(prev => ({
        ...prev,
        assumptionTags: prev.assumptionTags.filter(t => t.assumptionId !== assumptionId),
      }));
    } else {
      // Add new tag with defaults
      setFormData(prev => ({
        ...prev,
        assumptionTags: [
          ...prev.assumptionTags,
          {
            assumptionId,
            validationEffect: 'neutral',
            confidenceChange: 0,
            quote: '',
          },
        ],
      }));
    }
  };

  const updateAssumptionTag = (assumptionId: string, updates: Partial<AssumptionTag>) => {
    setFormData(prev => ({
      ...prev,
      assumptionTags: prev.assumptionTags.map(tag =>
        tag.assumptionId === assumptionId ? { ...tag, ...updates } : tag
      ),
    }));
  };

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {existingInterview ? 'Edit Interview' : 'New Enhanced Interview'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Step {currentStep} of 4: {
            currentStep === 1 ? 'Metadata' :
            currentStep === 2 ? 'Key Findings' :
            currentStep === 3 ? 'Tag Assumptions' :
            'Reflection'
          }
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {[1, 2, 3, 4].map(step => (
            <div
              key={step}
              className={`flex-1 h-2 rounded ${
                step <= currentStep ? 'bg-blue-600' : 'bg-gray-200'
              } ${step < 4 ? 'mr-2' : ''}`}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-600">
          <span>Metadata</span>
          <span>Findings</span>
          <span>Assumptions</span>
          <span>Reflection</span>
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6 mb-6">
        {/* Step 1: Metadata */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interviewee Type <span className="text-red-600">*</span>
              </label>
              <select
                value={formData.intervieweeType}
                onChange={(e) => setFormData({ ...formData, intervieweeType: e.target.value as IntervieweeTypeEnhanced })}
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                required
              >
                <option value="">Select type...</option>
                <option value="customer">Customer</option>
                <option value="partner">Partner</option>
                <option value="regulator">Regulator</option>
                <option value="expert">Expert</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Segment <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={formData.segmentName}
                onChange={(e) => setFormData({ ...formData, segmentName: e.target.value })}
                placeholder="e.g., Elderly users, Small bakery owners"
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interview Date <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Context <span className="text-red-600">*</span>
              </label>
              <textarea
                value={formData.context}
                onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                placeholder="Where did this interview take place? What was the setting?"
                className="w-full h-24 p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                required
              />
            </div>
          </div>
        )}

        {/* Step 2: Key Findings */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Main Pain Points Discussed <span className="text-red-600">*</span>
              </label>
              <textarea
                value={formData.mainPainPoints}
                onChange={(e) => setFormData({ ...formData, mainPainPoints: e.target.value })}
                placeholder="What are the main problems or pain points they mentioned?"
                className="w-full h-32 p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Problem Importance (1-5) <span className="text-red-600">*</span>
              </label>
              <div className="flex items-center gap-4">
                <select
                  value={formData.problemImportance}
                  onChange={(e) => setFormData({ ...formData, problemImportance: Number(e.target.value) as ConfidenceLevel })}
                  className="w-32 p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                >
                  <option value="">Select</option>
                  <option value="1">1 - Very Low</option>
                  <option value="2">2 - Low</option>
                  <option value="3">3 - Medium</option>
                  <option value="4">4 - High</option>
                  <option value="5">5 - Very High</option>
                </select>
                {formData.problemImportance !== '' && (
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(level => (
                      <span
                        key={level}
                        className={`text-2xl ${
                          level <= formData.problemImportance ? 'text-purple-600' : 'text-gray-300'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quote Supporting This Rating (optional)
              </label>
              <textarea
                value={formData.problemImportanceQuote}
                onChange={(e) => setFormData({ ...formData, problemImportanceQuote: e.target.value })}
                placeholder="Any specific quote that shows the problem importance?"
                className="w-full h-20 p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Alternatives They Use <span className="text-red-600">*</span>
              </label>
              <textarea
                value={formData.currentAlternatives}
                onChange={(e) => setFormData({ ...formData, currentAlternatives: e.target.value })}
                placeholder="What are they currently using to solve this problem?"
                className="w-full h-24 p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Memorable Quotes (optional)
              </label>
              {formData.memorableQuotes.map((quote, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <textarea
                    value={quote}
                    onChange={(e) => updateMemorableQuote(index, e.target.value)}
                    placeholder="Any memorable quotes from the interview?"
                    className="flex-1 h-16 p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                  />
                  {formData.memorableQuotes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMemorableQuote(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Remove quote"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addMemorableQuote}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add another quote
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Surprising Feedback (optional)
              </label>
              <textarea
                value={formData.surprisingFeedback}
                onChange={(e) => setFormData({ ...formData, surprisingFeedback: e.target.value })}
                placeholder="Anything that surprised you or was unexpected?"
                className="w-full h-24 p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 3: Tag Assumptions */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Select assumptions that were discussed in this interview and indicate how the interview affected your confidence in each assumption.
              </p>

              {assumptions.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No assumptions available yet.</p>
                  <p className="text-sm text-gray-400 mt-1">Add some assumptions first to tag them here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assumptions.map(assumption => {
                    const tag = formData.assumptionTags.find(t => t.assumptionId === assumption.id);
                    const isTagged = !!tag;

                    return (
                      <div
                        key={assumption.id}
                        className={`border-2 rounded-lg p-4 transition-all ${
                          isTagged ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white'
                        }`}
                      >
                        {/* Assumption Header */}
                        <div className="flex items-start gap-3 mb-3">
                          <input
                            type="checkbox"
                            checked={isTagged}
                            onChange={() => toggleAssumptionTag(assumption.id)}
                            className="mt-1 w-5 h-5"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">{assumption.description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Type: {assumption.type} • Current confidence: {assumption.confidence}/5
                            </p>
                          </div>
                        </div>

                        {/* Tag Details (shown when tagged) */}
                        {isTagged && tag && (
                          <div className="ml-8 space-y-3 border-t border-blue-200 pt-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Validation Effect
                              </label>
                              <select
                                value={tag.validationEffect}
                                onChange={(e) => updateAssumptionTag(assumption.id, {
                                  validationEffect: e.target.value as ValidationEffect,
                                })}
                                className="w-full p-2 text-sm border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                              >
                                <option value="supports">Supports (validates the assumption)</option>
                                <option value="contradicts">Contradicts (invalidates the assumption)</option>
                                <option value="neutral">Neutral (no clear effect)</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Confidence Change ({tag.confidenceChange > 0 ? '+' : ''}{tag.confidenceChange})
                              </label>
                              <input
                                type="range"
                                min="-2"
                                max="2"
                                step="1"
                                value={tag.confidenceChange}
                                onChange={(e) => updateAssumptionTag(assumption.id, {
                                  confidenceChange: Number(e.target.value),
                                })}
                                className="w-full"
                              />
                              <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>-2 (much less confident)</span>
                                <span>0 (no change)</span>
                                <span>+2 (much more confident)</span>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Supporting Quote (optional)
                              </label>
                              <textarea
                                value={tag.quote || ''}
                                onChange={(e) => updateAssumptionTag(assumption.id, {
                                  quote: e.target.value,
                                })}
                                placeholder="Quote from interview that supports this validation..."
                                className="w-full h-16 p-2 text-sm border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Reflection */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student Reflection <span className="text-red-600">*</span>
              </label>
              <textarea
                value={formData.studentReflection}
                onChange={(e) => setFormData({ ...formData, studentReflection: e.target.value })}
                placeholder="What did you learn from this interview? What will you do differently? How does this change your understanding?"
                className="w-full h-40 p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mentor Feedback (optional)
              </label>
              <textarea
                value={formData.mentorFeedback}
                onChange={(e) => setFormData({ ...formData, mentorFeedback: e.target.value })}
                placeholder="Space for mentor to provide feedback later..."
                className="w-full h-32 p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                This can be filled in later by a mentor or instructor
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        <div className="flex gap-3">
          {currentStep > 1 && (
            <button
              onClick={handlePrevious}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
            >
              ← Previous
            </button>
          )}
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all"
          >
            Cancel
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSaveDraft}
            className="px-6 py-3 bg-yellow-100 text-yellow-800 border-2 border-yellow-300 rounded-lg hover:bg-yellow-200 transition-all font-medium"
          >
            💾 Save as Draft
          </button>
          {currentStep < 4 ? (
            <button
              onClick={handleNext}
              disabled={
                (currentStep === 1 && !isStep1Valid) ||
                (currentStep === 2 && !isStep2Valid)
              }
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={!isStep1Valid || !isStep2Valid || !isStep4Valid}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
            >
              ✓ Mark as Complete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

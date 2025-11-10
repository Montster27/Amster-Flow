import { useState } from 'react';
import { useDiscovery } from '../../contexts/DiscoveryContext';
import { EnhancedInterview, IntervieweeTypeEnhanced, ValidationEffect, ConfidenceLevel, AssumptionTag } from '../../types/discovery';

interface EnhancedInterviewFormProps {
  interview?: EnhancedInterview; // For edit mode
  onSave: (interview: Omit<EnhancedInterview, 'id' | 'created' | 'lastUpdated'>) => void;
  onCancel: () => void;
}

export const EnhancedInterviewForm = ({ interview, onSave, onCancel }: EnhancedInterviewFormProps) => {
  const { assumptions } = useDiscovery();
  const [currentStep, setCurrentStep] = useState(1);

  // Form state
  const [intervieweeType, setIntervieweeType] = useState<IntervieweeTypeEnhanced>(interview?.intervieweeType || 'customer');
  const [segmentName, setSegmentName] = useState(interview?.segmentName || '');
  const [date, setDate] = useState(interview?.date || new Date().toISOString().split('T')[0]);
  const [context, setContext] = useState(interview?.context || '');

  const [mainPainPoints, setMainPainPoints] = useState(interview?.mainPainPoints || '');
  const [problemImportance, setProblemImportance] = useState<ConfidenceLevel>(interview?.problemImportance || 3);
  const [problemImportanceQuote, setProblemImportanceQuote] = useState(interview?.problemImportanceQuote || '');
  const [currentAlternatives, setCurrentAlternatives] = useState(interview?.currentAlternatives || '');
  const [memorableQuotes, setMemorableQuotes] = useState<string[]>(interview?.memorableQuotes || ['']);
  const [surprisingFeedback, setSurprisingFeedback] = useState(interview?.surprisingFeedback || '');

  const [assumptionTags, setAssumptionTags] = useState<AssumptionTag[]>(interview?.assumptionTags || []);

  const [studentReflection, setStudentReflection] = useState(interview?.studentReflection || '');
  const [mentorFeedback, setMentorFeedback] = useState(interview?.mentorFeedback || '');

  const steps = [
    { number: 1, title: 'Metadata', icon: '📋' },
    { number: 2, title: 'Key Findings', icon: '💡' },
    { number: 3, title: 'Tag Assumptions', icon: '🏷️' },
    { number: 4, title: 'Reflection', icon: '🤔' },
  ];

  const getTypeIcon = (type: IntervieweeTypeEnhanced) => {
    switch (type) {
      case 'customer': return '👤';
      case 'partner': return '🤝';
      case 'regulator': return '⚖️';
      case 'expert': return '🎓';
      case 'other': return '📝';
    }
  };

  const handleAddQuote = () => {
    setMemorableQuotes([...memorableQuotes, '']);
  };

  const handleRemoveQuote = (index: number) => {
    setMemorableQuotes(memorableQuotes.filter((_, i) => i !== index));
  };

  const handleQuoteChange = (index: number, value: string) => {
    const newQuotes = [...memorableQuotes];
    newQuotes[index] = value;
    setMemorableQuotes(newQuotes);
  };

  const handleToggleAssumption = (assumptionId: string) => {
    const existing = assumptionTags.find(t => t.assumptionId === assumptionId);
    if (existing) {
      setAssumptionTags(assumptionTags.filter(t => t.assumptionId !== assumptionId));
    } else {
      setAssumptionTags([...assumptionTags, {
        assumptionId,
        validationEffect: 'neutral',
        confidenceChange: 0,
      }]);
    }
  };

  const handleUpdateAssumptionTag = (assumptionId: string, updates: Partial<AssumptionTag>) => {
    setAssumptionTags(assumptionTags.map(tag =>
      tag.assumptionId === assumptionId ? { ...tag, ...updates } : tag
    ));
  };

  const canProceedFromStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return segmentName.trim() !== '' && context.trim() !== '';
      case 2:
        return mainPainPoints.trim() !== '' && currentAlternatives.trim() !== '';
      case 3:
        return true; // Optional step
      case 4:
        return studentReflection.trim() !== '';
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (canProceedFromStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSaveDraft = () => {
    const interviewData: Omit<EnhancedInterview, 'id' | 'created' | 'lastUpdated'> = {
      intervieweeType,
      segmentName,
      date,
      context,
      status: 'draft',
      mainPainPoints,
      problemImportance,
      problemImportanceQuote,
      currentAlternatives,
      memorableQuotes: memorableQuotes.filter(q => q.trim() !== ''),
      surprisingFeedback,
      assumptionTags,
      studentReflection,
      mentorFeedback,
    };
    onSave(interviewData);
  };

  const handleComplete = () => {
    if (!canProceedFromStep(4)) {
      alert('Please complete all required fields before marking as complete.');
      return;
    }

    const interviewData: Omit<EnhancedInterview, 'id' | 'created' | 'lastUpdated'> = {
      intervieweeType,
      segmentName,
      date,
      context,
      status: 'completed',
      mainPainPoints,
      problemImportance,
      problemImportanceQuote,
      currentAlternatives,
      memorableQuotes: memorableQuotes.filter(q => q.trim() !== ''),
      surprisingFeedback,
      assumptionTags,
      studentReflection,
      mentorFeedback,
    };
    onSave(interviewData);
  };

  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            {interview ? 'Edit Interview' : 'New Enhanced Interview'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close form"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    currentStep === step.number
                      ? 'bg-blue-600 text-white'
                      : currentStep > step.number
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {currentStep > step.number ? '✓' : step.icon}
                </div>
                <span className="text-xs mt-2 text-center font-medium">{step.title}</span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-1 flex-1 mx-2 rounded ${
                    currentStep > step.number ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6">
        {/* Step 1: Metadata */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Interview Metadata</h3>

            {/* Interviewee Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interviewee Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {(['customer', 'partner', 'regulator', 'expert', 'other'] as IntervieweeTypeEnhanced[]).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setIntervieweeType(type)}
                    className={`p-3 border-2 rounded-lg transition-all ${
                      intervieweeType === type
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{getTypeIcon(type)}</div>
                    <div className="text-xs font-medium capitalize">{type}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Segment Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Segment <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={segmentName}
                onChange={(e) => setSegmentName(e.target.value)}
                placeholder="e.g., Small Business Owners in Healthcare"
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Interview Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interview Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Context */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Context & Background <span className="text-red-500">*</span>
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Who did you speak with? What's their role? What's their current situation?"
                rows={4}
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Describe who you spoke with and their current situation
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Key Findings */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Key Findings</h3>

            {/* Main Pain Points */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Main Pain Points <span className="text-red-500">*</span>
              </label>
              <textarea
                value={mainPainPoints}
                onChange={(e) => setMainPainPoints(e.target.value)}
                placeholder="What problems are they experiencing? Be specific and use their words when possible."
                rows={4}
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Problem Importance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How Important is This Problem to Them? <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setProblemImportance(level as ConfidenceLevel)}
                    className={`flex-1 p-3 border-2 rounded-lg transition-all ${
                      problemImportance === level
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="text-lg font-bold">{level}</div>
                    <div className="text-xs">
                      {level === 1 ? 'Low' : level === 5 ? 'Critical' : ''}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quote for Importance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quote Supporting Importance (Optional)
              </label>
              <input
                type="text"
                value={problemImportanceQuote}
                onChange={(e) => setProblemImportanceQuote(e.target.value)}
                placeholder="What did they say that shows how important this is?"
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Current Alternatives */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Alternatives / How They Solve It Today <span className="text-red-500">*</span>
              </label>
              <textarea
                value={currentAlternatives}
                onChange={(e) => setCurrentAlternatives(e.target.value)}
                placeholder="What are they doing now to solve this problem? What tools/methods do they use?"
                rows={3}
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Memorable Quotes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Memorable Quotes (Optional)
              </label>
              {memorableQuotes.map((quote, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={quote}
                    onChange={(e) => handleQuoteChange(index, e.target.value)}
                    placeholder="Verbatim quote from the interviewee"
                    className="flex-1 p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                  {memorableQuotes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuote(index)}
                      className="px-3 text-red-600 hover:text-red-700"
                      aria-label="Remove quote"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddQuote}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add Another Quote
              </button>
            </div>

            {/* Surprising Feedback */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Most Surprising Feedback (Optional)
              </label>
              <textarea
                value={surprisingFeedback}
                onChange={(e) => setSurprisingFeedback(e.target.value)}
                placeholder="What did you learn that you didn't expect?"
                rows={3}
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Step 3: Tag Assumptions */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Tag Assumptions</h3>
            <p className="text-sm text-gray-600 mb-4">
              Select assumptions this interview relates to and how it validates them
            </p>

            {assumptions.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No assumptions yet. Add assumptions in the Assumptions tab first.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assumptions.map(assumption => {
                  const tag = assumptionTags.find(t => t.assumptionId === assumption.id);
                  const isSelected = !!tag;

                  return (
                    <div
                      key={assumption.id}
                      className={`border-2 rounded-lg p-4 transition-all ${
                        isSelected ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      {/* Assumption Header */}
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleAssumption(assumption.id)}
                          className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{assumption.description}</p>
                          <p className="text-sm text-gray-500 mt-1">Type: {assumption.type}</p>
                        </div>
                      </div>

                      {/* Validation Details (shown when selected) */}
                      {isSelected && tag && (
                        <div className="mt-4 ml-8 space-y-3">
                          {/* Validation Effect */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Validation Effect
                            </label>
                            <div className="flex gap-2">
                              {(['supports', 'contradicts', 'neutral'] as ValidationEffect[]).map(effect => (
                                <button
                                  key={effect}
                                  type="button"
                                  onClick={() => handleUpdateAssumptionTag(assumption.id, { validationEffect: effect })}
                                  className={`flex-1 p-2 border-2 rounded-lg text-sm font-medium transition-all ${
                                    tag.validationEffect === effect
                                      ? effect === 'supports'
                                        ? 'border-green-600 bg-green-50 text-green-700'
                                        : effect === 'contradicts'
                                        ? 'border-red-600 bg-red-50 text-red-700'
                                        : 'border-gray-600 bg-gray-50 text-gray-700'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  {effect === 'supports' ? '✓ Supports' : effect === 'contradicts' ? '✕ Contradicts' : '○ Neutral'}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Confidence Change */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Confidence Change: {tag.confidenceChange > 0 ? '+' : ''}{tag.confidenceChange}
                            </label>
                            <input
                              type="range"
                              min="-2"
                              max="2"
                              step="1"
                              value={tag.confidenceChange}
                              onChange={(e) => handleUpdateAssumptionTag(assumption.id, { confidenceChange: parseInt(e.target.value) })}
                              className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>Much Less (-2)</span>
                              <span>No Change (0)</span>
                              <span>Much More (+2)</span>
                            </div>
                          </div>

                          {/* Supporting Quote */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Supporting Quote (Optional)
                            </label>
                            <input
                              type="text"
                              value={tag.quote || ''}
                              onChange={(e) => handleUpdateAssumptionTag(assumption.id, { quote: e.target.value })}
                              placeholder="Quote that supports this validation"
                              className="w-full p-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
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
        )}

        {/* Step 4: Reflection */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Reflection</h3>

            {/* Student Reflection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Reflection <span className="text-red-500">*</span>
              </label>
              <textarea
                value={studentReflection}
                onChange={(e) => setStudentReflection(e.target.value)}
                placeholder="What did you learn? What surprised you? What should you do next? How does this change your thinking?"
                rows={6}
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Reflect on what you learned and how it impacts your understanding
              </p>
            </div>

            {/* Mentor Feedback */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mentor Feedback (Optional)
              </label>
              <textarea
                value={mentorFeedback}
                onChange={(e) => setMentorFeedback(e.target.value)}
                placeholder="Space for mentor to provide feedback on this interview and your reflection"
                rows={4}
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Summary */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mt-6">
              <h4 className="font-bold text-blue-900 mb-2">Interview Summary</h4>
              <div className="text-sm space-y-1">
                <p><span className="font-medium">Segment:</span> {segmentName || 'Not specified'}</p>
                <p><span className="font-medium">Date:</span> {date}</p>
                <p><span className="font-medium">Type:</span> {intervieweeType}</p>
                <p><span className="font-medium">Problem Importance:</span> {problemImportance}/5</p>
                <p><span className="font-medium">Assumptions Tagged:</span> {assumptionTags.length}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Actions */}
      <div className="border-t border-gray-200 p-6 bg-gray-50">
        <div className="flex items-center justify-between">
          {/* Left: Back/Cancel */}
          <div>
            {currentStep > 1 ? (
              <button
                onClick={handleBack}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                ← Back
              </button>
            ) : (
              <button
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                Cancel
              </button>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {/* Save as Draft (available on all steps) */}
            <button
              onClick={handleSaveDraft}
              className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 transition-all"
            >
              Save as Draft
            </button>

            {/* Next or Complete */}
            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                disabled={!canProceedFromStep(currentStep)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={!canProceedFromStep(4)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Mark Complete
              </button>
            )}
          </div>
        </div>

        {/* Validation message */}
        {!canProceedFromStep(currentStep) && (
          <p className="text-sm text-red-600 mt-3 text-right">
            Please complete all required fields to continue
          </p>
        )}
      </div>
    </div>
  );
};

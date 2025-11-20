import { useState, useEffect } from 'react';
import { useDiscovery2 } from '../../contexts/Discovery2Context';
import type {
  EnhancedInterview,
  Discovery2Assumption,
  AssumptionTag,
  IntervieweeTypeEnhanced,
  ConfidenceLevel,
  ValidationEffect,
} from '../../types/discovery';

interface InterviewFormProps {
  assumptions: Discovery2Assumption[];
  editingInterview: EnhancedInterview | null;
  onClose: () => void;
}

const BIG_THREE_GUIDANCE = {
  title: "The Big 3 + Why Framework",
  description: "Focus your interview on these three critical questions, always asking 'Why?' to dig deeper:",
  questions: [
    {
      number: 1,
      question: "What's the biggest problem/challenge you face with [topic]?",
      why: "Then ask: Why is this a problem? What have you tried? What's the impact?"
    },
    {
      number: 2,
      question: "How do you currently solve this?",
      why: "Then ask: Why did you choose this approach? What's frustrating about it? What does it cost you?"
    },
    {
      number: 3,
      question: "If you could wave a magic wand, what would be different?",
      why: "Then ask: Why would that be valuable? What would change for you? What would you pay for that?"
    }
  ]
};

export function InterviewForm({ assumptions, editingInterview, onClose }: InterviewFormProps) {
  const { addInterview, updateInterview, updateAssumption } = useDiscovery2();

  // Form state
  const [intervieweeType, setIntervieweeType] = useState<IntervieweeTypeEnhanced>('customer');
  const [segmentName, setSegmentName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [context, setContext] = useState('');
  const [mainPainPoints, setMainPainPoints] = useState('');
  const [problemImportance, setProblemImportance] = useState<ConfidenceLevel>(3);
  const [problemImportanceQuote, setProblemImportanceQuote] = useState('');
  const [currentAlternatives, setCurrentAlternatives] = useState('');
  const [memorableQuotes, setMemorableQuotes] = useState<string[]>(['']);
  const [surprisingFeedback, setSurprisingFeedback] = useState('');
  const [assumptionTags, setAssumptionTags] = useState<AssumptionTag[]>([]);
  const [studentReflection, setStudentReflection] = useState('');
  const [status, setStatus] = useState<'draft' | 'completed'>('draft');

  // Load editing interview data
  useEffect(() => {
    if (editingInterview) {
      setIntervieweeType(editingInterview.intervieweeType);
      setSegmentName(editingInterview.segmentName);
      setDate(editingInterview.date.split('T')[0]);
      setContext(editingInterview.context);
      setMainPainPoints(editingInterview.mainPainPoints);
      setProblemImportance(editingInterview.problemImportance);
      setProblemImportanceQuote(editingInterview.problemImportanceQuote || '');
      setCurrentAlternatives(editingInterview.currentAlternatives);
      setMemorableQuotes(editingInterview.memorableQuotes.length > 0 ? editingInterview.memorableQuotes : ['']);
      setSurprisingFeedback(editingInterview.surprisingFeedback);
      setAssumptionTags(editingInterview.assumptionTags);
      setStudentReflection(editingInterview.studentReflection);
      setStatus(editingInterview.status);
    }
  }, [editingInterview]);

  const handleAddQuote = () => {
    setMemorableQuotes([...memorableQuotes, '']);
  };

  const handleRemoveQuote = (index: number) => {
    setMemorableQuotes(memorableQuotes.filter((_, i) => i !== index));
  };

  const handleQuoteChange = (index: number, value: string) => {
    const updated = [...memorableQuotes];
    updated[index] = value;
    setMemorableQuotes(updated);
  };

  const handleAddAssumptionTag = () => {
    if (assumptions.length === 0) {
      alert('Create assumptions first before linking them to interviews');
      return;
    }
    setAssumptionTags([
      ...assumptionTags,
      {
        assumptionId: assumptions[0].id,
        validationEffect: 'neutral',
        confidenceChange: 0,
        quote: '',
      },
    ]);
  };

  const handleRemoveAssumptionTag = (index: number) => {
    setAssumptionTags(assumptionTags.filter((_, i) => i !== index));
  };

  const handleAssumptionTagChange = (
    index: number,
    field: keyof AssumptionTag,
    value: string | number
  ) => {
    const updated = [...assumptionTags];
    updated[index] = { ...updated[index], [field]: value };
    setAssumptionTags(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const filteredQuotes = memorableQuotes.filter((q) => q.trim() !== '');

    const interviewData: EnhancedInterview = {
      id: editingInterview?.id || crypto.randomUUID(),
      intervieweeType,
      segmentName: segmentName.trim(),
      date,
      context: context.trim(),
      status,
      mainPainPoints: mainPainPoints.trim(),
      problemImportance,
      problemImportanceQuote: problemImportanceQuote.trim() || undefined,
      currentAlternatives: currentAlternatives.trim(),
      memorableQuotes: filteredQuotes,
      surprisingFeedback: surprisingFeedback.trim(),
      assumptionTags,
      studentReflection: studentReflection.trim(),
      created: editingInterview?.created || new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };

    if (editingInterview) {
      updateInterview(editingInterview.id, interviewData);
    } else {
      addInterview(interviewData);
    }

    // Update assumption interview counts and confidence
    assumptionTags.forEach((tag) => {
      const assumption = assumptions.find((a) => a.id === tag.assumptionId);
      if (assumption) {
        const newConfidence = Math.max(
          1,
          Math.min(5, assumption.confidence + tag.confidenceChange)
        ) as ConfidenceLevel;

        updateAssumption(tag.assumptionId, {
          confidence: newConfidence,
          interviewCount: (assumption.interviewCount || 0) + 1,
          lastTestedDate: date,
          evidence: [
            ...assumption.evidence,
            `Interview ${date}: ${tag.validationEffect} (${tag.quote || 'No quote'})`,
          ],
        });
      }
    });

    onClose();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border-2 border-blue-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">
          {editingInterview ? 'Edit Interview' : 'New Interview'}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
          title="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Big 3 + Why Guidance */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-bold text-blue-900 mb-2">{BIG_THREE_GUIDANCE.title}</h4>
        <p className="text-xs text-blue-800 mb-3">{BIG_THREE_GUIDANCE.description}</p>
        <div className="space-y-3">
          {BIG_THREE_GUIDANCE.questions.map((item) => (
            <div key={item.number} className="bg-white p-3 rounded border border-blue-100">
              <p className="text-sm font-medium text-gray-900 mb-1">
                {item.number}. {item.question}
              </p>
              <p className="text-xs text-gray-600 italic">
                <strong>Follow-up:</strong> {item.why}
              </p>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Interviewee Type *
            </label>
            <select
              value={intervieweeType}
              onChange={(e) => setIntervieweeType(e.target.value as IntervieweeTypeEnhanced)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="customer">Customer</option>
              <option value="partner">Partner</option>
              <option value="regulator">Regulator</option>
              <option value="expert">Expert</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Segment Name *
            </label>
            <input
              type="text"
              value={segmentName}
              onChange={(e) => setSegmentName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Small Business Owner"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        {/* Context */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Context / Setting
          </label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Where did this interview take place? Any important context?"
          />
        </div>

        {/* Main Pain Points (Big 3 #1) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Main Pain Points * (Big 3 #1)
          </label>
          <textarea
            value={mainPainPoints}
            onChange={(e) => setMainPainPoints(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="What's the biggest problem/challenge they face?"
            required
          />
        </div>

        {/* Current Alternatives (Big 3 #2) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current Alternatives * (Big 3 #2)
          </label>
          <textarea
            value={currentAlternatives}
            onChange={(e) => setCurrentAlternatives(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="How do they currently solve this?"
            required
          />
        </div>

        {/* Problem Importance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Problem Importance (1-5) *
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setProblemImportance(level as ConfidenceLevel)}
                  className={`flex-1 py-2 rounded-md text-sm font-medium border-2 ${
                    problemImportance === level
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Not Important</span>
              <span>Very Important</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supporting Quote
            </label>
            <input
              type="text"
              value={problemImportanceQuote}
              onChange={(e) => setProblemImportanceQuote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="A quote that captures their sentiment"
            />
          </div>
        </div>

        {/* Memorable Quotes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Memorable Quotes
            </label>
            <button
              type="button"
              onClick={handleAddQuote}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              + Add Quote
            </button>
          </div>
          <div className="space-y-2">
            {memorableQuotes.map((quote, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={quote}
                  onChange={(e) => handleQuoteChange(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="What did they say that was memorable?"
                />
                {memorableQuotes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveQuote(index)}
                    className="px-3 py-2 text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Surprising Feedback (Big 3 #3) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Surprising Feedback (Big 3 #3)
          </label>
          <textarea
            value={surprisingFeedback}
            onChange={(e) => setSurprisingFeedback(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="What surprised you? What did you learn that you didn't expect?"
          />
        </div>

        {/* Assumption Tags */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Link to Assumptions
            </label>
            <button
              type="button"
              onClick={handleAddAssumptionTag}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              + Link Assumption
            </button>
          </div>
          <div className="space-y-3">
            {assumptionTags.map((tag, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Assumption
                    </label>
                    <select
                      value={tag.assumptionId}
                      onChange={(e) => handleAssumptionTagChange(index, 'assumptionId', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                    >
                      {assumptions.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.description.substring(0, 50)}...
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Validation Effect
                    </label>
                    <select
                      value={tag.validationEffect}
                      onChange={(e) =>
                        handleAssumptionTagChange(index, 'validationEffect', e.target.value)
                      }
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                    >
                      <option value="supports">Supports</option>
                      <option value="contradicts">Contradicts</option>
                      <option value="neutral">Neutral</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Confidence Change (-2 to +2)
                    </label>
                    <select
                      value={tag.confidenceChange}
                      onChange={(e) =>
                        handleAssumptionTagChange(index, 'confidenceChange', parseInt(e.target.value))
                      }
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                    >
                      <option value="-2">-2 (Much Less Confident)</option>
                      <option value="-1">-1 (Less Confident)</option>
                      <option value="0">0 (No Change)</option>
                      <option value="1">+1 (More Confident)</option>
                      <option value="2">+2 (Much More Confident)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Supporting Quote
                    </label>
                    <input
                      type="text"
                      value={tag.quote || ''}
                      onChange={(e) => handleAssumptionTagChange(index, 'quote', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                      placeholder="Quote supporting this"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveAssumptionTag(index)}
                  className="mt-2 text-xs text-red-600 hover:text-red-700"
                >
                  Remove Link
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Student Reflection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your Reflection *
          </label>
          <textarea
            value={studentReflection}
            onChange={(e) => setStudentReflection(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="What did you learn? How will this change your approach?"
            required
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'draft' | 'completed')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="draft">Draft</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {editingInterview ? 'Update Interview' : 'Save Interview'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

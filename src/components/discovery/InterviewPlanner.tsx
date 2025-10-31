import { useState, useEffect } from 'react';
import { useDiscoveryStore } from '../../store/useDiscoveryStore';
import { InterviewFormat, IntervieweeType } from '../../types/discovery';

interface InterviewFormData {
  date: string;
  customerSegment: string;
  interviewee: string;
  intervieweeType: IntervieweeType | '';
  format: InterviewFormat;
  duration: string;
  notes: string;
  selectedAssumptions: string[];
  keyInsights: string[];
  surprises: string;
  nextAction: string;
  followUpNeeded: boolean;
}

export const InterviewPlanner = () => {
  const { assumptions, addInterview, setCurrentView } = useDiscoveryStore();
  const [formData, setFormData] = useState<InterviewFormData>({
    date: new Date().toISOString().split('T')[0],
    customerSegment: '',
    interviewee: '',
    intervieweeType: '',
    format: 'video',
    duration: '',
    notes: '',
    selectedAssumptions: [],
    keyInsights: [''],
    surprises: '',
    nextAction: '',
    followUpNeeded: false,
  });
  const [guidance, setGuidance] = useState<any>(null);
  const [questions, setQuestions] = useState<any>(null);

  // Load interview guidance and templates
  useEffect(() => {
    fetch('/assumptions.json')
      .then((res) => res.json())
      .then((data) => {
        setGuidance(data.ycGuidance);
        setQuestions(data.interviewQuestions);
      })
      .catch((err) => console.error('Failed to load guidance:', err));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    addInterview({
      date: new Date(formData.date).toISOString(),
      customerSegment: formData.customerSegment,
      interviewee: formData.interviewee || undefined,
      intervieweeType: formData.intervieweeType || undefined,
      format: formData.format,
      duration: formData.duration ? Number(formData.duration) : undefined,
      notes: formData.notes,
      assumptionsAddressed: formData.selectedAssumptions,
      keyInsights: formData.keyInsights.filter((insight) => insight.trim() !== ''),
      surprises: formData.surprises || undefined,
      nextAction: formData.nextAction || undefined,
      followUpNeeded: formData.followUpNeeded,
    });

    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      customerSegment: '',
      interviewee: '',
      intervieweeType: '',
      format: 'video',
      duration: '',
      notes: '',
      selectedAssumptions: [],
      keyInsights: [''],
      surprises: '',
      nextAction: '',
      followUpNeeded: false,
    });

    // Navigate to Interview Log
    setCurrentView('log');
  };

  const handleAssumptionToggle = (assumptionId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedAssumptions: prev.selectedAssumptions.includes(assumptionId)
        ? prev.selectedAssumptions.filter((id) => id !== assumptionId)
        : [...prev.selectedAssumptions, assumptionId],
    }));
  };

  const addInsightField = () => {
    setFormData((prev) => ({
      ...prev,
      keyInsights: [...prev.keyInsights, ''],
    }));
  };

  const updateInsight = (index: number, value: string) => {
    const newInsights = [...formData.keyInsights];
    newInsights[index] = value;
    setFormData((prev) => ({ ...prev, keyInsights: newInsights }));
  };

  const removeInsight = (index: number) => {
    if (formData.keyInsights.length > 1) {
      setFormData((prev) => ({
        ...prev,
        keyInsights: prev.keyInsights.filter((_, i) => i !== index),
      }));
    }
  };

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Interview Planner</h2>
      <p className="text-gray-600 mb-6">
        Plan and record your customer interviews using Y Combinator's best practices
      </p>

      {/* YC Guidance Cards */}
      {guidance && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-bold text-green-800 mb-2 flex items-center gap-2">
              <span>✓</span> Do
            </h3>
            <ul className="text-sm text-green-700 space-y-1">
              {guidance.dos.map((item: string, index: number) => (
                <li key={index}>• {item}</li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-bold text-red-800 mb-2 flex items-center gap-2">
              <span>✗</span> Don't
            </h3>
            <ul className="text-sm text-red-700 space-y-1">
              {guidance.donts.map((item: string, index: number) => (
                <li key={index}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Question Templates */}
      {questions && (
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-bold text-blue-800 mb-3">💡 Example Questions</h3>
          <div className="space-y-3">
            {Object.entries(questions).map(([key, category]: [string, any]) => (
              <div key={key}>
                <p className="text-sm font-medium text-blue-700 mb-1">{category.category}:</p>
                <ul className="text-sm text-blue-600 space-y-1 ml-4">
                  {category.questions.map((q: string, index: number) => (
                    <li key={index}>• {q}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interview Form */}
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 border-2 border-gray-200 rounded-lg">
        <h3 className="text-lg font-bold text-gray-800">Record Interview</h3>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
            <select
              value={formData.format}
              onChange={(e) => setFormData({ ...formData, format: e.target.value as InterviewFormat })}
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="video">Video</option>
              <option value="phone">Phone</option>
              <option value="in-person">In-Person</option>
              <option value="survey">Survey</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Customer Segment</label>
            <input
              type="text"
              value={formData.customerSegment}
              onChange={(e) => setFormData({ ...formData, customerSegment: e.target.value })}
              placeholder="e.g., Small bakery owners"
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interviewee Type
            </label>
            <select
              value={formData.intervieweeType}
              onChange={(e) => setFormData({ ...formData, intervieweeType: e.target.value as IntervieweeType })}
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select type...</option>
              <option value="potential-buyer">Potential Buyer</option>
              <option value="competitor">Competitor</option>
              <option value="substitute">Substitute</option>
              <option value="knowledgeable">Someone Knowledgeable in the Field</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Interviewee Name (optional)
          </label>
          <input
            type="text"
            value={formData.interviewee}
            onChange={(e) => setFormData({ ...formData, interviewee: e.target.value })}
            placeholder="Keep anonymous if preferred"
            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duration (minutes, optional)
          </label>
          <input
            type="number"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            placeholder="30"
            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
            min="1"
          />
        </div>

        {/* Assumptions Being Tested */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Which assumptions are you testing?
          </label>
          {assumptions.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No assumptions yet. Add some in the Assumptions tab first.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto p-3 border-2 border-gray-200 rounded-lg">
              {assumptions.map((assumption) => (
                <label key={assumption.id} className="flex items-start gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={formData.selectedAssumptions.includes(assumption.id)}
                    onChange={() => handleAssumptionToggle(assumption.id)}
                    className="mt-1"
                  />
                  <span className="text-sm text-gray-700">{assumption.description}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Interview Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Interview Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="What did you learn? What did they say?"
            className="w-full h-32 p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
            required
          />
        </div>

        {/* Key Insights */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Key Insights
          </label>
          {formData.keyInsights.map((insight, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={insight}
                onChange={(e) => updateInsight(index, e.target.value)}
                placeholder="What surprised you?"
                className="flex-1 p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
              {formData.keyInsights.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeInsight(index)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  aria-label="Remove insight"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addInsightField}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            + Add another insight
          </button>
        </div>

        {/* Surprises & Next Action */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What surprised you?
            </label>
            <textarea
              value={formData.surprises}
              onChange={(e) => setFormData({ ...formData, surprises: e.target.value })}
              placeholder="Unexpected learnings..."
              className="w-full h-24 p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Next action
            </label>
            <textarea
              value={formData.nextAction}
              onChange={(e) => setFormData({ ...formData, nextAction: e.target.value })}
              placeholder="What will you do differently?"
              className="w-full h-24 p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Follow-up */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.followUpNeeded}
              onChange={(e) => setFormData({ ...formData, followUpNeeded: e.target.checked })}
              className="w-5 h-5"
            />
            <span className="text-sm font-medium text-gray-700">Follow-up needed</span>
          </label>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
          >
            Save Interview
          </button>
          <button
            type="button"
            onClick={() => setCurrentView('log')}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
          >
            View All Interviews
          </button>
        </div>
      </form>
    </div>
  );
};

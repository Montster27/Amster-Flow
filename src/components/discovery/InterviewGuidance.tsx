import { useState, useEffect } from 'react';

interface GuidanceData {
  dos: string[];
  donts: string[];
  reminders: string[];
}

interface QuestionCategory {
  category: string;
  questions: string[];
}

interface GuidanceResponse {
  ycGuidance: GuidanceData;
  interviewQuestions: {
    discovery: QuestionCategory;
    behavior: QuestionCategory;
    validation: QuestionCategory;
  };
}

export const InterviewGuidance = () => {
  const [guidance, setGuidance] = useState<GuidanceData | null>(null);
  const [questions, setQuestions] = useState<Record<string, QuestionCategory> | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    fetch('/assumptions.json')
      .then((res) => res.json())
      .then((data: GuidanceResponse) => {
        setGuidance(data.ycGuidance);
        setQuestions(data.interviewQuestions);
      })
      .catch((err) => console.error('Failed to load guidance:', err));
  }, []);

  if (!guidance || !questions) {
    return null;
  }

  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full p-4 bg-gradient-to-r from-blue-50 to-purple-50 flex items-center justify-between hover:from-blue-100 hover:to-purple-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">💡</span>
          <div className="text-left">
            <h3 className="font-bold text-gray-800">Y Combinator Interview Guidance</h3>
            <p className="text-sm text-gray-600">Best practices for customer discovery</p>
          </div>
        </div>
        <svg
          className={`w-6 h-6 text-gray-600 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <div className="p-6 space-y-6">
          {/* Do's and Don'ts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                <span>✓</span> Do
              </h4>
              <ul className="text-sm text-green-700 space-y-2">
                {guidance.dos.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                <span>✗</span> Don't
              </h4>
              <ul className="text-sm text-red-700 space-y-2">
                {guidance.donts.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Key Reminders */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-bold text-yellow-800 mb-3 flex items-center gap-2">
              <span>⚡</span> Key Reminders
            </h4>
            <ul className="text-sm text-yellow-700 space-y-2">
              {guidance.reminders.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-yellow-600 mt-0.5">•</span>
                  <span className="italic">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Sample Questions */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>❓</span> Sample Interview Questions
            </h4>
            <div className="space-y-4">
              {Object.values(questions).map((category, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-700 mb-2">{category.category}</h5>
                  <ul className="text-sm text-gray-600 space-y-1.5">
                    {category.questions.map((question, qIdx) => (
                      <li key={qIdx} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">→</span>
                        <span>{question}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Footer tip */}
          <div className="text-xs text-gray-500 text-center pt-4 border-t border-gray-200">
            💡 Tip: Review this guidance before each interview. The goal is to learn, not to sell.
          </div>
        </div>
      )}
    </div>
  );
};

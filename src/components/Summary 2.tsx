import { useGuideStore } from '../store/useGuideStore';
import { useDiscoveryStore } from '../store/useDiscoveryStore';
import { getModuleName } from '../utils/helpers';
import { QuestionsData } from '../App';

interface SummaryProps {
  questionsData: QuestionsData;
  modules: string[];
  onStartOver: () => void;
  onContinue: () => void;
}

export const Summary = ({ questionsData, modules, onStartOver, onContinue }: SummaryProps) => {
  const { progress } = useGuideStore();
  const { assumptions, interviews, iterations } = useDiscoveryStore();

  const handleExport = () => {
    const exportData = {
      modules: modules
        .filter((module) => questionsData[module]?.type !== 'discovery')
        .map((module) => ({
          name: getModuleName(module),
          key: module,
          title: questionsData[module]?.title,
          answers: progress[module]?.answers.map((answer) => ({
            question: questionsData[module]?.questions?.[answer.questionIndex],
            answer: answer.answer,
          })) || [],
        })),
      discovery: {
        assumptions: assumptions.map((a) => ({
          type: a.type,
          description: a.description,
          status: a.status,
          confidence: a.confidence,
          evidence: a.evidence,
        })),
        interviews: interviews.map((i) => ({
          date: i.date,
          customerSegment: i.customerSegment,
          format: i.format,
          notes: i.notes,
          keyInsights: i.keyInsights,
        })),
        iterations: iterations.map((it) => ({
          version: it.version,
          date: it.date,
          changes: it.changes,
          reasoning: it.reasoning,
        })),
      },
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `amster-flow-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportText = () => {
    let textContent = 'AMSTER FLOW SUMMARY\n';
    textContent += '='.repeat(50) + '\n\n';
    textContent += `Generated: ${new Date().toLocaleString()}\n\n`;

    // Export regular modules
    modules
      .filter((module) => questionsData[module]?.type !== 'discovery')
      .forEach((module) => {
        const moduleProgress = progress[module];
        if (moduleProgress && moduleProgress.answers.length > 0) {
          textContent += `${getModuleName(module).toUpperCase()}\n`;
          textContent += '-'.repeat(50) + '\n';
          moduleProgress.answers
            .sort((a, b) => a.questionIndex - b.questionIndex)
            .forEach((answer) => {
              textContent += `\nQ: ${questionsData[module].questions?.[answer.questionIndex]}\n`;
              textContent += `A: ${answer.answer}\n`;
            });
          textContent += '\n';
        }
      });

    // Export Discovery data
    if (assumptions.length > 0 || interviews.length > 0) {
      textContent += 'CUSTOMER DISCOVERY\n';
      textContent += '='.repeat(50) + '\n\n';

      if (assumptions.length > 0) {
        textContent += 'ASSUMPTIONS\n';
        textContent += '-'.repeat(50) + '\n';
        assumptions.forEach((assumption, index) => {
          textContent += `\n${index + 1}. [${assumption.type.toUpperCase()}] ${assumption.description}\n`;
          textContent += `   Status: ${assumption.status} | Confidence: ${assumption.confidence}/5\n`;
          if (assumption.evidence.length > 0) {
            textContent += `   Evidence: ${assumption.evidence.join('; ')}\n`;
          }
        });
        textContent += '\n';
      }

      if (interviews.length > 0) {
        textContent += 'INTERVIEWS\n';
        textContent += '-'.repeat(50) + '\n';
        interviews.forEach((interview, index) => {
          textContent += `\n${index + 1}. ${interview.customerSegment} - ${new Date(interview.date).toLocaleDateString()}\n`;
          textContent += `   Format: ${interview.format}\n`;
          textContent += `   Key Insights: ${interview.keyInsights.join('; ')}\n`;
        });
        textContent += '\n';
      }

      if (iterations.length > 0) {
        textContent += 'ITERATIONS\n';
        textContent += '-'.repeat(50) + '\n';
        iterations
          .sort((a, b) => b.version - a.version)
          .forEach((iteration) => {
            textContent += `\nVersion ${iteration.version} - ${new Date(iteration.date).toLocaleDateString()}\n`;
            textContent += `   Changes: ${iteration.changes}\n`;
            textContent += `   Reasoning: ${iteration.reasoning}\n`;
          });
        textContent += '\n';
      }
    }

    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `amster-flow-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Your Amster Flow Summary</h1>
        <p className="text-gray-600">
          Great work! Here's everything you've captured so far. You can review or export your canvas.
        </p>
      </div>

      {/* Export Buttons */}
      <div className="mb-8 flex gap-3">
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-2"
          aria-label="Export canvas as JSON file"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export JSON
        </button>
        <button
          onClick={handleExportText}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
          aria-label="Export canvas as text file"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export Text
        </button>
      </div>

      <div className="space-y-6 mb-8">
        {modules.map((module) => {
          const moduleData = questionsData[module];
          const moduleProgress = progress[module];

          if (!moduleProgress || moduleProgress.answers.length === 0) return null;

          return (
            <section key={module} className="bg-white border-2 border-gray-200 rounded-lg p-6" aria-labelledby={`module-${module}`}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center" role="status" aria-label="Module completed">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h2 id={`module-${module}`} className="text-xl font-bold text-gray-800">{getModuleName(module)}</h2>
              </div>

              <div className="space-y-4">
                {moduleProgress.answers
                  .sort((a, b) => a.questionIndex - b.questionIndex)
                  .map((answer) => (
                    <div key={answer.questionIndex} className="border-l-4 border-blue-500 pl-4">
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        {moduleData.questions?.[answer.questionIndex]}
                      </p>
                      <p className="text-gray-800">{answer.answer}</p>
                    </div>
                  ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="flex gap-4">
        <button
          onClick={onStartOver}
          className="px-6 py-3 rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all"
          aria-label="Start over and clear all progress"
        >
          Start Over
        </button>
        <button
          onClick={onContinue}
          className="px-6 py-3 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all"
          aria-label="Continue to additional modules"
        >
          Continue to Next Modules
        </button>
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600">
          💡 <strong>Next Steps:</strong> Modules 4-8 (Unique Value Proposition, Unfair Advantage,
          Channels, Revenue Streams, and Cost Structure) are coming soon!
        </p>
      </div>
    </div>
  );
};

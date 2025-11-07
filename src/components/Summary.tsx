import { useGuide } from '../contexts/GuideContext';
import { useDiscovery } from '../contexts/DiscoveryContext';
import { useSectorMap } from '../contexts/SectorMapContext';
import { getModuleName } from '../utils/helpers';
import { QuestionsData } from '../App';

interface SummaryProps {
  questionsData: QuestionsData;
  modules: string[];
}

export const Summary = ({ questionsData, modules }: SummaryProps) => {
  const { progress } = useGuide();
  const { assumptions, interviews, iterations } = useDiscovery();
  const {
    customerType,
    firstTarget,
    competitors,
    decisionMakers,
  } = useSectorMap();
  const handleExport = () => {
    const exportData = {
      modules: modules
        .filter((module) => questionsData[module]?.type !== 'discovery' && questionsData[module]?.type !== 'sectorMap')
        .map((module) => ({
          name: getModuleName(module),
          key: module,
          title: questionsData[module]?.title,
          answers: progress[module]?.answers.map((answer) => ({
            questionIndex: answer.questionIndex,
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
      sectorMap: {
        customerType,
        firstTarget,
        competitors,
        decisionMakers,
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

  const handleExportPDF = async () => {
    // Dynamically import jsPDF only when needed
    const { default: jsPDF } = await import('jspdf');

    const doc = new jsPDF();
    let yPosition = 20;
    const lineHeight = 7;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;

    // Helper function to add text with page breaks
    const addText = (text: string, fontSize = 10, isBold = false) => {
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.setFontSize(fontSize);
      if (isBold) {
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
      }
      const lines = doc.splitTextToSize(text, 170);
      lines.forEach((line: string) => {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
      });
    };

    // Title
    addText('AMSTER FLOW SUMMARY', 16, true);
    yPosition += 5;
    addText(`Generated: ${new Date().toLocaleString()}`, 10);
    yPosition += 10;

    // Export regular modules
    modules
      .filter((module) => questionsData[module]?.type !== 'discovery')
      .forEach((module) => {
        const moduleProgress = progress[module];
        if (moduleProgress && moduleProgress.answers.length > 0) {
          addText(getModuleName(module).toUpperCase(), 14, true);
          yPosition += 3;
          moduleProgress.answers
            .sort((a, b) => a.questionIndex - b.questionIndex)
            .forEach((answer) => {
              addText(`Q: ${questionsData[module].questions?.[answer.questionIndex]}`, 10, true);
              addText(`A: ${answer.answer}`, 10);
              yPosition += 3;
            });
          yPosition += 5;
        }
      });

    // Export Discovery data
    if (assumptions.length > 0 || interviews.length > 0) {
      addText('CUSTOMER DISCOVERY', 14, true);
      yPosition += 5;

      if (assumptions.length > 0) {
        addText('ASSUMPTIONS', 12, true);
        assumptions.forEach((assumption, index) => {
          addText(`${index + 1}. [${assumption.type.toUpperCase()}] ${assumption.description}`, 10);
          addText(`Status: ${assumption.status} | Confidence: ${assumption.confidence}/5`, 9);
          if (assumption.evidence.length > 0) {
            addText(`Evidence: ${assumption.evidence.join('; ')}`, 9);
          }
          yPosition += 2;
        });
        yPosition += 5;
      }

      if (interviews.length > 0) {
        addText('INTERVIEWS', 12, true);
        interviews.forEach((interview, index) => {
          addText(`${index + 1}. ${interview.customerSegment} - ${new Date(interview.date).toLocaleDateString()}`, 10, true);
          addText(`Format: ${interview.format}`, 9);
          addText(`Key Insights: ${interview.keyInsights.join('; ')}`, 9);
          yPosition += 2;
        });
      }
    }

    doc.save(`amster-flow-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="flex-1 p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Your Amster Flow Summary</h1>
        <p className="text-gray-600">
          Great work! Here's everything you've captured so far. You can review or export your canvas.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="mb-8 flex flex-wrap gap-3">
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-2 font-medium"
          aria-label="Export canvas as JSON file"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          Export JSON
        </button>

        <button
          onClick={handleExportPDF}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all flex items-center gap-2 font-medium"
          aria-label="Export canvas as PDF file"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Export PDF
        </button>

        <button
          onClick={handleExportText}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 font-medium"
          aria-label="Export canvas as text file"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export Text
        </button>
      </div>

      {/* Discovery Dashboard Stats */}
      {(assumptions.length > 0 || interviews.length > 0) && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Customer Discovery Dashboard</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
              <div className="text-2xl font-bold text-gray-800">{assumptions.length}</div>
              <div className="text-sm text-gray-600">Total Assumptions</div>
            </div>

            <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
              <div className="text-2xl font-bold text-green-800">
                {assumptions.filter((a) => a.status === 'validated').length}
              </div>
              <div className="text-sm text-green-700">Validated</div>
            </div>

            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
              <div className="text-2xl font-bold text-red-800">
                {assumptions.filter((a) => a.status === 'invalidated').length}
              </div>
              <div className="text-sm text-red-700">Invalidated</div>
            </div>

            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <div className="text-2xl font-bold text-blue-800">{interviews.length}</div>
              <div className="text-sm text-blue-700">Interviews</div>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
};

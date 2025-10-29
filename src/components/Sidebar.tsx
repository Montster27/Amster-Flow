import { useGuideStore } from '../store/useGuideStore';
import { getModuleName } from '../utils/helpers';

interface SidebarProps {
  modules: string[];
  onModuleClick: (module: string) => void;
  onViewSummary?: () => void;
}

export const Sidebar = ({ modules, onModuleClick, onViewSummary }: SidebarProps) => {
  const { currentModule, progress } = useGuideStore();

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col h-screen">
      <div className="flex-1">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Amster Flow</h2>
        <nav className="space-y-2" aria-label="Module navigation">
          {modules.map((module) => {
            const isActive = currentModule === module;
            const isCompleted = progress[module]?.completed || false;

            return (
              <button
                key={module}
                onClick={() => onModuleClick(module)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3 ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`${getModuleName(module)} module${isCompleted ? ', completed' : ''}`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isCompleted
                      ? 'bg-green-500 border-green-500'
                      : isActive
                      ? 'border-blue-500'
                      : 'border-gray-300'
                  }`}
                  role="status"
                  aria-label={isCompleted ? 'Completed' : 'Not completed'}
                >
                  {isCompleted && (
                    <svg
                      className="w-3 h-3 text-white"
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
                  )}
                </div>
                <span>{getModuleName(module)}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* View Summary Button */}
      {onViewSummary && (
        <div className="pt-4 border-t border-gray-200 mt-4">
          <button
            onClick={onViewSummary}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 font-medium"
            aria-label="View summary and file controls"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View Summary
          </button>
        </div>
      )}
    </div>
  );
};

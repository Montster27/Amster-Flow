import { useGuideStore } from '../store/useGuideStore';
import { getModuleName } from '../utils/helpers';

interface SidebarProps {
  modules: string[];
  onModuleClick: (module: string) => void;
}

export const Sidebar = ({ modules, onModuleClick }: SidebarProps) => {
  const { currentModule, progress } = useGuideStore();

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-6">
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
  );
};

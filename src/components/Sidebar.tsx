import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_CONFIG } from '../config/constants';
import { useGuide } from '../contexts/GuideContext';
import { useDiscovery } from '../contexts/DiscoveryContext';
import { useEnhancedInterviews } from '../hooks/useEnhancedInterviews';

interface SidebarProps {
  modules: string[];
  onModuleClick: (module: string) => void;
  onViewSummary?: () => void;
  projectId?: string;
}

export function Sidebar({ modules, onModuleClick, onViewSummary, projectId }: SidebarProps) {
  const navigate = useNavigate();
  const { currentModule, progress } = useGuide();
  const { interviews } = useDiscovery();
  const { interviews: enhancedInterviews } = useEnhancedInterviews(projectId);
  const [showAbout, setShowAbout] = useState(false);

  // Check if pivot module should be enabled (requires 3+ interviews)
  // Count BOTH old basic interviews AND new enhanced interviews
  const totalInterviews = interviews.length + enhancedInterviews.length;
  const hasMinimumInterviews = totalInterviews >= APP_CONFIG.THRESHOLDS.MIN_INTERVIEWS_FOR_PIVOT;

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-blue-600">Pivot Kit</h1>
        <p className="text-sm text-gray-500 mt-1">Startup Validation Guide</p>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto">
        {/* Step 0: First Look - Top level entry */}
        {projectId && (
          <button
            onClick={() => navigate(`/project/${projectId}/discovery/step-0`)}
            className="w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-between"
          >
            <span className="font-medium">Step 0: First Look</span>
          </button>
        )}

        {modules.map((module) => {
          const isCompleted = progress[module]?.completed;
          const isActive = currentModule === module;

          // Special handling for Pivot module
          if (module === 'pivot') {
            return (
              <button
                key={module}
                onClick={() => hasMinimumInterviews && onModuleClick(module)}
                disabled={!hasMinimumInterviews}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center justify-between group ${isActive
                  ? 'bg-blue-50 text-blue-700'
                  : hasMinimumInterviews
                    ? 'text-gray-600 hover:bg-gray-50'
                    : 'text-gray-400 cursor-not-allowed opacity-60'
                  }`}
              >
                <span className="font-medium">Pivot or Proceed</span>
                {!hasMinimumInterviews && (
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500 group-hover:block hidden absolute left-64 w-48 shadow-lg border border-gray-200 z-50">
                    Complete {APP_CONFIG.THRESHOLDS.MIN_INTERVIEWS_FOR_PIVOT} interviews to unlock
                  </span>
                )}
              </button>
            );
          }

          return (
            <>
              <button
                key={module}
                onClick={() => onModuleClick(module)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center justify-between ${isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="font-medium capitalize">
                  {module === 'discovery' ? 'Old Discovery' : module.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                {isCompleted && (
                  <span className="text-green-500" aria-label="Completed">
                    ✓
                  </span>
                )}
              </button>

              {/* New Discovery Link - appears after "discovery" module */}
              {module === 'discovery' && projectId && (
                <button
                  onClick={() => navigate(`/project/${projectId}/discovery`)}
                  className="w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-between group"
                >
                  <span className="font-medium">New Discovery</span>
                </button>
              )}
            </>
          );
        })}

        {onViewSummary && (
          <button
            onClick={onViewSummary}
            className="w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors mt-4 border-t border-gray-100"
          >
            <span className="font-medium">View Summary</span>
          </button>
        )}
      </nav>

      <div className="pt-4 border-t border-gray-200 space-y-2">
        <button
          onClick={() => setShowAbout(true)}
          className="flex items-center text-gray-500 hover:text-gray-700 transition-colors text-sm"
        >
          <span className="mr-2">ℹ️</span>
          About / Help
        </button>
      </div>

      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowAbout(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-4">About Pivot Kit</h2>
            <p className="text-gray-600 mb-4">
              Pivot Kit is a structured guide designed to help entrepreneurs validate their startup ideas through rigorous customer discovery and problem validation.
            </p>

            <h3 className="font-semibold mb-2">Need Help?</h3>
            <p className="text-gray-600 mb-4">
              If you're stuck or need guidance, please contact:
              <br />
              <a href={`mailto:${APP_CONFIG.SUPPORT_EMAIL}`} className="text-blue-600 hover:underline">
                {APP_CONFIG.SUPPORT_EMAIL}
              </a>
            </p>

            <div className="text-xs text-gray-400 mt-6 pt-4 border-t border-gray-100">
              Version 1.0.0
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

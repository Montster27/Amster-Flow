import { useDiscoveryStore } from '../store/useDiscoveryStore';
import { AssumptionTable } from './discovery/AssumptionTable';
import { InterviewPlanner } from './discovery/InterviewPlanner';
import { InterviewLog } from './discovery/InterviewLog';
import { IterationDashboard } from './discovery/IterationDashboard';

export const DiscoveryModule = () => {
  const { currentView, setCurrentView } = useDiscoveryStore();

  const tabs = [
    { id: 'assumptions' as const, label: 'Assumptions', icon: '📋' },
    { id: 'planner' as const, label: 'Interview Planner', icon: '📝' },
    { id: 'log' as const, label: 'Interview Log', icon: '💬' },
    { id: 'dashboard' as const, label: 'Dashboard', icon: '📊' },
  ];

  return (
    <div className="flex-1 p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Customer Discovery</h1>
        <p className="text-gray-600">
          Track assumptions, conduct interviews, and iterate based on real customer feedback
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8 border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Discovery module tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentView(tab.id)}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                currentView === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              aria-current={currentView === tab.id ? 'page' : undefined}
              aria-label={`Go to ${tab.label}`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content Area */}
      <div className="min-h-[600px]">
        {currentView === 'assumptions' && <AssumptionTable />}
        {currentView === 'planner' && <InterviewPlanner />}
        {currentView === 'log' && <InterviewLog />}
        {currentView === 'dashboard' && <IterationDashboard />}
      </div>
    </div>
  );
};

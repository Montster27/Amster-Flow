import { useState, useEffect, ReactNode } from 'react';
import { useProjectData } from '../hooks/useProjectData';
import { useDiscoveryData } from '../hooks/useDiscoveryData';
import { useSectorMapData } from '../hooks/useSectorMapData';
import { usePivotData } from '../hooks/usePivotData';
import { captureException } from '../lib/sentry';
import { ProjectContextProvider } from '../contexts/ProjectDataContext';
import { QuestionsData } from '../App';

// Runtime validation for questions.json
// Copied from App.tsx - we'll remove it from there later
const validateQuestionsData = (data: any): data is QuestionsData => {
    if (!data || typeof data !== 'object') return false;

    return Object.values(data).every((module: any) => {
        if (!module || typeof module !== 'object') return false;
        if (typeof module.title !== 'string') return false;
        if (typeof module.intro !== 'string') return false;

        // Discovery, Sector Map, and Pivot modules don't need questions/hints
        if (module.type === 'discovery' || module.type === 'sectorMap' || module.type === 'pivot') {
            return true;
        }

        // Standard modules need questions and hints
        return (
            Array.isArray(module.questions) &&
            module.questions.every((q: any) => typeof q === 'string') &&
            Array.isArray(module.hints) &&
            module.hints.every((h: any) => typeof h === 'string')
        );
    });
};

interface ProjectDataProviderProps {
    projectId?: string;
    children: ReactNode;
}

export function ProjectDataProvider({ projectId, children }: ProjectDataProviderProps) {
    const [questionsData, setQuestionsData] = useState<QuestionsData | null>(null);
    const [loadingError, setLoadingError] = useState<string | null>(null);

    // Sync with Supabase if projectId is provided
    const { loading: loadingProjectData, error: projectDataError } = useProjectData(projectId);
    const { loading: loadingDiscoveryData, error: discoveryDataError } = useDiscoveryData(projectId);
    const { loading: loadingSectorMapData, error: sectorMapDataError } = useSectorMapData(projectId);
    const { loading: loadingPivotData, error: pivotDataError } = usePivotData(projectId);

    // Load questions.json on mount
    useEffect(() => {
        const loadQuestions = async () => {
            try {
                const res = await fetch('/questions.json');
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                const data = await res.json();

                // Validate the data structure
                if (!validateQuestionsData(data)) {
                    throw new Error('Invalid questions data format');
                }

                setQuestionsData(data);
            } catch (err) {
                const error = err instanceof Error ? err : new Error('Failed to load questions');
                captureException(error, {
                    extra: { context: 'ProjectDataProvider initialization' },
                });
                setLoadingError(
                    err instanceof Error ? err.message : 'Failed to load guide. Please try again later.'
                );
            }
        };
        loadQuestions();
    }, []);

    if (loadingError || projectDataError || discoveryDataError || sectorMapDataError || pivotDataError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Guide</h2>
                    <p className="text-gray-600 mb-4">{loadingError || projectDataError || discoveryDataError || sectorMapDataError || pivotDataError}</p>
                    <button
                        onClick={() => {
                            setLoadingError(null);
                            setQuestionsData(null);
                            window.location.reload();
                        }}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                        aria-label="Retry loading guide"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!questionsData || loadingProjectData || loadingDiscoveryData || loadingSectorMapData || loadingPivotData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">
                        {!questionsData ? 'Loading your guide...' : 'Loading project data...'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <ProjectContextProvider value={{ questionsData }}>
            {children}
        </ProjectContextProvider>
    );
}

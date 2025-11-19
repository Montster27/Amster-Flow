import { createContext, useContext, ReactNode } from 'react';
import { QuestionsData } from '../App';

interface ProjectContextState {
    questionsData: QuestionsData | null;
}

const ProjectContext = createContext<ProjectContextState | undefined>(undefined);

export function ProjectContextProvider({
    children,
    value
}: {
    children: ReactNode;
    value: ProjectContextState
}) {
    return (
        <ProjectContext.Provider value={value}>
            {children}
        </ProjectContext.Provider>
    );
}

export function useProjectContext() {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error('useProjectContext must be used within a ProjectContextProvider');
    }
    return context;
}

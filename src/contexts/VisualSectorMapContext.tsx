import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import {
  Actor,
  Connection,
  Annotation,
  ActorCategory,
  ConnectionType,
  AnnotationType,
  AnnotationStatus,
  LayerType,
  Position,
  SectorMapScope,
  VisualSectorMapData,
} from '../types/visualSectorMap';
import { generateId } from '../utils/idGenerator';

interface VisualSectorMapState extends VisualSectorMapData {
  // Scope actions
  updateScope: (scope: Partial<SectorMapScope>) => void;

  // Actor actions
  addActor: (name: string, category: ActorCategory, position: Position) => void;
  updateActor: (id: string, updates: Partial<Actor>) => void;
  moveActor: (id: string, position: Position) => void;
  deleteActor: (id: string) => void;

  // Connection actions
  addConnection: (
    sourceActorId: string,
    targetActorId: string,
    type: ConnectionType,
    description: string,
    layer?: LayerType
  ) => void;
  updateConnection: (id: string, updates: Partial<Connection>) => void;
  deleteConnection: (id: string) => void;

  // Annotation actions
  addAnnotation: (
    type: AnnotationType,
    targetId: string,
    targetType: 'actor' | 'connection',
    content: string,
    status: AnnotationStatus
  ) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  deleteAnnotation: (id: string) => void;

  // Layer actions
  toggleLayer: (layer: LayerType) => void;
  setActiveLayers: (layers: LayerType[]) => void;

  // Utility
  reset: () => void;
  importData: (data: VisualSectorMapData) => void;
  exportData: () => VisualSectorMapData;
}

const VisualSectorMapContext = createContext<VisualSectorMapState | undefined>(undefined);

const initialState: VisualSectorMapData = {
  scope: {
    sector: '',
    question: '',
  },
  actors: [],
  connections: [],
  annotations: [],
  activeLayers: ['value', 'information', 'regulation'], // All layers visible by default
};

export function VisualSectorMapProvider({ children }: { children: ReactNode }) {
  const [scope, setScope] = useState<SectorMapScope>(initialState.scope);
  const [actors, setActors] = useState<Actor[]>(initialState.actors);
  const [connections, setConnections] = useState<Connection[]>(initialState.connections);
  const [annotations, setAnnotations] = useState<Annotation[]>(initialState.annotations);
  const [activeLayers, setActiveLayersState] = useState<LayerType[]>(initialState.activeLayers);

  // Scope actions
  const updateScope = useCallback((updates: Partial<SectorMapScope>) => {
    setScope((prev) => ({ ...prev, ...updates }));
  }, []);

  // Actor actions
  const addActor = useCallback((name: string, category: ActorCategory, position: Position) => {
    const newActor: Actor = {
      id: generateId(),
      name,
      category,
      position,
      created: new Date().toISOString(),
    };
    setActors((prev) => [...prev, newActor]);
  }, []);

  const updateActor = useCallback((id: string, updates: Partial<Actor>) => {
    setActors((prev) =>
      prev.map((actor) => (actor.id === id ? { ...actor, ...updates } : actor))
    );
  }, []);

  const moveActor = useCallback((id: string, position: Position) => {
    setActors((prev) =>
      prev.map((actor) => (actor.id === id ? { ...actor, position } : actor))
    );
  }, []);

  const deleteActor = useCallback((id: string) => {
    setActors((prev) => prev.filter((actor) => actor.id !== id));
    // Also delete related connections and annotations
    setConnections((prev) =>
      prev.filter((conn) => conn.sourceActorId !== id && conn.targetActorId !== id)
    );
    setAnnotations((prev) =>
      prev.filter((ann) => !(ann.targetType === 'actor' && ann.targetId === id))
    );
  }, []);

  // Connection actions
  const addConnection = useCallback((
    sourceActorId: string,
    targetActorId: string,
    type: ConnectionType,
    description: string,
    layer?: LayerType
  ) => {
    const newConnection: Connection = {
      id: generateId(),
      sourceActorId,
      targetActorId,
      type,
      description,
      layer,
      created: new Date().toISOString(),
    };
    setConnections((prev) => [...prev, newConnection]);
  }, []);

  const updateConnection = useCallback((id: string, updates: Partial<Connection>) => {
    setConnections((prev) =>
      prev.map((conn) => (conn.id === id ? { ...conn, ...updates } : conn))
    );
  }, []);

  const deleteConnection = useCallback((id: string) => {
    setConnections((prev) => prev.filter((conn) => conn.id !== id));
    // Also delete related annotations
    setAnnotations((prev) =>
      prev.filter((ann) => !(ann.targetType === 'connection' && ann.targetId === id))
    );
  }, []);

  // Annotation actions
  const addAnnotation = useCallback((
    type: AnnotationType,
    targetId: string,
    targetType: 'actor' | 'connection',
    content: string,
    status: AnnotationStatus
  ) => {
    const newAnnotation: Annotation = {
      id: generateId(),
      type,
      targetId,
      targetType,
      content,
      status,
      created: new Date().toISOString(),
    };
    setAnnotations((prev) => [...prev, newAnnotation]);
  }, []);

  const updateAnnotation = useCallback((id: string, updates: Partial<Annotation>) => {
    setAnnotations((prev) =>
      prev.map((ann) => (ann.id === id ? { ...ann, ...updates } : ann))
    );
  }, []);

  const deleteAnnotation = useCallback((id: string) => {
    setAnnotations((prev) => prev.filter((ann) => ann.id !== id));
  }, []);

  // Layer actions
  const toggleLayer = useCallback((layer: LayerType) => {
    setActiveLayersState((prev) =>
      prev.includes(layer) ? prev.filter((l) => l !== layer) : [...prev, layer]
    );
  }, []);

  const setActiveLayers = useCallback((layers: LayerType[]) => {
    setActiveLayersState(layers);
  }, []);

  // Utility
  const reset = useCallback(() => {
    setScope(initialState.scope);
    setActors(initialState.actors);
    setConnections(initialState.connections);
    setAnnotations(initialState.annotations);
    setActiveLayersState(initialState.activeLayers);
  }, []);

  const importData = useCallback((data: VisualSectorMapData) => {
    setScope(data.scope);
    setActors(data.actors);
    setConnections(data.connections);
    setAnnotations(data.annotations);
    setActiveLayersState(data.activeLayers);
  }, []);

  const exportData = useCallback((): VisualSectorMapData => {
    return {
      scope,
      actors,
      connections,
      annotations,
      activeLayers,
    };
  }, [scope, actors, connections, annotations, activeLayers]);

  const value: VisualSectorMapState = useMemo(
    () => ({
      scope,
      actors,
      connections,
      annotations,
      activeLayers,
      updateScope,
      addActor,
      updateActor,
      moveActor,
      deleteActor,
      addConnection,
      updateConnection,
      deleteConnection,
      addAnnotation,
      updateAnnotation,
      deleteAnnotation,
      toggleLayer,
      setActiveLayers,
      reset,
      importData,
      exportData,
    }),
    [
      scope,
      actors,
      connections,
      annotations,
      activeLayers,
      updateScope,
      addActor,
      updateActor,
      moveActor,
      deleteActor,
      addConnection,
      updateConnection,
      deleteConnection,
      addAnnotation,
      updateAnnotation,
      deleteAnnotation,
      toggleLayer,
      setActiveLayers,
      reset,
      importData,
      exportData,
    ]
  );

  return (
    <VisualSectorMapContext.Provider value={value}>
      {children}
    </VisualSectorMapContext.Provider>
  );
}

export function useVisualSectorMap() {
  const context = useContext(VisualSectorMapContext);
  if (context === undefined) {
    throw new Error('useVisualSectorMap must be used within a VisualSectorMapProvider');
  }
  return context;
}

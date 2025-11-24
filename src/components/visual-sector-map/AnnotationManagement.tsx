import { useState } from 'react';
import { useVisualSectorMap } from '../../contexts/VisualSectorMapContext';
import {
  AnnotationType,
  AnnotationStatus,
  ANNOTATION_ICONS,
  ANNOTATION_LABELS,
} from '../../types/visualSectorMap';
import { VisualCanvas } from './VisualCanvas';

interface AnnotationManagementProps {
  onContinue: () => void;
  onBack: () => void;
}

export const AnnotationManagement = ({ onContinue, onBack }: AnnotationManagementProps) => {
  const { actors, connections, annotations, addAnnotation, deleteAnnotation } =
    useVisualSectorMap();
  const [annotationType, setAnnotationType] = useState<AnnotationType>('pain-point');
  const [targetType, setTargetType] = useState<'actor' | 'connection'>('actor');
  const [targetId, setTargetId] = useState<string>('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<AnnotationStatus>('unvalidated');

  const annotationTypes: AnnotationType[] = ['pain-point', 'opportunity', 'uncertainty'];
  const statusOptions: AnnotationStatus[] = ['validated', 'unvalidated', 'needs-interview'];

  const canAddAnnotation = targetId && content.trim();

  const handleAddAnnotation = () => {
    if (!canAddAnnotation) return;

    addAnnotation(annotationType, targetId, targetType, content.trim(), status);

    // Reset form
    setContent('');
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Left Panel - Annotation Controls */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="px-6 py-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <span>📌</span> Add Annotations
          </h1>
          <p className="text-sm text-gray-600">Highlight insights and questions</p>
        </div>

        {/* Annotation Form */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Annotation Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <span>①</span> Type
            </label>
            <div className="space-y-2">
              {annotationTypes.map((type) => {
                const isSelected = annotationType === type;
                return (
                  <button
                    key={type}
                    onClick={() => setAnnotationType(type)}
                    className={`w-full px-4 py-3 rounded-lg font-medium text-sm transition-all border-2 text-left ${
                      isSelected
                        ? type === 'pain-point'
                          ? 'bg-red-100 border-red-400 text-red-800 shadow-md'
                          : type === 'opportunity'
                          ? 'bg-green-100 border-green-400 text-green-800 shadow-md'
                          : 'bg-yellow-100 border-yellow-400 text-yellow-800 shadow-md'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {ANNOTATION_ICONS[type]} {ANNOTATION_LABELS[type]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <span>②</span> Attach to
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setTargetType('actor');
                  setTargetId('');
                }}
                className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all border-2 ${
                  targetType === 'actor'
                    ? 'bg-blue-100 border-blue-400 text-blue-800 shadow-md'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                Actor
              </button>
              <button
                onClick={() => {
                  setTargetType('connection');
                  setTargetId('');
                }}
                className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all border-2 ${
                  targetType === 'connection'
                    ? 'bg-blue-100 border-blue-400 text-blue-800 shadow-md'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                Connection
              </button>
            </div>
          </div>

          {/* Target Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <span>③</span> Select {targetType}
            </label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Choose {targetType} --</option>
              {targetType === 'actor'
                ? actors.map((actor) => (
                    <option key={actor.id} value={actor.id}>
                      {actor.name}
                    </option>
                  ))
                : connections.map((conn) => {
                    const source = actors.find((a) => a.id === conn.sourceActorId);
                    const target = actors.find((a) => a.id === conn.targetActorId);
                    return (
                      <option key={conn.id} value={conn.id}>
                        {source?.name} → {target?.name}
                      </option>
                    );
                  })}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <span>④</span> Status
            </label>
            <div className="space-y-1">
              {statusOptions.map((s) => {
                const isSelected = status === s;
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`w-full px-3 py-2 rounded-lg font-medium text-xs transition-all border-2 text-left ${
                      isSelected
                        ? 'bg-purple-100 border-purple-400 text-purple-800 shadow-md'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {s === 'validated'
                      ? '✅ Validated'
                      : s === 'unvalidated'
                      ? '❓ Unvalidated'
                      : '📋 Needs Interview'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <span>⑤</span> Description
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                annotationType === 'pain-point'
                  ? 'e.g., Seniors struggle to navigate complex insurance requirements'
                  : annotationType === 'opportunity'
                  ? 'e.g., Could simplify the application process with a digital assistant'
                  : 'e.g., Unclear if hospitals would adopt a new coordination platform'
              }
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
            />
          </div>

          {/* Add Button */}
          <button
            onClick={handleAddAnnotation}
            disabled={!canAddAnnotation}
            className={`w-full px-4 py-3 rounded-lg font-semibold transition-all ${
              canAddAnnotation
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Add Annotation
          </button>

          {/* Existing Annotations List */}
          {annotations.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Annotations ({annotations.length}):
              </h3>
              <div className="space-y-2">
                {annotations.map((ann) => {
                  let targetName = '';
                  if (ann.targetType === 'actor') {
                    targetName = actors.find((a) => a.id === ann.targetId)?.name || 'Unknown';
                  } else {
                    const conn = connections.find((c) => c.id === ann.targetId);
                    const source = actors.find((a) => a.id === conn?.sourceActorId);
                    const target = actors.find((a) => a.id === conn?.targetActorId);
                    targetName = `${source?.name} → ${target?.name}`;
                  }

                  return (
                    <div
                      key={ann.id}
                      className={`p-2 rounded border text-xs ${
                        ann.type === 'pain-point'
                          ? 'bg-red-50 border-red-200'
                          : ann.type === 'opportunity'
                          ? 'bg-green-50 border-green-200'
                          : 'bg-yellow-50 border-yellow-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium">
                            {ANNOTATION_ICONS[ann.type]} {targetName}
                          </p>
                          <p className="text-gray-600 mt-1">{ann.content}</p>
                          <p className="text-gray-500 text-xs mt-1">
                            {ann.status === 'validated'
                              ? '✅ Validated'
                              : ann.status === 'unvalidated'
                              ? '❓ Unvalidated'
                              : '📋 Needs Interview'}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteAnnotation(ann.id)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 space-y-3">
          <button
            onClick={onBack}
            className="w-full px-4 py-2 rounded-lg font-medium text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 transition-all"
          >
            ← Back to Connections
          </button>
          <button
            onClick={onContinue}
            className="w-full px-4 py-3 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
          >
            Continue to Insights →
          </button>
        </div>
      </div>

      {/* Right Panel - Visual Canvas */}
      <div className="flex-1 overflow-hidden">
        <VisualCanvas
          selectedCategory="customer"
          showConnections={true}
          readOnly={true}
        />
      </div>
    </div>
  );
};

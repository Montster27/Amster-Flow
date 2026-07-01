import { useState } from 'react';
import { useVisualSectorMap } from '../../contexts/VisualSectorMapContext';
import {
  AnnotationType,
  AnnotationStatus,
  ANNOTATION_ICONS,
  ANNOTATION_LABELS,
} from '../../types/visualSectorMap';
import { VisualCanvas } from './VisualCanvas';
import {
  TEAL, TEAL_LITE, INK, SLATE_FG, MUTED, TAN, STONE, PAPER,
  AMBER_FG, AMBER_SOFT, AMBER_LINE, ERROR_FG,
} from '../../features/v3/lib/tokens';

const ERROR_SOFT = 'rgba(190,18,60,0.08)';
const ERROR_LINE = 'rgba(190,18,60,0.3)';

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
    <div className="h-screen flex" style={{ background: PAPER }}>
      {/* Left Panel - Annotation Controls */}
      <div className="w-96 bg-white border-r flex flex-col" style={{ borderColor: TAN }}>
        {/* Header */}
        <div className="px-6 py-6 border-b" style={{ borderColor: TAN }}>
          <h1 className="text-2xl font-bold mb-2 flex items-center gap-2" style={{ color: INK }}>
            <span>📌</span> Add Annotations
          </h1>
          <p className="text-sm" style={{ color: SLATE_FG }}>Highlight insights and questions</p>
        </div>

        {/* Annotation Form */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Annotation Type */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-1" style={{ color: SLATE_FG }}>
              <span>①</span> Type
            </label>
            <div className="space-y-2">
              {annotationTypes.map((type) => {
                const isSelected = annotationType === type;
                const selectedStyle =
                  type === 'pain-point'
                    ? { background: ERROR_SOFT, borderColor: ERROR_LINE, color: ERROR_FG }
                    : type === 'opportunity'
                    ? { background: TEAL_LITE, borderColor: TEAL, color: TEAL }
                    : { background: AMBER_SOFT, borderColor: AMBER_LINE, color: AMBER_FG };
                return (
                  <button
                    key={type}
                    onClick={() => setAnnotationType(type)}
                    className={`w-full px-4 py-3 rounded-lg font-medium text-sm transition-all border-2 text-left ${
                      isSelected ? 'shadow-md' : 'bg-white'
                    }`}
                    style={isSelected ? selectedStyle : { borderColor: STONE, color: SLATE_FG }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.borderColor = MUTED; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.borderColor = STONE; }}
                  >
                    {ANNOTATION_ICONS[type]} {ANNOTATION_LABELS[type]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Type */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-1" style={{ color: SLATE_FG }}>
              <span>②</span> Attach to
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setTargetType('actor');
                  setTargetId('');
                }}
                className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all border-2 ${
                  targetType === 'actor' ? 'shadow-md' : 'bg-white'
                }`}
                style={targetType === 'actor'
                  ? { background: TEAL_LITE, borderColor: TEAL, color: TEAL }
                  : { borderColor: STONE, color: SLATE_FG }}
                onMouseEnter={(e) => { if (targetType !== 'actor') e.currentTarget.style.borderColor = MUTED; }}
                onMouseLeave={(e) => { if (targetType !== 'actor') e.currentTarget.style.borderColor = STONE; }}
              >
                Actor
              </button>
              <button
                onClick={() => {
                  setTargetType('connection');
                  setTargetId('');
                }}
                className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all border-2 ${
                  targetType === 'connection' ? 'shadow-md' : 'bg-white'
                }`}
                style={targetType === 'connection'
                  ? { background: TEAL_LITE, borderColor: TEAL, color: TEAL }
                  : { borderColor: STONE, color: SLATE_FG }}
                onMouseEnter={(e) => { if (targetType !== 'connection') e.currentTarget.style.borderColor = MUTED; }}
                onMouseLeave={(e) => { if (targetType !== 'connection') e.currentTarget.style.borderColor = STONE; }}
              >
                Connection
              </button>
            </div>
          </div>

          {/* Target Selection */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-1" style={{ color: SLATE_FG }}>
              <span>③</span> Select {targetType}
            </label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full px-3 py-2 border-2 rounded-lg focus:outline-none"
              style={{ borderColor: STONE, color: INK }}
              onFocus={(e) => { e.currentTarget.style.borderColor = TEAL; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = STONE; }}
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
            <label className="block text-sm font-medium mb-2 flex items-center gap-1" style={{ color: SLATE_FG }}>
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
                      isSelected ? 'shadow-md' : 'bg-white'
                    }`}
                    style={isSelected
                      ? { background: TEAL_LITE, borderColor: TEAL, color: TEAL }
                      : { borderColor: STONE, color: SLATE_FG }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.borderColor = MUTED; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.borderColor = STONE; }}
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
            <label className="block text-sm font-medium mb-2 flex items-center gap-1" style={{ color: SLATE_FG }}>
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
              className="w-full px-3 py-2 border-2 rounded-lg focus:outline-none"
              style={{ borderColor: STONE, color: INK }}
              onFocus={(e) => { e.currentTarget.style.borderColor = TEAL; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = STONE; }}
              rows={4}
            />
          </div>

          {/* Add Button */}
          <button
            onClick={handleAddAnnotation}
            disabled={!canAddAnnotation}
            className={`w-full px-4 py-3 rounded-lg font-semibold transition-all ${
              canAddAnnotation ? 'text-white shadow-lg hover:shadow-xl' : 'cursor-not-allowed'
            }`}
            style={canAddAnnotation ? { background: TEAL } : { background: '#e2e8f0', color: MUTED }}
            onMouseEnter={(e) => { if (canAddAnnotation) e.currentTarget.style.background = '#0d5c56'; }}
            onMouseLeave={(e) => { if (canAddAnnotation) e.currentTarget.style.background = TEAL; }}
          >
            Add Annotation
          </button>

          {/* Existing Annotations List */}
          {annotations.length > 0 && (
            <div className="pt-4 border-t" style={{ borderColor: TAN }}>
              <h3 className="text-sm font-medium mb-2" style={{ color: SLATE_FG }}>
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

                  const cardStyle =
                    ann.type === 'pain-point'
                      ? { background: ERROR_SOFT, borderColor: ERROR_LINE }
                      : ann.type === 'opportunity'
                      ? { background: TEAL_LITE, borderColor: TEAL }
                      : { background: AMBER_SOFT, borderColor: AMBER_LINE };

                  return (
                    <div
                      key={ann.id}
                      className="p-2 rounded border text-xs"
                      style={cardStyle}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium" style={{ color: INK }}>
                            {ANNOTATION_ICONS[ann.type]} {targetName}
                          </p>
                          <p className="mt-1" style={{ color: SLATE_FG }}>{ann.content}</p>
                          <p className="text-xs mt-1" style={{ color: MUTED }}>
                            {ann.status === 'validated'
                              ? '✅ Validated'
                              : ann.status === 'unvalidated'
                              ? '❓ Unvalidated'
                              : '📋 Needs Interview'}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteAnnotation(ann.id)}
                          style={{ color: MUTED }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = ERROR_FG; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = MUTED; }}
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
        <div className="px-6 py-4 border-t space-y-3" style={{ borderColor: TAN }}>
          <button
            onClick={onBack}
            className="w-full px-4 py-2 rounded-lg font-medium bg-white border-2 transition-all"
            style={{ color: SLATE_FG, borderColor: STONE }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
          >
            ← Back to Connections
          </button>
          <button
            onClick={onContinue}
            className="w-full px-4 py-3 rounded-lg font-semibold text-white shadow-lg hover:shadow-xl transition-all"
            style={{ background: TEAL }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#0d5c56'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = TEAL; }}
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

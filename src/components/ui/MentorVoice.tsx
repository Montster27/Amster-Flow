import { useState } from 'react';
import type { ContentType } from '../../lib/pivotKitContent';

interface MentorVoiceProps {
  text: string;
  type?: ContentType;
  dismissible?: boolean;
  /** If true, content shows inline (always visible). Default false = collapsed behind lightbulb icon. */
  inline?: boolean;
  /** Label shown next to the lightbulb when collapsed. Defaults to type-based label. */
  label?: string;
  className?: string;
}

const TYPE_STYLES: Record<string, { container: string; icon?: string; label?: string }> = {
  mentor_voice: {
    container: 'border-l-4 border-orange-400 bg-orange-50 p-4 rounded-r-lg',
    icon: '💡',
    label: 'Mentor tip',
  },
  mentor_voice_flag: {
    container: 'border-l-4 border-red-400 bg-red-50 p-4 rounded-r-lg',
    icon: '🚩',
    label: 'Heads up',
  },
  warning: {
    container: 'bg-amber-50 border border-amber-200 p-4 rounded-lg',
    icon: '⚠️',
    label: 'Warning',
  },
  tip: {
    container: 'bg-blue-50 border border-blue-200 p-4 rounded-lg',
    icon: '💡',
    label: 'Tip',
  },
  callout: {
    container: 'border-l-4 border-orange-400 bg-orange-50 p-4 rounded-r-lg',
    icon: '💡',
    label: 'Insight',
  },
  lock_callout: {
    container: 'bg-slate-100 border border-slate-300 p-4 rounded-lg',
    icon: '🔒',
    label: 'Locked',
  },
  explainer: {
    container: 'bg-slate-50 border border-slate-200 p-4 rounded-lg',
    label: 'Context',
  },
  reminder: {
    container: 'border-l-4 border-blue-400 bg-blue-50 p-4 rounded-r-lg',
    icon: '📌',
    label: 'Reminder',
  },
  decision_prompt: {
    container: 'border-l-4 border-purple-400 bg-purple-50 p-4 rounded-r-lg',
    icon: '🤔',
    label: 'Decision point',
  },
  stage_intro: {
    container: 'bg-slate-50 p-4 rounded-lg',
    label: 'Stage overview',
  },
  subtitle: {
    container: '',
  },
  tooltip: {
    container: '',
  },
  field_label: {
    container: '',
  },
};

export function MentorVoice({ text, type = 'mentor_voice', dismissible = false, inline = false, label, className = '' }: MentorVoiceProps) {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  if (dismissed) return null;

  const style = TYPE_STYLES[type] || TYPE_STYLES.mentor_voice;
  const paragraphs = text.split('\n\n').filter(Boolean);
  const displayLabel = label || style.label || 'Tip';

  // Collapsed mode (default): show lightbulb icon, expand on click
  if (!inline && !expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 transition-colors text-left group ${className}`}
      >
        <span className="text-amber-500 text-lg group-hover:scale-110 transition-transform">💡</span>
        <span className="text-xs font-medium text-amber-700">{displayLabel}</span>
        <svg className="w-3 h-3 text-amber-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    );
  }

  return (
    <div className={`${style.container} ${className} relative`}>
      {/* Collapse button (when not inline) or dismiss button */}
      {!inline && (
        <button
          onClick={() => setExpanded(false)}
          className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 text-xs flex items-center gap-1"
          title="Collapse"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}
      {dismissible && inline && (
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 text-xs"
        >
          ✕
        </button>
      )}
      <div className="flex gap-3">
        {style.icon && <span className="flex-shrink-0 text-lg">{style.icon}</span>}
        <div className="space-y-2 pr-6">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-sm text-slate-700 leading-relaxed">{p}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

interface TooltipTextProps {
  text: string;
  children: React.ReactNode;
}

export function TooltipText({ text, children }: TooltipTextProps) {
  const [show, setShow] = useState(false);

  return (
    <span className="relative inline-flex items-center gap-1">
      {children}
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="text-slate-400 hover:text-slate-600 cursor-help"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      </button>
      {show && (
        <div className="absolute z-50 bottom-full left-0 mb-2 w-80 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-lg leading-relaxed">
          {text}
        </div>
      )}
    </span>
  );
}

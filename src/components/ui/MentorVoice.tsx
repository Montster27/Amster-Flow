import { useState } from 'react';
import type { ContentType } from '../../lib/pivotKitContent';

interface MentorVoiceProps {
  text: string;
  type?: ContentType;
  dismissible?: boolean;
  className?: string;
}

const TYPE_STYLES: Record<string, { container: string; icon?: string }> = {
  mentor_voice: {
    container: 'border-l-4 border-orange-400 bg-orange-50 p-4 rounded-r-lg',
    icon: '💡',
  },
  mentor_voice_flag: {
    container: 'border-l-4 border-red-400 bg-red-50 p-4 rounded-r-lg',
    icon: '🚩',
  },
  warning: {
    container: 'bg-amber-50 border border-amber-200 p-4 rounded-lg',
    icon: '⚠️',
  },
  tip: {
    container: 'bg-blue-50 border border-blue-200 p-4 rounded-lg',
    icon: '💡',
  },
  callout: {
    container: 'border-l-4 border-orange-400 bg-orange-50 p-4 rounded-r-lg',
  },
  lock_callout: {
    container: 'bg-slate-100 border border-slate-300 p-4 rounded-lg',
    icon: '🔒',
  },
  explainer: {
    container: 'bg-slate-50 border border-slate-200 p-4 rounded-lg',
  },
  reminder: {
    container: 'border-l-4 border-blue-400 bg-blue-50 p-4 rounded-r-lg',
    icon: '📌',
  },
  decision_prompt: {
    container: 'border-l-4 border-purple-400 bg-purple-50 p-4 rounded-r-lg',
    icon: '🤔',
  },
  stage_intro: {
    container: 'bg-slate-50 p-4 rounded-lg',
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

export function MentorVoice({ text, type = 'mentor_voice', dismissible = false, className = '' }: MentorVoiceProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const style = TYPE_STYLES[type] || TYPE_STYLES.mentor_voice;
  const paragraphs = text.split('\n\n').filter(Boolean);

  return (
    <div className={`${style.container} ${className} relative`}>
      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 text-xs"
        >
          ✕
        </button>
      )}
      <div className="flex gap-3">
        {style.icon && <span className="flex-shrink-0 text-lg">{style.icon}</span>}
        <div className="space-y-2">
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

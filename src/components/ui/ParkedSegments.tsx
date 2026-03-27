import { useState } from 'react';

interface ParkedSegment {
  name: string;
  accessRank?: number;
  problem?: string;
}

interface ParkedSegmentsProps {
  segments: ParkedSegment[];
  className?: string;
}

/**
 * Floating button that expands to show parked (backup) segments.
 * Place this on Discovery, Quick Check, or any page where the user
 * should remember they have alternatives.
 */
export function ParkedSegments({ segments, className = '' }: ParkedSegmentsProps) {
  const [open, setOpen] = useState(false);

  if (segments.length === 0) return null;

  return (
    <div className={`fixed bottom-6 right-6 z-40 ${className}`}>
      {open && (
        <div className="mb-3 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-slate-800">Your Backup Segments</h4>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-slate-600 text-xs"
            >
              x
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            If your current path isn't validating, these are ready to explore:
          </p>
          <div className="space-y-2">
            {segments.map((seg, idx) => (
              <div key={idx} className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">{seg.name}</span>
                  {seg.accessRank !== undefined && (
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      seg.accessRank >= 4 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      Access: {seg.accessRank}/5
                    </span>
                  )}
                </div>
                {seg.problem && (
                  <p className="text-xs text-slate-500 mt-1 italic">"{seg.problem}"</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 text-white rounded-full shadow-lg hover:bg-slate-800 transition-colors text-sm font-medium"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        {segments.length} Parked Segment{segments.length > 1 ? 's' : ''}
      </button>
    </div>
  );
}

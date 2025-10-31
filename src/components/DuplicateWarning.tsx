import { DuplicateMatch } from '../utils/deduplicationHelper';

interface DuplicateWarningProps {
  duplicates: DuplicateMatch[];
  onDismiss?: () => void;
}

export const DuplicateWarning = ({ duplicates, onDismiss }: DuplicateWarningProps) => {
  if (duplicates.length === 0) return null;

  return (
    <div className="mt-2 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-yellow-800 text-sm flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Similar content found
        </h4>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-yellow-600 hover:text-yellow-800"
            aria-label="Dismiss warning"
          >
            ✕
          </button>
        )}
      </div>
      <p className="text-sm text-yellow-700 mb-3">
        You may have already entered similar information elsewhere. Consider editing the existing content or referencing it.
      </p>
      <div className="space-y-3">
        {duplicates.slice(0, 3).map((match, idx) => (
          <div key={idx} className="bg-white p-3 rounded border border-yellow-300">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gray-700">
                {match.source} - {match.location}
              </span>
              <span className="text-xs text-gray-500">
                {Math.round(match.similarity * 100)}% similar
              </span>
            </div>
            <p className="text-sm text-gray-600 italic">"{match.content}"</p>
          </div>
        ))}
        {duplicates.length > 3 && (
          <p className="text-xs text-yellow-700">
            ...and {duplicates.length - 3} more similar entries
          </p>
        )}
      </div>
    </div>
  );
};

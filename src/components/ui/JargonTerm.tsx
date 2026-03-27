import { useState, useRef, useEffect } from 'react';

/**
 * Glossary of startup/lean methodology terms used throughout PivotKit.
 * Each term has a short definition and an optional longer explanation.
 */
export const GLOSSARY: Record<string, { short: string; long?: string }> = {
  beachhead: {
    short: 'Your starting point — the smallest, most desperate customer group you test first.',
    long: 'Military term meaning "first foothold." In startups, it\'s the narrowest segment where the problem is most acute and you have the best access. You prove your idea here before expanding.',
  },
  lbmc: {
    short: 'Lean Business Model Canvas — a framework that breaks your business into 11 testable areas.',
    long: 'Based on the Business Model Canvas, adapted for early-stage validation. Areas include Customer Segments, Problem, Solution, Unique Value Proposition, Channels, Revenue Streams, Cost Structure, Key Metrics, and Unfair Advantage.',
  },
  pmf: {
    short: 'Product-Market Fit — when your product clearly satisfies a strong market demand.',
    long: 'You know you have PMF when customers are actively using and recommending your product without being pushed. Until then, you\'re still searching.',
  },
  'risk score': {
    short: 'How urgent an assumption is to test. Higher = test it first.',
    long: 'Calculated as (6 - your confidence) × importance. Score of 15+ is critical, 8-14 is medium, below 8 is low priority. Focus your interviews on the highest-risk assumptions.',
  },
  assumption: {
    short: 'Something you believe to be true but haven\'t proven yet.',
    long: 'Every startup is built on assumptions — about who has the problem, how bad it is, whether they\'ll pay, etc. Discovery is the process of testing these assumptions with real conversations.',
  },
  'unfair advantage': {
    short: 'Something you have that a well-funded competitor can\'t easily copy.',
    long: 'Not a patent or first-mover advantage — those rarely hold. Think: deep customer relationships, proprietary data, a distribution channel built over years, or domain expertise that compounds.',
  },
  pivot: {
    short: 'A structured change in strategy based on what you learned from customers.',
    long: 'Not giving up — it\'s using evidence to change direction. There are 10+ types of pivots: customer segment, problem, solution, channel, revenue model, and more.',
  },
  patch: {
    short: 'A smaller adjustment to your current approach — iterate, don\'t overhaul.',
    long: 'When the core idea is working but something specific needs fixing. Maybe your channel is wrong, or your messaging doesn\'t land. Fix the weak point without starting over.',
  },
  proceed: {
    short: 'Your evidence supports moving forward — scale what\'s working.',
    long: 'You\'ve validated the key assumptions and the signal is strong. Time to build, grow, and invest more in the current direction.',
  },
  'validation stage': {
    short: 'One of three phases of testing: Customer-Problem Fit → Problem-Solution Fit → Business Model.',
    long: 'Stage 1: Does anyone have this problem? Stage 2: Does your solution actually fix it? Stage 3: Can you build a business around it? Each stage requires real interviews before you can move on.',
  },
  'customer-problem fit': {
    short: 'Stage 1 — proving that real people have a real problem worth solving.',
    long: 'Before you can test any solution, you need evidence that a specific group of people experiences a specific problem frequently enough and painfully enough to do something about it.',
  },
  'problem-solution fit': {
    short: 'Stage 2 — proving your proposed solution actually addresses the validated problem.',
    long: 'Show people how it would work (words, pictures, prototypes) and watch their reaction. You\'re looking for the smallest solution they\'d accept as a starting point.',
  },
  confidence: {
    short: 'How sure you are about an assumption, from 1 (guessing) to 5 (proven).',
    long: 'Should change based on interviews. If confidence only goes up, you\'re probably only talking to people who agree with you. Real discovery moves confidence in both directions.',
  },
  'parked segment': {
    short: 'A customer group you identified but aren\'t testing first — your backup options.',
    long: 'If your beachhead doesn\'t validate, these are ready to explore next. Having parked segments means a failed test isn\'t a dead end.',
  },
  priority: {
    short: 'A label based on your Risk Score: High (15+), Medium (8-14), or Low (under 8).',
    long: 'Priority, Risk Score, and the Risk Matrix quadrant all show the same thing — how urgently you need to test this assumption. They\'re just different views of the same number.',
  },
  'founder-market fit': {
    short: 'How well your background and access match the problem you\'re solving.',
    long: 'Do you have direct experience with the problem? Do you know the customers? Can you reach them? Strong FMF means you\'ll learn faster and build the right thing.',
  },
};

interface JargonTermProps {
  /** The glossary key (lowercase) */
  term: string;
  /** Display text — defaults to the term itself */
  children?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Clickable jargon term that shows a popup definition.
 * Usage: <JargonTerm term="beachhead">Beachhead</JargonTerm>
 *   or:  <JargonTerm term="beachhead" /> (auto-displays the term)
 */
export function JargonTerm({ term, children, className = '' }: JargonTermProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [showLong, setShowLong] = useState(false);

  const entry = GLOSSARY[term.toLowerCase()];
  if (!entry) {
    return <span className={className}>{children || term}</span>;
  }

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        ref.current && !ref.current.contains(e.target as Node) &&
        popupRef.current && !popupRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setShowLong(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <span ref={ref} className={`relative inline ${className}`}>
      <button
        type="button"
        onClick={() => { setOpen(!open); setShowLong(false); }}
        className="underline decoration-dotted decoration-blue-400 underline-offset-2 text-blue-700 hover:text-blue-900 hover:decoration-blue-600 cursor-help font-medium transition-colors"
      >
        {children || term}
      </button>
      {open && (
        <div
          ref={popupRef}
          className="absolute z-50 bottom-full left-0 mb-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-4 text-left animate-in fade-in slide-in-from-bottom-1 duration-150"
        >
          <div className="flex items-start justify-between gap-2 mb-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">
              {term}
            </span>
            <button
              type="button"
              onClick={() => { setOpen(false); setShowLong(false); }}
              className="text-slate-400 hover:text-slate-600 text-xs leading-none"
            >
              x
            </button>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{entry.short}</p>
          {entry.long && !showLong && (
            <button
              type="button"
              onClick={() => setShowLong(true)}
              className="mt-2 text-xs text-blue-500 hover:text-blue-700 font-medium"
            >
              Tell me more...
            </button>
          )}
          {entry.long && showLong && (
            <p className="mt-2 text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-2">
              {entry.long}
            </p>
          )}
        </div>
      )}
    </span>
  );
}

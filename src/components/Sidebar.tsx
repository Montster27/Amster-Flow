import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_CONFIG } from '../config/constants';
import { useGuide } from '../contexts/GuideContext';
import { useEnhancedInterviews } from '../hooks/useEnhancedInterviews';

interface SidebarProps {
  modules: string[];
  onModuleClick: (module: string) => void;
  onViewSummary?: () => void;
  projectId?: string;
}

function NavChip({ letter, active = false }: { letter: string; active?: boolean }) {
  return (
    <div
      className="inline-flex items-center justify-center flex-shrink-0 font-bold"
      style={{
        width: 28,
        height: 28,
        borderRadius: 7,
        background: active ? 'var(--sky-600)' : 'var(--sky-100)',
        color: active ? '#fff' : 'var(--sky-600)',
        fontSize: 12,
        letterSpacing: '-0.02em',
      }}
    >
      {letter}
    </div>
  );
}

function moduleLetter(module: string): string {
  return module.charAt(0).toUpperCase();
}

function moduleLabel(module: string): string {
  return module.replace(/([A-Z])/g, ' $1').trim().replace(/^./, (c) => c.toUpperCase());
}

export function Sidebar({ modules, onModuleClick, onViewSummary, projectId }: SidebarProps) {
  const navigate = useNavigate();
  const { currentModule, progress } = useGuide();
  const { interviews: enhancedInterviews } = useEnhancedInterviews(projectId);
  const [showAbout, setShowAbout] = useState(false);

  const totalInterviews = enhancedInterviews.length;
  const hasMinimumInterviews = totalInterviews >= APP_CONFIG.THRESHOLDS.MIN_INTERVIEWS_FOR_PIVOT;

  const displayedModules = modules.filter((m) => !['problem', 'customerSegments', 'solution'].includes(m));

  return (
    <div
      className="flex flex-col"
      style={{
        width: 240,
        alignSelf: 'stretch',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-soft)',
      }}
    >
      {/* Brand */}
      <div
        className="flex items-center gap-3"
        style={{ padding: '18px 16px', borderBottom: '1px solid var(--border-soft)' }}
      >
        <NavChip letter="P" active />
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-1)', lineHeight: 1.2 }}>
            Pivot Kit
          </div>
          <div style={{ fontSize: 11, color: 'var(--fg-4)', lineHeight: 1.3 }}>
            Startup validation
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto" style={{ padding: '16px 12px' }}>
        {projectId && (
          <>
            <div className="pk-kicker" style={{ padding: '4px 8px 8px' }}>
              Start here
            </div>
            <button
              onClick={() => navigate(`/project/${projectId}/discovery/step-0`)}
              className="w-full flex items-center gap-3 text-left transition-colors"
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                color: 'var(--fg-2)',
                fontSize: 13,
                fontWeight: 500,
                marginBottom: 2,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--slate-100)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <NavChip letter="0" />
              <span>Step 0 · First Look</span>
            </button>
            <button
              onClick={() => navigate(`/project/${projectId}/quick-check`)}
              className="w-full flex items-center gap-3 text-left transition-colors"
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                color: 'var(--fg-2)',
                fontSize: 13,
                fontWeight: 500,
                marginBottom: 2,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--slate-100)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <NavChip letter="Q" />
              <span>Quick Check</span>
            </button>
            <button
              onClick={() => navigate(`/project/${projectId}/sanity-check`)}
              className="w-full flex items-center gap-3 text-left transition-colors"
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                color: 'var(--fg-2)',
                fontSize: 13,
                fontWeight: 500,
                marginBottom: 2,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--slate-100)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <NavChip letter="S" />
              <span>Sanity Check</span>
            </button>
          </>
        )}

        <div className="pk-kicker" style={{ padding: '16px 8px 8px' }}>
          Modules
        </div>

        {displayedModules.map((module) => {
          const isCompleted = progress[module]?.completed;
          const isActive = currentModule === module;

          if (module === 'pivot' && projectId) {
            return (
              <React.Fragment key="discovery-and-pivot">
                <button
                  onClick={() => navigate(`/project/${projectId}/discovery`)}
                  className="w-full flex items-center gap-3 text-left transition-colors"
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    color: 'var(--fg-2)',
                    fontSize: 13,
                    fontWeight: 500,
                    marginBottom: 2,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--slate-100)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <NavChip letter="D" />
                  <span>Discovery</span>
                </button>
                <button
                  onClick={() => hasMinimumInterviews && onModuleClick(module)}
                  disabled={!hasMinimumInterviews}
                  title={
                    !hasMinimumInterviews
                      ? `Complete ${APP_CONFIG.THRESHOLDS.MIN_INTERVIEWS_FOR_PIVOT} interviews to unlock`
                      : undefined
                  }
                  className="w-full flex items-center gap-3 text-left transition-colors"
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    color: hasMinimumInterviews ? 'var(--fg-2)' : 'var(--fg-4)',
                    fontSize: 13,
                    fontWeight: 500,
                    marginBottom: 2,
                    background: isActive ? 'var(--sky-50)' : 'transparent',
                    border: 'none',
                    cursor: hasMinimumInterviews ? 'pointer' : 'not-allowed',
                    opacity: hasMinimumInterviews ? 1 : 0.6,
                  }}
                  onMouseEnter={(e) => {
                    if (hasMinimumInterviews && !isActive) {
                      e.currentTarget.style.background = 'var(--slate-100)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <NavChip letter="P" />
                  <span style={{ flex: 1 }}>Pivot or Proceed</span>
                  {!hasMinimumInterviews && (
                    <span className="pk-pill outline" style={{ fontSize: 10 }}>
                      Locked
                    </span>
                  )}
                </button>
              </React.Fragment>
            );
          }

          return (
            <button
              key={module}
              onClick={() => onModuleClick(module)}
              aria-current={isActive ? 'page' : undefined}
              className="w-full flex items-center gap-3 text-left transition-colors"
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                color: isActive ? 'var(--sky-700)' : 'var(--fg-2)',
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                marginBottom: 2,
                background: isActive ? 'var(--sky-50)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = 'var(--slate-100)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              <NavChip letter={moduleLetter(module)} active={isActive} />
              <span style={{ flex: 1 }}>{moduleLabel(module)}</span>
              {isCompleted && (
                <span
                  className="pk-dot validated"
                  aria-label="Completed"
                  style={{ width: 8, height: 8 }}
                />
              )}
            </button>
          );
        })}

        {onViewSummary && (
          <>
            <hr className="pk-hair" style={{ margin: '12px 8px' }} />
            <button
              onClick={onViewSummary}
              className="w-full flex items-center gap-3 text-left transition-colors"
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                color: 'var(--fg-3)',
                fontSize: 13,
                fontWeight: 500,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--slate-100)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <NavChip letter="S" />
              <span>View Summary</span>
            </button>
          </>
        )}
      </nav>

      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border-soft)',
        }}
      >
        <button
          onClick={() => setShowAbout(true)}
          className="flex items-center gap-2 transition-colors"
          style={{
            color: 'var(--fg-4)',
            fontSize: 12,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--fg-2)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--fg-4)')}
        >
          About · Help
        </button>
      </div>

      {showAbout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className="pk-panel relative"
            style={{ maxWidth: 480, width: '100%', padding: 24 }}
          >
            <button
              onClick={() => setShowAbout(false)}
              aria-label="Close"
              className="absolute"
              style={{
                top: 12,
                right: 12,
                color: 'var(--fg-4)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: 18,
              }}
            >
              ✕
            </button>

            <div className="pk-kicker" style={{ marginBottom: 6 }}>
              About
            </div>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: 'var(--fg-1)',
                margin: '0 0 12px',
              }}
            >
              Pivot Kit
            </h2>
            <p style={{ color: 'var(--fg-3)', fontSize: 14, lineHeight: 1.55, margin: '0 0 16px' }}>
              A structured guide to help entrepreneurs validate their startup ideas through rigorous
              customer discovery and problem validation.
            </p>

            <hr className="pk-hair" style={{ margin: '16px 0' }} />

            <div className="pk-kicker" style={{ marginBottom: 6 }}>
              Need help?
            </div>
            <p style={{ color: 'var(--fg-3)', fontSize: 13, margin: 0 }}>
              <a
                href={`mailto:${APP_CONFIG.SUPPORT_EMAIL}`}
                style={{ color: 'var(--sky-700)', fontWeight: 500 }}
              >
                {APP_CONFIG.SUPPORT_EMAIL}
              </a>
            </p>

            <div
              style={{
                marginTop: 20,
                paddingTop: 12,
                borderTop: '1px solid var(--border-soft)',
                fontSize: 11,
                color: 'var(--fg-4)',
              }}
            >
              Version 1.0.0
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProjectHeaderBarProps {
  projectName: string;
  section?: string;
  rightSlot?: React.ReactNode;
}

/**
 * Shared page header used across ProjectPage, DiscoveryPage, and SectorMapPage.
 * Breadcrumb on the left (Dashboard › Project › Section), user email on the right.
 */
export function ProjectHeaderBar({ projectName, section, rightSlot }: ProjectHeaderBarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <header
      className="flex items-center justify-between"
      style={{
        height: 52,
        padding: '0 20px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-soft)',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}
    >
      <nav className="flex items-center gap-2" aria-label="Breadcrumb">
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            fontSize: 13,
            color: 'var(--fg-4)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 6px',
            borderRadius: 6,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--fg-2)';
            e.currentTarget.style.background = 'var(--slate-100)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--fg-4)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          Dashboard
        </button>
        <span style={{ color: 'var(--slate-300)', fontSize: 12 }}>/</span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--fg-1)',
            padding: '4px 6px',
          }}
        >
          {projectName}
        </span>
        {section && (
          <>
            <span style={{ color: 'var(--slate-300)', fontSize: 12 }}>/</span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--fg-3)',
                padding: '4px 6px',
              }}
            >
              {section}
            </span>
          </>
        )}
      </nav>

      <div className="flex items-center gap-3">
        {rightSlot}
        {user?.email && (
          <span style={{ fontSize: 12, color: 'var(--fg-4)' }}>{user.email}</span>
        )}
      </div>
    </header>
  );
}

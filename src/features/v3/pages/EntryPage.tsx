// /v3 entry — pick or create a PivotKit venture (project), then route to
// onboarding or the dashboard depending on whether the venture has been
// started yet.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../lib/supabase';
import { PageShell } from '../components/atoms';

const FONT_MONO = 'JetBrains Mono, ui-monospace, monospace';
const FONT_SERIF = '"Instrument Serif", Georgia, serif';

interface ProjectListItem {
  id: string;
  name: string;
  description: string | null;
  organization_id: string;
  has_venture: boolean;
  has_completed_onboarding: boolean;
  door_choice: string | null;
}

export default function EntryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!user) return;
    setLoading(true); setError(null);
    (async () => {
      try {
        // Get projects for orgs the user is in
        const { data: memberships, error: mErr } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id);
        if (mErr) throw mErr;
        const orgIds = (memberships ?? []).map((m) => m.organization_id);
        if (orgIds.length === 0) {
          if (!cancelled) setItems([]);
          return;
        }
        const { data: projects, error: pErr } = await supabase
          .from('projects')
          .select('id, name, description, organization_id, deleted_at')
          .in('organization_id', orgIds)
          .is('deleted_at', null);
        if (pErr) throw pErr;

        // Per project, look up if a pivotkit_ventures row exists
        const projectIds = (projects ?? []).map((p) => p.id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sb = supabase as any;
        const { data: ventures, error: vErr } = projectIds.length
          ? await sb
            .from('pivotkit_ventures')
            .select('project_id, has_completed_onboarding, door_choice')
            .in('project_id', projectIds)
          : { data: [], error: null };
        if (vErr) throw vErr;
        const vMap = new Map<string, { has_completed_onboarding: boolean; door_choice: string | null }>(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (ventures ?? []).map((v: any) => [v.project_id, {
            has_completed_onboarding: !!v.has_completed_onboarding,
            door_choice: v.door_choice ?? null,
          }]),
        );

        if (cancelled) return;
        setItems((projects ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          organization_id: p.organization_id,
          has_venture: vMap.has(p.id),
          has_completed_onboarding: vMap.get(p.id)?.has_completed_onboarding ?? false,
          door_choice: vMap.get(p.id)?.door_choice ?? null,
        })));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const enter = (item: ProjectListItem) => {
    if (item.has_completed_onboarding) {
      navigate(`/v3/dashboard/${item.id}`);
    } else if (item.door_choice === 'A') {
      navigate(`/v3/door-a/${item.id}`);
    } else if (item.door_choice === 'B') {
      navigate(`/v3/door-b/${item.id}`);
    } else {
      navigate(`/v3/onboarding/${item.id}`);
    }
  };

  if (!user) {
    return (
      <PageShell>
        <div style={{ padding: 40 }}>
          You need to <a href="/login" style={{ color: '#0f766e' }}>sign in</a> first.
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div style={{ padding: '40px 56px', maxWidth: 920, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 7, background: '#0b1220',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontFamily: FONT_MONO, fontWeight: 700, fontSize: 13,
          }}>PK</div>
          <div style={{
            fontFamily: FONT_MONO, fontSize: 11, color: '#94a3b8',
            letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600,
          }}>PivotKit · Questions Up &amp; Down · v3</div>
          <div style={{ flex: 1 }} />
          <a href="/dashboard" style={{
            fontSize: 12, color: '#64748b',
          }}>← back to legacy dashboard</a>
        </div>

        <div style={{
          fontFamily: FONT_SERIF, fontSize: 44, color: '#0b1220',
          letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 8,
        }}>Pick a venture.</div>
        <div style={{ fontSize: 16, color: '#475569', lineHeight: 1.55, marginBottom: 32, maxWidth: 600 }}>
          PivotKit v3 enrolls your existing projects as ventures. Pick one to start the
          16-layer flow. The legacy modules stay where they were — this lives in
          parallel.
        </div>

        {loading && <div style={{ color: '#64748b' }}>Loading…</div>}
        {error && <div role="alert" style={{ color: '#be123c' }}>Failed to load: {error}</div>}

        {!loading && items.length === 0 && (
          <div style={{
            padding: '20px 22px', background: '#fff',
            border: '1px dashed #d6cfb8', borderRadius: 10,
            fontSize: 14, color: '#475569', lineHeight: 1.6,
          }}>
            No projects yet. <a href="/dashboard" style={{ color: '#0f766e' }}>Create one on the legacy dashboard</a>, then come back here.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((p) => {
            const stateLabel = p.has_completed_onboarding ? 'Dashboard'
              : p.door_choice === 'A' ? 'Resume Door A'
              : p.door_choice === 'B' ? 'Resume Door B'
              : 'Start onboarding';
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => enter(p)}
                style={{
                  textAlign: 'left',
                  padding: '16px 20px', background: '#fff',
                  border: '1px solid #e8dfc9', borderRadius: 10,
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'grid', gridTemplateColumns: '1fr auto', gap: 14,
                  alignItems: 'center',
                  transition: 'border-color .12s, transform .12s, box-shadow .12s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#0f766e';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(15,118,110,0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e8dfc9';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                <div>
                  <div style={{
                    fontSize: 16, color: '#0b1220', fontWeight: 600, lineHeight: 1.2,
                  }}>{p.name}</div>
                  {p.description && (
                    <div style={{
                      fontSize: 12.5, color: '#64748b', marginTop: 4, lineHeight: 1.5,
                    }}>{p.description}</div>
                  )}
                  {!p.has_venture && (
                    <div style={{
                      fontSize: 11, color: '#94a3b8', marginTop: 4,
                      fontFamily: FONT_MONO, letterSpacing: '0.06em',
                    }}>NEW · NOT YET ENROLLED</div>
                  )}
                </div>
                <span style={{
                  fontFamily: FONT_MONO, fontSize: 10.5, color: '#0f766e',
                  letterSpacing: '0.08em', fontWeight: 700,
                }}>{stateLabel.toUpperCase()} →</span>
              </button>
            );
          })}
        </div>

        <div style={{
          marginTop: 28, paddingTop: 18, borderTop: '1px solid #ece6d6',
          fontSize: 12.5, color: '#64748b', lineHeight: 1.55,
        }}>
          The design canvas (mocks of all 8 surfaces) is at <a href="/v3/canvas" style={{ color: '#0f766e' }}>/v3/canvas</a>.
        </div>
      </div>
    </PageShell>
  );
}

// /v3 entry — pick or create a PivotKit venture (project), then route to
// onboarding or the dashboard depending on whether the venture has been
// started yet.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../lib/supabase';
import { PageShell } from '../components/atoms';
import { ensureVenture, updateVenture } from '../lib/storage';
import { INDUSTRIES, industryLabel } from '../lib/industryVariants';
import type { Industry } from '../lib/layers';

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

interface Membership {
  organization_id: string;
  role?: string;
}

export default function EntryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<ProjectListItem[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create-venture form state
  const [creating, setCreating] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState<{
    name: string; description: string; industry: Industry;
  }>({ name: '', description: '', industry: 'software' });
  const [createError, setCreateError] = useState<string | null>(null);

  const refresh = async (uid: string) => {
    // Memberships first — capture role so we can hide create UI for viewers.
    const { data: mems, error: mErr } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', uid);
    if (mErr) throw mErr;
    const list = (mems ?? []) as Membership[];
    setMemberships(list);
    const orgIds = list.map((m) => m.organization_id);
    // Default org = first the user belongs to (the legacy DashboardPage uses
    // similar fallthrough). If the user is in multiple orgs, the v3 entry
    // doesn't currently let them switch — extend later.
    setOrgId(orgIds[0] ?? null);

    if (orgIds.length === 0) { setItems([]); return; }

    const { data: projects, error: pErr } = await supabase
      .from('projects')
      .select('id, name, description, organization_id, deleted_at')
      .in('organization_id', orgIds)
      .is('deleted_at', null);
    if (pErr) throw pErr;

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

    setItems((projects ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      organization_id: p.organization_id,
      has_venture: vMap.has(p.id),
      has_completed_onboarding: vMap.get(p.id)?.has_completed_onboarding ?? false,
      door_choice: vMap.get(p.id)?.door_choice ?? null,
    })));
  };

  useEffect(() => {
    let cancelled = false;
    if (!user) return;
    setLoading(true); setError(null);
    refresh(user.id)
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : String(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
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

  const myRole = memberships.find((m) => m.organization_id === orgId)?.role ?? null;
  const canCreate = myRole === 'owner' || myRole === 'editor' || myRole === 'admin';

  const onCreate = async () => {
    if (!user || !orgId || !draft.name.trim()) return;
    setCreating(true); setCreateError(null);
    try {
      const { data: project, error: pErr } = await supabase
        .from('projects')
        .insert({
          organization_id: orgId,
          name: draft.name.trim(),
          description: draft.description.trim() || null,
          created_by: user.id,
        })
        .select()
        .single();
      if (pErr) throw pErr;
      // Provision the v3 venture row + set its industry up front.
      await ensureVenture(project.id);
      if (draft.industry !== 'software') {
        await updateVenture(project.id, { industry_variant: draft.industry });
      }
      // Reset and route
      setFormOpen(false);
      setDraft({ name: '', description: '', industry: 'software' });
      navigate(`/v3/onboarding/${project.id}`);
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
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
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          gap: 16, marginBottom: 8,
        }}>
          <div style={{
            fontFamily: FONT_SERIF, fontSize: 44, color: '#0b1220',
            letterSpacing: '-0.02em', lineHeight: 1.1,
          }}>Pick a venture.</div>
          {canCreate && !formOpen && (
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              style={{
                padding: '9px 16px', background: '#0b1220', color: '#fff',
                border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >+ New venture</button>
          )}
        </div>
        <div style={{ fontSize: 16, color: '#475569', lineHeight: 1.55, marginBottom: 24, maxWidth: 600 }}>
          PivotKit v3 enrolls your existing projects as ventures. Pick one to start the
          16-layer flow, or spin up a new one. The legacy modules stay where they were —
          this lives in parallel.
        </div>

        {loading && <div style={{ color: '#64748b' }}>Loading…</div>}
        {error && <div role="alert" style={{ color: '#be123c' }}>Failed to load: {error}</div>}

        {/* ── Create-venture form ── */}
        {formOpen && (
          <div style={{
            padding: '18px 20px', background: '#fff',
            border: '1.5px solid #0f766e', borderRadius: 10,
            boxShadow: '0 0 0 4px rgba(15,118,110,0.06)',
            marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <div style={{
              fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: '#0f766e', fontWeight: 700,
            }}>+ New venture</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{
                fontFamily: FONT_MONO, fontSize: 10.5, color: '#64748b',
                letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600,
              }}>Name</label>
              <input
                type="text"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g. PetFinder"
                autoFocus
                style={{
                  padding: '8px 12px', border: '1px solid #d6cfb8', borderRadius: 6,
                  fontSize: 14, fontFamily: 'inherit', background: '#fbfaf7', outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{
                fontFamily: FONT_MONO, fontSize: 10.5, color: '#64748b',
                letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600,
              }}>Description (optional)</label>
              <input
                type="text"
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                placeholder="One-line tagline"
                style={{
                  padding: '8px 12px', border: '1px solid #d6cfb8', borderRadius: 6,
                  fontSize: 13, fontFamily: 'inherit', background: '#fbfaf7', outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{
                fontFamily: FONT_MONO, fontSize: 10.5, color: '#64748b',
                letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600,
              }}>Industry variant</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {INDUSTRIES.map((i) => {
                  const on = i === draft.industry;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setDraft({ ...draft, industry: i })}
                      style={{
                        padding: '6px 12px', borderRadius: 18,
                        background: on ? '#0b1220' : '#fff',
                        border: `1px solid ${on ? '#0b1220' : '#d6cfb8'}`,
                        color: on ? '#fff' : '#475569',
                        fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >{industryLabel(i)}</button>
                  );
                })}
              </div>
              <div style={{
                fontSize: 11, color: '#94a3b8', marginTop: 2, lineHeight: 1.4,
              }}>The 16-layer ontology is shared; variants reword the layer names and core questions to fit the domain. You can switch later from the dashboard.</div>
            </div>

            {createError && (
              <div role="alert" style={{
                padding: '8px 12px', background: '#fef2f2',
                border: '1px solid #fda4af', borderRadius: 6,
                color: '#9f1239', fontSize: 12.5,
              }}>{createError}</div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button
                type="button"
                onClick={() => { void onCreate(); }}
                disabled={creating || !draft.name.trim() || !orgId}
                style={{
                  padding: '9px 16px',
                  background: !draft.name.trim() || !orgId ? '#e2e8f0' : '#0b1220',
                  color: !draft.name.trim() || !orgId ? '#94a3b8' : '#fff',
                  border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500,
                  cursor: !draft.name.trim() || !orgId ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >{creating ? 'Creating…' : 'Create & start onboarding →'}</button>
              <button
                type="button"
                onClick={() => { setFormOpen(false); setCreateError(null); }}
                style={{
                  padding: '9px 14px', background: 'transparent', color: '#64748b',
                  border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >Cancel</button>
              {!orgId && (
                <span style={{
                  fontSize: 11.5, color: '#94a3b8', alignSelf: 'center',
                  fontFamily: FONT_MONO, letterSpacing: '0.06em',
                }}>You need an organization to create a venture.</span>
              )}
            </div>
          </div>
        )}

        {!loading && items.length === 0 && !formOpen && (
          <div style={{
            padding: '20px 22px', background: '#fff',
            border: '1px dashed #d6cfb8', borderRadius: 10,
            fontSize: 14, color: '#475569', lineHeight: 1.6,
          }}>
            {canCreate
              ? <>No projects yet. <button type="button" onClick={() => setFormOpen(true)} style={{ background: 'none', border: 'none', color: '#0f766e', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 14, fontFamily: 'inherit' }}>Spin up your first venture →</button></>
              : <>You don’t have permission to create projects in this organization. Ask an owner or editor to add one for you.</>}
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

// L8_3_TripleFilter.tsx
// Door A · L8.3 — Triple-filter sub-group scoring wireframe.
// Standalone reference component. Self-contained: useState only, no router/db/storage.

import { useState } from 'react';

// ── Types ──
type PainValue = 'critical' | 'useful' | 'nice-to-have';
type ReachValue = 'know-personally' | 'specific-channel' | 'no-idea';
type SizeValue = 'tiny-niche' | 'real-market' | 'large-market';

interface SubGroup {
  id: string;
  parentGroupId: string;
  name: string;
  pain: PainValue | null;
  reachability: ReachValue | null;
  size: SizeValue | null;
}

interface ParentGroup {
  id: string;
  name: string;
}

// ── Score math ──
const PAIN_W = 3;
const REACH_W = 2;
const SIZE_W = 1;
const SCORE_MIN = PAIN_W + REACH_W + SIZE_W;
const SCORE_MAX = 3 * PAIN_W + 3 * REACH_W + 3 * SIZE_W;

const PAIN_VAL: Record<PainValue, number> = { 'critical': 3, 'useful': 2, 'nice-to-have': 1 };
const REACH_VAL: Record<ReachValue, number> = { 'know-personally': 3, 'specific-channel': 2, 'no-idea': 1 };
const SIZE_VAL: Record<SizeValue, number> = { 'large-market': 3, 'real-market': 2, 'tiny-niche': 1 };

function rawScore(sg: SubGroup): number | null {
  if (!sg.pain || !sg.reachability || !sg.size) return null;
  return PAIN_VAL[sg.pain] * PAIN_W
    + REACH_VAL[sg.reachability] * REACH_W
    + SIZE_VAL[sg.size] * SIZE_W;
}

function normalized(raw: number | null): number {
  if (raw == null) return 0;
  return (raw - SCORE_MIN) / (SCORE_MAX - SCORE_MIN);
}

// ── Option labels & tooltips ──
const PAIN_OPTIONS: { value: PainValue; label: string; tip: string }[] = [
  { value: 'critical',     label: 'Critical',     tip: "They're actively trying to solve this right now. They've tried alternatives. They're losing money / time / sleep over it." },
  { value: 'useful',       label: 'Useful',       tip: 'Meaningful improvement — saves real time or money — but they live with it. They will not switch on their own.' },
  { value: 'nice-to-have', label: 'Nice-to-have', tip: "Convenience or polish. They'd take it if free. Nobody is paying for this." },
];

const REACH_OPTIONS: { value: ReachValue; label: string; tip: string }[] = [
  { value: 'know-personally',  label: 'I know them',         tip: 'You can talk to 5 of them by Friday without any introductions. Genuine personal access.' },
  { value: 'specific-channel', label: 'Specific channel',    tip: 'You know exactly where they hang out — a subreddit, a Slack, a conference, a job title to search.' },
  { value: 'no-idea',          label: 'No idea',             tip: "You'd be cold-emailing strangers. Don't pretend otherwise." },
];

const SIZE_OPTIONS: { value: SizeValue; label: string; tip: string }[] = [
  { value: 'tiny-niche',   label: 'Tiny niche',   tip: 'Hundreds to low thousands. Fine for a beachhead. Bad for a Series A pitch.' },
  { value: 'real-market',  label: 'Real market',  tip: 'Tens of thousands to a few hundred thousand. Most beachheads land here.' },
  { value: 'large-market', label: 'Large market', tip: 'Millions. Almost never the right starting place.' },
];

// ── Mock data (Quiet Hours · ADHD focus app from spec §3) ──
const SEED_PARENTS: ParentGroup[] = [
  { id: 'p-consult',  name: 'Solo consultants' },
  { id: 'p-writers',  name: 'Freelance writers' },
  { id: 'p-adhd',     name: 'ADHD adults' },
  { id: 'p-remote',   name: 'Remote employees at large tech' },
];

const SEED_SUBGROUPS: SubGroup[] = [
  { id: 'sg-consult-new',    parentGroupId: 'p-consult', name: 'New (<2 yrs)',              pain: 'useful',       reachability: 'specific-channel', size: 'real-market'  },
  { id: 'sg-consult-est',    parentGroupId: 'p-consult', name: 'Established (>5 yrs)',      pain: 'nice-to-have', reachability: 'specific-channel', size: 'real-market'  },
  { id: 'sg-writers-long',   parentGroupId: 'p-writers', name: 'Long-form (book) writers',  pain: 'critical',     reachability: 'know-personally',  size: 'tiny-niche'   },
  { id: 'sg-adhd-unmed',     parentGroupId: 'p-adhd',    name: 'Diagnosed & unmedicated',   pain: 'critical',     reachability: 'know-personally',  size: 'real-market'  },
  { id: 'sg-adhd-med',       parentGroupId: 'p-adhd',    name: 'Diagnosed & medicated',     pain: 'useful',       reachability: 'specific-channel', size: 'real-market'  },
  { id: 'sg-remote-ic',      parentGroupId: 'p-remote',  name: 'IC engineers',              pain: 'useful',       reachability: 'no-idea',          size: 'large-market' },
];

// ── Visual tokens (PivotKit palette) ──
const PAPER     = '#fbfaf7';
const INK       = '#0b1220';
const TAN       = '#e8dfc9';
const TEAL      = '#0f766e';
const TEAL_LITE = '#dcf2ec';
const GOLD      = '#fcd34d';
const AMBER_FG  = '#b45309';
const AMBER_BG  = '#fef3c7';
const SLATE_FG  = '#475569';
const MUTED     = '#94a3b8';
const HAIR      = '#f1f5f9';

// ── Sub-components ──
function ParentChip({ name, count }: { name: string; count: number }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono uppercase tracking-wider"
      style={{ borderColor: TAN, color: SLATE_FG, background: PAPER }}
    >
      <span className="font-semibold" style={{ color: INK }}>{name}</span>
      <span style={{ color: MUTED }}>· {count}</span>
    </span>
  );
}

function PillOption({
  selected, label, tip, onClick, disabled,
}: {
  selected: boolean; label: string; tip: string;
  onClick: () => void; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block">
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        title={tip}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="px-2.5 py-1 rounded-full text-[11.5px] font-medium border transition-colors"
        style={{
          background: selected ? INK : '#fff',
          color: selected ? '#fff' : SLATE_FG,
          borderColor: selected ? INK : TAN,
        }}
      >
        {label}
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 -translate-x-1/2 mt-2 z-30 w-60 px-3 py-2 rounded-md text-[11.5px] leading-snug shadow-lg pointer-events-none"
          style={{ background: INK, color: '#f8fafc', top: '100%' }}
        >
          {tip}
        </span>
      )}
    </span>
  );
}

function ScoreBar({ raw }: { raw: number | null }) {
  const n = normalized(raw);
  const isHigh = n >= 0.7;
  const isLow  = n > 0 && n < 0.4;
  const barColor = isHigh ? TEAL : isLow ? MUTED : '#94a3b8';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: HAIR }}>
        <div
          className="h-full transition-all"
          style={{ width: `${Math.max(0, n) * 100}%`, background: raw == null ? 'transparent' : barColor }}
        />
      </div>
      <span
        className="font-mono text-[12px] tabular-nums w-8 text-right"
        style={{ color: raw == null ? MUTED : isHigh ? TEAL : INK, fontWeight: isHigh ? 700 : 500 }}
      >
        {raw == null ? '—' : raw}
      </span>
    </div>
  );
}

// ── Main component ──
export default function L8_3_TripleFilter() {
  const [parents] = useState<ParentGroup[]>(SEED_PARENTS);
  const [subgroups, setSubgroups] = useState<SubGroup[]>(SEED_SUBGROUPS);
  const [beachheadId, setBeachheadId] = useState<string | null>('sg-adhd-unmed');

  const countByParent = (id: string) => subgroups.filter((s) => s.parentGroupId === id).length;

  const update = (id: string, patch: Partial<SubGroup>) =>
    setSubgroups((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  // Order: keep groups together, but visually sort by score within group for the bar story
  const scored = subgroups.map((s) => ({ sg: s, raw: rawScore(s) }));
  const topScore = Math.max(...scored.map(({ raw }) => raw ?? 0));

  // Group by parent, preserving parent ordering
  const grouped: { parent: ParentGroup; rows: typeof scored }[] = parents
    .map((p) => ({ parent: p, rows: scored.filter(({ sg }) => sg.parentGroupId === p.id) }))
    .filter((g) => g.rows.length > 0);

  const continueLabel = beachheadId ? 'Continue to L9 — Solution' : 'Continue without picking a beachhead';

  return (
    <div className="min-h-screen w-full font-sans" style={{ background: PAPER, color: INK }}>
      {/* Header */}
      <header className="px-7 py-4 border-b sticky top-0 z-20" style={{ borderColor: TAN, background: PAPER }}>
        <div className="font-mono text-[10.5px] tracking-widest uppercase font-semibold" style={{ color: MUTED }}>
          PivotKit · Door A · L8.3
        </div>
        <h1 className="text-[22px] tracking-tight mt-0.5" style={{ fontFamily: 'Georgia, serif' }}>
          Score each sub-group on the triple filter
        </h1>
      </header>

      <div className="grid grid-cols-[1fr_320px] gap-8 px-7 py-6 max-w-[1240px] mx-auto">
        {/* Left column — parent chips + scoring grid */}
        <main>
          {/* Parent option space */}
          <div className="mb-5">
            <div className="font-mono text-[10px] tracking-widest uppercase font-semibold mb-2" style={{ color: MUTED }}>
              Your option space (L8.1)
            </div>
            <div className="flex flex-wrap gap-2">
              {parents.map((p) => (
                <ParentChip key={p.id} name={p.name} count={countByParent(p.id)} />
              ))}
            </div>
          </div>

          {/* Column headers */}
          <div
            className="grid items-center px-4 py-3 rounded-t-lg border border-b-0 font-mono text-[10px] tracking-widest uppercase font-semibold"
            style={{
              gridTemplateColumns: '1.4fr 1.5fr 1.5fr 1.4fr 1.2fr 48px',
              borderColor: TAN, background: '#fff', color: SLATE_FG, columnGap: 14,
            }}
          >
            <span>Sub-group</span>
            <span>Pain <span style={{ color: TEAL }}>×3</span></span>
            <span>Reachability <span style={{ color: TEAL }}>×2</span></span>
            <span>Size <span style={{ color: MUTED }}>×1</span></span>
            <span>Beachhead score</span>
            <span className="text-right">Pick</span>
          </div>

          {/* Grouped rows */}
          <div className="border rounded-b-lg overflow-visible" style={{ borderColor: TAN, background: '#fff' }}>
            {grouped.map((g, gi) => (
              <div key={g.parent.id}>
                {/* Parent label band */}
                <div
                  className="px-4 py-1.5 font-mono text-[10px] tracking-widest uppercase font-semibold border-t"
                  style={{ color: MUTED, borderColor: HAIR, background: PAPER }}
                >
                  {g.parent.name}
                </div>

                {g.rows.map(({ sg, raw }, ri) => {
                  const isBeachhead = beachheadId === sg.id;
                  const isTop = raw != null && raw === topScore;
                  return (
                    <div
                      key={sg.id}
                      className="grid items-center px-4 py-3 border-t relative"
                      style={{
                        gridTemplateColumns: '1.4fr 1.5fr 1.5fr 1.4fr 1.2fr 48px',
                        borderColor: HAIR, columnGap: 14,
                        background: isBeachhead ? TEAL_LITE : (gi + ri) % 2 === 0 ? '#fff' : '#fcfaf5',
                        borderLeft: isBeachhead ? `3px solid ${TEAL}` : '3px solid transparent',
                      }}
                    >
                      {/* Sub-group name */}
                      <div className="flex flex-col gap-0.5 pr-2">
                        <span className="text-[13.5px] font-medium leading-tight" style={{ color: INK }}>
                          {sg.name}
                        </span>
                        {isTop && (
                          <span className="font-mono text-[9.5px] tracking-widest uppercase font-bold" style={{ color: TEAL }}>
                            ★ top-scored
                          </span>
                        )}
                      </div>

                      {/* Pain pills */}
                      <div className="flex flex-wrap gap-1.5">
                        {PAIN_OPTIONS.map((o) => (
                          <PillOption
                            key={o.value}
                            selected={sg.pain === o.value}
                            label={o.label}
                            tip={o.tip}
                            onClick={() => update(sg.id, { pain: sg.pain === o.value ? null : o.value })}
                          />
                        ))}
                      </div>

                      {/* Reachability pills */}
                      <div className="flex flex-wrap gap-1.5">
                        {REACH_OPTIONS.map((o) => (
                          <PillOption
                            key={o.value}
                            selected={sg.reachability === o.value}
                            label={o.label}
                            tip={o.tip}
                            onClick={() => update(sg.id, { reachability: sg.reachability === o.value ? null : o.value })}
                          />
                        ))}
                      </div>

                      {/* Size pills */}
                      <div className="flex flex-wrap gap-1.5">
                        {SIZE_OPTIONS.map((o) => (
                          <PillOption
                            key={o.value}
                            selected={sg.size === o.value}
                            label={o.label}
                            tip={o.tip}
                            onClick={() => update(sg.id, { size: sg.size === o.value ? null : o.value })}
                          />
                        ))}
                      </div>

                      {/* Score */}
                      <ScoreBar raw={raw} />

                      {/* Beachhead radio */}
                      <div className="flex justify-end">
                        <button
                          type="button"
                          aria-label={`Select ${sg.name} as beachhead`}
                          aria-pressed={isBeachhead}
                          onClick={() => setBeachheadId(isBeachhead ? null : sg.id)}
                          className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
                          style={{
                            borderColor: isBeachhead ? TEAL : '#cbd5e1',
                            background: isBeachhead ? TEAL : '#fff',
                          }}
                        >
                          {isBeachhead && <span className="w-2 h-2 rounded-full" style={{ background: GOLD }} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <p className="mt-3 text-[12px]" style={{ color: SLATE_FG }}>
            Hover any pill to see what it actually means in your beachhead&rsquo;s terms.
          </p>
        </main>

        {/* Right rail — mentor voice */}
        <aside className="sticky top-24 self-start">
          <div className="rounded-lg p-5 border" style={{ borderColor: TAN, background: '#fff' }}>
            <div className="flex items-center gap-2 mb-3">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: GOLD }}
              />
              <span className="font-mono text-[10px] tracking-widest uppercase font-bold" style={{ color: AMBER_FG }}>
                Monty · mentor voice
              </span>
            </div>
            <p className="text-[13.5px] leading-relaxed" style={{ color: INK }}>
              You&rsquo;re ranking sub-groups by how much pain they have, how easy they are to reach, and how big they are.
              We weight pain heaviest because a painless market is a hobby, and reachability second because an unreachable market is a dream.
              Size is third because founders systematically overweight it.
            </p>
            <hr className="my-4" style={{ borderColor: HAIR }} />
            <p className="text-[12.5px] leading-relaxed italic" style={{ color: SLATE_FG }}>
              &ldquo;The instinct is to pick the biggest market. The right move is the most acute pain you can actually reach.
              Big markets are where you end up; tiny desperate groups you can put your hands on are where you start.&rdquo;
            </p>
          </div>

          {/* Live scoring legend */}
          <div className="rounded-lg p-4 border mt-4" style={{ borderColor: TAN, background: PAPER }}>
            <div className="font-mono text-[10px] tracking-widest uppercase font-semibold mb-2" style={{ color: MUTED }}>
              Score formula
            </div>
            <div className="font-mono text-[11.5px]" style={{ color: SLATE_FG }}>
              pain × 3 &nbsp;+&nbsp; reach × 2 &nbsp;+&nbsp; size × 1
            </div>
            <div className="font-mono text-[10.5px] mt-1" style={{ color: MUTED }}>
              range {SCORE_MIN}–{SCORE_MAX}
            </div>
          </div>
        </aside>
      </div>

      {/* Footer / continue */}
      <footer
        className="sticky bottom-0 px-7 py-4 border-t flex items-center gap-4 z-10"
        style={{ borderColor: TAN, background: PAPER }}
      >
        <div className="flex-1">
          {beachheadId ? (
            <span className="text-[13px]" style={{ color: SLATE_FG }}>
              Beachhead locked for L9: <span className="font-semibold" style={{ color: INK }}>
                {subgroups.find((s) => s.id === beachheadId)?.name}
              </span>
              <span style={{ color: MUTED }}> · You can change this any time.</span>
            </span>
          ) : (
            <span className="text-[13px]" style={{ color: AMBER_FG, background: AMBER_BG, padding: '4px 10px', borderRadius: 6 }}>
              You don&rsquo;t have to pick now &mdash; the rest of L9 &amp; L10 will assume the highest-scoring sub-group unless you tell us otherwise.
            </span>
          )}
        </div>
        <button
          type="button"
          className="px-5 py-2.5 rounded-md text-[13px] font-semibold tracking-tight transition-colors"
          style={{
            background: INK,
            color: beachheadId ? '#fff' : GOLD,
          }}
        >
          {continueLabel} &rarr;
        </button>
      </footer>
    </div>
  );
}

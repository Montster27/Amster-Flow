// L10_1_ValueChain.tsx
// Door A · L10.1 — Value-chain builder wireframe.
// Standalone reference component. Self-contained: useState only, no router/db/storage.

import { useRef, useState } from 'react';

// ── Types ──
type Role = 'maker' | 'aggregator' | 'distributor' | 'retailer' | 'end-user' | 'other';

interface ChainNode {
  id: string;
  label: string;
  role: Role;
  position: number;
  locked: boolean;
}

interface ChainEdge {
  fromNodeId: string;
  toNodeId: string;
  notes?: string;
}

interface ValueChain {
  nodes: ChainNode[];
  edges: ChainEdge[];
}

// ── Visual tokens (PivotKit palette) ──
const PAPER     = '#fbfaf7';
const INK       = '#0b1220';
const TAN       = '#e8dfc9';
const TEAL      = '#0f766e';
const TEAL_LITE = '#dcf2ec';
const GOLD      = '#fcd34d';
const CORAL     = '#d97757';
const CORAL_LITE= '#fbe9df';
const AMBER_FG  = '#b45309';
const SLATE_FG  = '#475569';
const MUTED     = '#94a3b8';
const HAIR      = '#f1f5f9';

// ── Role labels ──
const ROLE_OPTIONS: { value: Role; label: string; hint: string }[] = [
  { value: 'maker',       label: 'Maker',       hint: 'Designs / manufactures the underlying product or component.' },
  { value: 'aggregator',  label: 'Aggregator',  hint: 'Bundles inputs from multiple makers.' },
  { value: 'distributor', label: 'Distributor', hint: 'Moves product through wholesale / logistics tiers.' },
  { value: 'retailer',    label: 'Retailer',    hint: 'Sells to the end user. Sets shelf price. Owns the storefront.' },
  { value: 'end-user',    label: 'End user',    hint: 'The person who ultimately uses or consumes the product.' },
  { value: 'other',       label: 'Other',       hint: 'Doesn’t fit any of the above. Add a label that explains it.' },
];

// ── Template starters ──
interface Template {
  id: string;
  steps: number;
  title: string;
  subtitle: string;
  chain: { label: string; role: Role }[];
}

const TEMPLATES: Template[] = [
  {
    id: 't-b2c',
    steps: 0,
    title: 'B2C',
    subtitle: 'Direct to consumer',
    chain: [
      { label: 'You', role: 'maker' },
      { label: 'End user', role: 'end-user' },
    ],
  },
  {
    id: 't-b2b1',
    steps: 1,
    title: 'B2B → end-customer biz',
    subtitle: 'You sell to companies that sell to people',
    chain: [
      { label: 'You', role: 'maker' },
      { label: 'Retailer / SaaS co.', role: 'retailer' },
      { label: 'End user', role: 'end-user' },
    ],
  },
  {
    id: 't-b2b2b2c',
    steps: 2,
    title: 'B2B2B2C',
    subtitle: 'Component → assembler → retailer',
    chain: [
      { label: 'You', role: 'maker' },
      { label: 'Manufacturer', role: 'maker' },
      { label: 'Retailer', role: 'retailer' },
      { label: 'End user', role: 'end-user' },
    ],
  },
  {
    id: 't-deepb2b',
    steps: 3,
    title: 'Deep B2B',
    subtitle: '3+ links between you and the end user',
    chain: [
      { label: 'You', role: 'maker' },
      { label: 'Industrial process', role: 'aggregator' },
      { label: 'Manufacturer', role: 'maker' },
      { label: 'Distributor', role: 'distributor' },
      { label: 'Retailer', role: 'retailer' },
      { label: 'End user', role: 'end-user' },
    ],
  },
];

// ── Seed chain — partially built B2B2B2C per code-prompt brief ──
const SEED_CHAIN: ValueChain = {
  nodes: [
    { id: 'n-you',  label: 'You',          role: 'maker',    position: 0, locked: true  },
    { id: 'n-mfg',  label: 'Manufacturer', role: 'maker',    position: 1, locked: false },
    { id: 'n-ret',  label: 'Retailer',     role: 'retailer', position: 2, locked: false },
    { id: 'n-end',  label: 'End user',     role: 'end-user', position: 3, locked: true  },
  ],
  edges: [
    { fromNodeId: 'n-you', toNodeId: 'n-mfg', notes: 'Sensor unit @ $1.20/ea' },
    { fromNodeId: 'n-mfg', toNodeId: 'n-ret' },
    { fromNodeId: 'n-ret', toNodeId: 'n-end' },
  ],
};

let UID = 100;
const nextId = () => `n-${++UID}`;

// ── Sub-components ──
function RoleBadge({ role }: { role: Role }) {
  const meta = ROLE_OPTIONS.find((r) => r.value === role)!;
  const isEndUser = role === 'end-user';
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded-sm font-mono text-[9.5px] tracking-widest uppercase font-bold"
      style={{
        background: isEndUser ? CORAL_LITE : HAIR,
        color: isEndUser ? CORAL : SLATE_FG,
      }}
    >
      {meta.label}
    </span>
  );
}

function ChainArrow({
  onInsert, note, onNoteChange,
}: {
  onInsert: () => void;
  note?: string;
  onNoteChange: (s: string) => void;
}) {
  const [hover, setHover] = useState(false);
  const [insertFocused, setInsertFocused] = useState(false);
  const [editing, setEditing] = useState(false);
  const cancelledRef = useRef(false);
  const insertVisible = hover || insertFocused;
  return (
    <div
      className="relative flex flex-col items-center justify-center px-1 select-none"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ minWidth: 70 }}
    >
      <div className="relative flex items-center w-full">
        <span className="flex-1 h-px" style={{ background: '#cbd5e1' }} />
        <span
          className="inline-block"
          style={{
            width: 0, height: 0,
            borderTop: '4px solid transparent',
            borderBottom: '4px solid transparent',
            borderLeft: `6px solid #94a3b8`,
            marginLeft: -1,
          }}
        />
      </div>
      {/* Insert affordance — visible on hover OR focus (keyboard reachable) */}
      <button
        type="button"
        onClick={onInsert}
        onFocus={() => setInsertFocused(true)}
        onBlur={() => setInsertFocused(false)}
        aria-label="Insert a link here"
        className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border flex items-center justify-center text-[12px] leading-none transition-opacity"
        style={{
          opacity: insertVisible ? 1 : 0.15,
          background: '#fff',
          borderColor: TEAL,
          color: TEAL,
          fontWeight: 700,
        }}
      >
        +
      </button>
      {/* Edge note */}
      <button
        type="button"
        onClick={() => { cancelledRef.current = false; setEditing(true); }}
        className="mt-1 font-mono text-[10px] tracking-wide truncate max-w-[120px] text-center"
        style={{ color: note ? SLATE_FG : MUTED, fontStyle: note ? 'normal' : 'italic' }}
        title={note || 'click to add a flow note'}
      >
        {editing ? '' : note ? note : '+ flow note'}
      </button>
      {editing && (
        <input
          autoFocus
          defaultValue={note ?? ''}
          onBlur={(e) => {
            if (!cancelledRef.current) onNoteChange(e.currentTarget.value);
            cancelledRef.current = false;
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            if (e.key === 'Escape') {
              cancelledRef.current = true;
              (e.target as HTMLInputElement).blur();
            }
          }}
          placeholder="$ amount, terms, what flows..."
          className="mt-1 px-1.5 py-0.5 rounded border font-mono text-[10px] w-32 text-center"
          style={{ borderColor: TEAL, color: INK }}
        />
      )}
    </div>
  );
}

function Node({
  node, isFirst, isLast, dropdownOpen, onToggleDropdown,
  onRename, onChangeRole, onRemove,
}: {
  node: ChainNode;
  isFirst: boolean;
  isLast: boolean;
  dropdownOpen: boolean;
  onToggleDropdown: () => void;
  onRename: (s: string) => void;
  onChangeRole: (r: Role) => void;
  onRemove: () => void;
}) {
  const [editingName, setEditingName] = useState(false);

  const isYou = isFirst;
  const isEnd = isLast;
  const accent = isYou ? TEAL : isEnd ? CORAL : SLATE_FG;
  const accentBg = isYou ? TEAL_LITE : isEnd ? CORAL_LITE : '#fff';

  return (
    <div className="relative" style={{ minWidth: 140 }}>
      <div
        className="rounded-lg border-2 px-3 py-3 flex flex-col gap-1.5 transition-colors"
        style={{
          background: accentBg,
          borderColor: accent,
        }}
      >
        <div className="flex items-center justify-between gap-1.5">
          <RoleBadge role={node.role} />
          {!node.locked && (
            <button
              type="button"
              onClick={onRemove}
              className="text-[14px] leading-none font-bold opacity-60 hover:opacity-100"
              style={{ color: SLATE_FG }}
              title="Remove this link"
              aria-label={`Remove ${node.label}`}
            >
              ×
            </button>
          )}
        </div>
        {editingName ? (
          <input
            autoFocus
            defaultValue={node.label}
            onBlur={(e) => { onRename(e.currentTarget.value); setEditingName(false); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              if (e.key === 'Escape') setEditingName(false);
            }}
            className="px-1 py-0.5 rounded text-[14.5px] font-semibold w-full"
            style={{ background: '#fff', color: INK, border: `1px solid ${TEAL}` }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingName(true)}
            className="text-left text-[14.5px] font-semibold leading-tight"
            style={{ color: INK }}
            title="Click to rename"
          >
            {node.label}
          </button>
        )}
        <button
          type="button"
          onClick={onToggleDropdown}
          className="text-left font-mono text-[10.5px] tracking-wide flex items-center justify-between"
          style={{ color: SLATE_FG }}
        >
          <span>change role</span>
          <span style={{ color: MUTED }}>{dropdownOpen ? '▴' : '▾'}</span>
        </button>
      </div>

      {/* Role dropdown */}
      {dropdownOpen && (
        <div
          className="absolute left-0 right-0 mt-1 rounded-md border shadow-lg z-20"
          style={{ background: '#fff', borderColor: TAN }}
        >
          {ROLE_OPTIONS.map((opt) => {
            const on = opt.value === node.role;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChangeRole(opt.value)}
                className="w-full text-left px-3 py-2 text-[12px] flex flex-col gap-0.5 border-t first:border-t-0"
                style={{
                  borderColor: HAIR,
                  background: on ? TEAL_LITE : 'transparent',
                  color: INK,
                }}
              >
                <span className="font-semibold flex items-center gap-1.5">
                  {opt.label}
                  {on && <span style={{ color: TEAL }}>✓</span>}
                </span>
                <span className="text-[10.5px]" style={{ color: SLATE_FG }}>{opt.hint}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TemplateMini({
  tmpl, hovered, onHover, onLoad,
}: {
  tmpl: Template;
  hovered: boolean;
  onHover: (id: string | null) => void;
  onLoad: () => void;
}) {
  return (
    <button
      type="button"
      onMouseEnter={() => onHover(tmpl.id)}
      onMouseLeave={() => onHover(null)}
      onClick={onLoad}
      className="w-full text-left rounded-md border p-3 transition-colors"
      style={{
        borderColor: hovered ? TEAL : TAN,
        background: hovered ? TEAL_LITE : '#fff',
      }}
    >
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[12.5px] font-semibold" style={{ color: INK }}>{tmpl.title}</span>
        <span className="font-mono text-[10px]" style={{ color: MUTED }}>
          {tmpl.steps === 0 ? '0 steps' : `${tmpl.steps} step${tmpl.steps > 1 ? 's' : ''}`}
        </span>
      </div>
      <div className="text-[11px] mb-2" style={{ color: SLATE_FG }}>{tmpl.subtitle}</div>
      <div className="flex items-center flex-wrap gap-1">
        {tmpl.chain.map((c, i) => {
          const isEnd = c.role === 'end-user';
          const isYou = i === 0;
          return (
            <span key={i} className="flex items-center gap-1">
              <span
                className="px-1.5 py-0.5 rounded font-mono text-[9.5px] uppercase tracking-wider"
                style={{
                  background: isEnd ? CORAL_LITE : isYou ? TEAL_LITE : HAIR,
                  color: isEnd ? CORAL : isYou ? TEAL : SLATE_FG,
                  fontWeight: 600,
                }}
              >
                {c.label}
              </span>
              {i < tmpl.chain.length - 1 && (
                <span style={{ color: MUTED, fontSize: 10 }}>→</span>
              )}
            </span>
          );
        })}
      </div>
    </button>
  );
}

// ── Main component ──
export default function L10_1_ValueChain() {
  const [chain, setChain] = useState<ValueChain>(SEED_CHAIN);
  const [openRoleNodeId, setOpenRoleNodeId] = useState<string | null>('n-mfg'); // pre-open per code-prompt spec
  const [hoveredTemplateId, setHoveredTemplateId] = useState<string | null>('t-b2b2b2c');

  const nodesOrdered = [...chain.nodes].sort((a, b) => a.position - b.position);

  const findEdge = (fromId: string, toId: string) =>
    chain.edges.find((e) => e.fromNodeId === fromId && e.toNodeId === toId);

  const setEdgeNote = (fromId: string, toId: string, notes: string) => {
    setChain((prev) => {
      const existing = prev.edges.find((e) => e.fromNodeId === fromId && e.toNodeId === toId);
      if (existing) {
        return {
          ...prev,
          edges: prev.edges.map((e) =>
            e.fromNodeId === fromId && e.toNodeId === toId ? { ...e, notes: notes || undefined } : e,
          ),
        };
      }
      return { ...prev, edges: [...prev.edges, { fromNodeId: fromId, toNodeId: toId, notes }] };
    });
  };

  const insertBetween = (fromId: string, toId: string) => {
    setChain((prev) => {
      const fromNode = prev.nodes.find((n) => n.id === fromId)!;
      const toNode   = prev.nodes.find((n) => n.id === toId)!;
      const newPos = (fromNode.position + toNode.position) / 2;
      const newNode: ChainNode = {
        id: nextId(),
        label: 'New link',
        role: 'distributor',
        position: newPos,
        locked: false,
      };
      // re-normalize positions
      const merged = [...prev.nodes, newNode].sort((a, b) => a.position - b.position)
        .map((n, i) => ({ ...n, position: i }));
      // rewire edges that used the old direct fromId→toId
      const edges = prev.edges
        .filter((e) => !(e.fromNodeId === fromId && e.toNodeId === toId))
        .concat([
          { fromNodeId: fromId, toNodeId: newNode.id },
          { fromNodeId: newNode.id, toNodeId: toId },
        ]);
      return { nodes: merged, edges };
    });
  };

  const removeNode = (id: string) => {
    setChain((prev) => {
      const target = prev.nodes.find((n) => n.id === id);
      if (!target || target.locked) return prev;
      const prevNode = prev.nodes.find((n) => n.position === target.position - 1);
      const nextNode = prev.nodes.find((n) => n.position === target.position + 1);
      const nodes = prev.nodes
        .filter((n) => n.id !== id)
        .map((n) => (n.position > target.position ? { ...n, position: n.position - 1 } : n));
      const filtered = prev.edges.filter(
        (e) => e.fromNodeId !== id && e.toNodeId !== id,
      );
      const edges = prevNode && nextNode
        ? [...filtered, { fromNodeId: prevNode.id, toNodeId: nextNode.id }]
        : filtered;
      return { nodes, edges };
    });
    if (openRoleNodeId === id) setOpenRoleNodeId(null);
  };

  const rename = (id: string, label: string) =>
    setChain((prev) => ({ ...prev, nodes: prev.nodes.map((n) => (n.id === id ? { ...n, label: label || n.label } : n)) }));

  const setRole = (id: string, role: Role) => {
    setChain((prev) => ({ ...prev, nodes: prev.nodes.map((n) => (n.id === id ? { ...n, role } : n)) }));
    setOpenRoleNodeId(null);
  };

  const loadTemplate = (t: Template) => {
    const nodes: ChainNode[] = t.chain.map((c, i) => ({
      id: i === 0 ? 'n-you' : i === t.chain.length - 1 ? 'n-end' : nextId(),
      label: c.label,
      role: c.role,
      position: i,
      locked: i === 0 || i === t.chain.length - 1,
    }));
    const edges: ChainEdge[] = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push({ fromNodeId: nodes[i].id, toNodeId: nodes[i + 1].id });
    }
    setChain({ nodes, edges });
    setOpenRoleNodeId(null);
  };

  const isDirectB2C = nodesOrdered.length === 2;

  return (
    <div className="min-h-screen w-full font-sans" style={{ background: PAPER, color: INK }}>
      {/* Header */}
      <header className="px-7 py-4 border-b sticky top-0 z-30" style={{ borderColor: TAN, background: PAPER }}>
        <div className="font-mono text-[10.5px] tracking-widest uppercase font-semibold" style={{ color: MUTED }}>
          PivotKit · Door A · L10.1
        </div>
        <h1 className="text-[22px] tracking-tight mt-0.5" style={{ fontFamily: 'Georgia, serif' }}>
          Where are you in the value chain?
        </h1>
      </header>

      <div className="grid grid-cols-[1fr_300px] gap-8 px-7 py-6 max-w-[1320px] mx-auto">
        {/* Left — chain canvas */}
        <main>
          <div className="mb-4 text-[13.5px] leading-relaxed" style={{ color: SLATE_FG }}>
            Between you and the person who ultimately uses what you make, how many steps are there?
            Add a node for each link in the chain.
          </div>

          {/* Chain row */}
          <div
            className="rounded-xl border p-6 overflow-x-auto"
            style={{ borderColor: TAN, background: '#fff' }}
          >
            <div className="flex items-start gap-1 min-w-max">
              {nodesOrdered.map((node, i) => {
                const isFirst = i === 0;
                const isLast  = i === nodesOrdered.length - 1;
                return (
                  <span key={node.id} className="flex items-start gap-1">
                    <Node
                      node={node}
                      isFirst={isFirst}
                      isLast={isLast}
                      dropdownOpen={openRoleNodeId === node.id}
                      onToggleDropdown={() => setOpenRoleNodeId((curr) => (curr === node.id ? null : node.id))}
                      onRename={(s) => rename(node.id, s)}
                      onChangeRole={(r) => setRole(node.id, r)}
                      onRemove={() => removeNode(node.id)}
                    />
                    {!isLast && (
                      <ChainArrow
                        onInsert={() => insertBetween(node.id, nodesOrdered[i + 1].id)}
                        note={findEdge(node.id, nodesOrdered[i + 1].id)?.notes}
                        onNoteChange={(n) => setEdgeNote(node.id, nodesOrdered[i + 1].id, n)}
                      />
                    )}
                  </span>
                );
              })}
            </div>

            {/* Hint line under canvas */}
            <div className="mt-5 pt-4 border-t flex items-center gap-3 text-[11.5px]" style={{ borderColor: HAIR, color: MUTED }}>
              <span className="font-mono uppercase tracking-widest font-semibold">tip</span>
              <span style={{ color: SLATE_FG }}>
                Hover any arrow to reveal the <b>+</b> button and insert a link. Click a node&rsquo;s name to rename it.
              </span>
            </div>
          </div>

          {/* Bottom continue */}
          <div className="mt-6 flex items-center gap-4">
            <div className="flex-1">
              {isDirectB2C ? (
                <span
                  className="text-[12.5px] px-3 py-1.5 rounded-md"
                  style={{ background: '#fff7ed', color: AMBER_FG, border: `1px solid ${AMBER_FG}33` }}
                >
                  Most B2B products have intermediate links. Sure you&rsquo;re direct to consumer? You can always come back.
                </span>
              ) : (
                <span className="text-[12.5px]" style={{ color: SLATE_FG }}>
                  {nodesOrdered.length - 2} intermediate link{nodesOrdered.length - 2 === 1 ? '' : 's'} between you and the end user.
                </span>
              )}
            </div>
            <button
              type="button"
              className="px-5 py-2.5 rounded-md text-[13px] font-semibold tracking-tight"
              style={{ background: INK, color: '#fff' }}
            >
              Continue to margin walk &rarr;
            </button>
          </div>
        </main>

        {/* Right rail — mentor voice + templates */}
        <aside>
          {/* Mentor voice */}
          <div className="rounded-lg p-5 border" style={{ borderColor: TAN, background: '#fff' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: GOLD }} />
              <span className="font-mono text-[10px] tracking-widest uppercase font-bold" style={{ color: AMBER_FG }}>
                Monty · mentor voice
              </span>
            </div>
            <p className="text-[13px] leading-relaxed" style={{ color: INK }}>
              Every customer is a consumer eventually. The question is how many people are between you and them.
              Every link takes a margin and has an opinion about your price. The further left you sit in this chain,
              the more people have to agree before you make a sale.
            </p>
          </div>

          {/* Templates */}
          <div className="mt-4">
            <div className="font-mono text-[10px] tracking-widest uppercase font-semibold mb-2" style={{ color: MUTED }}>
              Load a starting template
            </div>
            <div className="flex flex-col gap-2">
              {TEMPLATES.map((t) => (
                <TemplateMini
                  key={t.id}
                  tmpl={t}
                  hovered={hoveredTemplateId === t.id}
                  onHover={setHoveredTemplateId}
                  onLoad={() => loadTemplate(t)}
                />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ChainNode — a single node in the L10.1 value-chain canvas.
//
// First node ("You") gets the teal accent and is locked-but-renameable.
// Last node ("End user") gets coral and is also locked-but-renameable.
// Intermediate nodes are neutral and removable.

import { useState } from 'react';
import {
  CORAL, FONT_MONO, HAIR, INK, MUTED, SLATE_FG, TAN, TEAL, TEAL_LITE, CORAL_LITE,
} from '../../lib/tokens';
import type { ChainNode as ChainNodeT, ChainRole } from '../../lib/doorAState';
import { RoleBadge, CHAIN_ROLE_LABEL } from './RoleBadge';

interface RoleOption { value: ChainRole; label: string; hint: string }

const ROLE_OPTIONS: RoleOption[] = [
  { value: 'maker',       label: 'Maker',       hint: 'Designs / manufactures the underlying product or component.' },
  { value: 'aggregator',  label: 'Aggregator',  hint: 'Bundles inputs from multiple makers.' },
  { value: 'distributor', label: 'Distributor', hint: 'Moves product through wholesale / logistics tiers.' },
  { value: 'retailer',    label: 'Retailer',    hint: 'Sells to the end user. Sets shelf price. Owns the storefront.' },
  { value: 'end-user',    label: 'End user',    hint: 'The person who ultimately uses or consumes the product.' },
  { value: 'other',       label: 'Other',       hint: 'Doesn’t fit any of the above. Add a label that explains it.' },
];

export function ChainNode({
  node, isFirst, isLast, dropdownOpen,
  onToggleDropdown, onRename, onChangeRole, onRemove,
}: {
  node: ChainNodeT;
  isFirst: boolean;
  isLast: boolean;
  dropdownOpen: boolean;
  onToggleDropdown: () => void;
  onRename: (s: string) => void;
  onChangeRole: (r: ChainRole) => void;
  onRemove: () => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const accent = isFirst ? TEAL : isLast ? CORAL : SLATE_FG;
  const accentBg = isFirst ? TEAL_LITE : isLast ? CORAL_LITE : '#fff';

  return (
    <div style={{ position: 'relative', minWidth: 140 }}>
      <div style={{
        borderRadius: 8,
        border: `2px solid ${accent}`,
        background: accentBg,
        padding: '10px 12px',
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6,
        }}>
          <RoleBadge role={node.role} />
          {!node.locked && (
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${node.label}`}
              title="Remove this link"
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: 700, lineHeight: 1,
                color: SLATE_FG, opacity: 0.6, padding: 0,
              }}
            >×</button>
          )}
        </div>

        {editingName ? (
          <input
            autoFocus
            defaultValue={node.label}
            onBlur={(e) => { onRename(e.currentTarget.value || node.label); setEditingName(false); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              if (e.key === 'Escape') setEditingName(false);
            }}
            style={{
              padding: '3px 6px', borderRadius: 4, width: '100%',
              fontSize: 14.5, fontWeight: 600, color: INK,
              background: '#fff', border: `1px solid ${TEAL}`,
              fontFamily: 'inherit',
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingName(true)}
            title="Click to rename"
            style={{
              background: 'transparent', border: 'none', padding: 0,
              textAlign: 'left', cursor: 'text',
              fontSize: 14.5, fontWeight: 600, color: INK,
              lineHeight: 1.25, fontFamily: 'inherit',
            }}
          >{node.label}</button>
        )}

        <button
          type="button"
          onClick={onToggleDropdown}
          style={{
            background: 'transparent', border: 'none', padding: 0,
            textAlign: 'left', cursor: 'pointer',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontFamily: FONT_MONO, fontSize: 10.5,
            color: SLATE_FG, letterSpacing: '0.04em',
          }}
        >
          <span>change role</span>
          <span style={{ color: MUTED }}>{dropdownOpen ? '▴' : '▾'}</span>
        </button>
      </div>

      {dropdownOpen && (
        <div
          role="menu"
          style={{
            position: 'absolute', left: 0, right: 0, top: '100%',
            marginTop: 4, borderRadius: 6,
            border: `1px solid ${TAN}`, background: '#fff',
            boxShadow: '0 6px 16px rgba(11,18,32,0.10)',
            zIndex: 20, overflow: 'hidden',
          }}
        >
          {ROLE_OPTIONS.map((opt, i) => {
            const on = opt.value === node.role;
            return (
              <button
                key={opt.value}
                type="button"
                role="menuitem"
                onClick={() => onChangeRole(opt.value)}
                style={{
                  display: 'flex', flexDirection: 'column', gap: 2,
                  width: '100%', textAlign: 'left',
                  padding: '8px 12px',
                  background: on ? TEAL_LITE : 'transparent',
                  border: 'none', borderTop: i === 0 ? 'none' : `1px solid ${HAIR}`,
                  cursor: 'pointer', fontFamily: 'inherit',
                  color: INK,
                }}
              >
                <span style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 12, fontWeight: 600,
                }}>
                  {opt.label}
                  {on && <span style={{ color: TEAL }}>✓</span>}
                </span>
                <span style={{ fontSize: 10.5, color: SLATE_FG, lineHeight: 1.35 }}>
                  {opt.hint}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { ROLE_OPTIONS, CHAIN_ROLE_LABEL };

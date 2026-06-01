// RouteLane — one "swim lane" in the L10.1 builder: a single route to market,
// rendered as the existing ChainNode / ChainArrow row. The editable lane label
// and the remove-route control appear only when more than one route exists, so
// a single-route chain looks exactly as it did before multi-route support.

import { useState } from 'react';
import { FONT_MONO, INK, MUTED, SLATE_FG, TAN, TEAL } from '../../lib/tokens';
import { nodesOrdered, type ValueRoute, type ChainRole } from '../../lib/doorAState';
import { ChainNode } from './ChainNode';
import { ChainArrow } from './ChainArrow';

export function RouteLane({
  route, showChrome, openNodeId,
  onToggleDropdown, onRenameNode, onChangeRole, onRemoveNode,
  onInsert, onNoteChange, onRenameLane, onRemoveLane,
}: {
  route: ValueRoute;
  /** Show the lane label + remove control (true when >1 route exists). */
  showChrome: boolean;
  /** Node id whose role menu is open in this lane, or null. */
  openNodeId: string | null;
  onToggleDropdown: (nodeId: string) => void;
  onRenameNode: (nodeId: string, label: string) => void;
  onChangeRole: (nodeId: string, role: ChainRole) => void;
  onRemoveNode: (nodeId: string) => void;
  onInsert: (fromId: string, toId: string) => void;
  onNoteChange: (fromId: string, toId: string, note: string) => void;
  onRenameLane: (label: string) => void;
  onRemoveLane: () => void;
}) {
  const [editingLabel, setEditingLabel] = useState(false);
  const nodes = nodesOrdered(route.chain);
  const noteFor = (fromId: string, toId: string) =>
    route.chain.edges.find((e) => e.fromNodeId === fromId && e.toNodeId === toId)?.notes;

  const labelStyle = {
    fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase' as const,
  };

  return (
    <div style={{
      padding: 24, marginBottom: 12, borderRadius: 12,
      border: `1px solid ${TAN}`, background: '#fff', overflowX: 'auto',
    }}>
      {showChrome && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 8, marginBottom: 12,
        }}>
          {editingLabel ? (
            <input
              autoFocus
              defaultValue={route.label}
              onBlur={(e) => { onRenameLane(e.currentTarget.value || route.label); setEditingLabel(false); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                if (e.key === 'Escape') setEditingLabel(false);
              }}
              style={{
                ...labelStyle, padding: '3px 6px', borderRadius: 4,
                color: INK, background: '#fff', border: `1px solid ${TEAL}`,
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingLabel(true)}
              title="Click to rename this route"
              style={{
                ...labelStyle, background: 'transparent', border: 'none',
                padding: 0, cursor: 'text', color: SLATE_FG,
              }}
            >{route.label}</button>
          )}
          <button
            type="button"
            onClick={onRemoveLane}
            aria-label={`Remove route ${route.label}`}
            title="Remove this route"
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontFamily: FONT_MONO, fontSize: 10.5, color: MUTED, padding: '2px 4px',
            }}
          >× remove route</button>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, minWidth: 'max-content' }}>
        {nodes.map((node, i) => {
          const isFirst = i === 0;
          const isLast = i === nodes.length - 1;
          return (
            <span key={node.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
              <ChainNode
                node={node} isFirst={isFirst} isLast={isLast}
                dropdownOpen={openNodeId === node.id}
                onToggleDropdown={() => onToggleDropdown(node.id)}
                onRename={(s) => onRenameNode(node.id, s)}
                onChangeRole={(r) => onChangeRole(node.id, r)}
                onRemove={() => onRemoveNode(node.id)}
              />
              {!isLast && (
                <ChainArrow
                  onInsert={() => onInsert(node.id, nodes[i + 1].id)}
                  note={noteFor(node.id, nodes[i + 1].id)}
                  onNoteChange={(n) => onNoteChange(node.id, nodes[i + 1].id, n)}
                />
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

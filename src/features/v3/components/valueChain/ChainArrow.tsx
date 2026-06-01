// ChainArrow — the arrow between two chain nodes.
//
// Reveals a "+ insert" button on hover OR keyboard focus (a11y: never make
// an interactive control invisible to keyboard users). Edge note is editable
// inline; Escape cancels via a ref flag (so onBlur doesn't accidentally
// save the previous value after the input unmounts).

import { useRef, useState } from 'react';
import {
  FONT_MONO, INK, MUTED, SLATE_FG, STONE, TEAL,
} from '../../lib/tokens';

export function ChainArrow({
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
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '0 4px',
        minWidth: 70, userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <span style={{ flex: 1, height: 1, background: STONE }} />
        <span style={{
          width: 0, height: 0,
          borderTop: '4px solid transparent',
          borderBottom: '4px solid transparent',
          borderLeft: '6px solid #94a3b8',
          marginLeft: -1,
        }} />
      </div>

      <button
        type="button"
        onClick={onInsert}
        onFocus={() => setInsertFocused(true)}
        onBlur={() => setInsertFocused(false)}
        aria-label="Insert a link here"
        style={{
          position: 'absolute', top: -12, left: '50%',
          transform: 'translateX(-50%)',
          width: 20, height: 20, borderRadius: '50%',
          background: '#fff', border: `1px solid ${TEAL}`,
          color: TEAL, fontWeight: 700, fontSize: 12, lineHeight: 1,
          cursor: 'pointer', padding: 0,
          opacity: insertVisible ? 1 : 0.15,
          transition: 'opacity .15s',
        }}
      >+</button>

      <button
        type="button"
        onClick={() => { cancelledRef.current = false; setEditing(true); }}
        title={note || 'Click to add a flow note'}
        style={{
          marginTop: 4, background: 'transparent', border: 'none',
          padding: 0, cursor: 'pointer',
          fontFamily: FONT_MONO, fontSize: 10,
          letterSpacing: '0.04em', textAlign: 'center',
          color: note ? SLATE_FG : MUTED,
          fontStyle: note ? 'normal' : 'italic',
          maxWidth: 120, overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}
      >{editing ? '' : note ? note : '+ flow note'}</button>

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
          placeholder="$ amount, terms, what flows…"
          style={{
            marginTop: 4, width: 128, textAlign: 'center',
            padding: '2px 6px', borderRadius: 4,
            border: `1px solid ${TEAL}`, color: INK,
            fontFamily: FONT_MONO, fontSize: 10, background: '#fff',
          }}
        />
      )}
    </div>
  );
}

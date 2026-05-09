// Floating tweaks panel — simplified port of tweaks-panel.jsx.
// Drops the host-protocol bridge (the design-tool-only piece) and keeps the
// visual control library (sections, segmented radios, selects).

import { useEffect, useRef, useState, type ReactNode } from 'react';

const TWEAKS_STYLE = `
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    background:rgba(250,249,247,.92);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:pointer;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;
    color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}
  .twk-field{appearance:none;width:100%;height:26px;padding:0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;
    background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
  .twk-field:focus{border-color:rgba(0,0,0,.25);background:rgba(255,255,255,.85)}
  select.twk-field{padding-right:22px;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 8px center}
  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:6px;cursor:pointer;padding:4px 6px;line-height:1.2;
    overflow-wrap:anywhere}
  .twk-toggle-btn{appearance:none;border:.5px solid rgba(0,0,0,.1);background:rgba(255,255,255,.6);
    color:inherit;font:inherit;border-radius:6px;padding:5px 10px;cursor:pointer}
  .twk-toggle-btn:hover{background:rgba(255,255,255,.85)}
`;

interface OptionT<T> {
  value: T;
  label: string;
}

export function TweaksPanel({
  title = 'Tweaks', children,
}: { title?: string; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  const [hidden, setHidden] = useState(false);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const offsetRef = useRef({ x: 16, y: 16 });
  const PAD = 16;

  const clampToViewport = () => {
    const panel = dragRef.current;
    if (!panel) return;
    const w = panel.offsetWidth;
    const h = panel.offsetHeight;
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y)),
    };
    panel.style.right = `${offsetRef.current.x}px`;
    panel.style.bottom = `${offsetRef.current.y}px`;
  };

  useEffect(() => {
    if (!open) return;
    clampToViewport();
    window.addEventListener('resize', clampToViewport);
    return () => window.removeEventListener('resize', clampToViewport);
  }, [open]);

  const onDragStart = (e: React.MouseEvent) => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX;
    const sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = (ev: MouseEvent) => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy),
      };
      clampToViewport();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  if (!open) return null;
  if (hidden) {
    return (
      <>
        <style>{TWEAKS_STYLE}</style>
        <button
          type="button"
          onClick={() => setHidden(false)}
          style={{
            position: 'fixed', right: 16, bottom: 16, zIndex: 2147483646,
            padding: '10px 14px', borderRadius: 999,
            background: 'rgba(11,18,32,.92)', color: '#fff',
            border: 'none', cursor: 'pointer',
            font: '12px/1.2 ui-sans-serif,system-ui,-apple-system,sans-serif',
            fontWeight: 500,
            boxShadow: '0 6px 20px rgba(0,0,0,.2)',
          }}
        >Tweaks</button>
      </>
    );
  }
  return (
    <>
      <style>{TWEAKS_STYLE}</style>
      <div
        ref={dragRef}
        className="twk-panel"
        style={{ right: offsetRef.current.x, bottom: offsetRef.current.y }}
      >
        <div className="twk-hd" onMouseDown={onDragStart}>
          <b>{title}</b>
          <button
            type="button"
            className="twk-x"
            aria-label="Close tweaks"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => setHidden(true)}
          >✕</button>
        </div>
        <div className="twk-body">{children}</div>
      </div>
    </>
  );
}

export function TweakSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <div className="twk-sect">{label}</div>
      {children}
    </>
  );
}

export function TweakRow({
  label, value, children,
}: { label: string; value?: ReactNode; children: ReactNode }) {
  return (
    <div className="twk-row">
      <div className="twk-lbl">
        <span>{label}</span>
        {value != null && <span className="twk-val">{value}</span>}
      </div>
      {children}
    </div>
  );
}

export function TweakRadio<T extends string>({
  label, value, options, onChange,
}: {
  label: string;
  value: T;
  options: OptionT<T>[];
  onChange: (v: T) => void;
}) {
  // If labels are too long, fall back to a select.
  const maxLen = options.reduce((m, o) => Math.max(m, o.label.length), 0);
  const fitsAsSegments = maxLen <= ({ 2: 16, 3: 10 } as Record<number, number>)[options.length] || false;
  if (!fitsAsSegments) {
    return <TweakSelect label={label} value={value} options={options} onChange={onChange} />;
  }
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  const n = options.length;

  return (
    <TweakRow label={label}>
      <div className="twk-seg" role="radiogroup">
        <div
          className="twk-seg-thumb"
          style={{
            left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
            width: `calc((100% - 4px) / ${n})`,
          }}
        />
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            onClick={() => onChange(o.value)}
          >{o.label}</button>
        ))}
      </div>
    </TweakRow>
  );
}

export function TweakSelect<T extends string>({
  label, value, options, onChange,
}: {
  label: string;
  value: T;
  options: OptionT<T>[];
  onChange: (v: T) => void;
}) {
  return (
    <TweakRow label={label}>
      <select
        className="twk-field"
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </TweakRow>
  );
}

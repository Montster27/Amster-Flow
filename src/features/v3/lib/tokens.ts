// PivotKit v3 — visual tokens.
//
// Palette constants pulled out of components/atoms.tsx and DoorAPage so the
// new Door A step UIs (and any future component) can reference one source of
// truth instead of re-inlining hex codes.
//
// Existing files continue to inline these for now — do not refactor in this
// pass (per AI_RULES §5.2, no silent refactors). New code should import here.

// ── Base palette ──
export const PAPER       = '#fbfaf7'; // warm-paper background
export const INK         = '#0b1220'; // primary text / dark navy
export const TAN         = '#e8dfc9'; // warm tan border
export const TAN_DARK    = '#d6cfb8'; // darker tan (form borders)
export const CREAM       = '#f4f1ea'; // right-rail / muted card

// ── Accents ──
export const TEAL        = '#0f766e'; // primary action / pass
export const TEAL_LITE   = '#dcf2ec'; // selected row background
export const TEAL_SOFT   = '#e6f4f1'; // softer teal background
export const GOLD        = '#fcd34d'; // highlight dot / star fill
export const CORAL       = '#d97757'; // end-user accent
export const CORAL_LITE  = '#fbe9df'; // end-user soft background

// ── Amber (warnings) ──
export const AMBER       = '#f59e0b';
export const AMBER_FG    = '#b45309';
export const AMBER_DARK  = '#92400e';
export const AMBER_BG    = '#fef3c7';
export const AMBER_SOFT  = '#fff8eb';
export const AMBER_LINE  = '#fde68a';

// ── Slate / greys ──
export const SLATE_DEEP  = '#1e293b';
export const SLATE_FG    = '#475569'; // body secondary
export const SLATE       = '#64748b'; // muted label
export const MUTED       = '#94a3b8'; // de-emphasized
export const HAIR        = '#f1f5f9'; // hairline / row stripe
export const STONE       = '#cbd5e1'; // dim border / disabled

// ── Status ──
export const ERROR_FG    = '#be123c';

// ── Typography ──
export const FONT_MONO  = 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace';
export const FONT_SERIF = '"Instrument Serif", Georgia, serif';
export const FONT_SANS  = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';

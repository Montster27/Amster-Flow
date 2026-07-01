import { ActorCategory, ACTOR_TYPE_META } from '../../types/visualSectorMap';
import { FONT_MONO } from '../../features/v3/lib/tokens';

interface ActorTypeChipProps {
  category: ActorCategory;
  size?: number;
}

// Letter-chip identity for an actor category — replaces the emoji icon on
// the Actors step (rail, type picker, placed nodes).
export function ActorTypeChip({ category, size = 24 }: ActorTypeChipProps) {
  const meta = ACTOR_TYPE_META[category];
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: size, height: size, borderRadius: Math.round(size * 0.28),
        background: meta.bg, color: meta.fg,
        fontFamily: FONT_MONO, fontSize: Math.round(size * 0.5), fontWeight: 700,
        flexShrink: 0, lineHeight: 1,
      }}
    >
      {meta.letter}
    </span>
  );
}

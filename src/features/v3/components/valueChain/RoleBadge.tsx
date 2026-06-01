// RoleBadge — small uppercase chip identifying a chain node's role.
//
// Color-coded per role: "end-user" gets coral, all other roles share a
// neutral slate. Used inside ChainNode + chain-template previews.

import {
  CORAL, CORAL_LITE, FONT_MONO, HAIR, SLATE_FG,
} from '../../lib/tokens';
import type { ChainRole } from '../../lib/doorAState';

const LABEL_BY_ROLE: Record<ChainRole, string> = {
  'maker': 'Maker',
  'aggregator': 'Aggregator',
  'distributor': 'Distributor',
  'retailer': 'Retailer',
  'end-user': 'End user',
  'other': 'Other',
};

export function RoleBadge({ role }: { role: ChainRole }) {
  const isEndUser = role === 'end-user';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 6px', borderRadius: 3,
      background: isEndUser ? CORAL_LITE : HAIR,
      color: isEndUser ? CORAL : SLATE_FG,
      fontFamily: FONT_MONO, fontSize: 9.5,
      letterSpacing: '0.12em', textTransform: 'uppercase',
      fontWeight: 700,
    }}>{LABEL_BY_ROLE[role]}</span>
  );
}

export const CHAIN_ROLE_LABEL = LABEL_BY_ROLE;

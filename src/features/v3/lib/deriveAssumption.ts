// deriveAssumption — project an L11 pain + its L09 solution row into a derived
// assumption claim, plus the bulk rebuild that keeps the persisted snapshot in
// lockstep with the live rows.
//
// Pure. Imports only TYPES from doorAState (erased at runtime) plus two pure
// selectors, so the dependency runs one way (here → doorAState) with no cycle.
//
// OUT OF SCOPE (deliberately not produced here): the per-row doubt-meter STATE
// LINE (deriveStateLine). That copy is in Monty's voice and pending his review.

import {
  getPains,
  getSolutionRow,
  type DerivedAssumption,
  type DoorAState,
  type EvidenceStar,
  type Pain,
  type SolutionRow,
} from './doorAState';

/** Derive the assumption a single filled solution row implies:
 *  `${segment} will ${solutionText} because ${pain.text}.`
 *  Returns null when the row is missing or its solutionText is blank — an
 *  unaddressed pain yields no claim. */
export function deriveAssumption({
  segment,
  pain,
  solution,
}: {
  segment: string;
  pain: Pick<Pain, 'id' | 'text'>;
  solution: Pick<SolutionRow, 'solutionText' | 'evidenceStar'> | null | undefined;
}): DerivedAssumption | null {
  if (!solution || solution.solutionText.trim().length === 0) return null;
  const evidenceStar: EvidenceStar = solution.evidenceStar ?? 1;
  return {
    painId: pain.id,
    text: `${segment} will ${solution.solutionText} because ${pain.text}.`,
    evidenceStar,
    needsRederive: false,
  };
}

/** Rebuild the derived-assumption snapshot from live state: one claim per
 *  FILLED pain row, in stable pain order. Unaddressed pains contribute nothing.
 *  This is what the L09 screen persists so the Assumption stack can later
 *  re-derive a single changed pain. */
export function rebuildDerivedAssumptions(state: DoorAState, segment: string): DerivedAssumption[] {
  return getPains(state)
    .map((pain) => deriveAssumption({ segment, pain, solution: getSolutionRow(state, pain.id) }))
    .filter((a): a is DerivedAssumption => a !== null);
}

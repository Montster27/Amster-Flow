import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { StackNavigator } from '../components/StackNavigator';
import { PK_LAYERS, type LayerStateRow } from '../lib/layers';

const stack: Record<string, LayerStateRow | undefined> = {
  worldImpact: { layer_id: 'worldImpact', claim_text: 'leave the world better' },
  customerSegment: { layer_id: 'customerSegment', claim_text: 'SMB ops leads', source_value: 'interviews' },
  businessModel: { layer_id: 'businessModel', claim_text: 'per-seat SaaS', source_value: 'logical' },
  solution: { layer_id: 'solution', claim_text: 'a dashboard', source_value: 'prototype' },
};

function setup(overrides: Partial<Parameters<typeof StackNavigator>[0]> = {}) {
  const onSelect = vi.fn();
  render(
    <StackNavigator
      stack={stack}
      selectedLayerId="customerSegment"
      onSelect={onSelect}
      perspective="all"
      heatLayerIds={new Set(['solution'])}
      assumptionLayerIds={new Set()}
      {...overrides}
    />,
  );
  return { onSelect };
}

describe('StackNavigator', () => {
  it('renders all 16 layers in canonical grouped order', () => {
    setup();
    for (const L of PK_LAYERS) {
      expect(screen.getByRole('button', { name: new RegExp(`^${L.name}\\.`) })).toBeInTheDocument();
    }
    expect(screen.getByText('Strategy & Vision')).toBeInTheDocument();
    expect(screen.getByText('Investor-critical core')).toBeInTheDocument();
    expect(screen.getByText('Execution & Build')).toBeInTheDocument();
  });

  it('selects a layer on click', async () => {
    const user = userEvent.setup();
    const { onSelect } = setup();
    await user.click(screen.getByRole('button', { name: /^Problem\./ }));
    expect(onSelect).toHaveBeenCalledWith('problem');
  });

  it('builds accessible names from name + state + evidence strength', () => {
    setup();
    // interviews on customerSegment → tier 4 → "Strong"; has a claim → Supported
    const cs = screen.getByRole('button', { name: /^Customer Segment\./ });
    expect(cs).toHaveAttribute('aria-current', 'true');
    expect(cs.getAttribute('aria-label')).toMatch(/Supported/);
    expect(cs.getAttribute('aria-label')).toMatch(/Evidence Strong/);
    // empty layer reads Empty
    expect(screen.getByRole('button', { name: /^Problem\./ }).getAttribute('aria-label')).toMatch(/Empty/);
  });

  it('shows no perspective marker until a perspective is chosen', () => {
    const { } = setup({ perspective: 'all' });
    expect(screen.getByRole('button', { name: /^Customer Segment\./ }).getAttribute('aria-label'))
      .not.toMatch(/In focus/);
  });

  it('marks relevant layers once a perspective is active, but a risk flag wins the slot', () => {
    setup({ perspective: 'investor' });
    expect(screen.getByRole('button', { name: /^Customer Segment\./ }).getAttribute('aria-label'))
      .toMatch(/In focus for Investor/);
    // solution is investor-relevant AND has heat → risk flag, not the role marker
    const sol = screen.getByRole('button', { name: /^Solution\./ });
    expect(sol.getAttribute('aria-label')).toMatch(/Has a risk flag/);
  });

  it('dims non-matching rows under a filter without removing them, and restores via Show all', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: 'Empty' }));
    // customerSegment is supported → dimmed, but still present
    const cs = screen.getByRole('button', { name: /^Customer Segment\./ });
    expect(cs).toBeInTheDocument();
    expect(cs.style.opacity).toBe('0.4');
    // an empty layer stays fully visible
    expect(screen.getByRole('button', { name: /^Problem\./ }).style.opacity).toBe('1');

    await user.click(screen.getByRole('button', { name: /show all layers/i }));
    expect(screen.getByRole('button', { name: /^Customer Segment\./ }).style.opacity).toBe('1');
  });

  it('moves focus with the Down arrow (roving tab stop)', () => {
    setup();
    const cs = screen.getByRole('button', { name: /^Customer Segment\./ });
    cs.focus();
    fireEvent.keyDown(cs, { key: 'ArrowDown' });
    // customerSegment is followed by solution in the critical group
    expect(screen.getByRole('button', { name: /^Solution\./ })).toHaveFocus();
  });
});

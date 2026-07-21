// Tests for the glossary affordances that keep framework jargon explained in
// the primary guided view: the reusable <Term> tooltip (acronym/term
// expansion on hover/focus) and the CategoryBadge's "Investor-critical"
// definition. Both must be reachable and dismissible by keyboard.

import { CategoryBadge, Term } from '../components/atoms';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

describe('Term (glossary tooltip)', () => {
  it('shows the plain-language definition on focus and wires aria-describedby', async () => {
    const user = userEvent.setup();
    render(<Term definition="Customer–Problem Fit: evidence a group has the problem.">CPF</Term>);

    const trigger = screen.getByText('CPF');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    await user.tab();
    expect(trigger).toHaveFocus();

    const tip = screen.getByRole('tooltip');
    expect(tip).toHaveTextContent(/Customer–Problem Fit/);
    expect(trigger).toHaveAttribute('aria-describedby', tip.getAttribute('id'));
  });

  it('dismisses the definition on Escape (WCAG content-on-hover)', async () => {
    const user = userEvent.setup();
    render(<Term definition="A layer is one building block.">layer</Term>);

    await user.tab();
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});

describe('CategoryBadge "Investor-critical" definition', () => {
  it('renders the term and reveals a plain-language definition on focus', async () => {
    const user = userEvent.setup();
    render(<CategoryBadge cat="critical" />);

    expect(screen.getByText('Investor-critical')).toBeInTheDocument();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    await user.tab();
    expect(screen.getByRole('tooltip')).toHaveTextContent(/investors press on first/i);
  });
});

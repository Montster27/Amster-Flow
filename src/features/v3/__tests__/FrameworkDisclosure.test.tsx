// Tests for the progressive-disclosure control that hides the PivotKit
// framework (stage gates, evidence-strength totals, step list) behind a single
// collapsed section. Covers: the disclosure control itself, persisted
// open/closed state (survives remount = navigating between guided steps /
// reload), keyboard operation, and the collapsed default that keeps the mobile
// primary view uncluttered.

import { useFrameworkDisclosure, FrameworkDisclosure } from '../components/FrameworkDisclosure';
import { render, screen, renderHook, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

const KEY = 'pk:test:framework';

// A minimal harness that wires the hook to the component the way DoorAPage does.
function Harness({ storageKey = KEY }: { storageKey?: string }) {
  const fw = useFrameworkDisclosure(storageKey);
  return (
    <FrameworkDisclosure open={fw.open} onToggle={fw.toggle}>
      <div>Stage gates and evidence strength</div>
    </FrameworkDisclosure>
  );
}

describe('FrameworkDisclosure', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('is collapsed by default and hides the framework content', () => {
    render(<Harness />);
    const toggle = screen.getByRole('button', { name: /see progress and framework/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    // Collapsed = framework content not in the accessibility tree / DOM.
    expect(screen.queryByText('Stage gates and evidence strength')).not.toBeInTheDocument();
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('is full-width so it stacks cleanly on a mobile viewport', () => {
    render(<Harness />);
    const toggle = screen.getByRole('button', { name: /see progress and framework/i });
    expect(toggle.style.width).toBe('100%');
  });

  it('expands on click, revealing the framework content in a labelled region', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const toggle = screen.getByRole('button', { name: /see progress and framework/i });

    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const region = screen.getByRole('region', { name: /see progress and framework/i });
    expect(region).toBeInTheDocument();
    expect(screen.getByText('Stage gates and evidence strength')).toBeInTheDocument();
    // The button's aria-controls points at the revealed region.
    expect(toggle.getAttribute('aria-controls')).toBe(region.getAttribute('id'));
  });

  it('can be operated with the keyboard (Tab to focus, Enter to toggle)', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const toggle = screen.getByRole('button', { name: /see progress and framework/i });

    await user.tab();
    expect(toggle).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await user.keyboard(' '); // Space also toggles a native button
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('persists the open state across a remount (navigating between steps)', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Harness />);
    await user.click(screen.getByRole('button', { name: /see progress and framework/i }));
    expect(window.localStorage.getItem(KEY)).toBe('1');
    unmount();

    // A fresh mount (as when the founder jumps to another guided step) reads the
    // persisted choice and comes up expanded.
    render(<Harness />);
    expect(screen.getByRole('button', { name: /see progress and framework/i }))
      .toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Stage gates and evidence strength')).toBeInTheDocument();
  });

  it('persists the collapsed state too', async () => {
    window.localStorage.setItem(KEY, '1');
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: /see progress and framework/i }));
    expect(window.localStorage.getItem(KEY)).toBe('0');
  });
});

describe('useFrameworkDisclosure', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('defaults to closed when nothing is stored', () => {
    const { result } = renderHook(() => useFrameworkDisclosure(KEY));
    expect(result.current.open).toBe(false);
  });

  it('honors an explicit defaultOpen when storage is empty', () => {
    const { result } = renderHook(() => useFrameworkDisclosure(KEY, true));
    expect(result.current.open).toBe(true);
  });

  it('reads the initial value synchronously from storage', () => {
    window.localStorage.setItem(KEY, '1');
    const { result } = renderHook(() => useFrameworkDisclosure(KEY));
    expect(result.current.open).toBe(true);
  });

  it('setOpen writes through to storage', () => {
    const { result } = renderHook(() => useFrameworkDisclosure(KEY));
    act(() => result.current.setOpen(true));
    expect(result.current.open).toBe(true);
    expect(window.localStorage.getItem(KEY)).toBe('1');
  });

  it('scopes state per storage key (different guided ventures stay independent)', () => {
    window.localStorage.setItem('pk:doorA:v1:framework', '1');
    const { result: a } = renderHook(() => useFrameworkDisclosure('pk:doorA:v1:framework'));
    const { result: b } = renderHook(() => useFrameworkDisclosure('pk:doorA:v2:framework'));
    expect(a.current.open).toBe(true);
    expect(b.current.open).toBe(false);
  });
});

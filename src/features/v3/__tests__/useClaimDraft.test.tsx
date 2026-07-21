import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useClaimDraft } from '../hooks/useClaimDraft';

describe('useClaimDraft', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('saves the trimmed claim after the debounce', async () => {
    const saveClaim = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useClaimDraft({ externalClaim: '', saveClaim, debounceMs: 1000 }));

    act(() => result.current.setClaim('  hello  '));
    expect(saveClaim).not.toHaveBeenCalled();

    await act(async () => { vi.advanceTimersByTime(1000); });
    expect(saveClaim).toHaveBeenCalledWith('hello');
  });

  it('flush() saves immediately when dirty and is a no-op when unchanged', async () => {
    const saveClaim = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useClaimDraft({ externalClaim: '', saveClaim, debounceMs: 1000 }));

    act(() => result.current.setClaim('hi'));
    await act(async () => { await result.current.flush(); });
    expect(saveClaim).toHaveBeenCalledWith('hi');

    saveClaim.mockClear();
    await act(async () => { await result.current.flush(); });
    expect(saveClaim).not.toHaveBeenCalled();
  });

  it('clearing an existing claim saves null', async () => {
    const saveClaim = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useClaimDraft({ externalClaim: 'existing', saveClaim, debounceMs: 1000 }));

    act(() => result.current.setClaim('   '));
    await act(async () => { await result.current.flush(); });
    expect(saveClaim).toHaveBeenCalledWith(null);
  });

  it('flushes unsaved text on unmount (switching layers never loses text)', async () => {
    const saveClaim = vi.fn().mockResolvedValue(undefined);
    const { result, unmount } = renderHook(() => useClaimDraft({ externalClaim: '', saveClaim, debounceMs: 1000 }));

    act(() => result.current.setClaim('draft in progress')); // debounce not yet fired
    expect(saveClaim).not.toHaveBeenCalled();

    await act(async () => { unmount(); });
    expect(saveClaim).toHaveBeenCalledWith('draft in progress');
  });

  it('syncs from an external value, but never over unsaved local edits', () => {
    const saveClaim = vi.fn().mockResolvedValue(undefined);
    const { result, rerender } = renderHook(
      ({ ext }) => useClaimDraft({ externalClaim: ext, saveClaim, debounceMs: 1000 }),
      { initialProps: { ext: '' } },
    );

    // External load with no local edits → adopt it.
    rerender({ ext: 'from server' });
    expect(result.current.claim).toBe('from server');

    // User is mid-edit → a refetch must not clobber their text.
    act(() => result.current.setClaim('my unsaved edit'));
    rerender({ ext: 'server changed again' });
    expect(result.current.claim).toBe('my unsaved edit');
  });
});

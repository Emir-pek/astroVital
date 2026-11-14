import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useNow } from '@core/hooks';

describe('useNow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-14T12:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('returns the current time and advances every interval', () => {
    const { result } = renderHook(() => useNow(1000));
    const first = result.current.getTime();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.getTime()).toBe(first + 1000);
  });

  it('shares ONE interval between many components and stops when all unmount', () => {
    const setSpy = vi.spyOn(window, 'setInterval');
    const clearSpy = vi.spyOn(window, 'clearInterval');
    const a = renderHook(() => useNow(5000));
    const b = renderHook(() => useNow(5000));
    expect(setSpy.mock.calls.filter(([, ms]) => ms === 5000)).toHaveLength(1);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(a.result.current.getTime()).toBe(b.result.current.getTime());
    a.unmount();
    expect(clearSpy).not.toHaveBeenCalled();
    b.unmount();
    expect(clearSpy).toHaveBeenCalledTimes(1);
  });
});

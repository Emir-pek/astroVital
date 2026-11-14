import { beforeEach, describe, expect, it } from 'vitest';
import type { Assessment } from '@core/types';
import { MS_PER_HOUR } from '@core/utils';
import { SNOOZE_MS, alertKey, buildAlertQueue } from '../services/alertQueue';
import { useAlertAckStore } from '../store/useAlertAckStore';

const now = new Date('2026-11-14T12:00:00Z');

function a(metric: string, status: Assessment['status'], measurementId?: string): Assessment {
  return { crewId: 'c1', metric, status, measurementId } as unknown as Assessment;
}

const empty = { acknowledged: {}, snoozedUntil: {} };

describe('buildAlertQueue', () => {
  it('orders blocking and strip groups', () => {
    const adv = a('spo2', 'advisory', 'm1');
    const cau = a('heartRate', 'caution', 'm2');
    const warnAcked = a('systolicBP', 'warning', 'm3');
    const warn = a('bodyTemp', 'warning', 'm4');
    const state = { acknowledged: { [alertKey(warnAcked)]: now.toISOString() }, snoozedUntil: {} };
    const q = buildAlertQueue([adv, cau, warnAcked, warn, a('x', 'nominal')], state, now);
    expect(q.blocking).toEqual([warn]);
    expect(q.strip).toEqual([warnAcked, cau, adv]);
  });

  it('hides snoozed caution until the snooze expires', () => {
    useAlertAckStore.getState().reset();
    const cau = a('heartRate', 'caution', 'm2');
    useAlertAckStore.getState().snooze(alertKey(cau), now);
    const s = useAlertAckStore.getState();
    expect(buildAlertQueue([cau], s, new Date(now.getTime() + MS_PER_HOUR)).strip).toEqual([]);
    expect(buildAlertQueue([cau], s, new Date(now.getTime() + SNOOZE_MS + 1)).strip).toEqual([cau]);
  });

  it('ignores snooze for warnings', () => {
    const w = a('bodyTemp', 'warning', 'm4');
    const state = { acknowledged: {}, snoozedUntil: { [alertKey(w)]: '2030-01-01T00:00:00Z' } };
    expect(buildAlertQueue([w], state, now).blocking).toEqual([w]);
  });

  it('uses measurementId in the key', () => {
    expect(alertKey(a('m', 'warning'))).toBe('c1:m:latest');
    expect(alertKey(a('m', 'warning', 'x'))).toBe('c1:m:x');
    expect(
      buildAlertQueue(
        [a('m', 'warning', 'new')],
        { ...empty, acknowledged: { 'c1:m:old': 'x' } },
        now,
      ).blocking,
    ).toHaveLength(1);
  });
});

describe('useAlertAckStore', () => {
  beforeEach(() => useAlertAckStore.getState().reset());
  it('acknowledges and resets', () => {
    useAlertAckStore.getState().acknowledge('k', now);
    expect(useAlertAckStore.getState().acknowledged.k).toBe(now.toISOString());
    useAlertAckStore.getState().snooze('k', now);
    expect(useAlertAckStore.getState().snoozedUntil.k).toBe(
      new Date(now.getTime() + SNOOZE_MS).toISOString(),
    );
    useAlertAckStore.getState().reset();
    expect(useAlertAckStore.getState().acknowledged).toEqual({});
    expect(useAlertAckStore.getState().snoozedUntil).toEqual({});
  });
});

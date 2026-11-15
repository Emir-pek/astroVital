import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { migrateHealthState, STORE_VERSION, useHealthStore } from '@core/store';
import { DemoDataBootstrap } from '../providers/DemoDataBootstrap';

describe('<DemoDataBootstrap/> (ADR-009, ADR-044)', () => {
  beforeEach(() => useHealthStore.getState().resetAll());

  it('loads demo data on an empty device when autoLoadDemo is on (default)', () => {
    expect(useHealthStore.getState().settings.autoLoadDemo).toBe(true);
    render(<DemoDataBootstrap />);
    expect(useHealthStore.getState().measurements.length).toBeGreaterThan(0);
  });

  it('stays empty when autoLoadDemo is off', () => {
    useHealthStore.getState().updateSettings({ autoLoadDemo: false });
    render(<DemoDataBootstrap />);
    expect(useHealthStore.getState().measurements).toHaveLength(0);
  });

  it('resetAll keeps the autoLoadDemo preference', () => {
    useHealthStore.getState().updateSettings({ autoLoadDemo: false });
    useHealthStore.getState().resetAll();
    expect(useHealthStore.getState().settings.autoLoadDemo).toBe(false);
  });
});

describe('migrateHealthState', () => {
  it('v1 → v2 adds autoLoadDemo = true and keeps existing settings', () => {
    expect(STORE_VERSION).toBe(2);
    const v1 = { measurements: [], settings: { language: 'tr', seed: 7 } };
    const out = migrateHealthState(v1, 1) as { settings: Record<string, unknown> };
    expect(out.settings).toMatchObject({ language: 'tr', seed: 7, autoLoadDemo: true });
  });

  it('current version and junk pass through unchanged', () => {
    const v2 = { settings: { autoLoadDemo: false } };
    expect(migrateHealthState(v2, 2)).toBe(v2);
    expect(migrateHealthState(null, 1)).toBeNull();
  });
});

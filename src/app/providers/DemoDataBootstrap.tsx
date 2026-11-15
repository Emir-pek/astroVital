import { useEffect } from 'react';
import { useHealthStore } from '@core/store';

/**
 * Runs ONCE per app start: if the device has no data yet AND auto-load is on
 * (`settings.autoLoadDemo`, default true), load deterministic demo data so the jury never sees an
 * empty app. A "Reset all data" during the session is respected (stays empty until the next start
 * or until "Load demo data"). See docs/DECISIONS.md ADR-009, ADR-044.
 */
export function DemoDataBootstrap() {
  useEffect(() => {
    const { measurements, demoLoadedAt, settings, loadDemoData } = useHealthStore.getState();
    if (settings.autoLoadDemo && measurements.length === 0 && demoLoadedAt === null) loadDemoData();
  }, []);
  return null;
}

import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react';
import { createHashRouter, type RouteObject } from 'react-router';
import { AppShell } from './layout/AppShell';
import { StatusPage } from './pages/StatusPage';

/**
 * Page-level code splitting (ADR-021, ADR-044): every page except the landing Status page is its own
 * chunk, fetched from the same static folder on first visit (offline-first: no network beyond the
 * app's own files). Status stays in the main chunk so the first screen never waits.
 */
const page = <K extends string>(
  load: () => Promise<Record<K, ComponentType>>,
  name: K,
): LazyExoticComponent<ComponentType> => lazy(async () => ({ default: (await load())[name] }));

const MeasurePage = page(() => import('./pages/MeasurePage'), 'MeasurePage');
const HistoryPage = page(() => import('./pages/HistoryPage'), 'HistoryPage');
const TeamPage = page(() => import('./pages/TeamPage'), 'TeamPage');
const RoutinePage = page(() => import('./pages/RoutinePage'), 'RoutinePage');
const EmergencyPage = page(() => import('./pages/EmergencyPage'), 'EmergencyPage');
const SettingsPage = page(() => import('./pages/SettingsPage'), 'SettingsPage');
const NotFoundPage = page(() => import('./pages/NotFoundPage'), 'NotFoundPage');

/** Lazy page inside Suspense. Local chunks load in milliseconds, so the fallback is empty. */
const withSuspense = (Page: LazyExoticComponent<ComponentType>) => (
  <Suspense fallback={null}>
    <Page />
  </Suspense>
);

/** Route table. The URL contract is documented in docs/CONTRACTS.md (Routes). */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <StatusPage /> },
      { path: 'measure', element: withSuspense(MeasurePage) },
      { path: 'history', element: withSuspense(HistoryPage) },
      { path: 'team', element: withSuspense(TeamPage) },
      { path: 'routine', element: withSuspense(RoutinePage) },
      { path: 'emergency', element: withSuspense(EmergencyPage) },
      { path: 'settings', element: withSuspense(SettingsPage) },
      { path: '*', element: withSuspense(NotFoundPage) },
    ],
  },
];

/**
 * Hash routing: works from any static folder / file share without server rewrites
 * (offline-first, see docs/DECISIONS.md ADR-007).
 */
export const createAppRouter = () => createHashRouter(routes);

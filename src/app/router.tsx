import { createHashRouter, type RouteObject } from 'react-router';
import { AppShell } from './layout/AppShell';
import { AlertsPage } from './pages/AlertsPage';
import { CrewIndexRedirect, CrewMemberPage } from './pages/CrewMemberPage';
import { DashboardPage } from './pages/DashboardPage';
import { LearnPage } from './pages/LearnPage';
import { LogMeasurementPage } from './pages/LogMeasurementPage';
import { MissionPage } from './pages/MissionPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { SettingsPage } from './pages/SettingsPage';

/** Route table — the URL contract is documented in docs/CONTRACTS.md § Routes. */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'crew', element: <CrewIndexRedirect /> },
      { path: 'crew/:id', element: <CrewMemberPage /> },
      { path: 'log', element: <LogMeasurementPage /> },
      { path: 'alerts', element: <AlertsPage /> },
      { path: 'learn', element: <LearnPage /> },
      { path: 'mission', element: <MissionPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

/**
 * Hash routing: works from any static folder / file share without server rewrites
 * (offline-first, see docs/DECISIONS.md ADR-007).
 */
export const createAppRouter = () => createHashRouter(routes);

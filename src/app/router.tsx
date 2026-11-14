import { createHashRouter, type RouteObject } from 'react-router';
import { AppShell } from './layout/AppShell';
import { EmergencyPage } from './pages/EmergencyPage';
import { HistoryPage } from './pages/HistoryPage';
import { MeasurePage } from './pages/MeasurePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RoutinePage } from './pages/RoutinePage';
import { SettingsPage } from './pages/SettingsPage';
import { StatusPage } from './pages/StatusPage';
import { TeamPage } from './pages/TeamPage';

/** Route table. The URL contract is documented in docs/CONTRACTS.md (Routes). */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <StatusPage /> },
      { path: 'measure', element: <MeasurePage /> },
      { path: 'history', element: <HistoryPage /> },
      { path: 'team', element: <TeamPage /> },
      { path: 'routine', element: <RoutinePage /> },
      { path: 'emergency', element: <EmergencyPage /> },
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

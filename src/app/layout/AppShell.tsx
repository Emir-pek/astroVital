import { motion, useReducedMotion } from 'framer-motion';
import { Outlet, useLocation } from 'react-router';
import { useHealthStore } from '@core/store';
import { AlertLayer } from '@modules/visualization';
import { Disclaimer } from './Disclaimer';
import { PortraitNotice } from './PortraitNotice';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

/**
 * Global layout, one viewport tall (ADR-036): left navigation + top bar + alert-strip row (only
 * while there is an alert, and not on the Status page, which places it in its own right column)
 * + the page, which scrolls on its own, and the disclaimer as a fixed
 * bottom row, so it is visible on every page without scrolling and the top bar never covers
 * content.
 */
export function AppShell() {
  const { pathname } = useLocation();
  const reduceMotion = useReducedMotion();
  const crewId = useHealthStore((s) => s.selectedCrewId);
  return (
    <div className="grid h-dvh grid-cols-[auto_minmax(0,1fr)] grid-rows-[minmax(0,1fr)_auto] overflow-hidden">
      <Sidebar />
      <div className="flex min-h-0 min-w-0 flex-col">
        <TopBar />
        {/* The Status page shows the strip above its vitals rail (AlertPanel) instead of a row. */}
        {crewId && <AlertLayer crewId={crewId} strip={pathname !== '/'} />}
        <motion.main
          key={pathname}
          id="main"
          className="relative flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-3"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <Outlet />
        </motion.main>
      </div>
      <Disclaimer />
      <PortraitNotice />
    </div>
  );
}

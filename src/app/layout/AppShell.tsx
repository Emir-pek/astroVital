import { motion, useReducedMotion } from 'framer-motion';
import { Outlet, useLocation } from 'react-router';
import { useHealthStore } from '@core/store';
import { AlertLayer } from '@modules/visualization';
import { Disclaimer } from './Disclaimer';
import { PortraitNotice } from './PortraitNotice';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

/** Global layout: left navigation, top bar, alert layer slot, page, disclaimer. */
export function AppShell() {
  const { pathname } = useLocation();
  const reduceMotion = useReducedMotion();
  const crewId = useHealthStore((s) => s.selectedCrewId);
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        {crewId && (
          <div className="px-6 pt-2">
            <AlertLayer crewId={crewId} />
          </div>
        )}
        <motion.main
          key={pathname}
          id="main"
          className="flex-1 px-6 py-4"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <Outlet />
        </motion.main>
        <Disclaimer />
      </div>
      <PortraitNotice />
    </div>
  );
}

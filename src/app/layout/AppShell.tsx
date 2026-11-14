import { Outlet } from 'react-router';
import { Disclaimer } from './Disclaimer';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

/** Global layout: sidebar navigation, top bar (MET, environment, language), disclaimer, page. */
export function AppShell() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <Disclaimer />
        <main id="main" className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

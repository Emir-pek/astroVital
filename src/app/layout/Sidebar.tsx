import { clsx } from 'clsx';
import {
  Bell,
  BookOpen,
  ClipboardPlus,
  HeartPulse,
  LayoutDashboard,
  Settings,
  Trophy,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router';
import { useHealthStore } from '@core/store';

interface NavItem {
  to: string;
  labelKey: string;
  icon: LucideIcon;
  end?: boolean;
}

export function Sidebar() {
  const { t } = useTranslation();
  const selectedCrewId = useHealthStore((s) => s.selectedCrewId);

  const items: NavItem[] = [
    { to: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard, end: true },
    {
      to: selectedCrewId ? `/crew/${selectedCrewId}` : '/crew',
      labelKey: 'nav.crew',
      icon: HeartPulse,
    },
    { to: '/log', labelKey: 'nav.log', icon: ClipboardPlus },
    { to: '/alerts', labelKey: 'nav.alerts', icon: Bell },
    { to: '/learn', labelKey: 'nav.learn', icon: BookOpen },
    { to: '/mission', labelKey: 'nav.mission', icon: Trophy },
    { to: '/settings', labelKey: 'nav.settings', icon: Settings },
  ];

  return (
    <nav
      aria-label={t('nav.label')}
      className="sticky top-0 flex h-screen w-16 shrink-0 flex-col gap-1 border-r border-border bg-surface/80 p-2 backdrop-blur md:w-56"
    >
      <div className="mb-4 flex items-center gap-2 px-2 py-3">
        <HeartPulse aria-hidden="true" className="size-7 text-env" />
        <span className="hidden text-lg font-bold tracking-wide md:inline">{t('app.name')}</span>
      </div>
      {items.map(({ to, labelKey, icon: Icon, end }) => (
        <NavLink
          key={labelKey}
          to={to}
          end={end}
          className={({ isActive }) =>
            clsx(
              'flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition',
              isActive
                ? 'bg-accent/15 text-accent'
                : 'text-muted hover:bg-surface-2 hover:text-text',
            )
          }
        >
          <Icon aria-hidden="true" className="size-5 shrink-0" />
          <span className="hidden md:inline">{t(labelKey)}</span>
          <span className="sr-only md:hidden">{t(labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  );
}

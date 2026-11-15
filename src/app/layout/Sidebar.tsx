import { clsx } from 'clsx';
import {
  Activity,
  CalendarCheck,
  ChartLine,
  ClipboardPlus,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router';
import { CompanionDock } from '@modules/routine';

interface NavItem {
  to: string;
  labelKey: string;
  icon: LucideIcon;
  end?: boolean;
}

const ITEMS: NavItem[] = [
  { to: '/', labelKey: 'nav.status', icon: Activity, end: true },
  { to: '/measure', labelKey: 'nav.measure', icon: ClipboardPlus },
  { to: '/history', labelKey: 'nav.history', icon: ChartLine },
  { to: '/team', labelKey: 'nav.team', icon: Users },
  { to: '/routine', labelKey: 'nav.routine', icon: CalendarCheck },
];

/** Fixed left navigation: five glove-sized destinations (icon + label). */
export function Sidebar() {
  const { t } = useTranslation();
  return (
    <aside className="flex min-h-0 w-[132px] shrink-0 flex-col gap-touch-gap overflow-y-auto bg-surface p-3">
      <p className="px-1 pt-2 text-center text-label font-bold text-text">{t('app.name')}</p>
      <nav aria-label={t('nav.label')} className="flex flex-col gap-touch-gap">
        {ITEMS.map(({ to, labelKey, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx(
                'flex min-h-touch flex-col items-center justify-center gap-1 rounded-button text-label',
                isActive ? 'bg-raised font-semibold text-accent' : 'text-text-2 hover:bg-raised',
              )
            }
          >
            <Icon aria-hidden="true" className="size-8" strokeWidth={1.75} />
            {t(labelKey)}
          </NavLink>
        ))}
      </nav>
      <CompanionDock />
    </aside>
  );
}

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useCrew } from '@core/store';
import { Card, StatusBadge } from '@core/ui';
import { useAllCrewHealth } from '@modules/assessment';

/**
 * One card per astronaut with overall status. Links to the crew route `/crew/:id`
 * (route contract: docs/CONTRACTS.md § Routes).
 * TODO(Engineer 4, P1): last measurement time, mini body silhouette, escalation chip, animation.
 */
export function CrewOverview() {
  const { t } = useTranslation();
  const crew = useCrew();
  const summaries = useAllCrewHealth();

  return (
    <Card title={t('visualization.crewOverview.title')}>
      <ul className="grid gap-3 sm:grid-cols-2">
        {crew.map((member) => {
          const s = summaries.find((x) => x.crewId === member.id);
          const status = s?.overall ?? 'green';
          return (
            <li key={member.id}>
              <Link
                to={`/crew/${member.id}`}
                aria-label={t('visualization.crewOverview.open', { name: member.name })}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface-2 p-3 transition hover:border-accent"
              >
                <span
                  aria-hidden="true"
                  className="flex size-11 items-center justify-center rounded-full font-semibold text-bg"
                  style={{ backgroundColor: member.avatarColor }}
                >
                  {member.name
                    .split(' ')
                    .map((p) => p[0])
                    .join('')}
                </span>
                <span className="flex-1">
                  <span className="block font-medium">{member.name}</span>
                  <span className="block text-xs text-muted">{member.role}</span>
                </span>
                <StatusBadge size="sm" status={status} label={t(`status.${status}`)} />
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

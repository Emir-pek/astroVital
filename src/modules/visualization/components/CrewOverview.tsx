import { useTranslation } from 'react-i18next';
import { useCrew } from '@core/store';
import { Card } from '@core/ui';

const initials = (name: string): string =>
  name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('');

/**
 * Crew roster. PRIVACY: never shows medical values or medical status of crew mates.
 * Medical data stays between the astronaut and the flight surgeon (design spec 7.7).
 */
export function CrewOverview() {
  const { t } = useTranslation();
  const crew = useCrew();

  return (
    <Card title={t('visualization.crewOverview.title')}>
      <ul className="grid grid-cols-2 gap-4">
        {crew.map((member) => (
          <li key={member.id} className="flex items-center gap-4 rounded-button bg-raised p-4">
            <span
              aria-hidden="true"
              className="flex size-14 shrink-0 items-center justify-center rounded-full bg-surface font-semibold text-text"
            >
              {initials(member.name)}
            </span>
            <span>
              <span className="block text-body font-semibold text-text">{member.name}</span>
              <span className="block text-label text-text-2">{member.role}</span>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

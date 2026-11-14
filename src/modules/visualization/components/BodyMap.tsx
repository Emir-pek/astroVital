import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import { BODY_REGIONS } from '@core/config/bodyRegions.config';
import type { BodyRegionId } from '@core/types';
import { Card, PlaceholderNotice, StatusBadge } from '@core/ui';
import { useCrewHealth } from '@modules/assessment';

export interface BodyMapProps {
  crewId: string;
  onRegionSelect: (region: BodyRegionId) => void;
  selectedRegion?: BodyRegionId | null;
}

/**
 * STUB: region buttons instead of the figure.
 * TODO(Engineer 4, P0): hand-drawn SVG human figure (no copyrighted assets), clickable
 * regions, hover highlight, status-coloured pulse (faster when warning: --av-pulse-*),
 * keyboard navigation (Tab/arrow keys), aria-labels, colour + icon + text.
 */
export function BodyMap({ crewId, onRegionSelect, selectedRegion }: BodyMapProps) {
  const { t } = useTranslation();
  const health = useCrewHealth(crewId);

  return (
    <Card title={t('visualization.bodyMap.title')} placeholder>
      <PlaceholderNotice text={t('common.stubNotice', { owner: 'Engineer 4' })} />
      <ul className="grid grid-cols-2 gap-2">
        {health.regions.map((r) => {
          const label = t(BODY_REGIONS[r.region].labelKey);
          const statusLabel = t(`status.${r.status}`);
          return (
            <li key={r.region}>
              <button
                type="button"
                aria-pressed={selectedRegion === r.region}
                aria-label={t('visualization.bodyMap.regionButton', {
                  region: label,
                  status: statusLabel,
                })}
                onClick={() => onRegionSelect(r.region)}
                className={clsx(
                  'flex min-h-12 w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm',
                  selectedRegion === r.region
                    ? 'border-accent bg-accent/10'
                    : 'border-border bg-surface-2 hover:border-accent/60',
                )}
              >
                <span>{label}</span>
                <StatusBadge size="sm" status={r.status} label={statusLabel} />
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BODY_REGION_IDS, BODY_REGIONS } from '@core/config/bodyRegions.config';
import { useActiveEnvironment, useLatestByMetric } from '@core/store';
import type { BodyRegionId, MetricId } from '@core/types';
import type { DisplayStatus } from '@core/ui';
import { isStale } from '@core/utils';
import { useCrewHealth } from '@modules/assessment';
import { regionDisplayStatus } from '../services/regionStatus';
import { AstronautFigure } from './figure/AstronautFigure';
import { HIT_AREAS, STAGE } from './figure/hitAreas';
import { RegionChips } from './RegionChips';

/** One body region ready for display: status already resolved, strings already translated. */
export interface RegionView {
  id: BodyRegionId;
  status: DisplayStatus;
  label: string;
  statusLabel: string;
}

export interface BodyMapViewProps {
  regions: RegionView[];
  selectedRegion: BodyRegionId | null;
  onRegionSelect: (id: BodyRegionId) => void;
  ariaLabelFor: (r: RegionView) => string;
}

/** Figure + invisible glove-sized hit areas laid over it (pure view, no store access). */
export function BodyMapView({
  regions,
  selectedRegion,
  onRegionSelect,
  ariaLabelFor,
}: BodyMapViewProps) {
  const statuses = useMemo(() => {
    const map = Object.fromEntries(BODY_REGION_IDS.map((id) => [id, 'none'])) as Record<
      BodyRegionId,
      DisplayStatus
    >;
    for (const r of regions) map[r.id] = r.status;
    return map;
  }, [regions]);

  return (
    <div className="relative shrink-0" style={{ width: STAGE.width, height: STAGE.height }}>
      <AstronautFigure regions={statuses} selected={selectedRegion} />
      {regions.map((r) => {
        const { left, top } = HIT_AREAS[r.id];
        return (
          <button
            key={r.id}
            type="button"
            data-region={r.id}
            data-status={r.status}
            aria-pressed={selectedRegion === r.id}
            aria-label={ariaLabelFor(r)}
            onClick={() => onRegionSelect(r.id)}
            style={{ left, top }}
            className="size-touch absolute rounded-button bg-transparent"
          />
        );
      })}
    </div>
  );
}

export interface BodyMapProps {
  crewId: string;
  selectedRegion: BodyRegionId | null;
  onRegionSelect: (id: BodyRegionId) => void;
}

/** Status-screen body map: crew health → display statuses → figure + region chips. */
export function BodyMap({ crewId, selectedRegion, onRegionSelect }: BodyMapProps) {
  const { t } = useTranslation();
  const health = useCrewHealth(crewId);
  const latest = useLatestByMetric(crewId);
  const env = useActiveEnvironment();

  const regions = useMemo<RegionView[]>(() => {
    const now = new Date();
    const isMetricStale = (m: MetricId) => {
      const measurement = latest[m];
      return measurement ? isStale(measurement.timestamp, m, env, now) : true;
    };
    return BODY_REGION_IDS.map((id) => {
      const region = health.regions.find((r) => r.region === id);
      const status: DisplayStatus = region ? regionDisplayStatus(region, isMetricStale) : 'none';
      return {
        id,
        status,
        label: t(BODY_REGIONS[id].labelKey),
        statusLabel:
          status === 'stale' || status === 'none'
            ? t(`visualization.status.${status}`)
            : t(`status.${status}`),
      };
    });
  }, [health.regions, latest, env, t]);

  return (
    <section
      aria-label={t('visualization.bodyMap.title')}
      className="flex flex-col items-center gap-touch-gap"
    >
      <BodyMapView
        regions={regions}
        selectedRegion={selectedRegion}
        onRegionSelect={onRegionSelect}
        ariaLabelFor={(r) =>
          t('visualization.bodyMap.regionButton', { region: r.label, status: r.statusLabel })
        }
      />
      <div style={{ width: STAGE.width }}>
        <RegionChips
          regions={regions}
          selectedRegion={selectedRegion}
          onRegionSelect={onRegionSelect}
        />
      </div>
    </section>
  );
}

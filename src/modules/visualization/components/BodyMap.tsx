import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { BODY_REGION_IDS, BODY_REGIONS } from '@core/config/bodyRegions.config';
import { useActiveEnvironment, useLatestByMetric } from '@core/store';
import type { BodyRegionId, MetricId } from '@core/types';
import { STATUS_COLOR_VAR, STATUS_STYLE, type DisplayStatus } from '@core/ui';
import { isStale } from '@core/utils';
import { useCrewHealth } from '@modules/assessment';
import { useElementSize } from '../hooks/useElementSize';
import { useNow } from '../hooks/useNow';
import { regionDisplayStatus } from '../services/regionStatus';
import { AstronautFigure } from './figure/AstronautFigure';
import {
  COLUMNS,
  LABEL_STACK_HEIGHT,
  computeBodyMapLayout,
  type BodyMapLayout,
} from './figure/layout';
import { RegionLabel } from './RegionLabel';

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

/** Used until the container has been measured (and in jsdom, which has no layout). */
const FALLBACK_SIZE = { width: 600, height: LABEL_STACK_HEIGHT };

const isAlert = (s: DisplayStatus) => s === 'advisory' || s === 'caution' || s === 'warning';

/** Status glyph disc of an alert region (r in px), set back along its leader from the anchor. */
const GLYPH_R = 11;
const GLYPH_SETBACK = 24;

interface LeaderProps {
  region: RegionView;
  points: BodyMapLayout['leaders'][BodyRegionId];
  selected: boolean;
  dimmed: boolean;
}

/**
 * Thin leader from a label to its anatomical anchor. A dark casing keeps the line legible where
 * it crosses the white suit (on the night background the casing disappears). Every leader ends in
 * a small dot on the anatomical point; alert regions also carry a status glyph a little way back
 * along the line, so the glyph never covers the (often small) status mark itself.
 */
function Leader({ region, points, selected, dimmed }: LeaderProps) {
  const alert = isAlert(region.status);
  const color = selected
    ? 'var(--av-accent)'
    : alert
      ? STATUS_COLOR_VAR[region.status]
      : 'var(--av-text-3)';
  const d = points.map((p) => `${p.x},${p.y}`).join(' ');
  const [, shoulder, end] = points;
  const dx = shoulder.x - end.x;
  const dy = shoulder.y - end.y;
  const length = Math.hypot(dx, dy) || 1;
  const setback = Math.min(GLYPH_SETBACK, length);
  const glyph = { x: end.x + (dx / length) * setback, y: end.y + (dy / length) * setback };
  const Icon = STATUS_STYLE[region.status].icon;
  return (
    <g data-leader={region.id} opacity={dimmed ? 0.35 : undefined}>
      <polyline
        points={d}
        fill="none"
        stroke="var(--av-bg)"
        strokeOpacity={0.85}
        strokeWidth={selected ? 5.5 : 4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points={d}
        fill="none"
        stroke={color}
        strokeWidth={selected ? 2.25 : 1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={end.x} cy={end.y} r={3.5} fill={color} stroke="var(--av-bg)" strokeWidth={2} />
      {alert && (
        <g data-glyph={region.status}>
          <circle
            cx={glyph.x}
            cy={glyph.y}
            r={GLYPH_R}
            fill="var(--av-bg)"
            stroke={color}
            strokeWidth={1.5}
          />
          <Icon
            x={glyph.x - 7.5}
            y={glyph.y - 7.5}
            width={15}
            height={15}
            color={STATUS_COLOR_VAR[region.status]}
            strokeWidth={2.25}
          />
        </g>
      )}
    </g>
  );
}

/**
 * Figure + leader lines + ten region labels (pure view, no store access). The figure scales
 * with the container; labels keep their glove size and stand in two columns beside it.
 */
export function BodyMapView({
  regions,
  selectedRegion,
  onRegionSelect,
  ariaLabelFor,
}: BodyMapViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const size = useElementSize(ref, FALLBACK_SIZE);
  const layout = useMemo(() => computeBodyMapLayout(size.width, size.height), [size]);

  const byId = useMemo(() => {
    const map = new Map<BodyRegionId, RegionView>();
    for (const r of regions) map.set(r.id, r);
    return map;
  }, [regions]);

  const statuses = useMemo(() => {
    const map = Object.fromEntries(BODY_REGION_IDS.map((id) => [id, 'none'])) as Record<
      BodyRegionId,
      DisplayStatus
    >;
    for (const r of regions) map[r.id] = r.status;
    return map;
  }, [regions]);

  // Keyboard order: down the left column, then down the right one.
  const ordered = [...COLUMNS.left, ...COLUMNS.right]
    .map((id) => byId.get(id))
    .filter((r): r is RegionView => r !== undefined);
  // The selected leader is drawn last so it sits on top of its neighbours.
  const leaderOrder = [...ordered].sort(
    (a, b) => Number(a.id === selectedRegion) - Number(b.id === selectedRegion),
  );
  const { figure } = layout;

  return (
    <div ref={ref} className="relative size-full" style={{ minHeight: LABEL_STACK_HEIGHT }}>
      <div
        className="absolute"
        style={{ left: figure.x, top: figure.y, width: figure.width, height: figure.height }}
      >
        <AstronautFigure regions={statuses} selected={selectedRegion} />
      </div>

      <svg
        aria-hidden="true"
        focusable="false"
        className="pointer-events-none absolute top-0 left-0"
        width={layout.width}
        height={layout.height}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
      >
        {leaderOrder.map((r) => (
          <Leader
            key={r.id}
            region={r}
            points={layout.leaders[r.id]}
            selected={selectedRegion === r.id}
            dimmed={selectedRegion !== null && selectedRegion !== r.id}
          />
        ))}
      </svg>

      {ordered.map((r) => {
        const box = layout.labels[r.id];
        return (
          <RegionLabel
            key={r.id}
            region={r}
            selected={selectedRegion === r.id}
            ariaLabel={ariaLabelFor(r)}
            onSelect={() => onRegionSelect(r.id)}
            style={{
              position: 'absolute',
              left: box.x,
              top: box.y,
              width: box.width,
              height: box.height,
            }}
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

/** Status-screen body map: crew health → display statuses → figure + region labels. */
export function BodyMap({ crewId, selectedRegion, onRegionSelect }: BodyMapProps) {
  const { t } = useTranslation();
  const health = useCrewHealth(crewId);
  const latest = useLatestByMetric(crewId);
  const env = useActiveEnvironment();
  const now = useNow();

  const regions = useMemo<RegionView[]>(() => {
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
  }, [health.regions, latest, env, now, t]);

  return (
    <section aria-label={t('visualization.bodyMap.title')} className="size-full min-w-0">
      <BodyMapView
        regions={regions}
        selectedRegion={selectedRegion}
        onRegionSelect={onRegionSelect}
        ariaLabelFor={(r) =>
          t('visualization.bodyMap.regionButton', { region: r.label, status: r.statusLabel })
        }
      />
    </section>
  );
}

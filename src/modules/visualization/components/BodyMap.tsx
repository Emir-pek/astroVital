import {
  Suspense,
  lazy,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
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
import { glyphPoint, writeLeaders } from './figure3d/leaders';
import type { BehindMap, Projection } from './figure3d/stageTypes';
import { canUseWebGL } from './figure3d/webgl';
import { RegionLabel } from './RegionLabel';

/** The 3D stage pulls in three.js: its own chunk, loaded only where WebGL works. */
const AstronautStage = lazy(() => import('./figure3d/AstronautStage'));

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
  /** A tap on the 3D stage beside the figure (the Status page closes the region sheet). */
  onBackgroundTap?: () => void;
}

/** Used until the container has been measured (and in jsdom, which has no layout). */
const FALLBACK_SIZE = { width: 600, height: LABEL_STACK_HEIGHT };

const isAlert = (s: DisplayStatus) => s === 'advisory' || s === 'caution' || s === 'warning';

/** Status glyph disc of an alert region (r in px), set back along its leader from the anchor. */
const GLYPH_R = 11;
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
  const glyph = glyphPoint(shoulder, end);
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

interface ProjectedLeaderProps {
  region: RegionView;
  selected: boolean;
  register: (id: BodyRegionId, el: SVGGElement | null) => void;
}

/**
 * Leader of the 3D figure. React owns only its colours; its geometry, visibility and dimming are
 * written straight to the DOM after every rendered 3D frame (applyProjection) — no re-render per
 * frame. Hidden until the first projection places it.
 */
function ProjectedLeader({ region, selected, register }: ProjectedLeaderProps) {
  const alert = isAlert(region.status);
  const color = selected
    ? 'var(--av-accent)'
    : alert
      ? STATUS_COLOR_VAR[region.status]
      : 'var(--av-text-3)';
  const Icon = STATUS_STYLE[region.status].icon;
  return (
    <g data-leader={region.id} visibility="hidden" ref={(el) => register(region.id, el)}>
      <polyline
        fill="none"
        stroke="var(--av-bg)"
        strokeOpacity={0.85}
        strokeWidth={selected ? 5.5 : 4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={selected ? 2.25 : 1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle data-end="" r={3.5} fill={color} stroke="var(--av-bg)" strokeWidth={2} />
      {alert && (
        <g data-glyph={region.status}>
          <circle r={GLYPH_R} fill="var(--av-bg)" stroke={color} strokeWidth={1.5} />
          <Icon
            x={-7.5}
            y={-7.5}
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
 *
 * Where WebGL works the figure is the 3D astronaut (lazy chunk) on a stage that fills the whole
 * container, and the leaders follow its projected anchors; elsewhere (tests, no GPU, lost
 * context) the SVG figure with static leaders. While the chunk loads nothing is drawn, so the
 * old figure never flashes before the 3D one.
 */
export function BodyMapView({
  regions,
  selectedRegion,
  onRegionSelect,
  ariaLabelFor,
  onBackgroundTap,
}: BodyMapViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const size = useElementSize(ref, FALLBACK_SIZE);
  const layout = useMemo(() => computeBodyMapLayout(size.width, size.height), [size]);
  const [webgl, setWebgl] = useState(canUseWebGL);
  /** The 3D stage has drawn at least one frame (until then neither figure nor leaders show). */
  const [projected, setProjected] = useState(false);
  const use3d = webgl && projected;

  // Latest values for the per-frame DOM writer (it runs outside React renders).
  const leaderEls = useRef(new Map<BodyRegionId, SVGGElement>());
  const layoutRef = useRef(layout);
  const selectedRef = useRef(selectedRegion);
  const lastFrame = useRef<{ points: Projection; behind: BehindMap } | null>(null);
  const projectedRef = useRef(false);
  const registerLeader = useCallback((id: BodyRegionId, el: SVGGElement | null) => {
    if (el) leaderEls.current.set(id, el);
    else leaderEls.current.delete(id);
  }, []);
  const onProject = useCallback((points: Projection, behind: BehindMap) => {
    lastFrame.current = { points, behind };
    writeLeaders(leaderEls.current, layoutRef.current, selectedRef.current, points, behind);
    if (!projectedRef.current) {
      projectedRef.current = true;
      setProjected(true);
    }
  }, []);
  // After every render (new layout, selection, leaders mounted) re-apply the last frame at once.
  useLayoutEffect(() => {
    layoutRef.current = layout;
    selectedRef.current = selectedRegion;
    const frame = lastFrame.current;
    if (frame) writeLeaders(leaderEls.current, layout, selectedRegion, frame.points, frame.behind);
  });
  const onContextLost = useCallback(() => {
    setWebgl(false);
    setProjected(false);
    projectedRef.current = false;
    lastFrame.current = null;
  }, []);
  const onBackground = useCallback(() => onBackgroundTap?.(), [onBackgroundTap]);
  const fit = useMemo(
    () => ({ width: layout.figure.width, height: layout.figure.height }),
    [layout.figure.width, layout.figure.height],
  );

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
  const svgFigure: ReactNode = (
    <div
      className="absolute"
      style={{ left: figure.x, top: figure.y, width: figure.width, height: figure.height }}
    >
      <AstronautFigure regions={statuses} selected={selectedRegion} />
    </div>
  );

  return (
    <div ref={ref} className="relative size-full" style={{ minHeight: LABEL_STACK_HEIGHT }}>
      {webgl ? (
        // No SVG figure while the 3D chunk loads: it would flash the old astronaut before the new one.
        <Suspense fallback={null}>
          <AstronautStage
            statuses={statuses}
            selected={selectedRegion}
            fit={fit}
            onSelect={onRegionSelect}
            onBackgroundTap={onBackground}
            onProject={onProject}
            onContextLost={onContextLost}
          />
        </Suspense>
      ) : (
        svgFigure
      )}

      <svg
        aria-hidden="true"
        focusable="false"
        className="pointer-events-none absolute top-0 left-0"
        width={layout.width}
        height={layout.height}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
      >
        {/* While the 3D stage loads (webgl, no frame yet) draw no leaders: the static ones point
            at the SVG figure, which is not shown. */}
        {(use3d || !webgl) &&
          leaderOrder.map((r) =>
            use3d ? (
              <ProjectedLeader
                key={r.id}
                region={r}
                selected={selectedRegion === r.id}
                register={registerLeader}
              />
            ) : (
              <Leader
                key={r.id}
                region={r}
                points={layout.leaders[r.id]}
                selected={selectedRegion === r.id}
                dimmed={selectedRegion !== null && selectedRegion !== r.id}
              />
            ),
          )}
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
  /** A tap on the 3D stage beside the figure (e.g. close the region sheet). */
  onBackgroundTap?: () => void;
}

/** Status-screen body map: crew health → display statuses → figure + region labels. */
export function BodyMap({ crewId, selectedRegion, onRegionSelect, onBackgroundTap }: BodyMapProps) {
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
        onBackgroundTap={onBackgroundTap}
        ariaLabelFor={(r) =>
          t('visualization.bodyMap.regionButton', { region: r.label, status: r.statusLabel })
        }
      />
    </section>
  );
}

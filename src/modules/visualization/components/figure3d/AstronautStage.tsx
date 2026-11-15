import { useReducedMotion } from 'framer-motion';
import { MoveHorizontal, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@core/ui';
import { createStage, type StageEngine } from './createStage';
import type { AstronautStageProps } from './stageTypes';

/** Keyboard zoom step. */
const ZOOM_STEP = 1.25;

/** One HUD corner bracket (Maina reference): two thin strokes meeting at a corner. */
function Corner({ className }: { className: string }) {
  return <span aria-hidden="true" className={`absolute size-6 border-accent/60 ${className}`} />;
}

/**
 * The 3D astronaut (spec 2026-11-15 §3.1): fills the whole body-map container; the labels and
 * leader lines sit on top. Drag = turn, pinch / wheel = zoom, tap = select a region, tap beside
 * the figure = close. Keyboard on the focused stage: ← → turn, + − zoom, 0 / Home reset.
 * Loaded lazily (default export) so three.js stays in its own chunk.
 */
export default function AstronautStage(props: AstronautStageProps) {
  const { statuses, selected, fit } = props;
  const { t } = useTranslation();
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<StageEngine | null>(null);
  const propsRef = useRef(props);
  const reduced = useReducedMotion() ?? false;
  const reducedRef = useRef(reduced);
  const [offDefault, setOffDefault] = useState(false);

  useEffect(() => {
    propsRef.current = props;
    reducedRef.current = reduced;
  });

  // Build the stage once; later prop changes go through the engine setters below.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const initial = propsRef.current;
    let engine: StageEngine;
    try {
      engine = createStage(
        host,
        {
          statuses: initial.statuses,
          selected: initial.selected,
          fit: initial.fit,
          reducedMotion: reducedRef.current,
        },
        () => ({
          onSelect: (id) => propsRef.current.onSelect(id),
          onBackgroundTap: () => propsRef.current.onBackgroundTap(),
          onProject: (points, behind) => propsRef.current.onProject(points, behind),
          onContextLost: () => propsRef.current.onContextLost(),
          onOffDefaultChange: setOffDefault,
        }),
      );
    } catch {
      // No usable WebGL after all: fall back to the SVG figure.
      initial.onContextLost();
      return;
    }
    engineRef.current = engine;
    return () => {
      engineRef.current = null;
      engine.dispose();
    };
  }, []);

  useEffect(() => engineRef.current?.setStatuses(statuses), [statuses]);
  useEffect(() => engineRef.current?.setSelected(selected), [selected]);
  useEffect(
    () => engineRef.current?.setFit({ width: fit.width, height: fit.height }),
    [fit.width, fit.height],
  );
  useEffect(() => engineRef.current?.setReducedMotion(reduced), [reduced]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Only keys pressed on the stage itself: the reset button handles its own Enter / Space.
    if (e.target !== e.currentTarget) return;
    const engine = engineRef.current;
    if (!engine) return;
    switch (e.key) {
      case 'ArrowLeft':
        engine.turn(-1);
        break;
      case 'ArrowRight':
        engine.turn(1);
        break;
      case '+':
      case '=':
        engine.zoom(ZOOM_STEP);
        break;
      case '-':
      case '_':
        engine.zoom(1 / ZOOM_STEP);
        break;
      case '0':
      case 'Home':
        engine.reset();
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  return (
    <div
      data-sheet-keep=""
      data-stage="3d"
      role="application"
      aria-roledescription={t('visualization.stage.roleDescription')}
      aria-label={t('visualization.stage.ariaLabel')}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="absolute inset-0 rounded-panel outline-none focus-visible:ring-3 focus-visible:ring-accent"
    >
      <div ref={hostRef} className="absolute inset-0" />

      {/* HUD frame around the figure box: corner brackets + a small status tag on top. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: fit.width + 24, height: fit.height }}
      >
        <Corner className="top-0 left-0 rounded-tl-tile border-t-2 border-l-2" />
        <Corner className="top-0 right-0 rounded-tr-tile border-t-2 border-r-2" />
        <Corner className="bottom-0 left-0 rounded-bl-tile border-b-2 border-l-2" />
        <Corner className="right-0 bottom-0 rounded-br-tile border-r-2 border-b-2" />
        <div className="absolute top-1 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-pill bg-bg/70 px-3 py-1 text-label text-text-2">
          <span className="av-live-dot text-accent" />
          <MoveHorizontal className="size-4 shrink-0" />
          <span>{t('visualization.stage.dragHint')}</span>
        </div>
      </div>

      {selected === null && offDefault && (
        <Button
          variant="secondary"
          icon={<RotateCcw aria-hidden="true" className="size-6" />}
          onClick={() => engineRef.current?.reset()}
          className="absolute bottom-2 left-1/2 z-10 -translate-x-1/2 shadow-soft"
        >
          {t('visualization.stage.reset')}
        </Button>
      )}
    </div>
  );
}

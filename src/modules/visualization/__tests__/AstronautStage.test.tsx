import { act, fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BODY_REGION_IDS } from '@core/config/bodyRegions.config';
import type { BodyRegionId } from '@core/types';
import type { DisplayStatus } from '@core/ui';
import { renderWithProviders } from '@test/renderWithProviders';
import type { StageCallbacks, StageEngine } from '../components/figure3d/createStage';
import type { AstronautStageProps } from '../components/figure3d/stageTypes';
import { canUseWebGL } from '../components/figure3d/webgl';

// jsdom has no WebGL: the imperative three.js engine is replaced by a recording fake.
const engine = {
  setStatuses: vi.fn(),
  setSelected: vi.fn(),
  setFit: vi.fn(),
  setReducedMotion: vi.fn(),
  turn: vi.fn(),
  zoom: vi.fn(),
  reset: vi.fn(),
  dispose: vi.fn(),
} satisfies StageEngine;
let callbacks: (() => StageCallbacks) | null = null;
let failNext = false;

vi.mock('../components/figure3d/createStage', () => ({
  createStage: (_host: HTMLElement, _init: unknown, cb: () => StageCallbacks) => {
    if (failNext) throw new Error('no WebGL');
    callbacks = cb;
    return engine;
  },
}));

const { default: AstronautStage } = await import('../components/figure3d/AstronautStage');

const statuses = Object.fromEntries(BODY_REGION_IDS.map((id) => [id, 'nominal'])) as Record<
  BodyRegionId,
  DisplayStatus
>;

const props = (over: Partial<AstronautStageProps> = {}): AstronautStageProps => ({
  statuses,
  selected: null,
  fit: { width: 260, height: 584 },
  onSelect: vi.fn(),
  onBackgroundTap: vi.fn(),
  onProject: vi.fn(),
  onContextLost: vi.fn(),
  ...over,
});

beforeEach(() => {
  for (const fn of Object.values(engine)) fn.mockClear();
  callbacks = null;
  failNext = false;
});

describe('<AstronautStage/>', () => {
  it('is a focusable, labelled stage that keeps the region sheet open', () => {
    renderWithProviders(<AstronautStage {...props()} />);
    const stage = screen.getByRole('application');
    expect(stage).toHaveAttribute('tabindex', '0');
    expect(stage).toHaveAttribute('data-sheet-keep');
    expect(stage).toHaveAccessibleName(/3D astronaut\. Drag/);
    expect(screen.getByText('Drag to rotate')).toBeInTheDocument();
  });

  it('keyboard: ← → turn, + − zoom, 0 / Home reset; other keys pass through', () => {
    renderWithProviders(<AstronautStage {...props()} />);
    const stage = screen.getByRole('application');
    fireEvent.keyDown(stage, { key: 'ArrowLeft' });
    fireEvent.keyDown(stage, { key: 'ArrowRight' });
    fireEvent.keyDown(stage, { key: '+' });
    fireEvent.keyDown(stage, { key: '-' });
    fireEvent.keyDown(stage, { key: '0' });
    fireEvent.keyDown(stage, { key: 'Home' });
    fireEvent.keyDown(stage, { key: 'Tab' });
    expect(engine.turn.mock.calls).toEqual([[-1], [1]]);
    expect(engine.zoom.mock.calls).toEqual([[1.25], [0.8]]);
    expect(engine.reset).toHaveBeenCalledTimes(2);
  });

  it('forwards selection and status changes to the engine', () => {
    const { rerender } = renderWithProviders(<AstronautStage {...props()} />);
    rerender(<AstronautStage {...props({ selected: 'kidneys' })} />);
    expect(engine.setSelected).toHaveBeenLastCalledWith('kidneys');
    const next = { ...statuses, kidneys: 'warning' as const };
    rerender(<AstronautStage {...props({ selected: 'kidneys', statuses: next })} />);
    expect(engine.setStatuses).toHaveBeenLastCalledWith(next);
  });

  it('routes taps from the engine to the latest callbacks', () => {
    const onSelect = vi.fn();
    const onBackgroundTap = vi.fn();
    const { rerender } = renderWithProviders(<AstronautStage {...props()} />);
    rerender(<AstronautStage {...props({ onSelect, onBackgroundTap })} />);
    callbacks?.().onSelect('heart');
    callbacks?.().onBackgroundTap();
    expect(onSelect).toHaveBeenCalledWith('heart');
    expect(onBackgroundTap).toHaveBeenCalledTimes(1);
  });

  it('shows a glove-sized reset button only while the view is off default and nothing is selected', () => {
    const { rerender } = renderWithProviders(<AstronautStage {...props()} />);
    expect(screen.queryByRole('button', { name: 'Reset view' })).toBeNull();
    act(() => callbacks?.().onOffDefaultChange(true));
    const reset = screen.getByRole('button', { name: 'Reset view' });
    expect(reset).toHaveClass('min-h-touch', 'min-w-touch');
    fireEvent.click(reset);
    expect(engine.reset).toHaveBeenCalledTimes(1);
    rerender(<AstronautStage {...props({ selected: 'brain' })} />);
    expect(screen.queryByRole('button', { name: 'Reset view' })).toBeNull();
  });

  it('falls back (onContextLost) when the stage cannot start', () => {
    failNext = true;
    const onContextLost = vi.fn();
    renderWithProviders(<AstronautStage {...props({ onContextLost })} />);
    expect(onContextLost).toHaveBeenCalledTimes(1);
  });

  it('disposes the engine on unmount', () => {
    const { unmount } = renderWithProviders(<AstronautStage {...props()} />);
    unmount();
    expect(engine.dispose).toHaveBeenCalledTimes(1);
  });
});

describe('canUseWebGL', () => {
  it('is false in jsdom (tests use the SVG figure) and stays memoised', () => {
    expect(canUseWebGL()).toBe(false);
    expect(canUseWebGL()).toBe(false);
  });
});

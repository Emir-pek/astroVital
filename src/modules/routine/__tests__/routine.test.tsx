import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useHealthStore } from '@core/store';
import { renderWithProviders } from '@test/renderWithProviders';
import { levelForXp, levelProgress, MetClock } from '../index';

describe('levels', () => {
  it('level 1 at 0 XP, +1 level per 100 XP', () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(99)).toBe(1);
    expect(levelForXp(100)).toBe(2);
    expect(levelForXp(-5)).toBe(1);
    expect(levelProgress(150)).toBeCloseTo(0.5);
  });
});

describe('<MetClock/>', () => {
  beforeEach(() => useHealthStore.getState().resetAll());

  it('shows "Day N · HH:MM:SS" outside Mars', () => {
    useHealthStore.getState().setActiveEnvironment('iss');
    renderWithProviders(<MetClock />);
    expect(screen.getByLabelText('Mission Elapsed Time')).toHaveTextContent(
      /^Day -?\d+ · \d{2}:\d{2}:\d{2}$/,
    );
  });

  it('shows "Sol N" on a Mars base', () => {
    useHealthStore.getState().setActiveEnvironment('mars_base');
    renderWithProviders(<MetClock />);
    expect(screen.getByLabelText('Mission Elapsed Time')).toHaveTextContent(
      /^Sol -?\d+ · \d{2}:\d{2}:\d{2}$/,
    );
  });
});

import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
  it('renders a DDD/HH:MM:SS clock', () => {
    renderWithProviders(<MetClock />);
    expect(screen.getByLabelText('Mission Elapsed Time')).toHaveTextContent(
      /^-?\d{3}\/\d{2}:\d{2}:\d{2}$/,
    );
  });
});

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { useHealthStore } from '@core/store';
import { renderWithProviders } from '@test/renderWithProviders';
import { MeasurementForm, MoodPicker, validateValue } from '../index';

describe('validateValue', () => {
  it('accepts plausible values and rejects out-of-range / NaN', () => {
    expect(validateValue('heartRate', 72)).toBeNull();
    expect(validateValue('heartRate', 500)).toBe('errorRange');
    expect(validateValue('heartRate', Number.NaN)).toBe('errorNumber');
  });
});

describe('<MeasurementForm/>', () => {
  beforeEach(() => useHealthStore.getState().resetAll());

  it('shows a validation error for an implausible value and saves nothing', async () => {
    renderWithProviders(<MeasurementForm crewId="crew-1" />);
    await userEvent.type(screen.getByLabelText(/Value/), '999');
    await userEvent.click(screen.getByRole('button', { name: 'Save measurement' }));
    expect(screen.getByRole('alert')).toHaveTextContent('between 25 and 230 bpm');
    expect(useHealthStore.getState().measurements).toHaveLength(0);
  });

  it('saves a valid value with source=keyboard', async () => {
    renderWithProviders(<MeasurementForm crewId="crew-1" />);
    await userEvent.type(screen.getByLabelText(/Value/), '64');
    await userEvent.click(screen.getByRole('button', { name: 'Save measurement' }));
    const [m] = useHealthStore.getState().measurements;
    expect(m).toMatchObject({
      crewId: 'crew-1',
      metric: 'heartRate',
      value: 64,
      source: 'keyboard',
    });
    expect(screen.getByText('Saved: Resting heart rate 64 bpm')).toBeInTheDocument();
  });
});

describe('<MoodPicker/>', () => {
  it('renders 5 labelled options', () => {
    renderWithProviders(<MoodPicker onChange={() => undefined} />);
    expect(screen.getAllByRole('radio')).toHaveLength(5);
    expect(screen.getByRole('radio', { name: /Very good/ })).toBeInTheDocument();
  });
});

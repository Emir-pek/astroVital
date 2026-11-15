import { act, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useHealthStore } from '@core/store';
import { renderWithProviders } from '@test/renderWithProviders';
import { EnvironmentChangeNotice } from '../index';

describe('<EnvironmentChangeNotice/>', () => {
  beforeEach(() => {
    useHealthStore.getState().resetAll();
    useHealthStore.getState().setActiveEnvironment('iss');
  });

  it('no toast on first render; one toast per environment change', () => {
    renderWithProviders(<EnvironmentChangeNotice />);
    expect(screen.queryByText(/Reminder schedule and thresholds are updated/)).toBeNull();

    act(() => useHealthStore.getState().setActiveEnvironment('mars_base'));
    expect(screen.getAllByText(/Reminder schedule and thresholds are updated/)).toHaveLength(1);
    expect(screen.getByText(/^Environment: .*Mars/)).toBeInTheDocument();

    act(() => useHealthStore.getState().setActiveEnvironment('mars_base'));
    expect(screen.getAllByText(/Reminder schedule and thresholds are updated/)).toHaveLength(1);
  });
});

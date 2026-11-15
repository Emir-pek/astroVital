import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SCENARIOS } from '@core/simulation';
import { useHealthStore } from '@core/store';
import { renderWithProviders } from '@test/renderWithProviders';
import { exportData, RoutineSettingsPanel, useRoutineStore } from '../index';

class FakeNotification {
  static permission: NotificationPermission = 'default';
  static requestPermission = vi.fn(() => Promise.resolve<NotificationPermission>('granted'));
}

beforeEach(() => {
  vi.stubGlobal('Notification', FakeNotification);
  FakeNotification.permission = 'default';
  useRoutineStore.getState().resetRoutine();
  useHealthStore.getState().resetAll();
});
afterEach(() => vi.unstubAllGlobals());

describe('<RoutineSettingsPanel/>', () => {
  it('notifications: turning on asks the browser and enables when granted', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RoutineSettingsPanel />);
    const group = screen.getByRole('radiogroup', { name: 'Browser notifications' });
    await user.click(screen.getAllByRole('radio', { name: 'On' })[0] as HTMLElement);
    await waitFor(() => expect(useRoutineStore.getState().notificationsEnabled).toBe(true));
    expect(FakeNotification.requestPermission).toHaveBeenCalled();
    expect(group).toBeInTheDocument();
  });

  it('autoLoadDemo switch writes the setting', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RoutineSettingsPanel />);
    await user.click(screen.getAllByRole('radio', { name: 'Off' })[1] as HTMLElement);
    expect(useHealthStore.getState().settings.autoLoadDemo).toBe(false);
  });

  it('loads the scenario with its recommended environment, or keeps the current one', async () => {
    const user = userEvent.setup();
    useHealthStore.getState().setActiveEnvironment('lunar_base');
    useHealthStore.getState().updateSettings({ scenario: 'solar_particle_event' });
    const rec = SCENARIOS.solar_particle_event.recommendedEnvironment;
    renderWithProviders(<RoutineSettingsPanel />);
    await user.click(screen.getByRole('button', { name: /Load scenario/ }));
    expect(useHealthStore.getState().activeEnvironment).toBe(rec);
    expect(useHealthStore.getState().measurements.length).toBeGreaterThan(0);

    useHealthStore.getState().setActiveEnvironment('lunar_base');
    await user.click(screen.getByRole('radio', { name: 'Keep current' }));
    await user.click(screen.getByRole('button', { name: /Load scenario/ }));
    expect(useHealthStore.getState().activeEnvironment).toBe('lunar_base');
  });

  it('import asks for confirmation before replacing data; cancel keeps everything', async () => {
    const user = userEvent.setup();
    useHealthStore.getState().loadDemoData({ days: 30, now: new Date('2026-11-14T22:00:00Z') });
    const backup = exportData(new Date('2026-11-14T22:00:00Z'));
    const count = useHealthStore.getState().measurements.length;
    useHealthStore.getState().resetAll();
    renderWithProviders(<RoutineSettingsPanel />);

    const input = screen.getByLabelText('Import data', { selector: 'input' });
    const file = new File([backup], 'backup.json', { type: 'application/json' });
    await user.upload(input, file);
    expect(await screen.findByText('Replace all data?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(useHealthStore.getState().measurements).toHaveLength(0);

    await user.upload(input, file);
    await user.click(await screen.findByRole('button', { name: 'Replace data' }));
    expect(useHealthStore.getState().measurements).toHaveLength(count);
    expect(await screen.findByText('Data restored from the file.')).toBeInTheDocument();
  });

  it('a broken file changes nothing and says why', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RoutineSettingsPanel />);
    const input = screen.getByLabelText('Import data', { selector: 'input' });
    await user.upload(input, new File(['{oops'], 'x.json', { type: 'application/json' }));
    await user.click(await screen.findByRole('button', { name: 'Replace data' }));
    expect(await screen.findByText(/not valid JSON/)).toBeInTheDocument();
    expect(useHealthStore.getState().measurements).toHaveLength(0);
  });
});

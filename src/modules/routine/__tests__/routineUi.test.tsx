import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useHealthStore } from '@core/store';
import { renderWithProviders } from '@test/renderWithProviders';
import { MissedCountBadge, MissionBoard, ReminderCenter, useRoutineStore } from '../index';

/** Default demo (mixed_mission) at 12:00 UTC on mission day 30, after Kenji's missed evening. */
const NOW = new Date('2026-11-30T12:00:00.000Z');

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  useRoutineStore.getState().resetRoutine();
  const s = useHealthStore.getState();
  s.resetAll();
  s.loadDemoData({ now: NOW });
});
afterEach(() => vi.useRealTimers());

describe('<ReminderCenter/> (styled)', () => {
  it('Me view: progress + rows with icon + text status, due first', () => {
    useHealthStore.getState().setSelectedCrew('crew-1');
    renderWithProviders(<ReminderCenter />);
    expect(screen.getByRole('progressbar', { name: "Today's tasks done" })).toBeInTheDocument();
    const rows = screen.getAllByRole('listitem');
    expect(rows[0]).toHaveAttribute('data-status', 'upcoming'); // nothing due or missed at noon
    expect(within(rows.at(-1) as HTMLElement).getByText('Done')).toBeInTheDocument();
  });

  it("'late' has its own word and icon, distinct from 'done'", () => {
    const s = useHealthStore.getState();
    s.resetAll(); // no demo data: only the two entries below
    s.updateSettings({ missionStart: '2026-11-01T00:00:00.000Z' });
    s.setSelectedCrew('crew-1');
    const entry = (metric: 'sleepHours' | 'heartRate', timestamp: string) =>
      s.addMeasurement({
        crewId: 'crew-1',
        metric,
        value: 7,
        timestamp,
        source: 'keyboard',
        environment: 'iss',
      });
    entry('sleepHours', '2026-11-30T09:00:00.000Z'); // 06:15 + 2 h 45 min → late
    entry('heartRate', '2026-11-30T06:35:00.000Z'); // on time → done
    renderWithProviders(<ReminderCenter />);
    const late = screen.getByText(/Log last night's sleep/).closest('li') as HTMLElement;
    const done = screen.getByText('Resting heart rate').closest('li') as HTMLElement;
    expect(late).toHaveAttribute('data-status', 'late');
    expect(within(late).getByText('Done late')).toBeInTheDocument();
    expect(within(done).getByText('Done')).toBeInTheDocument();
    const icon = (li: HTMLElement) =>
      li.querySelector('span[data-status] svg')?.getAttribute('class');
    expect(icon(late)).not.toBe(icon(done));
  });

  it('Crew view: every astronaut with task progress only — no health value or status', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReminderCenter />);
    await user.click(screen.getByRole('radio', { name: 'Crew' }));
    const list = screen.getByRole('list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(4);
    expect(within(list).getAllByRole('progressbar')).toHaveLength(4);
    expect(list.textContent).not.toMatch(/bpm|mmHg|°C|Nominal|Caution|Warning|Advisory/);
  });
});

describe('<MissionBoard/> (styled)', () => {
  it('level progress bar, rule text, streak, team score and dimmed unearned badges', () => {
    useHealthStore.getState().setSelectedCrew('crew-1');
    renderWithProviders(<MissionBoard />);
    expect(screen.getByText(/never how good a value is/)).toBeInTheDocument();
    const bar = screen.getByRole('progressbar', { name: /Progress to level/ });
    expect(bar.getAttribute('aria-valuetext')).toMatch(/^\d+ \/ 700 XP$/);
    expect(screen.getByText('Longest: 29 days')).toBeInTheDocument(); // Mira, before today closes
    const badges = document.querySelectorAll('li[data-earned]');
    expect(badges).toHaveLength(5);
    const unearned = [...badges].filter((b) => b.getAttribute('data-earned') === 'false');
    unearned.forEach((b) => expect(b).toHaveTextContent('Not earned yet'));
  });
});

describe('<MissedCountBadge/>', () => {
  it('shows "N missed" for the signed-in astronaut and nothing when zero', () => {
    vi.setSystemTime(new Date('2026-11-30T09:00:00.000Z')); // sleep-log 06:15 + 2 h passed
    useHealthStore.getState().addMeasurement({
      crewId: 'crew-1',
      metric: 'sleepHours',
      value: 7,
      timestamp: '2026-11-30T06:20:00.000Z',
      source: 'keyboard',
      environment: 'iss',
    });
    useHealthStore.getState().setSelectedCrew('crew-1');
    const { unmount } = renderWithProviders(<MissedCountBadge />);
    expect(screen.queryByTestId('missed-count')).toBeNull();
    unmount();
    renderWithProviders(<MissedCountBadge crewId="crew-9" />);
    expect(screen.queryByTestId('missed-count')).toBeNull();
  });
});

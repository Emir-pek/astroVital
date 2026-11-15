import { Check, ChevronDown, Settings, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { BOX, Menu } from '@core/ui';
import { useNavigate } from 'react-router';
import { useCrew, useHealthStore } from '@core/store';

const ITEM =
  'flex min-h-touch min-w-[280px] cursor-pointer items-center justify-between gap-4 rounded-button px-4 text-body text-text outline-none data-highlighted:bg-raised';

/**
 * "Who is signed in" selector. Only the data of the selected astronaut is ever shown;
 * the menu also links to the demo settings (not part of the main navigation).
 */
export function CrewPicker() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const crew = useCrew();
  const selectedId = useHealthStore((s) => s.selectedCrewId);
  const setSelectedCrew = useHealthStore((s) => s.setSelectedCrew);
  const selected = crew.find((c) => c.id === selectedId);
  const name = selected?.name ?? t('common.noData');

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={t('topbar.crewPickerValue', { name })}
        // Fixed width: the top bar does not move with the name or the language.
        className="inline-flex min-h-touch w-[200px] shrink-0 items-center gap-2 rounded-button bg-raised px-4 text-left text-label text-text"
      >
        <UserRound aria-hidden="true" className="size-6 shrink-0 text-text-2" strokeWidth={1.75} />
        <span className="line-clamp-2 min-w-0 flex-1">{name}</span>
        <ChevronDown aria-hidden="true" className="size-6 shrink-0 text-text-2" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={8} align="end" className="z-40">
          <Menu.Popup className={clsx(BOX.panel, 'flex flex-col gap-touch-gap outline-none')}>
            <Menu.RadioGroup
              value={selectedId}
              onValueChange={(next) => setSelectedCrew(String(next))}
              className="flex flex-col gap-touch-gap"
            >
              {crew.map((member) => (
                <Menu.RadioItem key={member.id} value={member.id} className={ITEM}>
                  {member.name}
                  <Menu.RadioItemIndicator>
                    <Check aria-hidden="true" className="size-6 text-accent" />
                  </Menu.RadioItemIndicator>
                </Menu.RadioItem>
              ))}
            </Menu.RadioGroup>
            <Menu.Separator className="h-px bg-line" />
            <Menu.Item className={ITEM} onClick={() => void navigate('/settings')}>
              {t('topbar.demoSettings')}
              <Settings aria-hidden="true" className="size-6 text-text-2" strokeWidth={1.75} />
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

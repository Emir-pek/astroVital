import { Check, ChevronDown, Orbit } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { BOX, Select } from '@core/ui';
import { ENVIRONMENT_IDS, ENVIRONMENTS } from '@core/config';
import { useHealthStore } from '@core/store';
import type { EnvironmentId } from '@core/types';

/** Mission environment selector (thresholds and escalation wording depend on it). */
export function EnvironmentPicker() {
  const { t } = useTranslation();
  const active = useHealthStore((s) => s.activeEnvironment);
  const setActive = useHealthStore((s) => s.setActiveEnvironment);
  // The trigger shows a short name so the top bar stays on one row at 1180 px in every
  // language; the full name is spoken and listed in the menu.
  const shortName = t(`topbar.envShort.${active}`);
  const label = t('topbar.environmentValue', { env: t(ENVIRONMENTS[active].labelKey) });

  return (
    <Select.Root
      value={active}
      onValueChange={(next) => {
        if (next) setActive(next as EnvironmentId);
      }}
    >
      <Select.Trigger
        aria-label={label}
        className="inline-flex min-h-touch min-w-touch items-center gap-2 rounded-button bg-raised px-4 text-left text-label whitespace-nowrap text-text"
      >
        <Orbit aria-hidden="true" className="size-6 shrink-0 text-text-2" strokeWidth={1.75} />
        <span>{shortName}</span>
        <ChevronDown aria-hidden="true" className="size-6 shrink-0 text-text-2" />
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner sideOffset={8} alignItemWithTrigger={false} className="z-40">
          <Select.Popup className={clsx(BOX.panel, 'outline-none')}>
            <Select.List className="flex flex-col gap-touch-gap">
              {ENVIRONMENT_IDS.map((id) => (
                <Select.Item
                  key={id}
                  value={id}
                  className="flex min-h-touch min-w-[320px] cursor-pointer items-center justify-between gap-4 rounded-button px-4 text-body text-text outline-none data-highlighted:bg-raised data-selected:font-semibold data-selected:text-accent"
                >
                  <Select.ItemText>{t(ENVIRONMENTS[id].labelKey)}</Select.ItemText>
                  <Select.ItemIndicator>
                    <Check aria-hidden="true" className="size-6" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

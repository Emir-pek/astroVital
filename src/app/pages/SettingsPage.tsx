import { clsx } from 'clsx';
import { Database, RotateCcw } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ENVIRONMENT_IDS, ENVIRONMENTS } from '@core/config/environments.config';
import { SUPPORTED_LANGUAGES } from '@core/i18n';
import { SCENARIO_IDS, SCENARIOS } from '@core/simulation';
import { useHealthStore, type Language } from '@core/store';
import type { ScenarioId } from '@core/types';
import { BOX, Button, Card, Modal, Segmented, useToast } from '@core/ui';
import type { GlucoseUnit, TemperatureUnit } from '@core/utils/units';
import { PageHeader } from './PageHeader';

const HISTORY_OPTIONS = [30, 60, 90, 180] as const;

/**
 * Glove-sized single choice as a row of tiles (radio semantics). The active tile has an accent
 * edge; the description of the active option is shown once, below the tiles.
 */
function ChoiceTiles<T extends string>({
  label,
  value,
  options,
  onChange,
  columns,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  columns: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={clsx('grid gap-touch-gap', columns)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={clsx(
              BOX.tile,
              'min-h-touch border-4 text-left text-body text-text transition',
              active ? 'border-accent font-semibold' : 'border-transparent',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** A visible label above a control group. */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-label text-text-2">{label}</span>
      {children}
    </div>
  );
}

/** `/settings` — environment, language, units, simulation scenario, reset data. */
export function SettingsPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const seedId = useId();
  const activeEnvironment = useHealthStore((s) => s.activeEnvironment);
  const setActiveEnvironment = useHealthStore((s) => s.setActiveEnvironment);
  const settings = useHealthStore((s) => s.settings);
  const updateSettings = useHealthStore((s) => s.updateSettings);
  const loadDemoData = useHealthStore((s) => s.loadDemoData);
  const resetAll = useHealthStore((s) => s.resetAll);
  const measurementCount = useHealthStore((s) => s.measurements.length);
  const [confirmReset, setConfirmReset] = useState(false);

  const onLoadDemo = () => {
    loadDemoData();
    toast.show({
      message: t('settings.demoLoaded', { count: useHealthStore.getState().measurements.length }),
      tone: 'nominal',
    });
  };

  const onReset = () => {
    resetAll();
    setConfirmReset(false);
    toast.show({ message: t('settings.resetDone'), tone: 'info' });
  };

  return (
    <>
      <PageHeader title={t('pages.settings.title')} subtitle={t('pages.settings.subtitle')} />
      <div className="flex flex-col gap-section">
        <Card title={t('settings.environment')}>
          <ChoiceTiles
            label={t('settings.environment')}
            value={activeEnvironment}
            options={ENVIRONMENT_IDS.map((id) => ({
              value: id,
              label: t(ENVIRONMENTS[id].labelKey),
            }))}
            onChange={setActiveEnvironment}
            columns="grid-cols-5"
          />
          <p className="mt-4 text-body text-text-2">
            {t(ENVIRONMENTS[activeEnvironment].descriptionKey)}
          </p>
        </Card>

        <Card title={t('settings.language')}>
          <Segmented
            label={t('settings.language')}
            value={settings.language}
            options={SUPPORTED_LANGUAGES.map((lng) => ({
              value: lng,
              label: lng === 'en' ? 'English' : 'Türkçe',
            }))}
            onChange={(language: Language) => updateSettings({ language })}
          />
        </Card>

        <Card title={t('settings.units')}>
          <div className="flex flex-wrap gap-section">
            <Field label={t('settings.temperature')}>
              <Segmented
                label={t('settings.temperature')}
                value={settings.units.temperature}
                options={[
                  { value: 'C', label: '°C' },
                  { value: 'F', label: '°F' },
                ]}
                onChange={(temperature: TemperatureUnit) =>
                  updateSettings({ units: { ...settings.units, temperature } })
                }
              />
            </Field>
            <Field label={t('settings.glucose')}>
              <Segmented
                label={t('settings.glucose')}
                value={settings.units.glucose}
                options={[
                  { value: 'mg/dL', label: 'mg/dL' },
                  { value: 'mmol/L', label: 'mmol/L' },
                ]}
                onChange={(glucose: GlucoseUnit) =>
                  updateSettings({ units: { ...settings.units, glucose } })
                }
              />
            </Field>
          </div>
        </Card>

        <Card title={t('settings.simulation')}>
          <div className="flex flex-col gap-section">
            <Field label={t('settings.scenario')}>
              <ChoiceTiles
                label={t('settings.scenario')}
                value={settings.scenario}
                options={SCENARIO_IDS.map((id) => ({
                  value: id,
                  label: t(SCENARIOS[id].labelKey),
                }))}
                onChange={(scenario: ScenarioId) => updateSettings({ scenario })}
                columns="grid-cols-3"
              />
              <p className="text-body text-text-2">
                {t(SCENARIOS[settings.scenario].descriptionKey)}
              </p>
            </Field>
            <div className="flex flex-wrap items-end gap-section">
              <div className="flex flex-col gap-2">
                <label htmlFor={seedId} className="text-label text-text-2">
                  {t('settings.seed')}
                </label>
                <input
                  id={seedId}
                  type="number"
                  value={settings.seed}
                  onChange={(e) => updateSettings({ seed: Number(e.target.value) || 0 })}
                  className="min-h-touch w-40 rounded-button border-2 border-line bg-raised px-4 font-mono text-body text-text"
                />
              </div>
              <Field label={t('settings.days')}>
                <Segmented
                  label={t('settings.days')}
                  value={String(settings.historyDays)}
                  options={HISTORY_OPTIONS.map((d) => ({ value: String(d), label: String(d) }))}
                  onChange={(days) => updateSettings({ historyDays: Number(days) })}
                />
              </Field>
            </div>
            <div className="flex flex-wrap items-center gap-touch-gap">
              <Button
                icon={<Database aria-hidden="true" className="size-6" />}
                onClick={onLoadDemo}
              >
                {t('settings.loadDemo')}
              </Button>
              <Button
                variant="secondary"
                icon={<RotateCcw aria-hidden="true" className="size-6 text-warning" />}
                onClick={() => setConfirmReset(true)}
              >
                {t('settings.reset')}
              </Button>
              <p className="text-label text-text-2">
                {t('settings.measurementsStored', { count: measurementCount })}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title={t('settings.resetConfirmTitle')}
        closeLabel={t('common.close')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmReset(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={onReset}>
              {t('common.confirm')}
            </Button>
          </>
        }
      >
        {t('settings.resetConfirmBody')}
      </Modal>
    </>
  );
}

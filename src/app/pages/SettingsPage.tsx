import { clsx } from 'clsx';
import { Database, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ENVIRONMENT_IDS, ENVIRONMENTS } from '@core/config/environments.config';
import { SUPPORTED_LANGUAGES } from '@core/i18n';
import { SCENARIO_IDS, SCENARIOS } from '@core/simulation';
import { useHealthStore, type Language } from '@core/store';
import type { ScenarioId } from '@core/types';
import { Button, Card, Modal, useToast } from '@core/ui';
import type { GlucoseUnit, TemperatureUnit } from '@core/utils/units';
import { PageHeader } from './PageHeader';

const HISTORY_OPTIONS = [30, 60, 90, 180] as const;

const selectClass = 'min-h-11 rounded-lg border border-border bg-surface-2 px-3';

/** `/settings` — environment, language, units, simulation scenario, reset data. */
export function SettingsPage() {
  const { t } = useTranslation();
  const toast = useToast();
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
      tone: 'green',
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
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title={t('settings.environment')} className="lg:col-span-2">
          <div
            role="radiogroup"
            aria-label={t('settings.environment')}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
          >
            {ENVIRONMENT_IDS.map((id) => {
              const env = ENVIRONMENTS[id];
              const active = id === activeEnvironment;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setActiveEnvironment(id)}
                  className={clsx(
                    'rounded-lg border p-3 text-left transition',
                    active
                      ? 'border-accent bg-accent/10'
                      : 'border-border bg-surface-2 hover:border-accent/60',
                  )}
                >
                  <span className="block font-medium">{t(env.labelKey)}</span>
                  <span className="mt-1 block text-xs text-muted">{t(env.descriptionKey)}</span>
                </button>
              );
            })}
          </div>
        </Card>

        <Card title={t('settings.language')}>
          <select
            aria-label={t('settings.language')}
            value={settings.language}
            onChange={(e) => updateSettings({ language: e.target.value as Language })}
            className={selectClass}
          >
            {SUPPORTED_LANGUAGES.map((lng) => (
              <option key={lng} value={lng}>
                {lng === 'en' ? 'English' : 'Türkçe'}
              </option>
            ))}
          </select>
        </Card>

        <Card title={t('settings.units')}>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              {t('settings.temperature')}
              <select
                value={settings.units.temperature}
                onChange={(e) =>
                  updateSettings({
                    units: { ...settings.units, temperature: e.target.value as TemperatureUnit },
                  })
                }
                className={selectClass}
              >
                <option value="C">°C</option>
                <option value="F">°F</option>
              </select>
            </label>
            <label className="flex items-center gap-2">
              {t('settings.glucose')}
              <select
                value={settings.units.glucose}
                onChange={(e) =>
                  updateSettings({
                    units: { ...settings.units, glucose: e.target.value as GlucoseUnit },
                  })
                }
                className={selectClass}
              >
                <option value="mg/dL">mg/dL</option>
                <option value="mmol/L">mmol/L</option>
              </select>
            </label>
          </div>
        </Card>

        <Card title={t('settings.simulation')} className="lg:col-span-2">
          <div className="flex flex-wrap items-end gap-4 text-sm">
            <label className="flex flex-col gap-1">
              {t('settings.scenario')}
              <select
                value={settings.scenario}
                onChange={(e) => updateSettings({ scenario: e.target.value as ScenarioId })}
                className={selectClass}
              >
                {SCENARIO_IDS.map((id) => (
                  <option key={id} value={id}>
                    {t(SCENARIOS[id].labelKey)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              {t('settings.seed')}
              <input
                type="number"
                value={settings.seed}
                onChange={(e) => updateSettings({ seed: Number(e.target.value) || 0 })}
                className={clsx(selectClass, 'w-32 font-mono')}
              />
            </label>
            <label className="flex flex-col gap-1">
              {t('settings.days')}
              <select
                value={settings.historyDays}
                onChange={(e) => updateSettings({ historyDays: Number(e.target.value) })}
                className={selectClass}
              >
                {HISTORY_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <Button
              size="lg"
              icon={<Database aria-hidden="true" className="size-4" />}
              onClick={onLoadDemo}
            >
              {t('settings.loadDemo')}
            </Button>
            <Button
              size="lg"
              variant="danger"
              icon={<RotateCcw aria-hidden="true" className="size-4" />}
              onClick={() => setConfirmReset(true)}
            >
              {t('settings.reset')}
            </Button>
          </div>
          <p className="mt-3 text-sm text-muted">
            {t(SCENARIOS[settings.scenario].descriptionKey)}
          </p>
          <p className="mt-1 text-xs text-muted">
            {t('settings.measurementsStored', { count: measurementCount })}
          </p>
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

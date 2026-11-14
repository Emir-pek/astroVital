import { useId, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { METRIC_IDS, METRICS } from '@core/config/metrics.config';
import type { MetricId } from '@core/types';
import { Button, Card } from '@core/ui';
import { formatNumber } from '@core/utils/format';
import { useAddMeasurement } from '../hooks/useAddMeasurement';
import { validateValue } from '../services/validation';

export interface MeasurementFormProps {
  crewId: string;
  /** Pre-selected metric. */
  defaultMetric?: MetricId;
  onSaved?: () => void;
}

/**
 * Keyboard entry with Zod validation.
 * STUB-level: Engineer 2 adds unit conversion (°F, mmol/L), BP pair entry (groupId),
 * "implausible but possible" soft warnings, multi-crew selection, how-to help (P0).
 */
export function MeasurementForm({
  crewId,
  defaultMetric = 'heartRate',
  onSaved,
}: MeasurementFormProps) {
  const { t } = useTranslation();
  const add = useAddMeasurement();
  const ids = { metric: useId(), value: useId(), note: useId(), error: useId() };

  const [metric, setMetric] = useState<MetricId>(defaultMetric);
  const [raw, setRaw] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const def = METRICS[metric];

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const value = raw.trim() === '' ? Number.NaN : Number(raw.replace(',', '.'));
    const code = validateValue(metric, value);
    if (code) {
      setSaved(null);
      setError(t(`intake.form.${code}`, { min: def.min, max: def.max, unit: def.unit }));
      return;
    }
    add({ crewId, metric, value, source: 'keyboard', ...(note ? { note } : {}) });
    setError(null);
    setSaved(
      t('intake.form.saved', {
        metric: t(def.labelKey),
        value: formatNumber(value, def.step),
        unit: def.unit,
      }),
    );
    setRaw('');
    setNote('');
    onSaved?.();
  };

  return (
    <Card title={t('intake.form.title')}>
      <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
        <label htmlFor={ids.metric} className="text-sm font-medium">
          {t('intake.form.metric')}
        </label>
        <select
          id={ids.metric}
          value={metric}
          onChange={(e) => setMetric(e.target.value as MetricId)}
          className="min-h-12 rounded-lg border border-border bg-surface-2 px-3"
        >
          {METRIC_IDS.map((id) => (
            <option key={id} value={id}>
              {t(METRICS[id].labelKey)}
            </option>
          ))}
        </select>

        <label htmlFor={ids.value} className="text-sm font-medium">
          {t('intake.form.value', { unit: def.unit })}
        </label>
        <input
          id={ids.value}
          inputMode="decimal"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? ids.error : undefined}
          className="min-h-12 rounded-lg border border-border bg-surface-2 px-3 font-mono text-lg"
        />
        {error && (
          <p id={ids.error} role="alert" className="text-sm text-crit">
            {error}
          </p>
        )}

        <label htmlFor={ids.note} className="text-sm font-medium">
          {t('intake.form.note')}
        </label>
        <input
          id={ids.note}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="min-h-10 rounded-lg border border-border bg-surface-2 px-3"
        />

        <Button type="submit" size="lg">
          {t('intake.form.submit')}
        </Button>
        {saved && (
          <p role="status" className="text-sm text-ok">
            {saved}
          </p>
        )}
      </form>
    </Card>
  );
}

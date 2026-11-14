import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, PlaceholderNotice } from '@core/ui';
import { useAddMeasurement } from '../hooks/useAddMeasurement';
import { MoodPicker } from './MoodPicker';

export interface QuickLogPanelProps {
  crewId: string;
}

/**
 * Click-based quick entry. STUB: mood only.
 * TODO(Engineer 2, P0): sleep slider, exercise stepper, big +/- buttons for HR/SpO₂,
 * one-tap "same as yesterday", source = 'click'.
 */
export function QuickLogPanel({ crewId }: QuickLogPanelProps) {
  const { t } = useTranslation();
  const add = useAddMeasurement();
  const [mood, setMood] = useState<number | undefined>();

  const onMood = (value: number) => {
    setMood(value);
    add({ crewId, metric: 'mood', value, source: 'click' });
  };

  return (
    <Card title={t('intake.quickLog.title')}>
      <PlaceholderNotice text={t('common.stubNotice', { owner: 'Engineer 2' })} />
      <p className="mb-3 text-sm text-muted">{t('intake.quickLog.moodQuestion')}</p>
      <MoodPicker value={mood} onChange={onMood} />
    </Card>
  );
}

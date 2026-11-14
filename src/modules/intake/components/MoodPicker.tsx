import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

export interface MoodPickerProps {
  value?: number;
  onChange: (mood: number) => void;
}

const FACES = ['😫', '🙁', '😐', '🙂', '😄'] as const;

/** 1–5 mood scale with big (glove-friendly) buttons. Emoji + text label (not emoji alone). */
export function MoodPicker({ value, onChange }: MoodPickerProps) {
  const { t } = useTranslation();
  return (
    <div
      role="radiogroup"
      aria-label={t('intake.quickLog.moodQuestion')}
      className="grid grid-cols-5 gap-2"
    >
      {FACES.map((face, i) => {
        const mood = i + 1;
        const selected = value === mood;
        return (
          <button
            key={mood}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(mood)}
            className={clsx(
              'flex min-h-20 flex-col items-center justify-center gap-1 rounded-xl border text-xs transition',
              selected
                ? 'border-accent bg-accent/15'
                : 'border-border bg-surface-2 hover:border-accent/60',
            )}
          >
            <span aria-hidden="true" className="text-3xl">
              {face}
            </span>
            {t(`intake.mood.${mood}`)}
          </button>
        );
      })}
    </div>
  );
}

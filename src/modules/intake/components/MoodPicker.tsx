import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

export interface MoodPickerProps {
  value?: number;
  onChange: (mood: number) => void;
}

const LEVELS = [1, 2, 3, 4, 5] as const;
const BAR_WIDTH = 8;
const BAR_GAP = 4;

/** Five-bar level glyph: bars up to `level` are solid, the rest are faint. No faces. */
function LevelGlyph({ level }: { level: number }) {
  return (
    <svg viewBox="0 0 56 40" aria-hidden="true" className="h-10 w-14">
      {LEVELS.map((step, i) => {
        const height = 8 + i * 8;
        return (
          <rect
            key={step}
            x={i * (BAR_WIDTH + BAR_GAP)}
            y={40 - height}
            width={BAR_WIDTH}
            height={height}
            rx={2}
            fill="currentColor"
            opacity={step <= level ? 1 : 0.25}
          />
        );
      })}
    </svg>
  );
}

/**
 * 1-5 mood scale for gloved hands: five labelled steps with a plain level glyph.
 * Deliberately no emoji or faces (design spec: calm and mature, never cute).
 */
export function MoodPicker({ value, onChange }: MoodPickerProps) {
  const { t } = useTranslation();
  return (
    <div
      role="radiogroup"
      aria-label={t('intake.quickLog.moodQuestion')}
      className="grid grid-cols-5 gap-touch-gap"
    >
      {LEVELS.map((mood) => {
        const selected = value === mood;
        return (
          <button
            key={mood}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(mood)}
            className={clsx(
              'flex min-h-touch min-w-touch flex-col items-center justify-center gap-2 rounded-button border-4 bg-raised p-2 text-label',
              selected ? 'border-accent font-semibold text-accent' : 'border-transparent text-text',
            )}
          >
            <LevelGlyph level={mood} />
            <span className="font-mono">{mood}</span>
            {t(`intake.mood.${mood}`)}
          </button>
        );
      })}
    </div>
  );
}

import { clsx } from 'clsx';

export interface ProgressBarProps {
  /** 0–1 (clamped). */
  value: number;
  /** Already-translated accessible name, e.g. "Progress to level 6". */
  label: string;
  /** Already-translated value text read by screen readers and shown beside the bar, e.g. "420 / 700 XP". */
  valueText: string;
  className?: string;
}

/**
 * Thin horizontal progress bar (kit, Engineer 1). Neutral track (`line`), `accent` fill — not a
 * status colour (spec §5.1: colour only tells status). Shows the value text in mono beside it;
 * the bar alone never carries the information.
 */
export function ProgressBar({ value, label, valueText, className }: ProgressBarProps) {
  const pct = Math.round(Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0)) * 100);
  return (
    <div className={clsx('flex items-center gap-touch-gap', className)}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={valueText}
        className="h-3 min-w-0 flex-1 overflow-hidden rounded-pill bg-line"
      >
        <div className="h-full rounded-pill bg-accent" style={{ width: `${pct}%` }} />
      </div>
      <span className="shrink-0 font-mono text-label text-text-2">{valueText}</span>
    </div>
  );
}

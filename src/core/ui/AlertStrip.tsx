import { clsx } from 'clsx';
import { useState } from 'react';
import type { Status } from '@core/types';
import { BOX } from './box';
import { Button } from './Button';
import { StatusLine } from './StatusLine';
import { STATUS_STYLE } from './statusStyle';

export interface AlertStripItem {
  id: string;
  status: Exclude<Status, 'nominal'>;
  title: string;
  detail?: string;
}

/**
 * `row`: one wide row per alert (icon · text · buttons), for a full-width strip.
 * `stacked`: text on top, buttons below, for a narrow column (e.g. above the Status-screen vitals
 * rail, ADR-036). Its edge takes the colour of the most severe alert, so it stays unmistakable.
 */
export type AlertStripLayout = 'row' | 'stacked';

export interface AlertStripProps {
  label: string;
  items: AlertStripItem[];
  emptyText: string;
  whatToDoLabel: string;
  onWhatToDo: (id: string) => void;
  snoozeLabel: string;
  onSnooze: (id: string) => void;
  /** Already translated, e.g. "2 more". */
  moreLabel: string;
  layout?: AlertStripLayout;
}

const EDGE: Record<AlertStripItem['status'], string> = {
  advisory: 'border-advisory',
  caution: 'border-caution',
  warning: 'border-warning',
};

/** Persistent alert strip. Order is kept as given (sorting is alertQueue's job). */
export function AlertStrip({
  label,
  items,
  emptyText,
  whatToDoLabel,
  onWhatToDo,
  snoozeLabel,
  onSnooze,
  moreLabel,
  layout = 'row',
}: AlertStripProps) {
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) {
    return <StatusLine status="nominal" text={emptyText} label={label} />;
  }

  const visible = expanded ? items : items.slice(0, 1);
  const stacked = layout === 'stacked';

  // Row layout: one glove-sized row per alert (≈ 156 px: 104 px buttons + panel padding + edge); the "n more" toggle sits at
  // the end of the first row instead of taking a row of its own. Stacked layout: the same parts,
  // text above a wrapping row of buttons.
  return (
    <section
      aria-label={label}
      aria-live="polite"
      data-layout={layout}
      // A Panel (box.ts) whose edge takes the colour of the most severe alert, in both layouts.
      className={clsx(
        BOX.panel,
        'flex flex-col border-2',
        stacked ? 'gap-4' : 'gap-3',
        EDGE[items[0]!.status],
      )}
    >
      {visible.map((item, index) => {
        const { icon: Icon, textClass } = STATUS_STYLE[item.status];
        const text = (
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <Icon
              aria-hidden="true"
              className={clsx('size-6 shrink-0', stacked ? 'mt-0.5' : 'self-center', textClass)}
            />
            <div className="min-w-0 flex-1">
              <p className={`text-body font-medium ${textClass}`}>{item.title}</p>
              {item.detail && <p className="text-label text-text-2">{item.detail}</p>}
            </div>
          </div>
        );
        const buttons = (
          <>
            <Button variant="secondary" onClick={() => onWhatToDo(item.id)}>
              {whatToDoLabel}
            </Button>
            {item.status !== 'warning' && (
              <Button variant="ghost" onClick={() => onSnooze(item.id)}>
                {snoozeLabel}
              </Button>
            )}
            {index === 0 && items.length > 1 && (
              <Button
                variant="ghost"
                aria-expanded={expanded}
                onClick={() => setExpanded((v) => !v)}
              >
                {moreLabel}
              </Button>
            )}
          </>
        );
        return stacked ? (
          <div key={item.id} data-status={item.status} className="flex flex-col gap-3">
            {text}
            <div className="flex flex-wrap gap-touch-gap">{buttons}</div>
          </div>
        ) : (
          <div key={item.id} data-status={item.status} className="flex items-center gap-touch-gap">
            {text}
            {buttons}
          </div>
        );
      })}
    </section>
  );
}

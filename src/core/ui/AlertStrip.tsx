import { useState } from 'react';
import type { Status } from '@core/types';
import { Button } from './Button';
import { STATUS_STYLE } from './statusStyle';

export interface AlertStripItem {
  id: string;
  status: Exclude<Status, 'nominal'>;
  title: string;
  detail?: string;
}

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
}

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
}: AlertStripProps) {
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) {
    const { icon: Icon, textClass } = STATUS_STYLE.nominal;
    return (
      <section aria-label={label} className="flex items-center gap-3 rounded-card bg-raised p-4">
        <Icon aria-hidden="true" className={`size-6 ${textClass}`} />
        <span className="text-body">{emptyText}</span>
      </section>
    );
  }

  const visible = expanded ? items : items.slice(0, 1);

  return (
    <section aria-label={label} className="flex flex-col gap-touch-gap rounded-card bg-raised p-4">
      {visible.map((item) => {
        const { icon: Icon, textClass } = STATUS_STYLE[item.status];
        return (
          <div
            key={item.id}
            data-status={item.status}
            className="flex flex-wrap items-center gap-touch-gap"
          >
            <Icon aria-hidden="true" className={`size-6 shrink-0 ${textClass}`} />
            <div className="min-w-0 flex-1">
              <p className={`text-body font-medium ${textClass}`}>{item.title}</p>
              {item.detail && <p className="text-label">{item.detail}</p>}
            </div>
            <Button variant="secondary" onClick={() => onWhatToDo(item.id)}>
              {whatToDoLabel}
            </Button>
            {item.status !== 'warning' && (
              <Button variant="ghost" onClick={() => onSnooze(item.id)}>
                {snoozeLabel}
              </Button>
            )}
          </div>
        );
      })}
      {items.length > 1 && (
        <Button variant="ghost" aria-expanded={expanded} onClick={() => setExpanded((v) => !v)}>
          {moreLabel}
        </Button>
      )}
    </section>
  );
}

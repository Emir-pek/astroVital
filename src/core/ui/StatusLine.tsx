import { STATUS_STYLE, type DisplayStatus } from './statusStyle';

export interface StatusLineProps {
  status: DisplayStatus;
  /** Already-translated sentence, e.g. "All indicators nominal · last measurement 1 h ago". */
  text: string;
  /** Already-translated accessible name of the region (e.g. "Alerts"). */
  label: string;
}

/**
 * One-line status pill (icon in the status colour + sentence). The calm, all-clear form of the
 * alert strip; it fits in the page-header row (spec §7.1, ADR-036). Changes are announced.
 */
export function StatusLine({ status, text, label }: StatusLineProps) {
  const { icon: Icon, textClass } = STATUS_STYLE[status];
  return (
    <section
      aria-label={label}
      aria-live="polite"
      data-status={status}
      className="inline-flex min-w-0 items-center gap-3 rounded-pill bg-raised py-1.5 pr-5 pl-4"
    >
      <Icon aria-hidden="true" className={`size-6 shrink-0 ${textClass}`} />
      <span className="text-body text-text">{text}</span>
    </section>
  );
}

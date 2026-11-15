import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { clsx } from 'clsx';

export interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  /**
   * Fill the parent's width with equal options (labels may wrap to two lines). Use it where the
   * control sits in a fixed-width slot, so a longer translation never changes its size.
   */
  fill?: boolean;
}

/**
 * Single-select segmented control (radio semantics); one option is always selected.
 * Each option reserves the width of its bold (selected) label, so selecting an option never
 * nudges its neighbours.
 */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  fill = false,
}: SegmentedProps<T>) {
  return (
    <RadioGroup
      aria-label={label}
      value={value}
      onValueChange={(next) => {
        if (typeof next === 'string' && next !== '' && next !== value) onChange(next as T);
      }}
      className={clsx(
        'gap-touch-gap',
        fill ? 'grid w-full auto-cols-fr grid-flow-col' : 'inline-flex',
      )}
    >
      {options.map((o) => (
        <Radio.Root
          key={o.value}
          value={o.value}
          className={clsx(
            'inline-flex min-h-touch min-w-touch cursor-pointer items-center justify-center rounded-button border-4 border-transparent bg-raised text-center text-body text-text data-checked:border-accent data-checked:font-semibold',
            fill ? 'px-3' : 'px-6',
          )}
        >
          {/* The invisible bold copy (pseudo-element, not in the accessible name) sets the width. */}
          <span
            data-label={o.label}
            className="flex flex-col items-center after:invisible after:h-0 after:overflow-hidden after:font-semibold after:content-[attr(data-label)]"
          >
            {o.label}
          </span>
        </Radio.Root>
      ))}
    </RadioGroup>
  );
}

import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';

export interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

/** Single-select segmented control (radio semantics); one option is always selected. */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: SegmentedProps<T>) {
  return (
    <RadioGroup
      aria-label={label}
      value={value}
      onValueChange={(next) => {
        if (typeof next === 'string' && next !== '' && next !== value) onChange(next as T);
      }}
      className="inline-flex gap-touch-gap"
    >
      {options.map((o) => (
        <Radio.Root
          key={o.value}
          value={o.value}
          className="inline-flex min-h-touch min-w-touch cursor-pointer items-center justify-center rounded-button border-4 border-transparent bg-raised px-6 text-body text-text data-checked:border-accent data-checked:font-semibold"
        >
          {o.label}
        </Radio.Root>
      ))}
    </RadioGroup>
  );
}

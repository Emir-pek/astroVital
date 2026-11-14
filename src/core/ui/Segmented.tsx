import { ToggleGroup } from 'radix-ui';

export interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

/** Single-select segmented control; deselecting (empty value) is ignored. */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: SegmentedProps<T>) {
  return (
    <ToggleGroup.Root
      type="single"
      aria-label={label}
      value={value}
      onValueChange={(v) => {
        if (v) onChange(v as T);
      }}
      className="inline-flex gap-touch-gap"
    >
      {options.map((o) => (
        <ToggleGroup.Item
          key={o.value}
          value={o.value}
          className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-button bg-raised px-6 text-body text-text focus-visible:outline-2 focus-visible:outline-focus data-[state=on]:border-4 data-[state=on]:border-accent data-[state=on]:font-semibold"
        >
          {o.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}

import { useCallback } from 'react';
import { useHealthStore } from '@core/store';
import type { Measurement, NewMeasurement } from '@core/types';

/** What a caller must provide; timestamp & environment default to "now" / active environment. */
export type AddMeasurementInput = Omit<NewMeasurement, 'timestamp' | 'environment'> &
  Partial<Pick<NewMeasurement, 'timestamp' | 'environment'>>;

/**
 * Single entry point for saving user-entered data (every intake component uses it).
 * Value must already be validated and in canonical units.
 */
export function useAddMeasurement(): (input: AddMeasurementInput) => Measurement {
  const addMeasurement = useHealthStore((s) => s.addMeasurement);
  const activeEnvironment = useHealthStore((s) => s.activeEnvironment);

  return useCallback(
    (input) =>
      addMeasurement({
        ...input,
        timestamp: input.timestamp ?? new Date().toISOString(),
        environment: input.environment ?? activeEnvironment,
      }),
    [addMeasurement, activeEnvironment],
  );
}

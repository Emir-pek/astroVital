import { z } from 'zod';
import { METRIC_IDS, METRICS } from '@core/config/metrics.config';
import type { MetricId } from '@core/types';

/** Zod schema for one value of a metric (canonical units, plausibility bounds). */
export const valueSchema = (metric: MetricId) => {
  const { min, max } = METRICS[metric];
  return z
    .number({ error: 'errorNumber' })
    .refine((v) => Number.isFinite(v), { message: 'errorNumber' })
    .refine((v) => v >= min && v <= max, { message: 'errorRange' });
};

export const metricIdSchema = z.enum(METRIC_IDS as [MetricId, ...MetricId[]]);

/** Schema of the manual-entry form (value already converted to canonical units). */
export const measurementFormSchema = z
  .object({
    crewId: z.string().min(1),
    metric: metricIdSchema,
    value: z.number(),
    note: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    const res = valueSchema(data.metric).safeParse(data.value);
    if (!res.success) {
      ctx.addIssue({
        code: 'custom',
        path: ['value'],
        message: res.error.issues[0]?.message ?? 'errorRange',
      });
    }
  });

export type MeasurementFormValues = z.infer<typeof measurementFormSchema>;

/** Error code ('errorNumber' | 'errorRange') or null if valid. i18n: intake.form.<code>. */
export const validateValue = (
  metric: MetricId,
  value: number,
): 'errorNumber' | 'errorRange' | null => {
  const res = valueSchema(metric).safeParse(value);
  if (res.success) return null;
  return res.error.issues[0]?.message === 'errorNumber' ? 'errorNumber' : 'errorRange';
};

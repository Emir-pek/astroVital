import { formatDistanceToNow } from 'date-fns';
import { enUS, tr } from 'date-fns/locale';

/** Number of decimals implied by an input step (1 → 0, 0.1 → 1, 0.25 → 2). */
export const decimalsForStep = (step: number): number => {
  if (Number.isInteger(step)) return 0;
  const [, frac = ''] = String(step).split('.');
  return frac.length;
};

export const formatNumber = (value: number, step = 1, locale = 'en'): string =>
  new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimalsForStep(step),
  }).format(value);

const DATE_LOCALES = { en: enUS, tr } as const;

/** "5 minutes ago" / "5 dakika önce". */
export const formatRelative = (iso: string, lang: string): string => {
  const locale = lang.startsWith('tr') ? DATE_LOCALES.tr : DATE_LOCALES.en;
  return formatDistanceToNow(new Date(iso), { addSuffix: true, locale });
};

/** Round to the precision implied by `step` (avoids 36.699999). */
export const roundToStep = (value: number, step: number): number => {
  const d = decimalsForStep(step);
  const f = 10 ** d;
  return Math.round(value * f) / f;
};

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

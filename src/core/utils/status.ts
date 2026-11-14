import type { Escalation, Status } from '@core/types';

/** Severity order (higher = worse). */
export const STATUS_ORDER: Record<Status, number> = {
  nominal: 0,
  advisory: 1,
  caution: 2,
  warning: 3,
};
export const ESCALATION_ORDER: Record<Escalation, number> = {
  self_care: 0,
  crew_medical_officer: 1,
  flight_surgeon: 2,
  emergency: 3,
};

/** Worst status of a list; empty list ⇒ 'nominal' (no data = nothing flagged). */
export const worstStatus = (statuses: Iterable<Status>): Status => {
  let worst: Status = 'nominal';
  for (const s of statuses) if (STATUS_ORDER[s] > STATUS_ORDER[worst]) worst = s;
  return worst;
};

/** Highest escalation of a list; empty list ⇒ 'self_care'. */
export const highestEscalation = (items: Iterable<Escalation>): Escalation => {
  let top: Escalation = 'self_care';
  for (const e of items) if (ESCALATION_ORDER[e] > ESCALATION_ORDER[top]) top = e;
  return top;
};

/**
 * Crew contract.
 * SINGLE SOURCE OF TRUTH — mirror changes in docs/CONTRACTS.md.
 */
import type { MetricId } from './metrics';

export interface CrewMember {
  id: string;
  /** Fictional names only (demo data). */
  name: string;
  /** Free text, e.g. "Commander", "Crew Medical Officer". */
  role: string;
  age: number;
  sex: 'F' | 'M';
  /** CSS color used for avatars / chart series. */
  avatarColor: string;
  /**
   * Individual pre-flight baseline per metric (canonical units). Used by the simulator
   * and (P1) by trend analysis ("deviation from MY normal").
   * NOTE: `radiationDose` baseline = typical DAILY dose, not cumulative.
   */
  baseline: Partial<Record<MetricId, number>>;
  /**
   * Career effective dose received BEFORE this mission (mSv). Added on top of the
   * mission's summed daily doses when evaluating the career limit. Default 0.
   * (Extension to the original spec — see docs/DECISIONS.md ADR-010.)
   */
  priorRadiationMSv?: number;
}

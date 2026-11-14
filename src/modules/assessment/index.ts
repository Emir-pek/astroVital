/**
 * @modules/assessment — PUBLIC API (the only file other modules may import).
 * Owner: Engineer 3. Contract: docs/CONTRACTS.md § assessment.
 * Allowed deps: @core/* only.
 */
export { assessMeasurement } from './engine/assessMeasurement';
export { assessCrew, buildRegions, emptySummary } from './engine/assessCrew';
export { useAllCrewHealth, useCrewHealth } from './hooks/useCrewHealth';
export { AlertCenter, type AlertCenterProps } from './components/AlertCenter';
export { LearnPanel, type LearnPanelProps } from './components/LearnPanel';
export { RecommendationList, type RecommendationListProps } from './components/RecommendationList';

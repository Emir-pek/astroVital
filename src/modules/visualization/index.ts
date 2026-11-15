/**
 * @modules/visualization — PUBLIC API (the only file other modules may import).
 * Owner: Engineer 4. Contract: docs/CONTRACTS.md § visualization.
 * Allowed deps: @core/*, @modules/assessment.
 */
export { BodyMap, type BodyMapProps } from './components/BodyMap';
export { RegionSheet, type RegionSheetProps } from './components/RegionSheet';
export { RegionDetailPanel, type RegionDetailPanelProps } from './components/RegionDetailPanel';
export { VitalsPanel, type VitalsPanelProps } from './components/VitalsPanel';
export {
  AlertLayer,
  AlertPanel,
  AlertSummary,
  type AlertLayerProps,
} from './components/AlertLayer';
export { MetricTrendChart, type MetricTrendChartProps } from './components/MetricTrendChart';
export { CrewOverview } from './components/CrewOverview';
export { filterByRange, TREND_RANGES, type TrendRange } from './services/timeRange';

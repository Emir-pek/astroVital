# @modules/visualization

Interactive views for AstroVital: clickable human body map (hand-drawn SVG, P0), region detail
panel, metric trend charts with green/yellow/red bands (Recharts, P1), live vitals grid and crew overview.

| Folder        | Content                                                                                                                             |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `components/` | `BodyMap` (**stub: region buttons**), `RegionDetailPanel`, `MetricTrendChart` (**stub: point count**), `VitalsGrid`, `CrewOverview` |
| `services/`   | `timeRange.ts` (`filterByRange`, `TREND_RANGES`)                                                                                    |
| `__tests__/`  | render + helper tests                                                                                                               |

Owner: Engineer 4 · Tasks: [`docs/modules/visualization.md`](../../../docs/modules/visualization.md)

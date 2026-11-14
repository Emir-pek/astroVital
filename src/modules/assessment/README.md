# @modules/assessment

Rules engine and guidance for AstroVital. Turns measurements into traffic-light assessments with
plain-language explanations, recommendations and escalation (self-care → Crew Medical Officer →
flight surgeon → emergency), adapted to the mission environment (ISS, transit, rover, Moon, Mars).

| Folder        | Content                                                                                              |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| `engine/`     | `assessMeasurement` (**Phase 0 stub: always green**), `assessCrew` (real region/overall aggregation) |
| `hooks/`      | `useCrewHealth(crewId)`, `useAllCrewHealth()`                                                        |
| `components/` | `AlertCenter`, `LearnPanel`, `RecommendationList`                                                    |
| `__tests__/`  | engine contract tests                                                                                |

Thresholds: [`docs/THRESHOLDS.md`](../../../docs/THRESHOLDS.md) · Sources: [`docs/SOURCES.md`](../../../docs/SOURCES.md) ·
Owner: Engineer 3 · Tasks: [`docs/modules/assessment.md`](../../../docs/modules/assessment.md)

# @modules/intake

Data capture for AstroVital: keyboard form, tap-based quick log, camera heart rate (rPPG, P1) and
ultrasound upload with calipers (P1). Every entry is validated with Zod, stored in canonical units
and tagged with its `source`.

| Folder        | Content                                                                                               |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| `components/` | `MeasurementForm`, `MoodPicker`, `QuickLogPanel`, `CameraHeartRate` (stub), `UltrasoundUpload` (stub) |
| `hooks/`      | `useAddMeasurement` — the only write path to the store                                                |
| `services/`   | `validation.ts` (Zod schemas, `validateValue`)                                                        |
| `__tests__/`  | form + validation tests                                                                               |

Owner: Engineer 2 · Tasks: [`docs/modules/intake.md`](../../../docs/modules/intake.md) ·
Contract: [`docs/CONTRACTS.md`](../../../docs/CONTRACTS.md)

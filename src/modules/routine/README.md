# @modules/routine

Mission-routine support for AstroVital: environment-specific measurement reminders, missed-measurement
tracking, gamified health missions (XP for **adherence**, never for "good" values) and the
Mission Elapsed Time clock.

| Folder        | Content                                                                                 |
| ------------- | --------------------------------------------------------------------------------------- |
| `components/` | `MetClock` (real), `ReminderCenter` (**stub: empty**), `MissionBoard` (**stub: empty**) |
| `hooks/`      | `useReminders` (**stub**), `useGamification` (**stub**)                                 |
| `services/`   | `levels.ts` (`levelForXp`, `levelProgress`)                                             |
| `__tests__/`  | levels + MetClock tests                                                                 |

Owner: Engineer 1 · Tasks: [`docs/modules/core-routine.md`](../../../docs/modules/core-routine.md)

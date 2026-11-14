# ROUTINE_SCHEDULE — Hatırlatma takvimi (günlük / haftalık / aylık)

**Sahip:** Mühendis 1 · **Karar:** ADR-035 · **Kod:** `CORE_ROUTINE` in
`src/core/config/environments.config.ts`, gün kuralı `isScheduledOn()` in `src/core/utils/routineSchedule.ts`
· **Kaynaklar:** `docs/SOURCES.md` § Hatırlatma takvimi kaynakları.

Faz 0 takvimi örnek bir şablondu ve kaynağı yoktu. Bu takvim NASA/CSA'nın ISS'teki pratiğine dayanır ve
üç katmandan oluşur. **Saatler (`timeOfDayMET`) bu adımda değişmedi**, ayrı bir kararla gelecek.
Gün sayımı görev gününe göredir: görev başlangıcı = 1. gün (Mars'ta gösterim "Sol", hesap UTC — ADR-030).

## Takvim

| Katman   | Görev (`id`)                       | Metrik            | Sıklık                                    | Dayanak sourceId'leri                                                                          | Not                                              |
| -------- | ---------------------------------- | ----------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Günlük   | `sleep-log`                        | `sleepHours`      | her gün                                   | `nasa-standard-measures`, `ntrs-2018-standard-measures`                                        | Uyanınca                                         |
| Günlük   | `morning-bp`                       | `systolicBP`      | her gün                                   | `csa-bio-monitor`                                                                              | Diastolik aynı ölçümde; bilinçli sapma (aşağıda) |
| Günlük   | `morning-hr`                       | `heartRate`       | her gün                                   | `csa-bio-monitor`                                                                              | İstirahat nabzı                                  |
| Günlük   | `morning-spo2` (yeni)              | `spo2`            | her gün                                   | `csa-bio-monitor`                                                                              | Sabah vital bloğunda (07:30)                     |
| Günlük   | `morning-temp`                     | `bodyTemp`        | her gün                                   | `csa-bio-monitor`                                                                              |                                                  |
| Günlük   | `exercise`                         | `exerciseMinutes` | haftada 6 gün (`restEveryNDays: 7`)       | `ntrs-2011-iss-exercise-conditioning`, `ntrs-2009-iss-exrx`                                    | 7., 14., 21. … gün dinlenme                      |
| Günlük   | `dosimeter`                        | `radiationDose`   | her gün                                   | `pmc-2024-iss-radiation-crew-dosimetry`                                                        | Kişisel dozimetre                                |
| Günlük   | `evening-mood`                     | `mood`            | her gün                                   | `nasa-standard-measures`                                                                       | Uyumadan önce                                    |
| Haftalık | `fasting-glucose`                  | `bloodGlucose`    | 7 günde bir (`anchorDay: 1` → 1, 8, 15 …) | `ntrs-2006-iss-health-fitness`                                                                 | Bilinçli sapma (aşağıda)                         |
| Haftalık | `weekly-health-summary` (yeni)     | —                 | 7 günde bir (1, 8, 15 …)                  | `ntrs-2006-iss-health-fitness`, `nasa-podcast-crew-health-consoles`, `nasa-std-3001-v1-medops` | Haftalık sağlık özeti / uçuş doktoruna rapor     |
| Aylık    | `monthly-health-exam` (yeni)       | —                 | 30 günde bir (1, 31, 61 …)                | `ntrs-2006-iss-health-fitness`                                                                 | Tam muayene: tüm göstergeler                     |
| Aylık    | `monthly-sleep-team-survey` (yeni) | —                 | 30 günde bir (1, 31, 61 …)                | `ntrs-2018-standard-measures`                                                                  | Uyku + ekip anketi                               |

Ortama özel ekler (`withExtra`) korunuyor: ISS akşam nabzı, transit/Mars ekip sohbeti, Mars haftalık
uçuş doktoru raporu (`weekly-report`). Rover kendi takvimini kullanıyor (değişmedi).

## Neden bu sıklıklar?

- **Günlük:** Standard Measures uyanınca uyku anketi, uyumadan önce ruh hali/ekip anketi öngörür
  (`nasa-standard-measures`, uçuşta sürekli aktigrafi: `ntrs-2018-standard-measures`). CSA Bio-Monitor
  nabız, tansiyon, SpO₂ ve ısıyı giyilebilir cihazla sürekli kaydeder (`csa-bio-monitor`), bu yüzden
  sabah vitali günlük. Kişisel dozimetre zamana bağlı doz tutar (`pmc-2024-iss-radiation-crew-dosimetry`).
  Egzersiz ISS'te haftada 6 gün (`ntrs-2011-iss-exercise-conditioning`, `ntrs-2009-iss-exrx`).
- **Haftalık:** ISS'te uçuş doktoruyla Private Medical Conference haftalıktır
  (`ntrs-2006-iss-health-fitness`, `nasa-podcast-crew-health-consoles`); NASA-STD-3001 düzenli özel
  tıbbi görüşmeyi şart koşar (`nasa-std-3001-v1-medops`). Haftalık sağlık özeti bunun karşılığı.
- **Aylık:** Periodic Health Status muayenesi aylık yapılır, mürettebat birbirini muayene eder
  (`ntrs-2006-iss-health-fitness`). Standard Measures uyku/ekip anketini aylık tekrarlar
  (`ntrs-2018-standard-measures`).

## Bilinçli sapmalar

- **Tansiyon günlük:** ISS'te tansiyon günlük rutin değildir, periyodik muayenede ölçülür. Biz uzun ve
  otonom bir görev varsayıyoruz (Mars'ta tahliye yok, iletişim gecikmesi var) ve Bio-Monitor tipi
  giyilebilirlerle günlük sabah vitali öneriyoruz: sorunu bir sonraki aylık muayeneyi beklemeden yakalamak için.
- **Açlık şekeri haftalık:** ISS'in rutin listesinde yok. Challenge kan şekerini açıkça gösterge olarak
  saydığı için takip ediyoruz; günlük parmak ucu ölçümü yerine (sarf malzemesi ve yük) haftalık.

## Simülasyon uyumu (ADR-016 → ADR-035)

Demo verisi takvimle aynı kuralı kullanır (`generator.ts` → `isScheduledOn`): açlık şekeri 1, 8, 15, 22, 29. günlerde; egzersiz 7. günlerde yok. Sabah vital grubunda SpO₂ zaten vardı. 30 gün × 4 kişi (seed 42,
ISS, nominal): **1.484 → 1.452 ölçüm** (şeker 40 → 20, egzersiz 120 → 104).

## Açık konular

- **Saatler:** `timeOfDayMET` değerleri ayrı karar (sirkadiyen dip 01–07 kuralı: `nasa-std-3001-v1-medops`).
  Simülasyonda egzersiz 17:00, takvimde 15:00 (bilinen fark, saat kararıyla çözülecek).
- **Ortam farkları:** Ortama göre takvim farkları ayrı karar. Mars'ta `weekly-report` ile yeni
  `weekly-health-summary` aynı işi tarif ediyor; ortam kararında birleştirilmeli.
- **Zaman penceresi:** Bir görevin ne zaman "yapıldı/kaçırıldı" sayılacağı (`useReminders`) ayrı karar.
  Bayatlık (`isStale`) şimdilik sıklık × 1.5 kuralını kullanıyor: egzersizin dinlenme gününden sonraki
  sabah değer "eski" görünebilir; zaman penceresi kararında ele alınacak.

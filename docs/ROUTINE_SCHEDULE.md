# ROUTINE_SCHEDULE — Hatırlatma takvimi (günlük / haftalık / aylık)

**Sahip:** Mühendis 1 · **Kararlar:** ADR-035 (yapı), ADR-036 (saatler), ADR-037 (veri = takvim) · **Kod:** `CORE_ROUTINE` in
`src/core/config/environments.config.ts`, gün kuralı `isScheduledOn()` in `src/core/utils/routineSchedule.ts`
· **Kaynaklar:** `docs/SOURCES.md` § Hatırlatma takvimi kaynakları.

Faz 0 takvimi örnek bir şablondu ve kaynağı yoktu. Bu takvim NASA/CSA'nın ISS'teki pratiğine dayanır ve
üç katmandan oluşur; saatler ISS gün iskeletine göre (ADR-036). Gün sayımı görev gününe göredir: görev
başlangıcı = 1. gün (Mars'ta gösterim "Sol", hesap UTC — ADR-030). Saatler UTC (ISS'in resmî saati GMT/UTC).

## Gün iskeleti

| Saat (UTC)  | Blok                                                            | Dayanak                                                          |
| ----------- | --------------------------------------------------------------- | ---------------------------------------------------------------- |
| 06:00       | Uyanış                                                          | `clickorlando-2020-day-in-space` (ikincil, NASA'ya atıfla)       |
| 06:00–07:00 | Uyku sonrası blok (hijyen, kahvaltı, sabah planlama konferansı) | `esa-outpost42-daily-schedule`                                   |
| 07:00–19:30 | Mesai (deneyler, bakım, egzersiz seansları)                     | `esa-outpost42-daily-schedule`, `clickorlando-2020-day-in-space` |
| 19:30–21:30 | Uyku öncesi blok (akşam planlama konferansı, kişisel zaman)     | `esa-pesquet-blog-presleep`                                      |
| 21:30       | Uyku (~8 sa)                                                    | `clickorlando-2020-day-in-space`                                 |

Tutarlı uyku/uyanış zamanları sirkadiyen uyumun şartıdır (`nasa-std-3001-v1-medops`); bu yüzden takvim
her gün aynı saatlere bağlı.

## Takvim

| Katman   | Görev (`id`)                | Metrik            | Saat (UTC) | Sıklık                                    | Dayanak sourceId'leri                                                                          | Not                                                    |
| -------- | --------------------------- | ----------------- | ---------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Günlük   | `sleep-log`                 | `sleepHours`      | 06:15      | her gün                                   | `nasa-standard-measures`, `ntrs-2018-standard-measures` + sabah bloğu¹                         | Uyanınca                                               |
| Günlük   | `morning-bp`                | `systolicBP`      | 06:30      | her gün                                   | `csa-bio-monitor` + sabah bloğu¹                                                               | Diastolik aynı ölçümde; bilinçli sapma (aşağıda)       |
| Günlük   | `morning-hr`                | `heartRate`       | 06:30      | her gün                                   | `csa-bio-monitor` + sabah bloğu¹                                                               | İstirahat nabzı                                        |
| Günlük   | `morning-spo2`              | `spo2`            | 06:30      | her gün                                   | `csa-bio-monitor` + sabah bloğu¹                                                               | Sabah vital bloğu                                      |
| Günlük   | `morning-resp`              | `respRate`        | 06:30      | her gün                                   | `csa-bio-monitor` + sabah bloğu¹                                                               | Sabah vital bloğu (ADR-037)                            |
| Günlük   | `morning-temp`              | `bodyTemp`        | 06:30      | her gün                                   | `csa-bio-monitor` + sabah bloğu¹                                                               | Sabah vital bloğu                                      |
| Günlük   | `exercise`                  | `exerciseMinutes` | 17:30      | haftada 6 gün (`restEveryNDays: 7`)       | `ntrs-2011-iss-exercise-conditioning`, `ntrs-2009-iss-exrx`, `nasa-std-3001-v1-medops`         | 7., 14., 21. … gün dinlenme; günün toplamı             |
| Günlük   | `dosimeter`                 | `radiationDose`   | 19:30      | her gün                                   | `pmc-2024-iss-radiation-crew-dosimetry` + akşam bloğu²                                         | Kişisel dozimetre                                      |
| Günlük   | `evening-mood`              | `mood`            | 21:00      | her gün                                   | `nasa-standard-measures` + akşam bloğu²                                                        | Uyumadan önce                                          |
| Haftalık | `fasting-glucose`           | `bloodGlucose`    | 06:30      | 7 günde bir (`anchorDay: 1` → 1, 8, 15 …) | `ntrs-2006-iss-health-fitness` + sabah bloğu¹                                                  | Kahvaltı öncesi = açlık; bilinçli sapma (aşağıda)      |
| Haftalık | `weekly-health-summary`     | —                 | 10:00      | 7 günde bir (1, 8, 15 …)                  | `ntrs-2006-iss-health-fitness`, `nasa-podcast-crew-health-consoles`, `nasa-std-3001-v1-medops` | Haftalık sağlık özeti / uçuş doktoruna rapor           |
| Aylık    | `monthly-health-exam`       | —                 | 10:00      | 30 günde bir (1, 31, 61 …)                | `ntrs-2006-iss-health-fitness`, `nasa-std-3001-v1-medops`                                      | Tam muayene; **1. gün = kişisel başlangıç (baseline)** |
| Aylık    | `monthly-sleep-team-survey` | —                 | 21:00      | 30 günde bir (1, 31, 61 …)                | `ntrs-2018-standard-measures` + akşam bloğu²                                                   | Uyku + ekip anketi                                     |
| ISS eki  | `evening-hr`                | `heartRate`       | 19:30      | her gün                                   | akşam bloğu²                                                                                   | Yalnız ISS (`withExtra`)                               |

¹ Sabah bloğu: `esa-outpost42-daily-schedule`, `clickorlando-2020-day-in-space`, `nasa-std-3001-v1-medops`.
² Akşam bloğu: `esa-pesquet-blog-presleep`, `nasa-std-3001-v1-medops`.

Ortama özel ekler (`withExtra`) korunuyor: ISS akşam nabzı, transit/Mars ekip sohbeti (18:00), Mars
haftalık uçuş doktoru raporu (`weekly-report`, 10:00). Rover kendi takvimini kullanıyor; saatleri
değişmedi (ortam farkları ayrı karar).

## Saat gerekçeleri

- **Sabah ölçümleri 06:15–06:30:** uyanıştan hemen sonra, kahvaltı, kafein ve egzersizden önce alınan
  değerler dinlenme değerleridir ve günden güne karşılaştırılabilir. [Yorum, genel klinik pratik]
  Uyku kaydı uyanınca (06:15), vitaller hemen ardından tek blokta (06:30).
- **Açlık şekeri 06:30:** kahvaltı öncesi, yani gece açlığından sonra; sabah vital bloğuyla aynı anda.
- **Egzersiz 17:30:** ISS'te egzersiz gün içine bölünmüş seanslardır; günün toplam dakikası son seanstan
  sonra tek seferde girilir.
- **Dozimetre ve akşam nabzı 19:30:** uyku öncesi bloğun başı (`esa-pesquet-blog-presleep`).
- **Ruh hali ve aylık anket 21:00:** uyumadan önce (`nasa-standard-measures`).
- **Haftalık özet ve aylık muayene 10:00:** mesai içinde, sabah planlama konferansından sonra.
- Not: `nasa-std-3001-v1-medops`, **kritik** işlerin 01–07 sirkadiyen dip saatlerine planlanmamasını
  ister. Sabah ölçümleri kritik bir iş değil, uyanış sonrası rutin öz bakımdır; ISS uyanışı 06:00'dır.

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
  (`ntrs-2018-standard-measures`). 1. gündeki muayene her astronotun kişisel başlangıç değerlerini verir.

## Bilinçli sapmalar

- **Tansiyon günlük:** ISS'te tansiyon günlük rutin değildir, periyodik muayenede ölçülür. Biz uzun ve
  otonom bir görev varsayıyoruz (Mars'ta tahliye yok, iletişim gecikmesi var) ve Bio-Monitor tipi
  giyilebilirlerle günlük sabah vitali öneriyoruz: sorunu bir sonraki aylık muayeneyi beklemeden yakalamak için.
- **Açlık şekeri haftalık:** ISS'in rutin listesinde yok. Challenge kan şekerini açıkça gösterge olarak
  saydığı için takip ediyoruz; günlük parmak ucu ölçümü yerine (sarf malzemesi ve yük) haftalık.

## Simülasyon uyumu: veri = takvim (ADR-016 → ADR-035, ADR-036, ADR-037)

Demo verisi takvimin kendisinden üretilir (`generator.ts`): bir metrik, aktif ortamın takviminde o gün
düşen bir hatırlatması varsa ve o hatırlatmanın saatinde (± birkaç dakika giriş gürültüsü) üretilir.
Takvimde olmayan hiçbir ölçüm üretilmez.

- **Gün kuralı** `isScheduledOn`: açlık şekeri 1, 8, 15, 22, 29. günlerde; egzersiz 7. günlerde yok.
- **Saat** takvimden: ISS'te uyku 06:15; sabah vital grubu (KB, nabız, SpO₂, solunum, ısı; tek `groupId`)
  ve şeker 06:30; egzersiz 17:30; dozimetre ve akşam nabzı 19:30; ruh hali 21:00.
- **Akşam:** ISS'te yalnız takvimdeki akşam nabzı (her gün 19:30). Transit, Ay ve Mars'ta akşam vitali yok.
  ADR-016'daki "günlerin ~%50'sinde akşam vitali" kuralı bu ortamlarda kalktı.
- Diastolik, sistolikle aynı manşon ölçümünde gelir (`morning-bp`'ye bağlı, ayrı maddesi yok).
- Ölçüm sayısı (30 gün × 4 kişi, ISS): **1.324** (nominal ve karma görev aynı; önce 1.452).
  Fark: akşam KB + ısı + yarım günlük nabız kalktı, her gün akşam nabzı geldi.

## Açık konular

- **Rover (ortam farkları kararı bekliyor):** rover kendi takvimini kullanıyor ve `CORE_ROUTINE`'i
  içermiyor; bu yüzden üretici rover'da "eski" moda geçer: takvimde maddesi olan metrikler (SpO₂/nabız
  08:00, dozimetre 20:30, ruh hali 21:00) takvimden, olmayanlar ADR-016 davranışıyla: uyku 07:00, KB +
  solunum + ısı sabah grubuyla 08:00, açlık şekeri haftalık 07:40, egzersiz 17:00, akşam vitali günlerin
  ~%50'sinde 19:00. Rover'ın `twice_daily` ikinci ölçümü (20:00) simüle edilmiyor.
- **Ortam farkları:** Ortama göre takvim farkları ayrı karar. Mars'ta `weekly-report` ile
  `weekly-health-summary` aynı işi tarif ediyor; ortam kararında birleştirilmeli.
- **Zaman penceresi:** Bir görevin ne zaman "yapıldı/kaçırıldı" sayılacağı (`useReminders`) ayrı karar.
  Bayatlık (`isStale`) şimdilik sıklık × 1.5 kuralını kullanıyor: egzersizin dinlenme gününden sonraki
  gün değer "eski" görünebilir; zaman penceresi kararında ele alınacak.

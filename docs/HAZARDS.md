# HAZARDS — 5 Tehlike → Metrik ve Vücut Bölgesi Eşlemesi

Kaynak: NASA HRP "5 Hazards of Human Spaceflight" (RIDGE: **R**adiation, **I**solation,
**D**istance, **G**ravity, **E**nvironment) — `nasa-hrp-5-hazards`. Riskler: NASA Human Research
Roadmap — `nasa-hrp-risks`. Kod: `src/core/config/hazards.config.ts`, `metrics.config.ts`
(`hazards`, `bodyRegions` alanları), `bodyRegions.config.ts`.

## Tehlike → metrik → bölge

| Tehlike                                   | Ne yapar? (sade dil)                                                                       | Etkilenen metrikler                                                                     | Vücut bölgeleri                                         | Karşı önlem (öneri kategorisi)                       | Kaynak                                                 |
| ----------------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------ |
| **Radyasyon** (`radiation`)               | Manyetik kalkan dışında parçacıklar DNA'ya zarar verir; kanser, katarakt, kalp/beyin riski | `radiationDose`                                                                         | `whole_body`, `eyes`, `immune`, `brain`                 | `radiation_shelter`, `remeasure`                     | `nasa-hrp-5-hazards`, `csa-radiation`, `nasa-std-3001` |
| **İzolasyon & kapalılık** (`isolation`)   | Aylarca dar alan, aynı kişiler → kötü uyku, düşük ruh hali, gerginlik                      | `sleepHours`, `mood`                                                                    | `brain`, `immune`                                       | `psych_support`, `rest`                              | `nasa-hrp-5-hazards`, `nasa-hrp-risks`                 |
| **Dünya'dan uzaklık** (`distance`)        | Gecikmeli iletişim, tahliye yok → ekip tıbben özerk olmalı                                 | `mood` (+ tüm eskalasyon mantığı)                                                       | `brain`                                                 | `contact_cmo`, `contact_flight_surgeon` (asenkron)   | `nasa-hrp-5-hazards`, `nasa-mars-comm-delay`           |
| **Değişen yerçekimi** (`gravity`)         | Sıvı başa kayar (SANS), kemik/kas kaybı, ortostatik intolerans                             | `systolicBP`, `diastolicBP`, `heartRate`, `bloodGlucose`, `bodyTemp`, `exerciseMinutes` | `heart`, `bones`, `muscles`, `eyes`, `kidneys`, `blood` | `exercise`, `hydration`                              | `nasa-hrp-5-hazards`, `nasa-hrp-risks`, `nasa-sans`    |
| **Kapalı/düşmanca ortam** (`environment`) | CO₂, hava kalitesi, mikroplar, gürültü, ışık                                               | `spo2`, `respRate`, `bodyTemp`, `sleepHours`, `heartRate`, BP, `bloodGlucose`           | `lungs`, `immune`, `blood`                              | `remeasure`, `contact_cmo`, `hydration`, `nutrition` | `nasa-hrp-5-hazards`, `nasa-hrp-risks`                 |

## Bölge → metrik → tehlike (vücut haritası için)

| Bölge (`BodyRegionId`) | İşlev (özet)                 | Uzay riski (özet)                                        | Metrikler (`METRICS[*].bodyRegions`'tan türetilir)          | Tehlikeler                        |
| ---------------------- | ---------------------------- | -------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------- |
| `brain`                | Düşünce, ruh hali, uyku      | İzolasyon, uyku kaybı, radyasyon                         | `sleepHours`, `mood`                                        | isolation, distance, radiation    |
| `eyes`                 | Görme                        | SANS (sıvı kayması), katarakt                            | `radiationDose` (+ P1: ultrason optik sinir kılıfı)         | gravity, radiation                |
| `heart`                | Kan pompalama                | Kardiyak atrofi, ortostatik intolerans                   | `systolicBP`, `diastolicBP`, `heartRate`, `exerciseMinutes` | gravity, radiation                |
| `lungs`                | Gaz değişimi                 | CO₂, toz, enfeksiyon                                     | `spo2`, `respRate`                                          | environment                       |
| `blood`                | Oksijen/yakıt taşıma         | Glukoz kontrolü, eritrosit değişimi                      | `bloodGlucose`, `spo2`                                      | gravity, environment              |
| `bones`                | Destek, kalsiyum deposu      | ~%1/ay kemik kaybı                                       | `exerciseMinutes`                                           | gravity                           |
| `muscles`              | Hareket, duruş               | Atrofi                                                   | `exerciseMinutes`                                           | gravity                           |
| `immune`               | Enfeksiyon savunması         | Stres/radyasyonla baskılanma, latent virüs reaktivasyonu | `bodyTemp`, `radiationDose`                                 | radiation, isolation, environment |
| `kidneys`              | Süzme, sıvı/tansiyon dengesi | Böbrek taşı (kemikten kalsiyum + az sıvı)                | `systolicBP`, `diastolicBP`                                 | gravity, environment              |
| `whole_body`           | Sistemik etkiler             | Kümülatif radyasyon dozu, SPE                            | `bodyTemp`, `radiationDose`                                 | radiation                         |

## Senaryo ↔ tehlike (demo)

| Senaryo (`ScenarioId`) | Gösterdiği tehlike                          | Önerilen ortam |
| ---------------------- | ------------------------------------------- | -------------- |
| `space_adaptation`     | Yerçekimi (sıvı kayması, hareket hastalığı) | `iss`          |
| `solar_particle_event` | Radyasyon                                   | `spacecraft`   |
| `isolation_stress`     | İzolasyon + uzaklık                         | `spacecraft`   |
| `fever_dehydration`    | Kapalı ortam (enfeksiyon)                   | `lunar_base`   |
| `orthostatic_return`   | Yerçekimi (dönüş)                           | `mars_base`    |

# SOURCES — Bilimsel Kaynaklar

> Her eşik, ortam değeri, tehlike açıklaması ve öneri buradaki bir **ID**'ye bağlanır.
> Kod karşılığı: `src/core/config/sources.config.ts` (ID'ler birebir aynı; birim testi config'te
> kullanılan her ID'nin kayıtta olduğunu doğrular).
>
> **Durum:** ⏳ = URL ve iddia henüz yeniden kontrol edilmedi (Faz 0'da internetten doğrulama
> yapılmadı). Mühendis 3, Faz 3'te her satırı açıp doğrular, gerekirse URL'yi düzeltir ve hem
> burada hem `sources.config.ts`'te `verified: true` yapar.

## Challenge'ın verdiği zorunlu kaynaklar

| ID                   | Kaynak                                                     | URL                                               | Desteklediği kararlar                                                                                       | Durum |
| -------------------- | ---------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----- |
| `nasa-hrp-5-hazards` | NASA HRP — 5 Hazards of Human Spaceflight                  | https://www.nasa.gov/hrp/hazards/                 | 5 tehlike modeli (RIDGE), HAZARDS.md eşlemesi, tüm tehlike metinleri                                        | ⏳    |
| `nasa-hrp-risks`     | NASA — Risks of Human Spaceflight (Human Research Roadmap) | https://humanresearchroadmap.nasa.gov/risks/      | Kemik kaybı, kardiyovasküler, bağışıklık, davranışsal sağlık riskleri; vücut bölgesi "uzay riski" metinleri | ⏳    |
| `nasa-hrp-research`  | NASA — Ongoing HRP Research in Space                       | https://www.nasa.gov/hrp/research/                | "Uzayda hangi ölçümler yapılabilir?" (LearnPanel), sunum                                                    | ⏳    |
| `csa-radiation`      | CSA — Monitoring Radiation for Astronaut Health            | https://www.asc-csa.gc.ca/eng/sciences/radiation/ | Kişisel dozimetre ile günlük ölçüm, ISS günlük doz aralığı, radyasyon metinleri                             | ⏳    |
| `csa-why-science`    | CSA — Why Do We Conduct Science Experiments in Space?      | https://www.asc-csa.gc.ca/eng/sciences/           | Sunum/etki anlatısı (uzay araştırmasının Dünya'ya faydası)                                                  | ⏳    |

## Eşik ve parametre kaynakları

| ID                          | Kaynak                                                                                                             | URL                                                                                 | Desteklediği kararlar                                                                                 | Durum                              |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `nasa-std-3001`             | NASA-STD-3001 Vol. 1 Rev. B (2022) — Crew Health                                                                   | https://www.nasa.gov/ochmo/human-spaceflight-standards/                             | Kariyer radyasyon limiti **600 mSv** (`CAREER_RADIATION_LIMIT_MSV`)                                   | ⏳                                 |
| `acc-aha-bp-2017`           | Whelton PK et al. 2017 ACC/AHA High Blood Pressure Guideline. _Hypertension_                                       | https://doi.org/10.1161/HYP.0000000000000065                                        | Sistolik/diastolik bantları (normal <120/80, evre 1: 130–139/80–89, evre 2 ≥140/90, kriz ≥180/120)    | ⏳                                 |
| `ada-standards-glycemia`    | ADA Standards of Care in Diabetes — Diagnosis & Glycemic Goals                                                     | https://diabetesjournals.org/care/issue/48/Supplement_1                             | Açlık glukozu: normal 70–99, prediyabet 100–125, diyabet ≥126; hipoglisemi seviye 1 <70, seviye 2 <54 | ⏳                                 |
| `rcp-news2`                 | Royal College of Physicians — National Early Warning Score 2                                                       | https://www.rcp.ac.uk/improving-care/resources/national-early-warning-score-news-2/ | SpO₂, solunum, nabız, ısı, sistolik bantları ve "erken uyarı" mantığı                                 | ⏳                                 |
| `nsf-sleep-2015`            | Hirshkowitz M et al. 2015. National Sleep Foundation's sleep time duration recommendations. _Sleep Health_         | https://doi.org/10.1016/j.sleh.2014.12.010                                          | Yetişkin uyku önerisi 7–9 sa                                                                          | ⏳                                 |
| `stahn-2017-core-temp`      | Stahn AC et al. 2017. Increased core body temperature in astronauts during long-duration space missions. _Sci Rep_ | https://doi.org/10.1038/s41598-017-15560-w                                          | Mikro-g'de çekirdek ısının ~1 °C yükselmesi → ISS/transit `bodyTemp shift`                            | ⏳                                 |
| `zeitlin-2013-msl-rad`      | Zeitlin C et al. 2013. Measurements of energetic particle radiation in transit to Mars on the MSL. _Science_       | https://doi.org/10.1126/science.1235989                                             | Derin uzay transiti ~1.8 mSv/gün (`spacecraft`)                                                       | ⏳                                 |
| `hassler-2014-mars-surface` | Hassler DM et al. 2014. Mars' surface radiation environment measured with the MSL Curiosity rover. _Science_       | https://doi.org/10.1126/science.1244797                                             | Mars yüzeyi ~0.64 mSv/gün (`mars_base`)                                                               | ⏳                                 |
| `zhang-2020-lunar-surface`  | Zhang S et al. 2020. First measurements of the radiation dose on the lunar surface. _Sci Adv_                      | https://doi.org/10.1126/sciadv.aaz1334                                              | Ay yüzeyi ~1.37 mSv/gün (`lunar_base`, `rover`)                                                       | ⏳                                 |
| `nasa-iss-exercise`         | NASA — ISS exercise countermeasures (~2 sa/gün)                                                                    | https://www.nasa.gov/humans-in-space/                                               | Egzersiz hedefi ≥120 dk/gün (mikro-g)                                                                 | ⏳ (daha spesifik sayfa bulunmalı) |
| `nasa-sans`                 | Lee AG et al. 2020. Spaceflight associated neuro-ocular syndrome (SANS). _npj Microgravity_                        | https://doi.org/10.1038/s41526-020-0097-9                                           | Göz bölgesi riski, ultrason ile optik sinir kılıfı takibi (intake P1)                                 | ⏳                                 |
| `verkruysse-2008-rppg`      | Verkruysse W et al. 2008. Remote plethysmographic imaging using ambient light. _Opt Express_                       | https://doi.org/10.1364/OE.16.021434                                                | Kameradan nabız (yeşil kanal rPPG) — `CameraHeartRate`                                                | ⏳                                 |
| `nasa-mars-comm-delay`      | NASA Mars Exploration — iletişim gecikmesi                                                                         | https://mars.nasa.gov/                                                              | Mars tek yön gecikme ~4–24 dk (NASA sayfaları genelde "3–22 dk" der; ADR-024)                         | ⏳                                 |

## Doğrulama kontrol listesi (Mühendis 3, Faz 3)

- [ ] Her URL açılıyor mu? Kırık olanı güncel NASA/CSA sayfasıyla değiştir.
- [ ] Her "desteklediği karar" sütunu, sayfadaki gerçek ifadeyle eşleşiyor mu? (alıntı notu ekle)
- [ ] `nasa-iss-exercise` için daha spesifik bir NASA sayfası bul.
- [ ] `sources.config.ts` → `verified: true` güncelle.
- [ ] LearnPanel'de her metrik kartının altında kaynak bağlantılarını göster (jüri: "Geçerlilik").

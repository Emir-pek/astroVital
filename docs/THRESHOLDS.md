# THRESHOLDS — Metrik Eşik Tablosu

> ⚠️ **Tıbbi tavsiye değildir.** Bunlar yapılandırılabilir başlangıç değerleridir.
> Kod karşılığı: `src/core/config/thresholds.config.ts` (bu tabloyla **senkron tutulmalı**).
> Mühendis 3, Faz 3'te her satırı `SOURCES.md` ile doğrulayıp "Doğrulandı" sütununu günceller.

## Bant semantiği

- Her bant **yarı açık aralıktır**: `min ≤ değer < max`. `min` yoksa −∞, `max` yoksa +∞.
- Bir metriğin bantları düşükten yükseğe sıralı, **bitişik ve çakışmasız**dır; birim testi
  (`src/core/config/__tests__/config.test.ts`) bunu zorlar.
- "Acil" sütunu, `escalation: 'flight_surgeon'` olan kırmızı bantlardır. Mars'ta (otonom)
  motor bunu `emergency`'ye yükseltir (bkz. Eskalasyon kuralları).

## Durum lejantı

Dört seviye (NASA-STD-3001 Ek F): yeşil = `nominal`, mavi = `advisory`, sarı = `caution`,
kırmızı = `warning`. Tablodaki Yeşil/Sarı/Kırmızı sütunları sırasıyla `nominal`/`caution`/`warning`
bantlarıdır; `advisory` şimdilik motor tarafından üretilmez.

## Tablo

| Metrik                     | Yeşil      | Sarı                    | Kırmızı (→ CMO)                                         | Acil (→ flight surgeon)                           | Kaynak ID'leri                                           | Doğrulandı |
| -------------------------- | ---------- | ----------------------- | ------------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------- | ---------- |
| Sistolik KB (mmHg)         | 90–<130    | 130–<140 · 85–<90       | 140–<180 · 80–<85                                       | ≥180 · <80 (+semptom, P1)                         | `acc-aha-bp-2017`, `rcp-news2`, `nasa-hrp-risks`         | ⏳         |
| Diastolik KB (mmHg)        | 60–<85     | 85–<90 · 55–<60         | 90–<120 · <55                                           | ≥120                                              | `acc-aha-bp-2017`, `nasa-hrp-risks`                      | ⏳         |
| İstirahat nabzı (bpm)      | 50–100     | 40–49 · 101–120         | 121–150 · 35–39                                         | >150 · <35                                        | `rcp-news2`, `nasa-hrp-risks`                            | ⏳         |
| Açlık kan şekeri (mg/dL)   | 70–<100    | 100–<126 · 60–<70       | 126–<250 · 54–<60                                       | ≥250 · <54                                        | `ada-standards-glycemia`, `nasa-hrp-risks`               | ⏳         |
| Vücut ısısı (°C)           | 36.1–<37.5 | 37.5–<38.0 · 35.5–<36.1 | 38.0–<39.5 · <35.5                                      | ≥39.5                                             | `rcp-news2`, `stahn-2017-core-temp`                      | ⏳         |
| Uyku (sa/gün)              | 7–<9       | 6–<7 · ≥9 (ADR-012)     | <6 (self-care) · **3 gün üst üste <6.5 → CMO**          | **2 gün üst üste <4**                             | `nsf-sleep-2015`, `nasa-hrp-risks`                       | ⏳         |
| Ruh hali (1–5)             | 4–5        | 3                       | 1–2 · 3 günlük düşüş trendi (−%25)                      | 1 + izolasyon belirtisi (bileşik kural, P1)       | `nasa-hrp-risks`, `nasa-hrp-5-hazards`                   | ⏳         |
| SpO₂ (%)                   | ≥95        | 92–94                   | 88–91                                                   | <88                                               | `rcp-news2`                                              | ⏳         |
| Solunum (/dk)              | 12–20      | 21–24 · 10–11           | 25–30 · <10                                             | >30                                               | `rcp-news2`                                              | ⏳         |
| Radyasyon (kümülatif mSv)  | <300 (%50) | 300–<480 (%50–80)       | ≥480 (>%80)                                             | Günlük doz > 5 × ortam beklentisi (SPE → sığınak) | `nasa-std-3001`, `csa-radiation`, `zeitlin-2013-msl-rad` | ⏳         |
| Egzersiz (dk/gün, mikro-g) | ≥120       | 60–119                  | <60 (self-care, ADR-013) · **3 gün üst üste <60 → CMO** | —                                                 | `nasa-iss-exercise`, `nasa-hrp-risks`                    | ⏳         |

Notlar:

- **Radyasyon:** ölçüm değeri = o günün dozimetre okuması (mSv/gün). Bantlar
  `crew.priorRadiationMSv + Σ günlük doz` üzerinden değerlendirilir (`basis: 'cumulativeSum'`).
  Kariyer limiti `CAREER_RADIATION_LIMIT_MSV = 600` mSv (NASA-STD-3001 Vol 1 Rev B). SPE kuralı
  `RADIATION_SPE_DAILY_MULTIPLIER = 5`.
- **Trend kuralları** (`trend`): sistolik 7 günde ±%10 → sarı; nabız 7 günde ±%15 → sarı;
  ruh hali 3 günde −%25 → kırmızı.
- Tamsayı metriklerde (nabız, solunum) tablo kapsayıcı tamsayı aralığı gösterir; kodda
  `[min, max)` kullanılır (ör. yeşil nabız `{min: 50, max: 101}`).

## Ortam düzeltmeleri (`environments.config.ts`)

Formül (motor, Mühendis 3): her bant sınırı `b` için, yeşil bandın merkezi `c` olmak üzere
`b' = b + shift + sign(b − c) × widen`.

| Ortam                              | g     | Beklenen doz (mSv/gün) | Tek yön gecikme | Tahliye            | Tıbbi kapasite      | Düzeltmeler                                                       | Kaynak                                              |
| ---------------------------------- | ----- | ---------------------- | --------------- | ------------------ | ------------------- | ----------------------------------------------------------------- | --------------------------------------------------- |
| `iss`                              | 0     | 0.5 (0.3–0.8)          | 0–1 sn          | ~24 sa             | full_ground_support | `bodyTemp shift +0.3`                                             | `csa-radiation`, `stahn-2017-core-temp`             |
| `spacecraft` (derin uzay transiti) | 0     | 1.8                    | 5 sn – ~22 dk   | yok (∞)            | limited             | `bodyTemp shift +0.3`                                             | `zeitlin-2013-msl-rad`                              |
| `rover` (Ay yüzeyi, basınçlı)      | 0.16  | 1.3                    | ~1.3 sn         | ~8 sa (üsse dönüş) | limited             | `spo2 shift +1`, `respRate widen −1`, `exerciseMinutes shift −60` | `zhang-2020-lunar-surface`                          |
| `lunar_base`                       | 0.166 | 1.3                    | ~1.3 sn         | 120 sa (3–5 gün)   | limited             | `exerciseMinutes shift −30`                                       | `zhang-2020-lunar-surface`                          |
| `mars_base`                        | 0.38  | 0.64                   | 4–24 dk         | yok (∞)            | autonomous          | `exerciseMinutes shift −30`                                       | `hassler-2014-mars-surface`, `nasa-mars-comm-delay` |

Gerekçeler:

- **ISS/transit vücut ısısı:** Uzun süreli mikro-g'de çekirdek ısının ~1 °C'ye kadar yükseldiği
  gösterildi (Stahn 2017). Ateşi maskelememek için yalnızca +0.3 °C kaydırıyoruz (ADR-017).
- **Rover:** küçük kabin hacmi → CO₂ birikimi riski; SpO₂ ve solunum daha sıkı, egzersiz hedefi düşük.
- **Ay/Mars:** kısmi yerçekimi kemik/kas yükünü kısmen sağlar → egzersiz hedefi 30 dk düşük
  (doğrulanacak varsayım).

## Eskalasyon kuralları (motor spesifikasyonu — Mühendis 3)

1. Tek metrik **kırmızı** → `crew_medical_officer` (bant `escalation` alanı; istisna ADR-013).
2. Kardiyovasküler / SpO₂ / glukoz / ısı **acil** bandı → `flight_surgeon`.
   `medicalCapability === 'autonomous'` (Mars) ise → `emergency` + "otonom protokol": CMO yönetir,
   flight surgeon'a **asenkron rapor** (öneri metni gecikmeyi `oneWayCommDelaySec` ile gösterir).
3. Aynı vücut bölgesinde **≥2 sarı** veya bir metrikte **3 ölçüm üst üste kötüleşen trend** →
   `crew_medical_officer`.
4. Bölge durumu = içindeki en kötü değerlendirme; mürettebat genel durumu = en kötü bölge
   (Faz 0'da uygulandı: `assessCrew`).
5. Her **kırmızı/acil** sonuç için **"yeniden ölç"** önerisi + sade dilde "neden önemli"
   açıklaması **zorunlu**.
6. Radyasyon SPE: günlük doz > 5 × `expectedDailyRadiationMSv` → kırmızı, `flight_surgeon`,
   `radiation_shelter` önerisi (Mars'ta `emergency`).

## Kritik durumu önleme (özet — detay Mühendis 3, P2)

- Trend uyarıları eşik aşılmadan **önce** sarı verir (erken uyarı).
- Rutin hatırlatmalar kaçırılan ölçümleri görünür kılar (veri yokluğu da bir risk sinyalidir).
- Her kırmızıda yeniden ölçüm → yanlış pozitifleri ayıklar, gerçek kötüleşmeyi doğrular.

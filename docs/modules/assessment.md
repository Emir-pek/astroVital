# Mühendis 3 — Değerlendirme, Risk & Yönlendirme

**Branch:** `feat/assessment` · **Sahip:** Mühendis 3 (_TBD_)

## Amaç

Ölçümleri **bilimsel dayanaklı** kurallarla değerlendirip astronotun anlayacağı dilde sonuç,
"neden önemli" açıklaması, öneri ve **kime haber verileceği** (eskalasyon) üretmek.

## Sahip olunan klasörler

`src/modules/assessment/**`, `docs/THRESHOLDS.md`, `docs/HAZARDS.md`, `docs/SOURCES.md`,
içerik olarak `src/core/config/thresholds.config.ts` ve `sources.config.ts` (merge onayı Mühendis 1),
`en.json`/`tr.json` içinde `assessment.*`, `thresholds.*`, `recommendations.*` anahtarları.

## Public API (`@modules/assessment`)

`assessMeasurement(m, ctx)`, `assessCrew(crewId, measurements, ctx)`, `buildRegions`,
`emptySummary`, `useCrewHealth(crewId)`, `useAllCrewHealth()`, `<AlertCenter compact? limit?/>`,
`<LearnPanel metric?/>`, `<RecommendationList recommendations/>`.

## Bağımlılıklar

Yalnız `@core/*`. Visualization ve routine **bu modüle** bağlıdır → public API'yi kırma.

## Görevler

### P0 (Faz 1) — Kural motoru (saf fonksiyonlar, ≥%90 kapsam)

- [ ] `engine/bands.ts`: `applyModifier(threshold, modifier)` — `b' = b + shift + sign(b − c)·widen`
- [ ] `engine/bands.ts`: `findBand(value, bands)` — yarı açık `[min, max)`
- [ ] Radyasyon: `basis: 'cumulativeSum'` → `priorRadiationMSv + Σ günlük doz`;
      SPE: günlük doz > `RADIATION_SPE_DAILY_MULTIPLIER × env.expectedDailyRadiationMSv`
      → kırmızı + `flight_surgeon` + `radiation_shelter`
- [ ] `engine/trend.ts`: hareketli ortalama + doğrusal eğim (`windowDays`), `improving/stable/worsening/unknown`;
      "metriğe göre iyi yön" (nabız düşüşü ≠ ruh hali düşüşü)
- [ ] `engine/sustained.ts`: ardışık gün kuralları (uyku, egzersiz) — günlük değer = o günün son ölçümü
- [ ] `engine/escalation.ts`: THRESHOLDS.md § Eskalasyon kuralları 1–6; Mars/otonom →
      `flight_surgeon` ⇒ `emergency` + otonom protokol önerisi
- [ ] `assessCrew`: "aynı bölgede ≥2 sarı → CMO" kuralı
- [ ] Her sonuç: `summaryKey`, `explanationKey`, `messageParams`, `sourceIds`, `recommendations`;
      **kırmızı/acilde "yeniden ölç" zorunlu**
- [ ] `assessMeasurement` `ctx.now` kullanır, store'a dokunmaz

### P1 (Faz 2)

- [ ] Öneri kütüphanesi `engine/recommendations.ts`: dinlenme, hidrasyon, egzersiz protokolü,
      radyasyon sığınağı, psikolojik destek, yeniden ölçüm, CMO / flight surgeon iletişimi
      (Mars'ta "mesajınız ~X dk'da ulaşır" — `oneWayCommDelaySec`)
- [ ] `<AlertCenter/>`: öncelik (eskalasyon > durum > zaman), onaylama (modül-yerel persist store
      `astrovital:assessment`), kime haber verileceği, `RecommendationList` açılır panel
- [ ] `<LearnPanel/>` tam içerik: her metrik için **Nedir? / Uzayda nasıl ölçülür? / Uzay onu nasıl
      etkiler? / Renkler ne demek?** + eşik tablosu (ortam düzeltmeli) + kaynak bağlantıları;
      5 tehlike kartı. Astronotun tıp bildiğini **varsayma**.

### P2 (Faz 3)

- [ ] SOURCES.md doğrulama (⏳ → ✅), `sources.config.ts > verified`
- [ ] THRESHOLDS.md / HAZARDS.md son hali (kod ile senkron)
- [ ] "Flight surgeon raporu": son 7 gün özeti, kopyalanabilir sade metin (asenkron gönderim için)
- [ ] Kritik durumu önleme kontrol listeleri (ateş, hipoglisemi, SPE, ortostatik)
- [ ] Bileşik kurallar: "sistolik <80 + semptom", "ruh hali 1 + izolasyon belirtisi" (semptom girişi
      için intake ile `note`/etiket sözleşmesi konuş)

## Kabul kriterleri

- `fever_dehydration` senaryosunda crew-2: ısı kırmızı, nabız sarı/kırmızı, genel kırmızı,
  eskalasyon ≥ CMO; Mars'ta aynı veri → `emergency`.
- `solar_particle_event` (spacecraft): SPE günü kırmızı + sığınak önerisi.
- `nominal` senaryoda mürettebatın büyük çoğunluğu yeşil (yanlış alarm yağmuru yok).
- Motor dosyalarında kapsam ≥%90 (`npm run test:coverage`).

## Test beklentileri

- Tablo-güdümlü bant testleri: her metrik için her bandın iki sınırı.
- Ortam düzeltmesi: ISS'te 37.6 °C sarı değil yeşil (shift +0.3) — gibi örnekler.
- Eskalasyon kural matrisi testleri; trend için sentetik seriler.
- Faz 0 stub testlerini (`__tests__/engine.stub.test.ts`) gerçek beklentilerle değiştir.

## Entegrasyon noktaları

- **Visualization:** `useCrewHealth().regions[*].status` vücut haritasını boyar;
  `assessments[*].recommendations` → `RegionDetailPanel`.
- **Routine:** kırmızı durumda "yeniden ölç" görevi; uyarı onayı XP vermez.
- **Intake:** semptom/not girişi sözleşmesi (P2 bileşik kurallar için).

## Yapma listesi

- ❌ Kaynaksız eşik/öneri ekleme — her sayı bir `sourceId`'ye bağlanır.
- ❌ Motorda `Date.now()`, store, React — saf kalmalı.
- ❌ Tıbbi teşhis dili ("hipertansiyonunuz var") — "değer yüksek, şunu yapın, X'e haber verin".
- ❌ Public API imzasını duyurmadan değiştirme (visualization/routine kırılır).

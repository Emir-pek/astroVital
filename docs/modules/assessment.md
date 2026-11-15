# Mühendis 3 — Değerlendirme, Risk & Yönlendirme

**Branch:** `feat/assessment` · **Sahip:** Mühendis 3 (Emir Efe Pekcan, `Emir-pek`)

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

- [x] `engine/bands.ts`: `applyModifier(threshold, modifier)` — `b' = b + shift + sign(b − c)·widen`
- [x] `engine/bands.ts`: `findBand(value, bands)` — yarı açık `[min, max)`
- [x] Radyasyon: `basis: 'cumulativeSum'` → `priorRadiationMSv + Σ günlük doz`;
      SPE: günlük doz > `RADIATION_SPE_DAILY_MULTIPLIER × env.expectedDailyRadiationMSv`
      → kırmızı + `flight_surgeon` + `radiation_shelter` (`engine/radiation.ts`)
- [x] `engine/trend.ts`: hareketli ortalama (pencereyi ikiye bölüp ortalamaları kıyaslar — tek
      günlük bir gürültünün sonucu tek başına çevirmesini önler) + `windowDays` içinde değişim
      yüzdesi, `improving/stable/worsening/unknown`; "metriğe göre iyi yön" `deltaPct`'in işaretinden
      geliyor (nabız artışı kötü, ruh hali düşüşü kötü — tek kod yolu, metrik özel dallanma yok)
- [x] `engine/sustained.ts`: ardışık gün kuralları (uyku, egzersiz) — günlük değer = o günün son
      ölçümü; aradaki bir gün eksikse (ör. egzersiz dinlenme günü) zincir sayılmıyor
- [x] `engine/escalation.ts`: THRESHOLDS.md § Eskalasyon kuralları 1–6; Mars/otonom →
      `flight_surgeon` ⇒ `emergency` + otonom protokol önerisi (yalnız flight_surgeon seviyesi
      yükseliyor; CMO seviyesi Mars'ta da CMO kalıyor — CMO zaten gemide)
- [x] `assessCrew`: "aynı bölgede ≥2 sarı → CMO" kuralı + `engine/trend.ts`'teki "3 ölçüm üst üste
      kötüleşen trend → CMO" kuralı (`isMonotonicWorsening`)
- [x] Her sonuç: `summaryKey`, `explanationKey`, `messageParams` (ölçülen değer, adımına
      yuvarlanmış), `sourceIds`, `recommendations`; **kırmızı/acilde "yeniden ölç" zorunlu**
- [x] `assessMeasurement` `ctx.now` kullanır, store'a dokunmaz

### P1 (Faz 2)

- [x] Öneri kütüphanesi `engine/recommendations.ts`: dinlenme, hidrasyon, egzersiz protokolü,
      radyasyon sığınağı (SPE için ayrı "hemen sığınağa geç" metni), psikolojik destek, yeniden
      ölçüm, CMO / flight surgeon iletişimi. **Eksik:** Mars'ta "mesajınız ~X dk'da ulaşır" dakika
      sayısı `oneWayCommDelaySec`'ten hesaplanmıyor — `Recommendation` tipinde `stepsKeys` sabit
      i18n anahtarları, parametre alanı yok; şimdilik genel "gerçek zamanlı yanıt bekleme" metni
      kullanılıyor. Dinamik dakika için ya `Recommendation`'a `params` eklenmeli (tip değişikliği →
      ekip duyurusu + Mühendis 1 onayı) ya da `AlertCenter`/`RegionDetailPanel` bunu ayrı gösterir.
- [ ] `<AlertCenter/>`: öncelik sıralaması zaten gerçek motordan geliyor; **eksik:** onaylama
      (modül-yerel persist store `astrovital:assessment`), `RecommendationList` açılır panel
- [ ] `<LearnPanel/>` tam içerik: eşik tablosu (ortam düzeltmeli) + kaynak bağlantıları eksik; "Nedir? /
      Uzayda nasıl ölçülür?" zaten vardı, bu oturumda yalnız kutu sistemine taşındı (sınıf adları).

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

- [x] Tablo-güdümlü bant testleri: her metrik için her bandın iki sınırı (`bands.test.ts`,
      `assessMeasurement.test.ts`).
- [x] Ortam düzeltmesi: ISS'te 37.6 °C sarı değil yeşil (shift +0.3), 38.5 °C sarı değil
      **kırmızı** (bildirilen hata) — `bands.test.ts`, `assessMeasurement.test.ts`.
- [x] Eskalasyon kural matrisi testleri (`escalation.test.ts`, `assessCrew.test.ts`); trend için
      sentetik seriler (`trend.test.ts`).
- [x] Faz 0 stub testlerini (`__tests__/engine.stub.test.ts`) gerçek beklentilerle değiştir →
      `engine/__tests__/{bands,trend,sustained,radiation,escalation,recommendations,
    assessMeasurement,assessCrew}.test.ts`. `assessCrew.test.ts`, `docs/DEMO_CREW_STORIES.md`'deki
      `mixed_mission` (seed 2026) beklenen tabloyu kilitliyor: crew-1 nominal, crew-2 warning/CMO,
      crew-3 caution/self_care. crew-4 (Lucas) bu motorla **nominal** — kişisel baseline/advisory
      kuralı henüz yok (ADR-031), test bunu bilerek kilitliyor, bug değil.

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

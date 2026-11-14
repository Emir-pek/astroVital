# CLAUDE.md — @modules/assessment (Değerlendirme, Risk & Yönlendirme)

**Sahip:** Mühendis 3 · **Branch:** `feat/assessment` · **Görev listesi:** `docs/modules/assessment.md`

## Amaç

Ölçümleri eşik bantları + ortam düzeltmeleri + trend + ardışık gün kuralları ile değerlendirmek;
sade dilde özet, "neden önemli" açıklaması, öneri listesi ve eskalasyon (self_care → CMO →
flight surgeon → emergency) üretmek. Uyarı merkezi ve öğrenme paneli de burada.

## Sahip olunan dosyalar

`src/modules/assessment/**` · `docs/THRESHOLDS.md`, `docs/HAZARDS.md`, `docs/SOURCES.md` ·
içerik: `src/core/config/thresholds.config.ts`, `sources.config.ts` (merge onayı Mühendis 1) ·
`assessment.*`, `thresholds.*`, `recommendations.*` i18n anahtarları.

## Public API (`index.ts` — tek giriş noktası)

`assessMeasurement`, `assessCrew`, `buildRegions`, `emptySummary`, `useCrewHealth`,
`useAllCrewHealth`, `AlertCenter`, `LearnPanel`, `RecommendationList`.
⚠️ visualization ve routine bu API'ye bağlı — imza değişikliği önce duyurulur.

## Bağımlılık

Yalnız `@core/*`.

## Kurallar

- `engine/` **saf**: store, React, `Date.now()` yok — `ctx.now` kullan. Hedef ≥%90 test kapsamı.
- Her eşik/öneri bir `sourceId` taşır (kaynaksız sayı yok).
- Kırmızı/acil her sonuçta "yeniden ölç" önerisi + sade "neden önemli" açıklaması zorunlu.
- Teşhis dili kullanma; "değer yüksek → şunu yap → X'e haber ver" kalıbı.
- Mars/otonom ortamda `flight_surgeon` → `emergency` + asenkron rapor (gecikmeyi göster).
- Modül-yerel durum (uyarı onayları) kendi persist store'unda: `astrovital:assessment`.

## Dokunulmaması gerekenler

`src/core/types/**` (öneri için Mühendis 1), diğer modüller, `src/app/**`.

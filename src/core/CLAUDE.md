# CLAUDE.md — src/core (ortak çekirdek)

**Sahip:** Mühendis 1. Görev listesi: `docs/modules/core-routine.md`.

## Amaç

Tüm modüllerin paylaştığı tek şey burada: sözleşmeler (`types`), statik bilgi (`config`),
paylaşılan durum (`store`), demo verisi (`simulation`), çeviriler (`i18n`), UI kit (`ui`), yardımcılar (`utils`).

## Kurallar

- `core` **hiçbir modülü ve app'i import etmez** (ESLint).
- `types/` yalnız tip içerir. Değişiklik → ekip duyurusu → `npm run docs:contracts` → Mühendis 1 onayı.
- `config/` saf veri: React/store yok. Eşik veya ortam değeri değişirse `docs/THRESHOLDS.md` de güncellenir.
  `thresholds.config.ts` / `sources.config.ts` içeriğinin sahibi Mühendis 3'tür (merge onayı Mühendis 1).
- `simulation/` saf ve deterministik: `Math.random`/`Date.now` yasak, seed'li `createRng` kullan.
- `ui/` bileşenleri `t()` çağırmaz; çevrilmiş metni prop olarak alır. Sabit renk yok, token kullan.
  `tokens.css` içeriğinin sahibi Mühendis 4'tür.
- `store/`: yalnız alan verisi. Şema değişirse `version` artır + `migrate`.
- `i18n/`: anahtar ekleyen herkes EN + TR'yi aynı commit'te ekler.

## Dokunma

Modül klasörleri (`src/modules/**`) ve `src/app/**` bu katmanın dışında.

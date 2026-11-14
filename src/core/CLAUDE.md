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
  **Kendi bileşenlerimiz + gerektiğinde Base UI veya Radix (ADR-029, esnek):** kit parçalarını biz
  yazarız; açılır menü, popover/tooltip, modal gibi konumlanan/odak yöneten parçalarda Base UI
  (`@base-ui/react`) veya Radix (`radix-ui` / `@radix-ui/*`) kullanılabilir. Bu kütüphaneler yalnız
  `src/core/ui/**` içinde import edilir (ESLint zorlar); paketi ilk ihtiyaç duyan kendi PR'ında kurar.
  Bir parça = bir motor (envanterde "Motor" sütunu); iç içe açılan katmanlar mümkünse aynı kütüphaneden.
  Kütüphane tipleri/bileşenleri kitin public API'sinden (`index.ts`) **dışarı sızmaz**: props bizim
  tiplerimizdir, sarmalayıp yalnız kendi bileşenimizi export ederiz.
  **Kit açık modeldir (ADR-029):** `src/core` sahibi Mühendis 1 olsa da `ui/`'a her mühendis genel
  (veya 2+ modülde kullanılacak) parça ekleyebilir; önce `docs/TEAM.md` "UI kit envanteri"ne adını
  yazar. Modüle özgü parça (ör. BodyMap) modülde kalır. Kit PR'larında mimari onay Mühendis 1,
  görünüm onayı tasarım sahibi; her yeni parça render testli.
- `store/`: yalnız alan verisi. Şema değişirse `version` artır + `migrate`.
- `i18n/`: anahtar ekleyen herkes EN + TR'yi aynı commit'te ekler.
- Zaman (ADR-030): Bileşenlerde güncel zaman için `new Date()` değil `useNow()` (`@core/hooks`) kullan;
  zaman hesaplayan fonksiyonlar `now`'ı parametre olarak alır (test edilebilirlik). Tüm zaman hesapları UTC.

## Dokunma

Modül klasörleri (`src/modules/**`) ve `src/app/**` bu katmanın dışında.

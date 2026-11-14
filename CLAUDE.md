# CLAUDE.md — AstroVital (kök kurallar)

## Proje özeti

AstroVital, NASA Space Apps Challenge 2026 "Health Monitoring Software" görevi için uzun süreli
görevlerdeki astronotların kendi sağlıklarını takip edip **sade dille** değerlendirebildiği bir
React web uygulamasıdır. Tansiyon, nabız, kan şekeri, ısı, uyku, ruh hali, SpO₂, solunum,
radyasyon ve egzersiz verisini klavye/tıklama/kamera/ultrason ile toplar; eşiklere göre
yeşil/sarı/kırmızı değerlendirir; öneri ve eskalasyon (CMO / flight surgeon) üretir; etkileşimli
vücut haritası ile gösterir. Backend yok, **offline-first**, veriler simüle. Tıbbi cihaz değildir.

## Komutlar

```bash
npm run dev          # geliştirme sunucusu (http://localhost:5173)
npm run build        # tsc -b + vite build → dist/
npm run preview      # production build önizleme
npm test             # vitest run (tüm testler)
npm run test:watch   # izleme modu
npm run test:coverage
npm run lint         # eslint, uyarı = hata (--max-warnings=0)
npm run typecheck    # tsc -b --noEmit
npm run format       # prettier --write
npm run verify       # lint + typecheck + test + build (merge öncesi)
npm run docs:contracts  # src/core/types → docs/CONTRACTS.md senkronu
```

## Mimari kurallar (ESLint ile zorlanır)

- Katmanlar: `src/core` (ortak çekirdek) · `src/modules/{intake,assessment,visualization,routine}` · `src/app` (kabuk).
- İzinli bağımlılık grafiği — döngü yasak:
  `core ← intake, assessment, visualization, routine, app` · `assessment ← visualization, routine, app` · `intake, visualization, routine ← app`.
- Bir modül başka modülü **yalnız** `@modules/<ad>` (index.ts) ile import eder. Derin import
  (`@modules/x/components/...`) ve katman dışına göreli import (`../../core/...`) yasak.
- Modül içinde kendi `@modules/<ad>`'ını import etme — göreli import kullan.
- `@core/*`, `@app/*` (yalnız app), `@test/*` (yalnız `__tests__`) alias'larını kullan.
- **`src/core/types` değişikliği = tüm ekibe duyuru + `npm run docs:contracts` + Mühendis 1 onayı.**
  Ayrıntı: `docs/CONTRACTS.md`. Mimari: `docs/ARCHITECTURE.md`. Kararlar: `docs/DECISIONS.md`.
- Paylaşılan alan verisi `useHealthStore`'da; modül-yerel durum modülün kendi store'unda.
- Zustand v5: seçiciden yeni dizi/nesne döndürme → ham dilim + `useMemo`.

## Kod stili

- Fonksiyonel React bileşenleri + hook'lar; sınıf yok.
- **Saf fonksiyonları tercih et** (motor, simülasyon, utils). Saat gerekiyorsa `now` parametresi al.
- TypeScript strict; **`any` yasak** (`unknown` + daraltma kullan). `import type` kullan.
- Kod, değişken adları, yorumlar **İngilizce**; `docs/` Türkçe.
- **i18n anahtarı olmadan UI metni yazma.** Yeni anahtarı hem `en.json` hem `tr.json`'a, kendi
  modül önekinle ekle (test eşitliği zorlar). `core/ui` bileşenleri `t()` çağırmaz, çevrilmiş metin alır.
- Renkleri sabit yazma; `tokens.css` + Tailwind token sınıfları (`bg-surface`, `text-ok/warn/crit`).
- Durum her zaman **renk + ikon + metin** (`StatusBadge`). Butonlar eldiven dostu (`size="lg"`).
- Her eşik/öneri bir kaynağa (`sourceIds`, `docs/SOURCES.md`) bağlanır.
- Ağ isteği yok (offline-first): CDN font/script, analitik, harici API ekleme.

## Test kuralı

- **Her yeni motor/saf fonksiyon testli** (`__tests__/` klasöründe, `*.test.ts(x)`).
- Her public bileşen için en az bir render testi (`renderWithProviders` — `@test/renderWithProviders`).
- Assessment motoru hedefi ≥%90 kapsam.
- Merge öncesi: `npm run lint && npm run typecheck && npm test` (tercihen `npm run verify`).

## Git kuralı (yerel)

- Branch'ler: `feat/core-routine` (Müh. 1), `feat/intake` (Müh. 2), `feat/assessment` (Müh. 3),
  `feat/visualization` (Müh. 4) — hepsi `main`'den.
- Conventional Commits: `feat(intake): ...`, `fix(assessment): ...`, `docs(thresholds): ...`.
- Günde en az 2 kez `main`'e merge; `src/core` değişiklikleri yalnız Mühendis 1 onayıyla.
- Aynı makinede paralel çalışma: `git worktree` (README + `docs/TEAM.md`).
- ⛔ **Push yapma, remote ekleme** (mevcut `origin`'e de push yok — ADR-001).

## Nerede ne var

- Görev listeleri: `docs/modules/{core-routine,intake,assessment,visualization}.md`
- Eşikler: `docs/THRESHOLDS.md` ↔ `src/core/config/thresholds.config.ts`
- Tehlikeler: `docs/HAZARDS.md` · Kaynaklar: `docs/SOURCES.md` ↔ `src/core/config/sources.config.ts`
- Plan: `docs/PLAN.md` · Ekip: `docs/TEAM.md` · Demo: `docs/DEMO_SCRIPT.md`
- Her modülün kendi `CLAUDE.md`'si modüle özel kuralları içerir.

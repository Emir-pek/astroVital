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
npm run doctor       # ortam kontrolü (SETUP_CHECK § 1–2 otomatik)
npm run docs:check   # değişiklik CHANGELOG'a yazılmış mı?
npm run claude:setup # ekip Claude plugin'lerini kur
```

Kurulum tek komut: `powershell -ExecutionPolicy Bypass -File scripts\setup.ps1` (Windows) ·
`bash scripts/setup.sh` (macOS/Linux/Git Bash).

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
- Paylaşılan veri dosyaları: tek modülün kullandığı veri (ör. gömülü uzay ajansı verisi) o modülün klasöründe durur; birden fazla modül veya `core/simulation` kullanacaksa `src/core/config/`'a konur (içerik sahibi veriyi getiren mühendis, merge onayı Mühendis 1). Neden: modüller core'dan okuyabilir, core hiçbir modülden okuyamaz (ESLint).
- Arayüz parçası gerekiyorsa önce @core/ui'a bak. Yoksa ve genel bir parçaysa veya 2+ modülde kullanılacaksa kendin src/core/ui'a ekle: önce docs/TEAM.md 'UI kit envanteri'ne adını ve motorunu (kendi/Base UI/Radix) yaz; kurallara uy (Base UI/Radix yalnız kitte, t() yok, renkler token'dan, test zorunlu). Tek modüle özgü parça (ör. BodyMap) o modülde kalır. Kit PR'larında mimari onay Mühendis 1, görünüm onayı tasarım sahibi.

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

## Kurulum ve bağımlılıklar (ZORUNLU)

- Projeyi ilk kez ayağa kaldırırken veya kullanıcı "kurulumu kontrol et" dediğinde:
  `docs/SETUP_CHECK.md`'deki listeyi sırayla çalıştır ve § 4 "Durum raporu"nu doldurup kullanıcıya ver
  (eksik araç, geride kalan sürüm, eksik bağımlılık ve düzeltme komutları).
- **Bağımlılık eklerken, çıkarırken veya sürümünü değiştirirken** (`npm install <paket>`,
  `npm uninstall`, `package.json` düzenlemesi): **aynı commit'te** `docs/SETUP_CHECK.md` § 5
  "Bağımlılık kaydı" tablosunu güncelle (paket, `package.json`'daki aralığın birebir aynısı, tür, amaç,
  ekleyen/tarih). Yeni bir sistem aracı gerekiyorsa § 1'e ekle. Prosedür: § 6.
  `src/test/setup-check.test.ts` tablo eksikse `npm test`'i kırmızı yapar — testi gevşetme, tabloyu düzelt.
- Bağımlılık eklemeden önce kullanıcıya/ekibe sor (bundle boyutu, offline çalışma).
- Python/venv kullanılmaz; izolasyon `node_modules` + `package-lock.json` ile sağlanır.

## Dokümantasyon (ZORUNLU)

- Kod/config'e dokunan **her değişiklikte** `CHANGELOG.md`'ye kayıt ekle (`<!-- NEW ENTRIES BELOW -->`
  altına, en yeni en üstte: Ne / Neden / Dosyalar / Ekip ne yapmalı) ve davranış değiştiyse ilgili
  `docs/` dosyasını güncelle — `document-change` skill'ini kullan. Pre-commit hook, CI ve Stop hook zorlar.
- İşe başlarken `CHANGELOG.md`'nin son kayıtlarını oku (SessionStart hook bağlama koyar); "Ekip ne
  yapmalı" satırında kullanıcıyı etkileyen bir şey varsa söyle.
- Ekip Claude araçları (`.claude/`, `.mcp.json`) yalnız araç sahibi (Emir) tarafından değiştirilir:
  `docs/CLAUDE_SETUP.md`, `/add-team-tool`.

## Test kuralı

- **Her yeni motor/saf fonksiyon testli** (`__tests__/` klasöründe, `*.test.ts(x)`).
- Her public bileşen için en az bir render testi (`renderWithProviders` — `@test/renderWithProviders`).
- Assessment motoru hedefi ≥%90 kapsam.
- Merge öncesi: `npm run lint && npm run typecheck && npm test` (tercihen `npm run verify`).

## Git kuralı

- Branch'ler: `feat/core-routine` (Müh. 1), `feat/intake` (Müh. 2), `feat/assessment` (Müh. 3),
  `feat/visualization` (Müh. 4) — hepsi `main`'den.
- Conventional Commits: `feat(intake): ...`, `fix(assessment): ...`, `docs(thresholds): ...`.
- `main`'e **yalnız Pull Request** ile (ADR-028): kendi `feat/*` branch'ine push → PR → CI (`verify` +
  `docs`) yeşil + en az 1 onay → merge. Günde en az 2 kez main'e al. `src/core` PR'larını Mühendis 1 onaylar.
- Aynı makinede paralel çalışma: `git worktree` (README + `docs/TEAM.md`).
- Repo: `https://github.com/Emir-pek/astroVital` (`origin`). Kullanıcı isterse kendi `feat/*` branch'ini
  push et ve PR aç. ⛔ **`main`'e doğrudan push yok, force push yok**, başkasının branch'ine push yok,
  remote ekleme/değiştirme yok (ADR-026, ADR-028).

## Nerede ne var

- Görev listeleri: `docs/modules/{core-routine,intake,assessment,visualization}.md`
- Eşikler: `docs/THRESHOLDS.md` ↔ `src/core/config/thresholds.config.ts`
- Tehlikeler: `docs/HAZARDS.md` · Kaynaklar: `docs/SOURCES.md` ↔ `src/core/config/sources.config.ts`
- Plan: `docs/PLAN.md` · Ekip: `docs/TEAM.md` · Demo: `docs/DEMO_SCRIPT.md`
- Kurulum kontrolü + bağımlılık kaydı: `docs/SETUP_CHECK.md`
- Değişiklik günlüğü: `CHANGELOG.md` · Ortak Claude kurulumu: `docs/CLAUDE_SETUP.md`
- Her modülün kendi `CLAUDE.md`'si modüle özel kuralları içerir.

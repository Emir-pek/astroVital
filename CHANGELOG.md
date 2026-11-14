# CHANGELOG — Ekip değişiklik günlüğü

Kod/config'e dokunan **her değişiklik** burada kayda girer, **en yeni en üstte**. `git pull`'dan sonra
yeni kayıtlar terminale otomatik basılır (post-merge hook) ve her Claude Code oturumu son kayıtları
okuyarak başlar (SessionStart hook).

Format (`document-change` skill'i, pre-commit hook'u ve CI zorlar):

```markdown
### YYYY-MM-DD HH:MM — Yazar (branch) — Kısa başlık

- **Ne:** kullanıcıya görünen etki önce
- **Neden:** gerekçe / karar
- **Dosyalar:** `yol/a`, `yol/b`
- **Ekip ne yapmalı:** hiçbir şey | npm ci | setup'ı tekrar çalıştır | /reload-plugins | ...
```

Not gerektirmeyen önemsiz düzeltme: `SKIP_DOCS=1 git commit ...` veya PR başlığına `[skip-docs]`.
Yalnız `docs/` değişiklikleri kayıt gerektirmez.

<!-- NEW ENTRIES BELOW -->

### 2026-11-14 16:25 — Muhammed Bektaş (feat/core-routine) — Mimari kural: paylaşılan veri dosyalarının yeri

- **Ne:** Yeni kural: tek modülün kullandığı veri dosyası (ör. gömülü uzay ajansı verisi) o modülde kalır; birden fazla modül
  veya `core/simulation` kullanacaksa `src/core/config/` altına konur (içerik sahibi veriyi getiren, merge onayı Mühendis 1).
- **Neden:** Modüller core'dan okuyabilir, core hiçbir modülden okuyamaz (ESLint) — paylaşılan veri modülde kalırsa diğerleri erişemez.
- **Dosyalar:** `CLAUDE.md`, `src/core/CLAUDE.md`, `docs/ARCHITECTURE.md`, `CHANGELOG.md`
- **Ekip ne yapmalı:** Hiçbir şey; yeni bir veri dosyası eklerken bu kurala göre yer seç.

### 2026-11-14 15:22 — Muhammed Bektaş (feat/core-routine) — UI kit kuralları: açık katkı modeli + Base UI/Radix yalnız core/ui'da

- **Ne:** UI kit (`src/core/ui`) açık katkı modeline geçti: genel/2+ modülde kullanılacak parçaları her
  mühendis ekleyebilir, önce `docs/TEAM.md` "UI kit envanteri"ne adını ve motorunu yazar (yeni "Motor"
  sütunu). Konumlanan/odak yöneten parçalarda Base UI veya Radix serbest; ESLint `@base-ui/react`,
  `radix-ui` ve `@radix-ui/*` importunu `src/core/ui/**` dışında hata olarak işaretliyor. Yeni paket kurulmadı.
- **Neden:** Tasarım sahibini tek kütüphaneye kilitlememek; kütüphaneler kitin içinde kaldığı için seçim
  parça bazında değişebilir ve modülleri etkilemez (ADR-029).
- **Dosyalar:** `eslint.config.js`, `docs/DECISIONS.md`, `docs/ARCHITECTURE.md`, `docs/TEAM.md`,
  `docs/SETUP_CHECK.md`, `src/core/CLAUDE.md`, `CLAUDE.md`, `CHANGELOG.md`
- **Ekip ne yapmalı:** Kendi branch'inde `git merge origin/main`. Genel arayüz parçası gerekiyorsa src/core/ui'a ekle; önce docs/TEAM.md 'UI kit envanteri'ne adını ve motorunu (kendi/Base UI/Radix) yaz. Base UI veya Radix gerekiyorsa paketi kendi PR'ında kur; yalnız src/core/ui içinde import et (lint zorlar).

### 2026-11-14 15:25 — Emir (chore/changelog-union) — CHANGELOG çakışmaları yerel merge'te otomatik çözülür

- **Ne:** `.gitattributes`'a `CHANGELOG.md merge=union` eklendi: kendi branch'inde `git merge origin/main`
  yaptığında iki taraftaki CHANGELOG kayıtları otomatik birleşir, çakışma çıkmaz.
- **Neden:** Paralel PR'lar kaydı hep aynı yere (en üst) eklediği için her seferinde çakışıyordu (PR #2).
- **Dosyalar:** `.gitattributes`, `docs/TEAM.md`, `CHANGELOG.md`
- **Ekip ne yapmalı:** Hiçbir şey. Bu kuralı içeren main'i branch'ine aldığın **ilk** merge'te bir kez daha
  çakışma çıkabilir (iki kaydı da tut); sonrakiler otomatik. GitHub web arayüzündeki "Resolve conflicts" bu
  kuralı kullanmaz — merge'ü yerelde yap.

> > > > > > > origin/main

### 2026-11-14 15:00 — Emir (docs/team-onboarding) — README'ye adım adım ekip kurulumu

- **Ne:** README'ye "Team onboarding (step by step)" bölümü: araç kurulumu → klonlama → setup → verify →
  uygulamayı çalıştırma → Claude Code trust + MCP/plugin/skill/hook doğrulama → dokümantasyon
  kontrolü denemesi → günlük akış; her adımda beklenen çıktı ve sonda kontrol listesi.
- **Neden:** Her ekip üyesinin kurulumunu kendi başına yapıp doğru çalıştığından emin olabilmesi.
- **Dosyalar:** `README.md`, `docs/TEAM.md`
- **Ekip ne yapmalı:** README › Team onboarding'i baştan sona uygula ve kontrol listesini tamamla.

### 2026-11-14 13:30 — Emir (main) — Ekip altyapısı: tek komut kurulum, dokümantasyon zorunluluğu, ortak Claude araçları

- **Ne:** Tek komutla kurulum (`scripts/setup.ps1` / `scripts/setup.sh`) ve otomatik kontrol (`npm run doctor`);
  her değişikliğin bu dosyaya yazılmasını zorlayan pre-commit hook + CI + Claude Stop hook'u; `git pull`
  sonrası değişiklik özeti; repoda paylaşılan Claude Code ayarları (plugin'ler, MCP sunucuları, skill'ler,
  hook'lar); GitHub Actions CI (`npm run verify`); PR şablonu; Codespaces dev container. Git akışı PR tabanlı
  oldu: `main`'e doğrudan push yerine PR + yeşil CI + 1 onay.
- **Neden:** Dört mühendisin aynı ortamı ve aynı Claude araçlarını tek adımda alması; birinin yaptığı her
  değişikliğin diğerleri tarafından okunabilmesi (ADR-027, ADR-028).
- **Dosyalar:** `.claude/`, `.mcp.json`, `.githooks/`, `.github/`, `.devcontainer/`, `scripts/setup.*`,
  `scripts/doctor.mjs`, `scripts/docs-check.mjs`, `scripts/claude-setup.mjs`, `package.json` (yalnız script'ler),
  `CHANGELOG.md`, `docs/CLAUDE_SETUP.md`, `README.md`, `CLAUDE.md`, `docs/TEAM.md`, `docs/SETUP_CHECK.md`,
  `docs/DECISIONS.md`, `.gitignore`, `.env.example`, `.vscode/extensions.json`
- **Ekip ne yapmalı:** `git pull` (kendi `feat/*` branch'inde `git merge origin/main`), sonra bir kez kurulum
  script'ini çalıştır (README › Quick start) ve repo klasöründe `claude` açıp trust sorusuna evet de.

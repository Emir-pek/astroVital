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

### 2026-11-14 14:22 — Muhammed Bektaş (feat/core-routine) — UI kit için Base UI (headless) eklendi

- **Ne:** UI kit'in davranış katmanı (konumlandırma, klavye, odak, erişilebilirlik) için `@base-ui/react@^1.9.0`
  kuruldu; görünüm tamamen bizim (Tailwind + `tokens.css`). Henüz yeni bileşen yok. ESLint artık
  `@base-ui/react` (alt yolları dahil) importunu `src/core/ui/**` dışında hata olarak işaretliyor.
- **Neden:** Kendi tasarımımızda modern arayüz; native `<select>` açılınca stillenemiyor, popover/tooltip
  davranışını elle yazmak 48 saatte riskli (ADR-029).
- **Dosyalar:** `package.json`, `package-lock.json`, `eslint.config.js`, `docs/DECISIONS.md`,
  `docs/ARCHITECTURE.md`, `docs/SETUP_CHECK.md`, `src/core/CLAUDE.md`, `CLAUDE.md`, `CHANGELOG.md`
- **Ekip ne yapmalı:** Kendi branch'inde `git merge origin/main` sonrası `npm ci`. Genel bir arayüz parçası gerekiyorsa src/core/ui'a kendin ekle; önce docs/TEAM.md 'UI kit envanteri'ne adını yaz. @base-ui/react'i yalnız src/core/ui içinde kullan (lint zorlar).

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

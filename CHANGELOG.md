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

### 2026-11-14 16:45 — Visualization Ekibi (feat/visualization) — AstroVital UI Plan 1: Dört seviyeli durum, Base UI bileşenleri, eldiven dostu kabuk ve Durum ekranı

- **Ne:** NASA-STD-3001 Ek F uyumlu 4 seviyeli durum (`nominal` / `advisory` / `caution` / `warning`), yerel fontlar (`@fontsource/atkinson-hyperlegible-next`, `@fontsource/jetbrains-mono`), `@base-ui/react` tabanlı `AlertStrip`, `RedAlertDialog`, `Sheet`, `Segmented`, `ArcGauge`, `ValueCard` bileşenleri, 5 sekmeli eldiven dostu `AppShell` (≥ 104 px dokunma hedefleri), katmanlı astronot figürü (`SuitArt`), bölge detay çekmecesi ve Vital kartlarıyla yeni Durum (`/`) ekranı eklendi.
- **Neden:** Onaylı AstroVital UI tasarım spesifikasyonu (`docs/superpowers/specs/2026-11-14-astrovital-ui-design.md`) ve ADR-029..031 kararlarının uygulanması.
- **Dosyalar:** `src/core/ui/`, `src/core/types/assessment.ts`, `src/core/config/thresholds.config.ts`, `src/core/utils/`, `src/core/i18n/`, `src/app/`, `src/modules/visualization/`, `package.json`, `docs/DECISIONS.md`, `docs/CONTRACTS.md`, `docs/SETUP_CHECK.md`
- **Ekip ne yapmalı:** `npm ci` (yeni `@base-ui/react` ve `@fontsource/*` paketleri için). `Status` tipi artık `'nominal' | 'advisory' | 'caution' | 'warning'` değerlerini alır (ADR-029).

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
